// 顺畅网络专用：按节点地区名称分组，不改 DNS、TUN、节点连接参数。
function main(config) {
  const root="顺畅网络", url="https://www.gstatic.com/generate_204";
  const old=config["proxy-groups"]||[], nodes=config.proxies||[];
  if(!old.some(g=>g.name===root)||!nodes.length||Object.keys(config["proxy-providers"]||{}).length||nodes.some(p=>p["dialer-proxy"]))return config;
  const defs=[
    ["香港","🇭🇰",/香港|Hong\s*Kong|\bHK\b/i],
    ["台湾","🇹🇼",/台湾|臺灣|台灣|台北|臺北|Taiwan|\bTW\b/i],
    ["日本","🇯🇵",/日本|东京|東京|大阪|Japan|\bJP\b/i],
    ["美国","🇺🇸",/美国|美國|United\s*States|\bUSA?\b/i],
    ["韩国","🇰🇷",/韩国|韓國|Korea|\bKR\b/i],
    ["新加坡","🇸🇬",/新加坡|Singapore|\bSG\b/i],
    ["英国","🇬🇧",/英国|英國|United\s*Kingdom|\b(?:UK|GB)\b/i],
    ["越南","🇻🇳",/越南|Vietnam|\bVN\b/i],
    ["泰国","🇹🇭",/泰国|泰國|Thailand|\bTH\b/i],
    ["马来西亚","🇲🇾",/马来西亚|馬來西亞|Malaysia|\bMY\b/i],
    ["印度尼西亚","🇮🇩",/印度尼西亚|印度尼西亞|印尼|Indonesia|\bID\b/i],
    ["印度","🇮🇳",/印度(?!尼)|India|\bIN\b/i],
    ["德国","🇩🇪",/德国|德國|Germany|\bDE\b/i],
    ["法国","🇫🇷",/法国|法國|France|\bFR\b/i],
    ["荷兰","🇳🇱",/荷兰|荷蘭|Netherlands|\bNL\b/i],
    ["加拿大","🇨🇦",/加拿大|Canada|\bCA\b/i],
    ["澳大利亚","🇦🇺",/澳大利亚|澳大利亞|澳洲|Australia|\bAU\b/i],
    ["菲律宾","🇵🇭",/菲律宾|菲律賓|Philippines|\bPH\b/i],
    ["澳门","🇲🇴",/澳门|澳門|Macau|Macao|\bMO\b/i],
    ["中国","🇨🇳",/中国|中國|China|\bCN\b/i]
  ];
  const used=new Set([...nodes.map(p=>p.name),...old.map(g=>g.name),"GLOBAL","AI","Google",root]);
  if(nodes.some(p=>["GLOBAL","AI","Google",root].includes(p.name)))return config;
  const buckets=new Map();
  const meta=/剩余流量|剩餘流量|套餐到期|到期时间|到期時間|订阅到期|訂閱到期|下次重置|请勿分享|請勿分享|官网地址|官網地址|更新订阅|更新訂閱/i;
  for(const p of nodes){
    const n=String(p.name||"");
    if(!n||meta.test(n))continue;
    const flag=n.match(/[\u{1F1E6}-\u{1F1FF}]{2}/u);
    // Explicit location text overrides flag: 🇨🇳台湾 and 🇨🇳香港 are not mainland nodes.
    const d=defs.find(x=>x[2].test(n))||(flag&&defs.find(x=>x[1]===flag[0]));
    const k=d?d[1]+" "+d[0]:flag?flag[0]+" "+Array.from(flag[0],x=>String.fromCharCode(x.codePointAt(0)-127397)).join(""):"其他地区";
    if(!buckets.has(k))buckets.set(k,[]);
    if(!buckets.get(k).includes(n))buckets.get(k).push(n);
  }
  if(!buckets.size)return config;
  const fresh=n=>{while(used.has(n))n+=" ·";used.add(n);return n;};
  const choices=[], ordered=[];
  for(const k of [...new Set([...defs.map(d=>d[1]+" "+d[0]),...buckets.keys()])]){
    if(!buckets.has(k))continue;
    const name=fresh(k), members=buckets.get(k), auto=members.length>1?fresh(name+"自动"):null;
    ordered.push({name,type:"select",proxies:auto?[auto,...members]:members.slice(),url,hidden:false});
    choices.push(name);
    if(auto){ordered.push({name:auto,type:"url-test",proxies:members.slice(),url,interval:600,tolerance:50,lazy:true,hidden:false});choices.push(auto);}
  }
  const select=(name,proxies)=>({name,type:"select",proxies:[...new Set(proxies)],url,hidden:false});
  const us=choices.find(n=>n.startsWith("🇺🇸 美国")&&n.includes("自动"))||choices.find(n=>n.startsWith("🇺🇸 美国"));
  const groups=[select("GLOBAL",choices),select(root,choices),select("AI",[...(us?[us]:[]),root,...choices]),select("Google",[root,...choices]),...ordered];
  const keep=new Set(groups.map(g=>g.name));
  const removed=new Set(old.map(g=>g.name).filter(n=>!keep.has(n)));
  // Avoid removing a group referenced by future DNS/provider configurations.
  if([...removed].some(n=>JSON.stringify(config.dns||{}).includes("#"+n)||JSON.stringify(config.dns||{}).includes('"'+n+'"')))return config;
  if(Object.values(config["rule-providers"]||{}).some(p=>p&&removed.has(p.proxy)))return config;
  const ai=/openai|anthropic|chatgpt|claude|gemini|aistudio|generativelanguage|oaistatic|oaiusercontent/i;
  const google=/google|gmail|youtube|youtu\.be|ytimg|gstatic|ggpht|blogspot|googleusercontent|xn--ngstr-lra8j\.com/i;
  const rewrite=r=>{
    if(typeof r!=="string")return r;
    const a=r.split(",");
    let i=a.length-1;
    while(i>0&&/^(no-resolve|src)$/i.test(a[i].trim()))i--;
    const n=a[i].trim();
    if(removed.has(n))a[i]=root;
    if(a[i].trim()===root&&/^DOMAIN(?:-SUFFIX|-KEYWORD)?$/i.test(a[0])){
      if(ai.test(a[1]))a[i]="AI";
      else if(google.test(a[1]))a[i]="Google";
    }
    return a.join(",");
  };
  if(Array.isArray(config.rules)){
    const rules=config.rules.map(rewrite);
    const extra=[
      "DOMAIN-SUFFIX,chatgpt.com,AI","DOMAIN-SUFFIX,openai.com,AI",
      "DOMAIN-SUFFIX,oaistatic.com,AI","DOMAIN-SUFFIX,oaiusercontent.com,AI",
      "DOMAIN-SUFFIX,claude.ai,AI","DOMAIN-SUFFIX,anthropic.com,AI",
      "DOMAIN-SUFFIX,gemini.google.com,AI","DOMAIN-SUFFIX,aistudio.google.com,AI",
      "DOMAIN,generativelanguage.googleapis.com,AI"
    ];
    // Put AI-specific domains before generic Google matches, leaving original rules in their original order.
    const idx=rules.findIndex(r=>r.endsWith(",Google")||r.endsWith(",AI"));
    const at=idx<0?Math.max(0,rules.findIndex(r=>r.startsWith("MATCH,"))):idx;
    rules.splice(at,0,...extra.filter(r=>!rules.includes(r)));
    config.rules=rules;
  }
  if(config["sub-rules"])for(const k of Object.keys(config["sub-rules"]))if(Array.isArray(config["sub-rules"][k]))config["sub-rules"][k]=config["sub-rules"][k].map(rewrite);
  config["proxy-groups"]=groups;
  return config;
}
