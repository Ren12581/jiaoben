function main(config) {
  const nodes = config.proxies || [];
  const groups = config["proxy-groups"] || [];
  const regions = [
    ["香港", /香港|Hong\s*Kong|🇭🇰|\bHK\b/i],
    ["台湾", /台湾|臺灣|台灣|Taiwan|🇹🇼|\bTW\b/i],
    ["日本", /日本|Japan|东京|大阪|🇯🇵|\bJP\b/i],
    ["新加坡", /新加坡|狮城|Singapore|🇸🇬|\bSG\b/i],
    ["美国", /美国|美國|United States|🇺🇸|\bUS\b/i],
    ["韩国", /韩国|韓國|Korea|🇰🇷|\bKR\b/i],
    ["英国", /英国|英國|United Kingdom|🇬🇧|\bUK\b/i]
  ];
  const names = new Set(nodes.map(p => p.name));
  const used = new Set([...names, ...groups.map(g => g.name)]);
  const added = [];
  for (const g of groups) {
    if (g.type !== "select" || !Array.isArray(g.proxies) || g["include-all"] || g["include-all-proxies"]) continue;
    const buckets = new Map();
    for (const n of g.proxies) {
      if (!names.has(n)) continue;
      const r = regions.find(x => x[1].test(n));
      const label = r ? r[0] : "其他节点";
      if (!buckets.has(label)) buckets.set(label, []);
      buckets.get(label).push(n);
    }
    const mapping = new Map();
    for (const [label, members] of buckets) {
      if (members.length < 2) continue;
      let name = g.name + " · " + label;
      while (used.has(name)) name += "·";
      used.add(name);
      added.push({name, type:"select", proxies:[...new Set(members)]});
      for (const n of members) mapping.set(n,name);
    }
    g.proxies = [...new Set(g.proxies.map(n => mapping.get(n) || n))];
  }
  config["proxy-groups"] = [...groups, ...added];
  return config;
}
