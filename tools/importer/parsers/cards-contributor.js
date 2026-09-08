/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-contributor. Base: cards.
 * Source: https://wknd.site/us/en/magazine/*.html (byline) and
 *   content-landing contributor experience fragment.
 * Structure: 2 columns. Row 1 = block name. Each subsequent row = one contributor card:
 *   [ image cell, text cell (name heading + occupations/description) ].
 */
export default function parse(element, { document }) {
  // A contributor may be a single byline or a list of contributor fragments.
  let cardEls = Array.from(element.querySelectorAll('.cmp-byline, [class*="byline"]'));
  if (!cardEls.length) {
    cardEls = Array.from(element.querySelectorAll('.cmp-experience-fragment--contributor, [class*="contributor"]'));
  }
  // Fall back to treating the element itself as a single card.
  if (!cardEls.length) cardEls = [element];

  const cells = [];

  cardEls.forEach((card) => {
    const img = card.querySelector('img');

    // Name + occupations. In the experience fragment these are two separate
    // title components (.cmp-title__text); in the byline they are the name
    // heading + occupations paragraph.
    let name = card.querySelector('.cmp-byline__name');
    let occupationsText = '';
    const occEl = card.querySelector('.cmp-byline__occupations, [class*="occupation"]');
    if (occEl) occupationsText = occEl.textContent.trim();

    if (!name) {
      const titles = Array.from(card.querySelectorAll('.cmp-title__text, .cmp-title [class*="__text"]'));
      if (titles.length) {
        name = titles[0];
        if (!occupationsText && titles[1]) occupationsText = titles[1].textContent.trim();
      }
    }
    if (!name) name = card.querySelector('h1, h2, h3, h4');

    const textCell = [];
    if (name) {
      const h = document.createElement('h3');
      h.textContent = name.textContent.trim();
      textCell.push(h);
    }
    if (occupationsText) {
      const p = document.createElement('p');
      p.textContent = occupationsText;
      textCell.push(p);
    }

    // Only add a row if we have meaningful content.
    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-contributor', cells });
  element.replaceWith(block);
}
