/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://wknd.site/ (hero carousel of teaser slides).
 * Structure: 2 columns. Row 1 = block name. Each subsequent row = one slide:
 *   [ image cell, text cell (title heading + description + CTA link) ].
 */
export default function parse(element, { document }) {
  const slides = Array.from(element.querySelectorAll('.cmp-carousel__item, [class*="carousel__item"]'));

  const cells = [];

  slides.forEach((slide) => {
    const img = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');

    const title = slide.querySelector('.cmp-teaser__title, [class*="teaser__title"], h1, h2, h3');
    const description = slide.querySelector('.cmp-teaser__description, [class*="teaser__description"]');
    const ctas = Array.from(slide.querySelectorAll('.cmp-teaser__action-link, a[class*="action-link"]'));

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

    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
