/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-filter. Base: tabs.
 * Source: https://wknd.site/us/en/adventures.html (tabbed filter of adventure lists).
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

    const contentCell = [];
    if (panel) {
      Array.from(panel.childNodes).forEach((node) => contentCell.push(node));
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-filter', cells });
  element.replaceWith(block);
}
