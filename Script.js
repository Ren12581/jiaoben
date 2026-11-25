// Yue.to country grouping only. Original network settings and rules are retained.
function main(config) {
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
    autoGroups.push({name,type:"url-test",proxies:[...g.proxies],url:"https://www.apple.com/library/test/success.html",interval:600,tolerance:50,lazy:true,hidden:false});
    g.proxies.unshift(name);
    choices.push(name);
  }
  // Keep original group references valid; show only country pairs in both main selectors.
  const mainGroup={...root,type:"select",proxies:[...choices],hidden:false};
  for(const k of ["include-all","include-all-proxies","include-all-providers","use","filter","exclude-filter","exclude-type","default-selected"])delete mainGroup[k];
  const retained=old.filter(g=>g.name!==root.name&&g.name!=="GLOBAL").map(g=>({...g,hidden:true}));
  const global={name:"GLOBAL",type:"select",proxies:[...choices],hidden:false};
  const ordered=groups.flatMap(g=>[g,...autoGroups.filter(a=>g.proxies[0]===a.name)]);
  config["proxy-groups"]=[global,mainGroup,...ordered,...retained];
  return config;
}
