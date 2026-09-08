/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Source: https://wknd.site/us/en/faqs.html
 * Structure: 2 columns. Row 1 = block name. Each subsequent row = one accordion item
 *   [ title cell, content cell ].
 */
export default function parse(element, { document }) {
  // Each accordion item: header title + expandable panel content.
  const items = Array.from(element.querySelectorAll('.cmp-accordion__item, [class*="accordion__item"]'));

  const cells = [];

  items.forEach((item) => {
    // Title: the visible label inside the header button.
    const titleEl = item.querySelector('.cmp-accordion__title, [class*="accordion__title"], .cmp-accordion__button, [class*="accordion__button"], .cmp-accordion__header, h3, h2');
    const titleText = titleEl ? titleEl.textContent.trim() : '';

    // Content: the panel body. Prefer inner text container, fall back to whole panel.
    const panel = item.querySelector('.cmp-accordion__panel, [class*="accordion__panel"]');
    let contentSource = panel;
    if (panel) {
      const inner = panel.querySelector('.cmp-text, [class*="cmp-text"], .text');
      if (inner) contentSource = inner;
    }

    const contentCell = [];
    if (contentSource) {
      Array.from(contentSource.childNodes).forEach((node) => contentCell.push(node));
    }

    // Only add a row if we have a title (mandatory) or some content.
    if (titleText || contentCell.length) {
      const titleCell = document.createElement('p');
      titleCell.textContent = titleText;
      cells.push([titleCell, contentCell.length ? contentCell : '']);
    }
  });

  // Empty-block guard: nothing extracted.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
