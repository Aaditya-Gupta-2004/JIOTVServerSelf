import express from "express";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

const router = express.Router();

const TARGET_URL =
  "https://jiotv.data.cdn.jio.com/apis/v1.4/getMobileChannelList/get/?os=android&devicetype=phone";

// Add more proxies here as you find them - one per line.
const proxies = [
  "http://139.59.1.14:3128",
];

const TIMEOUT_MS = 10000;

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
      preview: text.slice(0, 300),
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

  for (const proxyUrl of proxies) {
    res.write(`Testing ${proxyUrl} ...\n`);
    const result = await testProxy(proxyUrl);
    res.write(`  -> ${result.status}`);
    if (result.httpStatus) res.write(` (HTTP ${result.httpStatus})`);
    res.write(`\n`);
    if (result.preview) res.write(`  Preview: ${result.preview}\n`);
    if (result.error) res.write(`  Error: ${result.error}\n`);
    res.write(`\n`);
    results.push(result);
  }

  const working = results.filter((r) => r.status === "SUCCESS_JSON");

  res.write(`\n===== SUMMARY =====\n`);
  if (working.length > 0) {
    res.write(`SUCCESS! ${working.length} proxy(s) returned real JSON data.\n`);
    working.forEach((r) => res.write(`  ${r.proxyUrl}\n`));
  } else {
    res.write(`No working proxy in this batch.\n`);
  }

  res.end();
});

export default router;
