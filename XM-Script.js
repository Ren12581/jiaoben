// Country grouping for inline-proxy FlClash / Mihomo subscriptions.
// No subscription URL or credentials. Preserve original DNS/TUN and transport settings.
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
    ["阿根廷","AR","🇦🇷",/阿根廷|Argentina|\bAR\b/i],
    ["法国","FR","🇫🇷",/法国|法國|France|\bFR\b/i]
  ];
  const old = config["proxy-groups"] || [];
  const nodes = config.proxies || [];
  // Do not restructure provider-only or chained-proxy configurations blindly.
  if (!nodes.length || Object.keys(config["proxy-providers"] || {}).length ||
      nodes.some(p => p["dialer-proxy"])) return config;
  const extras = [
    ["法国","FR",/法国|法國|France|\bFR\b/i],
    ["俄罗斯","RU",/俄罗斯|俄羅斯|Russia|\bRU\b/i],
    ["意大利","IT",/意大利|義大利|Italy|\bIT\b/i],
    ["西班牙","ES",/西班牙|Spain|\bES\b/i],
    ["瑞士","CH",/瑞士|Switzerland|\bCH\b/i],
    ["瑞典","SE",/瑞典|Sweden|\bSE\b/i],
    ["以色列","IL",/以色列|Israel|\bIL\b/i],
    ["澳门","MO",/澳门|澳門|Macau|Macao|\bMO\b/i],
    ["中国","CN",/中国|中國|China|\bCN\b/i],
    ["南非","ZA",/南非|South Africa|\bZA\b/i],
    ["新西兰","NZ",/新西兰|紐西蘭|New Zealand|\bNZ\b/i],
    ["波兰","PL",/波兰|波蘭|Poland|\bPL\b/i],
    ["乌克兰","UA",/乌克兰|烏克蘭|Ukraine|\bUA\b/i],
    ["芬兰","FI",/芬兰|芬蘭|Finland|\bFI\b/i]
  ];
  const flagOf = c => String.fromCodePoint(...Array.from(c, x=>127397+x.charCodeAt(0)));
  for (const d of extras) if(!defs.some(x=>x[1]===d[1])) defs.push([d[0],d[1],flagOf(d[1]),d[2]]);
  const used = new Set([...old.map(g=>g.name),...nodes.map(p=>p.name),"GLOBAL","AI","Google","规则"]);
  const buckets = new Map();
  const add = (k,n) => { if(!buckets.has(k)) buckets.set(k,[]); if(!buckets.get(k).includes(n)) buckets.get(k).push(n); };
  const meta = /剩余流量|剩餘流量|套餐到期|到期时间|到期時間|距离下次重置|下次重置|流量重置|请勿分享|請勿分享|官网地址|官網地址|订阅到期|訂閱到期|更新订阅|更新訂閱|traffic remaining|expire date/i;
  for (const p of nodes) {
    const n=String(p.name||"");
    if (!n || meta.test(n)) continue;
    const flag=n.match(/[\u{1F1E6}-\u{1F1FF}]{2}/u);
    const d=(flag && defs.find(x=>x[2]===flag[0])) || defs.find(x=>x[3].test(n)) ||
      (/美西|美东|洛杉矶|洛杉磯|西雅图|纽约|紐約|圣何塞|United States|\bUSA\b/i.test(n)?defs.find(x=>x[1]==="US"):null) ||
      (/东京|東京|大阪|埼玉/i.test(n)?defs.find(x=>x[1]==="JP"):null) ||
      (/台北|臺北|台中|臺中|高雄/i.test(n)?defs.find(x=>x[1]==="TW"):null);
    if(d) add(d[2]+" "+d[0],n);
    else if(flag) add(flag[0]+" "+Array.from(flag[0],x=>String.fromCharCode(x.codePointAt(0)-127397)).join(""),n);
    else add("其他地区",n);
  }
  if (!buckets.size || nodes.some(p=>["GLOBAL","AI","Google","规则"].includes(p.name))) return config;
  const ordered=[], choices=[];
  const fresh=n=>{while(used.has(n))n+=" ·";used.add(n);return n;};
  const keys=[...new Set([...defs.map(d=>d[2]+" "+d[0]),...buckets.keys()])].filter(k=>buckets.has(k));
  for(const k of keys){
    const name=fresh(k), members=buckets.get(k);
    const auto=members.length>1?fresh(name+"自动"):null;
    ordered.push({name,type:"select",proxies:auto?[auto,...members]:members.slice(),url:testUrl,hidden:false});
    choices.push(name);
    if(auto){ordered.push({name:auto,type:"url-test",proxies:members.slice(),url:testUrl,interval:600,tolerance:50,lazy:true,hidden:false});choices.push(auto);}
  }
  const root="规则";
  const global={name:"GLOBAL",type:"select",proxies:choices.slice(),url:testUrl,hidden:false};
  const rule={name:root,type:"select",proxies:choices.slice(),url:testUrl,hidden:false};
  const us=choices.find(n=>n.startsWith("🇺🇸 美国")&&n.includes("自动"))||choices.find(n=>n.startsWith("🇺🇸 美国"));
  const services=["AI","Google"].map(name=>({name,type:"select",proxies:[...new Set([...(name==="AI"&&us?[us]:[]),root,...choices])],url:testUrl,hidden:false}));
  const finalGroups=[global,rule,...services,...ordered];
  const keep=new Set(finalGroups.map(g=>g.name));
  const oldNames=new Set(old.map(g=>g.name));
  const aliases=new Map();
  for(const g of old){
    if(keep.has(g.name)) continue;
    const name=g.name;
    const target=/\bAI\b|人工智能|人工智慧|OpenAI|ChatGPT|Claude|Gemini/i.test(name)?"AI":/Google|谷歌/i.test(name)?"Google":root;
    aliases.set(name,target);
  }
  // Retain any old groups explicitly referenced by DNS, together with their dependencies.
  const dnsText=JSON.stringify(config.dns||{});
  const needed=new Set();
  function retain(name){
    if(needed.has(name)||keep.has(name)||!oldNames.has(name))return;
    needed.add(name);
    const g=old.find(x=>x.name===name);
    for(const p of (g.proxies||[]))retain(p);
  }
  for(const g of old) if(dnsText.includes("#"+g.name)||dnsText.includes('"'+g.name+'"'))retain(g.name);
  for(const g of old) if(needed.has(g.name))finalGroups.push({...g,hidden:true});
  const target=n=>aliases.get(n)||n;
  const rewrite=r=>{
    if(typeof r!=="string")return r;
    const parts=r.split(",");
    let i=parts.length-1;
    while(i>0&&/^(?:no-resolve|src)$/i.test(parts[i].trim()))i--;
    const n=parts[i].trim();
    if(aliases.has(n))parts[i]=parts[i].replace(n,target(n));
    return parts.join(",");
  };
  if(Array.isArray(config.rules))config.rules=config.rules.map(rewrite);
  if(config["sub-rules"])for(const k of Object.keys(config["sub-rules"]))if(Array.isArray(config["sub-rules"][k]))config["sub-rules"][k]=config["sub-rules"][k].map(rewrite);
  for(const p of Object.values(config["rule-providers"]||{}))if(p&&typeof p.proxy==="string"&&!needed.has(p.proxy))p.proxy=target(p.proxy);
  config["proxy-groups"]=finalGroups;
  return config;
}
