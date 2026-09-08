/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-info. Base: tabs.
 * Source: https://wknd.site/ca/en/adventures/bali-surf-camp.html (trip info tabs).
 * Structure: 2 columns. Row 1 = block name. Each subsequent row = one tab:
 *   [ tab label cell, tab content cell (the panel's contents) ].
 */
export default function parse(element, { document }) {
  const labels = Array.from(element.querySelectorAll('.cmp-tabs__tab, [class*="tabs__tab"]:not([class*="tabpanel"]):not([class*="tablist"])'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel, [class*="tabpanel"]'));

  const cells = [];

  labels.forEach((label, i) => {
    const labelText = label.textContent.trim();
    const panel = panels[i];

    // Prefer the content fragment body; fall back to the whole panel.
    let contentSource = panel;
    if (panel) {
      const inner = panel.querySelector('.cmp-contentfragment__elements, [class*="contentfragment__elements"]');
      if (inner) contentSource = inner;
    }

    const contentCell = [];
    if (contentSource) {
      Array.from(contentSource.childNodes).forEach((node) => contentCell.push(node));
    }

    if (labelText || contentCell.length) {
      const labelCell = document.createElement('p');
      labelCell.textContent = labelText;
      cells.push([labelCell, contentCell.length ? contentCell : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-info', cells });
  element.replaceWith(block);
}
