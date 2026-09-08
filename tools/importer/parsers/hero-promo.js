/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-promo. Base: hero.
 * Source: https://wknd.site/ (imagebottom teaser) and
 *   https://wknd.site/us/en/adventures.html (hero teaser).
 * Structure: 1 column, up to 3 rows. Row 1 = block name.
 *   Row 2 = background image (optional). Row 3 = text cell (title heading + subheading + CTA).
 */
export default function parse(element, { document }) {
  const img = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  const title = element.querySelector('.cmp-teaser__title, [class*="teaser__title"], h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description, [class*="teaser__description"]');
  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link, a[class*="action-link"]'));

  const textCell = [];
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
  if (!img && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single-column block: each row has exactly one cell.
  const cells = [];
  if (img) cells.push([img]);
  if (textCell.length) cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo', cells });
  element.replaceWith(block);
}
