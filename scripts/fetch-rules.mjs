// Downloads the built-in mihomo MRS rule sets (private + Mainland China) into presets/rules.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "presets", "rules");

const UPSTREAM = "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo";
const MIRRORS = [
  (u) => u,
  (u) => `https://gh-proxy.org/${u}`,
  (u) => `https://ghfast.top/${u}`,
];

const FILES = [
  ["geosite-private.mrs", `${UPSTREAM}/geosite/private.mrs`],
  ["geosite-cn.mrs", `${UPSTREAM}/geosite/cn.mrs`],
  ["geoip-private.mrs", `${UPSTREAM}/geoip/private.mrs`],
  ["geoip-cn.mrs", `${UPSTREAM}/geoip/cn.mrs`],
];

async function fetchOne(url) {
  let lastErr;
  for (const wrap of MIRRORS) {
    const target = wrap(url);
    try {
      console.log(`downloading ${target}`);
      const res = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 64) throw new Error(`unexpectedly small payload (${buf.length} bytes)`);
      return buf;
    } catch (e) {
      lastErr = e;
      console.warn(`failed from ${target}: ${e.message ?? e}`);
    }
  }
  throw new Error(`all sources failed for ${url}: ${lastErr}`);
}

mkdirSync(outDir, { recursive: true });
for (const [name, url] of FILES) {
  const buf = await fetchOne(url);
  const dest = join(outDir, name);
  writeFileSync(dest, buf);
  console.log(`wrote ${dest} (${buf.length} bytes)`);
}
