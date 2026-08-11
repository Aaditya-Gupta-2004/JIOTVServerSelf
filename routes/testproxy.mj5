import express from "express";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

const router = express.Router();

const TARGET_URL =
  "https://jiotv.data.cdn.jio.com/apis/v1.4/getMobileChannelList/get/?os=android&devicetype=phone";

const proxies = [
  "socks4://103.176.171.46:4153",
  "http://14.139.235.82:3128",
  "http://219.65.73.81:80",
  "socks5://117.244.114.54:1080",
  "socks5://144.24.111.128:1088",
  "socks4://103.123.157.242:1080",
  "http://103.217.213.124:32650",
  "socks4://161.248.38.18:1080",
  "http://144.48.49.217:8080",
  "http://27.34.242.98:80",
  "http://103.143.8.126:8089",
  "socks4://103.66.74.61:1080",
  "http://103.171.55.34:82",
  "http://111.125.242.34:80",
  "http://139.59.59.122:8118",
  "http://202.176.1.77:5555",
  "http://103.143.39.97:1111",
  "socks5://103.163.244.106:1080",
  "http://136.233.127.168:3128",
  "http://103.246.194.251:3128",
  "http://103.158.242.62:82",
  "http://103.49.166.193:82",
  "http://103.155.130.241:8080",
  "http://103.155.130.134:8082",
  "http://140.245.255.83:3128",
  "http://45.118.35.169:8080",
  "http://115.247.115.38:8080",
  "http://125.20.128.196:3129",
  "http://103.48.69.70:83",
  "http://175.101.26.97:84",
  "http://216.48.180.117:8080",
  "http://103.177.235.194:83",
  "http://103.22.173.77:1111",
  "http://143.244.140.119:3128",
  "http://107.181.139.61:3128",
  "http://103.74.144.34:83",
  "socks5://150.129.115.253:6667",
  "http://103.48.68.138:84",
  "http://103.83.80.70:8080",
  "socks5://139.59.44.192:9050",
  "http://103.135.189.2:82",
  "http://144.24.146.160:3128",
  "http://111.92.88.27:3128",
  "http://103.177.235.207:83",
  "http://202.65.158.237:83",
  "http://103.48.71.186:83",
  "http://103.135.189.6:83",
  "http://103.174.145.97:83",
  "http://103.148.62.1:8080",
  "http://103.41.33.169:58080",
  "http://140.245.238.56:53",
  "http://219.65.73.80:80",
  "http://103.49.166.193:83",
  "http://103.80.118.33:8080",
  "http://103.70.44.6:8080",
  "http://103.48.68.11:83",
  "http://103.74.144.57:83",
  "http://103.48.71.142:84",
  "http://202.62.75.38:84",
  "http://103.49.166.185:84",
  "http://45.119.113.65:83",
  "http://103.148.39.38:83",
  "http://103.130.70.253:82",
  "http://103.72.101.61:3128",
];

const TIMEOUT_MS = 6000;

function getAgent(proxyUrl) {
  if (proxyUrl.startsWith("socks")) {
    return new SocksProxyAgent(proxyUrl);
  }
  return new HttpsProxyAgent(proxyUrl);
}

async function testProxy(proxyUrl) {
  const agent = getAgent(proxyUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(TARGET_URL, {
      agent,
      signal: controller.signal,
      headers: {
        Accept: "*/*",
        "User-Agent":
          "plaYtv/7.0.8 (Linux;Android 7.1.2) ExoPlayerLib/2.11.7",
      },
    });
    clearTimeout(timeout);

    const text = await res.text();
    const looksLikeJson =
      text.trim().startsWith("{") || text.trim().startsWith("[");

    return {
      proxyUrl,
      status: looksLikeJson ? "SUCCESS_JSON" : "BLOCKED_OR_HTML",
      httpStatus: res.status,
      preview: text.slice(0, 100),
    };
  } catch (err) {
    clearTimeout(timeout);
    return { proxyUrl, status: "FAILED", error: err.message };
  }
}

router.get("/testproxy", async (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.write(`Testing ${proxies.length} proxies against JioTV API...\n\n`);

  const results = [];
  const BATCH_SIZE = 8;

  for (let i = 0; i < proxies.length; i += BATCH_SIZE) {
    const batch = proxies.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(testProxy));
    for (const r of batchResults) {
      res.write(`${r.status.padEnd(18)} ${r.proxyUrl}\n`);
      results.push(r);
    }
  }

  const working = results.filter((r) => r.status === "SUCCESS_JSON");
  const blocked = results.filter((r) => r.status === "BLOCKED_OR_HTML");
  const failed = results.filter((r) => r.status === "FAILED");

  res.write(`\n\n===== SUMMARY =====\n`);
  res.write(`Working (real JSON): ${working.length}\n`);
  working.forEach((r) => res.write(`  ${r.proxyUrl} -> ${r.preview}\n`));

  res.write(`\nReachable but blocked: ${blocked.length}\n`);
  blocked.forEach((r) => res.write(`  ${r.proxyUrl} -> ${r.preview}\n`));

  res.write(`\nFailed/unreachable: ${failed.length}\n`);

  res.end();
});

export default router;
