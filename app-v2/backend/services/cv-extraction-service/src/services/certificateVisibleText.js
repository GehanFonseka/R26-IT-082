export async function readVisibleCertificateText(page) {
  return page.evaluate(() => {
    const pieces = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      const text = node.textContent.trim();
      if (!text || !parent || parent.closest("nav,header,footer,form,script,style,[hidden],[aria-hidden='true']")) continue;
      const sidebar = parent.closest("aside");
      if (sidebar && !/\bcertificate\s+recipient\b/i.test(sidebar.innerText)) continue;
      if (!parent.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const visible = [...range.getClientRects()].some((rect) => rect.width > 0 && rect.height > 0
        && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth);
      if (visible) pieces.push(text);
    }
    return pieces.join("\n").slice(0, 2500);
  });
}
