// Region grouping adapted from AIsouler/MyClash.
// https://github.com/AIsouler/MyClash
const ruleOptionsEnable = {生成地区自动选择组:true,隐藏地区手动选择组:false,生成高低倍率组:true,生成家宽节点组:true};
const iconBaseUrl = 'https://fastly.jsdelivr.net/gh/AIsouler/MyClash@main/Icons/svg/';


const regionDefinitions = [
  {
    name: '香港',
    flag: '🇭🇰',
    regex: /🇭🇰|香港|(?<![A-Za-z])HKG?(?![A-Za-z])|hong\s*kong/i,
    icon: `${iconBaseUrl}HongKong.svg`,
  },
  {
    name: '日本',
    flag: '🇯🇵',
    regex: /🇯🇵|日本|东京|大阪|京都|(?<![A-Za-z])JPN?(?![A-Za-z])|japan/i,
    icon: `${iconBaseUrl}Japan.svg`,
  },
  {
    name: '美国',
    flag: '🇺🇸',
    regex:
      /🇺🇸|美国|纽约|洛杉矶|旧金山|芝加哥|休斯顿|迈阿密|西雅图|波士顿|华盛顿|圣何塞|(?<![A-Za-z])USA?(?![A-Za-z])|america|united\s*states/i,
    icon: `${iconBaseUrl}America.svg`,
  },
  {
    name: '新加坡',
    flag: '🇸🇬',
    regex: /🇸🇬|新加坡|狮城|(?<![A-Za-z])SGP?(?![A-Za-z])|singapore/i,
    icon: `${iconBaseUrl}Singapore.svg`,
  },
  {
    name: '台湾',
    flag: '🇹🇼',
    regex: /🇹🇼|台湾|台北|高雄|(?<![A-Za-z])TWN?(?![A-Za-z])|taiwan/i,
    icon: `${iconBaseUrl}Taiwan.svg`,
  },
];

// 定义倍率策略组
const lowRateRegionName = '低倍率节点';
const highRateRegionName = '高倍率节点';

const rateRegionDefinitions = [
  {
    name: lowRateRegionName,
    regex:
      /^(?!.*(?:剩|期)).*(?:(?<![\d.])0(\.[0-5]|[*×✕✖⨯⨉x倍]))|(?:[*×✕✖⨯⨉x]0)|^(?!.*(?:客户端|软件)).*下载|低倍|免费|(?<![A-Za-z])free(?![A-Za-z])/i,
    icon: `${iconBaseUrl}Available.svg`,
  },
  {
    name: highRateRegionName,
    regex:
      /(?:[*×✕✖⨯⨉x](?:[2-9]\d*|[1-9]\d+)(?:\.\d+)?)|(?:(?<![\d.])(?:[2-9]\d*|[1-9]\d+)(?:\.\d+)?(?:倍|[*×✕✖⨯⨉x]))/i,
    icon: `${iconBaseUrl}Airport.svg`,
  },
];

// 定义家宽（住宅/原生 IP）节点策略组
const homeRegionName = '家宽节点';

const homeRegionDefinitions = [
  {
    name: homeRegionName,
    regex: /家宽|住宅|原生\s*IP|家庭宽带|\bISP\b|\bRES\b|residential/i,
    icon: `${iconBaseUrl}Home.svg`,
  },
];

// 全部策略组定义（地区 + 倍率 + 家宽），统一用于节点匹配与归类
const allRegionDefinitions = [...regionDefinitions, ...rateRegionDefinitions, ...homeRegionDefinitions];


const groupBaseOption = {
  timeout: 5000,
  url: 'https://www.apple.com/library/test/success.html',
  'max-failed-times': 3,
  'empty-fallback': 'REJECT',
};

// select策略组通用配置
const selectBaseOption = {
  ...groupBaseOption,
  type: 'select',
};

// url-test策略组通用配置
const urlTestBaseOption = {
  ...groupBaseOption,
  type: 'url-test',
  interval: 600,
  lazy: true,
  tolerance: 50,
  'exclude-type': 'DIRECT',
  icon: `${iconBaseUrl}Auto.svg`,
  hidden: true,
};


const invisibleCharsRegex = /[\u00AD\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u115F\u1160\u3164\uFFA0]/g;

/**
 * 取节点名「可用于匹配」的形式：剥离零宽/不可见字符
 */
function toMatchableName(name) {
  return typeof name === 'string' ? name.replace(invisibleCharsRegex, '') : name;
}

/**
 * 节点匹配缓存，避免重复执行正则
 */
const regionMatchCache = new Map();
function getMatchedRegions(proxyName) {
  if (regionMatchCache.has(proxyName)) {
    return regionMatchCache.get(proxyName);
  }

  const matchableName = toMatchableName(proxyName);
  const regions = allRegionDefinitions.filter((region) => region.regex.test(matchableName));
  regionMatchCache.set(proxyName, regions);

  return regions;
}


function createRegionGroup(name, icon, proxies) {
  const generateRegionAutoSelectEnabled = ruleOptionsEnable.生成地区自动选择组;
  const hideManualSelectGroupEnabled = ruleOptionsEnable.隐藏地区手动选择组;

  if (generateRegionAutoSelectEnabled) {
    const urlTestName = `${name}-自动选择`;
    return [
      {
        ...selectBaseOption,
        name,
        icon,
        proxies: [...proxies, urlTestName],
        hidden: hideManualSelectGroupEnabled,
      },
      {
        ...urlTestBaseOption,
        name: urlTestName,
        proxies,
      },
    ];
  }
  return [
    {
      ...selectBaseOption,
      name,
      icon,
      proxies,
      hidden: hideManualSelectGroupEnabled,
    },
  ];
}

/**
 * 将节点按地区/倍率归类，构建地区策略组、倍率策略组与“其他节点”组
 */
function buildRegionGroups(filteredProxies, customProxies) {
  const generateRateGroupEnabled = ruleOptionsEnable.生成高低倍率组;
  const generateHomeGroupEnabled = ruleOptionsEnable.生成家宽节点组;

  const regionGroups = Object.fromEntries(allRegionDefinitions.map(({ name }) => [name, []]));
  const otherProxies = [];

  for (const proxy of [...filteredProxies, ...customProxies]) {
    const matchedRegions = getMatchedRegions(proxy.name);
    const isRegionProxy = matchedRegions.some((region) => regionDefinitions.includes(region));

    for (const region of matchedRegions) {
      regionGroups[region.name].push(proxy.name);
    }

    if (!isRegionProxy) {
      otherProxies.push(proxy.name);
    }
  }

  const generatedRegionGroups = allRegionDefinitions
    .filter(
      (r) =>
        regionGroups[r.name].length > 0 &&
        (generateRateGroupEnabled || !rateRegionDefinitions.includes(r)) &&
        (generateHomeGroupEnabled || !homeRegionDefinitions.includes(r)),
    )
    .flatMap((r) => createRegionGroup(r.name, r.icon, regionGroups[r.name]));

  if (otherProxies.length > 0) {
    generatedRegionGroups.push(...createRegionGroup('其他节点', `${iconBaseUrl}WorldMap.svg`, otherProxies));
  }

  return generatedRegionGroups;
}


function main(config) {
  regionMatchCache.clear();
  const nodes = (config.proxies || []).filter(p => !['direct','reject','rematch'].includes(String(p.type).toLowerCase()));
  if (!nodes.length) return config;
  const old = config["proxy-groups"] || [];
  const used = new Set([... (config.proxies || []).map(p=>p.name), ...old.map(g=>g.name), 'GLOBAL','DIRECT','REJECT']);
  const generated = buildRegionGroups(nodes, []);
  const rename = new Map();
  for (const g of generated) {
    let n = g.name;
    while (used.has(n)) n += ' ·';
    used.add(n); rename.set(g.name,n);
  }
  const regions = generated.map(g=>({...g,name:rename.get(g.name),proxies:g.proxies.map(n=>rename.get(n)||n)}));
  let root = '默认代理';
  while (used.has(root)) root += ' ·';
  const choices = regions.filter(g=>g.type==='select').map(g=>g.name);
  const all = new Set(nodes.map(p=>p.name));
  const retained = old.filter(g=>g.name!=='GLOBAL').map(g=>{
    const p = g.proxies || [];
    const directNodes = p.filter(n=>all.has(n));
    if (g.type==='select' && !g.use?.length && !g.filter && !g['exclude-filter'] && (g['include-all'] || g['include-all-proxies'] || (all.size===new Set(directNodes).size))) {
      const copy={...g,hidden:true,proxies:[root,...p.filter(n=>!all.has(n)&&n!==root)]};
      delete copy['include-all']; delete copy['include-all-proxies'];
      return copy;
    }
    return {...g,hidden:true};
  });
  config["proxy-groups"] = [
    {name:'GLOBAL',type:'select',proxies:[root,...choices,'DIRECT']},
    {name:root,type:'select',proxies:choices,icon:iconBaseUrl+'Proxy.svg'},
    ...regions,...retained
  ];
  return config;
}
