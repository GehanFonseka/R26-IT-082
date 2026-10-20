import { chromium } from "playwright";
import { env } from "../config/env.js";
import { downloadCertificate } from "./certificateDownload.js";
import { readVisibleCertificateText } from "./certificateVisibleText.js";
import { remainingPageTime, waitForCertificatePageLoad } from "./certificatePageLoad.js";
import { certificateGraphqlBody } from "../utils/certificateGraphql.js";

let active = 0;
export async function renderCertificatePage(file, options = {}) {
  if (!file.sourceUrl) throw new Error("A public page URL is required for visual certificate reading.");
  if (active >= env.certificateBrowserMaxJobs) throw new Error("The certificate page reader is busy. Please try again.");
  active += 1;
  let browser;
  let timer;
  let expired = false;
  try {
    browser = await (options.browserType || chromium).launch({
      headless: true, channel: "chromium", timeout: 15000,
      ...(env.certificateBrowserExecutable ? { executablePath: env.certificateBrowserExecutable } : {}),
      args: ["--disable-background-networking", "--disable-quic", "--force-webrtc-ip-handling-policy=disable_non_proxied_udp"],
      env: Object.fromEntries(["PATH", "SystemRoot", "WINDIR", "TEMP", "TMP", "HOME", "USERPROFILE", "LOCALAPPDATA"].filter((key) => process.env[key]).map((key) => [key, process.env[key]])),
    });
    const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, serviceWorkers: "block", acceptDownloads: false });
    const deadline = Date.now() + env.certificateBrowserTimeoutMs;
    timer = setTimeout(() => { expired = true; void context.close().catch(() => {}); }, env.certificateBrowserTimeoutMs);
    await context.routeWebSocket(/.*/, (socket) => socket.close());
    const page = await context.newPage();
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const pageFile = Object.hasOwn(file, "requestUserAgent") && file.requestUserAgent !== userAgent
      ? await (options.download || downloadCertificate)(file.sourceUrl, { userAgent, timeoutMs: remainingPageTime(deadline) }) : file;
    const pageUrl = new URL(pageFile.sourceUrl);
    const publicCertificateId = pageUrl.hostname === "learn.mongodb.com" ? pageUrl.pathname.match(/^\/c\/([^/]+)\/?$/)?.[1] || "" : "";
    let requests = 0;
    let bytes = 0;
    let resourceLimitReached = false;
    const documents = [];
    await context.route("**/*", async (route) => {
      try {
        const request = route.request();
        const headers = request.headers();
        const graphqlBody = request.method() === "POST" && new URL(request.url()).origin === pageUrl.origin
          && /\/graphql\/?$/.test(new URL(request.url()).pathname) ? certificateGraphqlBody(request.postData(), publicCertificateId) : null;
        if (request.method() !== "GET" && !graphqlBody) return await route.abort();
        if (++requests > env.certificateBrowserMaxRequests) { resourceLimitReached = true; return await route.abort(); }
        const result = request.url() === pageFile.sourceUrl ? pageFile : await (options.download || downloadCertificate)(request.url(), {
          timeoutMs: remainingPageTime(deadline), userAgent, origin: headers.origin, accept: headers.accept,
          acceptLanguage: headers["accept-language"], requestedWith: headers["x-requested-with"],
          ...(graphqlBody ? { graphqlBody, publicCertificateId, nonce: headers.nonce } : {}),
        });
        bytes += result.buffer.length;
        if (bytes > 32 * 1024 * 1024) { resourceLimitReached = true; return await route.abort(); }
        if (result.buffer.subarray(0, 5).toString() === "%PDF-" && documents.length < 3
          && !documents.some((document) => document.sourceUrl === result.sourceUrl)) documents.push(result);
        await route.fulfill({ status: 200, contentType: result.mimeType || "application/octet-stream", headers: result.browserHeaders, body: result.buffer });
      } catch { await route.abort().catch(() => {}); }
    });
    page.setDefaultTimeout(3000);
    await page.goto(pageFile.sourceUrl, { waitUntil: "load", timeout: remainingPageTime(deadline) });
    await waitForCertificatePageLoad(page, deadline, true);
    const accessText = await page.evaluate(() => `${document.title}\n${document.body?.innerText || ""}`.slice(0, 20000));
    if (/verify (?:you are|you're) human|checking your browser|access denied|unusual traffic|complete the captcha|enable javascript and cookies to continue/i.test(accessText)) {
      throw new Error("The certificate website blocked inspection or requires CAPTCHA. Open the public certificate link and try again.");
    }
    const images = [];
    const texts = [];
    let complete = false;
    let y = 0;
    for (let index = 0; index < env.certificateBrowserMaxScreens; index += 1) {
      await page.evaluate((offset) => window.scrollTo(0, offset), y);
      await waitForCertificatePageLoad(page, deadline);
      const data = await page.screenshot({ type: "jpeg", quality: 85, animations: "disabled", timeout: remainingPageTime(deadline) });
      images.push({ data: data.toString("base64"), mimeType: "image/jpeg" });
      texts.push(await readVisibleCertificateText(page));
      complete = await page.evaluate(() => scrollY + innerHeight >= Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - 2);
      if (complete) break;
      y = await page.evaluate(() => scrollY + Math.floor(innerHeight * 0.8));
    }
    const unreadableImages = await page.evaluate(() => [...document.images].some((image) => {
      const rect = image.getBoundingClientRect();
      const label = [image.alt, image.className, image.id, image.src].join(" ");
      return (rect.width >= 200 && rect.height >= 150 || /certificate|credential|diploma/i.test(label)) && image.naturalWidth === 0;
    }));
    return { html: await page.content(), sourceUrl: page.url(), images, documents,
      rawText: texts.map((text, index) => `SCREENSHOT ${index + 1}:\n${text}`).join("\n\n").slice(0, 30000),
      complete: complete && !unreadableImages && !resourceLimitReached };
  } catch (error) {
    if (expired || error.name === "TimeoutError") throw new Error("The certificate page did not finish loading within the allowed time. Please try again.");
    if (/blocked inspection|CAPTCHA/.test(error.message)) throw error;
    if (/Executable doesn't exist/.test(error.message)) throw new Error("The certificate browser is not installed. Install the service's Chromium browser and try again.");
    throw new Error("The public certificate page could not be opened for visual reading.");
  } finally {
    clearTimeout(timer);
    await browser?.close().catch(() => {});
    active -= 1;
  }
}
