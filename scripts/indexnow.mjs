#!/usr/bin/env node
/**
 * Push every sitemap URL to IndexNow.
 *
 * IndexNow is the pull-free half of Bing-world indexing: instead of waiting for
 * a crawler to rediscover the sitemap, the site announces its URLs and the
 * shared endpoint fans them out to Bing, Seznam, Naver and Yandex. It is not a
 * substitute for Bing Webmaster Tools — it moves URLs, not dashboards — but it
 * works with no account, which matters because the Webmaster import needs an
 * interactive login this repo cannot do.
 *
 * The protocol: a key file at https://<host>/<key>.txt proves control of the
 * host (the key is public BY DESIGN — the file's existence is the proof, so
 * committing it is correct, not a leak), then a POST carries up to 10,000 URLs.
 * The endpoint answers 200 or 202 for accepted; 403 means it fetched the key
 * file and could not — so never run this before the key file is deployed.
 *
 * Usage: npm run indexnow      (after the key file is live on production)
 */

const HOST = "dandak.vercel.app";
const KEY = "d59dc7e620e34bf9e61461e0e7aff8dc";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// the key file must be live first, or the endpoint rejects the whole batch
const keyRes = await fetch(KEY_LOCATION);
const keyBody = (await keyRes.text()).trim();
if (!keyRes.ok || keyBody !== KEY) {
  console.error(`key file not live at ${KEY_LOCATION} (http ${keyRes.status}); deploy first`);
  process.exit(1);
}

const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) {
  console.error("sitemap yielded no URLs; refusing to submit an empty list");
  process.exit(1);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});

console.log(`indexnow: submitted ${urlList.length} URLs -> http ${res.status} ${res.statusText}`);
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
