/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns.
 * Source: https://wknd.site/ (featured teaser rendered as a two-column layout).
 * Structure: Columns block. Row 1 = block name. Row 2 has 2 cells:
 *   [ text cell (pretitle, title, description, CTA), image cell ].
 */
export default function parse(element, { document }) {
  const pretitle = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"]');
  const title = element.querySelector('.cmp-teaser__title, [class*="teaser__title"], h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description, [class*="teaser__description"]');
  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link, a[class*="action-link"]'));
  const img = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  const textCell = [];
  if (pretitle && pretitle.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = pretitle.textContent.trim();
    textCell.push(p);
  }
  if (title) {
    const h = document.createElement('h2');
    h.textContent = title.textContent.trim();
    textCell.push(h);
  }
  if (description && description.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = description.textContent.trim();
    textCell.push(p);
  }
  ctas.forEach((cta) => {
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = cta.textContent.trim();
    textCell.push(a);
  });

  // Empty-block guard.
  if (!textCell.length && !img) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Two columns: text and image.
  const cells = [[textCell.length ? textCell : '', img || '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
