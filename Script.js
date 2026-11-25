function main(config) {
  const nodes = config.proxies || [];
  const original = config["proxy-groups"] || [];
  if (!nodes.length) return config;
  const regions = [
    ["香港", /香港|港[島岛]|Hong\s*Kong|🇭🇰|\bHK\b/i],
    ["台湾", /台湾|臺灣|台灣|Taiwan|🇹🇼|\bTW\b/i],
    ["日本", /日本|Japan|东京|東京|大阪|🇯🇵|\bJP\b/i],
    ["新加坡", /新加坡|狮城|Singapore|🇸🇬|\bSG\b/i],
    ["美国", /美国|美國|United States|America|🇺🇸|\bUS\b/i],
    ["韩国", /韩国|韓國|Korea|🇰🇷|\bKR\b/i],
    ["英国", /英国|英國|United Kingdom|🇬🇧|\bUK\b/i]
  ];
  const used = new Set([...nodes.map(p => p.name), ...original.map(g => g.name), "DIRECT", "REJECT", "GLOBAL"]);
  const buckets = new Map();
  for (const p of nodes) {
    if (["direct","reject"].includes(String(p.type).toLowerCase())) continue;
    const region = regions.find(r => r[1].test(p.name));
    const label = region ? region[0] : "其他节点";
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label).push(p.name);
  }
  const shared = [];
  for (const [label, members] of buckets) {
    let name = label;
    while (used.has(name)) name += " · 地区";
    used.add(name);
    shared.push({name, type:"select", proxies:[...new Set(members)]});
  }
  for (const g of original) {
    if (g.name === "GLOBAL" || g.type !== "select" || !Array.isArray(g.proxies) || g["include-all"] || g["include-all-proxies"]) continue;
    const allowed = new Set(g.proxies);
    const mapping = new Map();
    for (const r of shared) {
      if (r.proxies.every(n => allowed.has(n))) for (const n of r.proxies) mapping.set(n,r.name);
    }
    g.proxies = [...new Set(g.proxies.map(n => mapping.get(n) || n))];
  }
  const global = original.find(g => g.name === "GLOBAL");
  const choices = [...shared.map(g => g.name), ...original.filter(g => g.name !== "GLOBAL").map(g => g.name), "DIRECT"];
  if (global) {
    // Preserve explicitly configured GLOBAL choices, compact complete regions only.
    const old = global.proxies || [];
    const allowed = new Set(old);
    const mapping = new Map();
    for (const r of shared) if (r.proxies.every(n => allowed.has(n))) for (const n of r.proxies) mapping.set(n,r.name);
    if (global.type === "select" && !global["include-all"] && !global["include-all-proxies"]) global.proxies = [...new Set(old.map(n => mapping.get(n) || n))];
  } else original.unshift({name:"GLOBAL",type:"select",proxies:[...new Set(choices)]});
  config["proxy-groups"] = [...original,...shared];
  return config;
}
