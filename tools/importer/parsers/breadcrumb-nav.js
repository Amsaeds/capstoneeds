/* eslint-disable */
/* global WebImporter */
/**
 * Parser for breadcrumb-nav. Base: breadcrumb (no library convention — inferred from source).
 * Source: https://wknd.site/ca/en/adventures/bali-surf-camp.html
 * Structure: single-column block. One content cell holding the ordered list of breadcrumb
 *   items (links for ancestors, plain text for the active/current item).
 */
export default function parse(element, { document }) {
  // Prefer the direct children of the breadcrumb ordered list to avoid duplicate/hidden items.
  const listEl = element.querySelector('.cmp-breadcrumb__list, [class*="breadcrumb__list"], ol, ul');
  const items = listEl
    ? Array.from(listEl.querySelectorAll(':scope > li'))
    : Array.from(element.querySelectorAll('.cmp-breadcrumb__item, [class*="breadcrumb__item"]'));

  const list = document.createElement('ul');
  let prevText = null;

  items.forEach((item) => {
    const link = item.querySelector('a[href]');
    const text = item.textContent.trim();
    if (!text) return;
    // Skip consecutive duplicates (some locales render the same crumb twice).
    if (text === prevText) return;
    prevText = text;

    const li = document.createElement('li');
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = link.textContent.trim() || text;
      li.appendChild(a);
    } else {
      li.textContent = text;
    }
    list.appendChild(li);
  });

  // Empty-block guard.
  if (!list.children.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[list]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'breadcrumb-nav', cells });
  element.replaceWith(block);
}
