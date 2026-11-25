// Yue.to country grouping only. Original network settings and rules are retained.
function main(config) {
  const testUrl = "https://www.gstatic.com/generate_204";
  const defs = [
    ["香港","HK","🇭🇰",/香港|Hong\s*Kong|\bHK\b/i],
    ["台湾","TW","🇹🇼",/台湾|臺灣|台灣|Taiwan|\bTW\b/i],
    ["日本","JP","🇯🇵",/日本|Japan|\bJP\b/i],
    ["美国","US","🇺🇸",/美国|美國|United\s*States|\bUS\b/i],
    ["韩国","KR","🇰🇷",/韩国|韓國|Korea|\bKR\b/i],
    ["新加坡","SG","🇸🇬",/新加坡|Singapore|\bSG\b/i],
    ["泰国","TH","🇹🇭",/泰国|泰國|Thailand|\bTH\b/i],
    ["马来西亚","MY","🇲🇾",/马来西亚|馬來西亞|Malaysia|\bMY\b/i],
    ["印度尼西亚","ID","🇮🇩",/印度尼西亚|印度尼西亞|印尼|Indonesia|\bID\b/i],
    ["印度","IN","🇮🇳",/印度(?!尼)|India|\bIN\b/i],
    ["越南","VN","🇻🇳",/越南|Vietnam|\bVN\b/i],
    ["英国","GB","🇬🇧",/英国|英國|United\s*Kingdom|\b(?:UK|GB)\b/i],
    ["德国","DE","🇩🇪",/德国|德國|Germany|\bDE\b/i],
    ["荷兰","NL","🇳🇱",/荷兰|荷蘭|Netherlands|\bNL\b/i],
    ["加拿大","CA","🇨🇦",/加拿大|Canada|\bCA\b/i],
    ["巴西","BR","🇧🇷",/巴西|Brazil|\bBR\b/i],
    ["墨西哥","MX","🇲🇽",/墨西哥|Mexico|\bMX\b/i],
    ["阿联酋","AE","🇦🇪",/阿联酋|阿聯酋|UAE|\bAE\b/i],
    ["土耳其","TR","🇹🇷",/土耳其|Turkey|\bTR\b/i],
    ["澳大利亚","AU","🇦🇺",/澳大利亚|澳大利亞|澳洲|Australia|\bAU\b/i],
    ["尼日利亚","NG","🇳🇬",/尼日利亚|尼日利亞|Nigeria|\bNG\b/i],
    ["菲律宾","PH","🇵🇭",/菲律宾|菲律賓|Philippines|\bPH\b/i],
    ["阿根廷","AR","🇦🇷",/阿根廷|Argentina|\bAR\b/i]
  ];
  const old=config["proxy-groups"]||[];
  const root=old.find(g=>g.name==="Yue.to | 悦通");
  if(!root) return config;
  const used=new Set([...old.map(g=>g.name),...(config.proxies||[]).map(p=>p.name)]);
  const groups=[];
  const buckets=defs.map(()=>[]);
  for(const p of config.proxies||[]){
    const name=String(p.name||"");
    if(/剩余流量|套餐到期|请勿分享订阅链接/.test(name)) continue;
    const flag=name.match(/[\u{1F1E6}-\u{1F1FF}]{2}/u);
    let i=flag?defs.findIndex(d=>d[2]===flag[0]):-1;
    if(i<0)i=defs.findIndex(d=>d[3].test(name));
    if(i>=0 && !buckets[i].includes(name))buckets[i].push(name);
  }
  defs.forEach((d,i)=>{
    if(!buckets[i].length)return;
    let name=d[2]+" "+d[0];
    while(used.has(name))name+=" ·";
    used.add(name);
    groups.push({name,type:"select",proxies:buckets[i],hidden:false});
  });
  if(!groups.length)return config;
  const autoGroups=[];
  const choices=[];
  for(const g of groups){
    choices.push(g.name);
    if(g.proxies.length<2)continue;
    let name=g.name+"自动";
    while(used.has(name))name+=" ·";
    used.add(name);
    autoGroups.push({name,type:"url-test",proxies:[...g.proxies],url:testUrl,interval:600,tolerance:50,lazy:true,hidden:false});
    g.proxies.unshift(name);
    choices.push(name);
  }
  // Keep original group references valid; show only country pairs in both main selectors.
  const mainGroup={...root,type:"select",proxies:[...choices],hidden:false};
  for(const k of ["include-all","include-all-proxies","include-all-providers","use","filter","exclude-filter","exclude-type","default-selected"])delete mainGroup[k];
  // Keep only the main selectors, country pairs and two independent service selectors.
  const services=["AI","Google"].map(name=>{
    const previous=old.find(g=>g.name===name);
    const usAuto=choices.find(n=>n==="🇺🇸 美国自动")||choices.find(n=>n==="🇺🇸 美国");
    const preferred=name==="AI"&&usAuto?[usAuto]:[root.name];
    const g={...previous,name,type:"select",proxies:[...new Set([...preferred,root.name,...choices])],hidden:false};
    for(const k of ["include-all","include-all-proxies","include-all-providers","use","filter","exclude-filter","exclude-type","default-selected"])delete g[k];
    return g;
  });
  const global={name:"GLOBAL",type:"select",proxies:[...choices],hidden:false};
  const ordered=groups.flatMap(g=>[g,...autoGroups.filter(a=>g.proxies[0]===a.name)]);
  const finalGroups=[global,mainGroup,...services,...ordered];
  const keep=new Set(finalGroups.map(g=>g.name));
  const removed=new Set(old.map(g=>g.name).filter(n=>!keep.has(n)));
  const target=n=>removed.has(n)?root.name:n;
  // Only rewrite the policy target, not the domain, matcher, or rule order.
  const rewriteRule=rule=>{
    if(typeof rule!=="string")return rule;
    const parts=rule.split(",");
    let i=parts.length-1;
    while(i>0&&/^(?:no-resolve|src)$/i.test(parts[i].trim()))i--;
    const n=parts[i].trim();
    if(removed.has(n))parts[i]=parts[i].replace(n,root.name);
    return parts.join(",");
  };
  if(Array.isArray(config.rules))config.rules=config.rules.map(rewriteRule);
  if(config["sub-rules"])for(const k of Object.keys(config["sub-rules"]))if(Array.isArray(config["sub-rules"][k]))config["sub-rules"][k]=config["sub-rules"][k].map(rewriteRule);
  // Rule-provider downloads and other explicit group references must not point at deleted groups.
  for(const key of ["rule-providers","proxy-providers"]){
    for(const p of Object.values(config[key]||{}))if(p&&typeof p.proxy==="string")p.proxy=target(p.proxy);
  }
  for(const p of config.proxies||[])if(typeof p["dialer-proxy"]==="string")p["dialer-proxy"]=target(p["dialer-proxy"]);
  for(const g of finalGroups)g.url=testUrl;
  config["proxy-groups"]=finalGroups;
  return config;
}
