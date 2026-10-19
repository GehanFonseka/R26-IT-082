export const remainingPageTime = (deadline) => Math.max(1, deadline - Date.now());

export async function waitForCertificatePageLoad(page, deadline, requireContent = false) {
  await page.waitForLoadState("load", { timeout: remainingPageTime(deadline) });
  try {
    // Certificate pages can keep analytics requests alive after their content is ready.
    await page.waitForLoadState("networkidle", { timeout: Math.min(1200, remainingPageTime(deadline)) });
  } catch (error) {
    if (error.name !== "TimeoutError" || Date.now() >= deadline) throw error;
  }
  if (requireContent) await page.waitForFunction(() => {
    if (document.body?.innerText.trim()) return true;
    return [...document.querySelectorAll("img, canvas, svg, iframe")].some((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width >= 100 && rect.height >= 100 && style.visibility !== "hidden" && style.display !== "none"
        && (element.tagName !== "IMG" || element.naturalWidth > 0);
    });
  }, null, { timeout: remainingPageTime(deadline) });
  await page.waitForFunction(() => [...document.images].every((image) => {
    const rect = image.getBoundingClientRect();
    return rect.bottom <= 0 || rect.top >= innerHeight || image.complete;
  }), null, { timeout: remainingPageTime(deadline) });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight && image.naturalWidth > 0;
    }).map((image) => image.decode().catch(() => {})));
  });
}
