/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-teaser. Base: cards.
 * Source: https://wknd.site/us/en/magazine.html (image-list).
 * Structure: 2 columns. Row 1 = block name. Each subsequent row = one card:
 *   [ image cell, text cell (title as linked heading + description) ].
 */
export default function parse(element, { document }) {
  // Select only the top-level list items. A broad [class*="image-list__item"]
  // would also match nested item-content/item-image/title-link elements.
  let items = Array.from(element.querySelectorAll('li.cmp-image-list__item, li[class*="image-list__item"]'));
  if (!items.length) {
    const listEl = element.matches('ul, ol') ? element : element.querySelector('ul, ol');
    items = listEl ? Array.from(listEl.querySelectorAll(':scope > li')) : [];
  }

  const cells = [];

  items.forEach((item) => {
    const img = item.querySelector('img');

    // Title link (preferred) or plain title text.
    const titleLink = item.querySelector('.cmp-image-list__item-title-link, a[class*="title-link"]');
    const titleSpan = item.querySelector('.cmp-image-list__item-title, [class*="item-title"]');
    const titleText = (titleSpan ? titleSpan.textContent : titleLink ? titleLink.textContent : '').trim();
    const href = titleLink ? titleLink.getAttribute('href') : (item.querySelector('a[href]') ? item.querySelector('a[href]').getAttribute('href') : null);

    const description = item.querySelector('.cmp-image-list__item-description, [class*="item-description"]');

    const textCell = [];
    if (titleText) {
      const h = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        h.appendChild(a);
      } else {
        h.textContent = titleText;
      }
      textCell.push(h);
    }
    if (description && description.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      textCell.push(p);
    }

    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-teaser', cells });
  element.replaceWith(block);
}
