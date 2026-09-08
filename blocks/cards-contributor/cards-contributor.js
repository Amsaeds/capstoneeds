import { createOptimizedPicture } from '../../scripts/aem.js';

// Inline brand SVGs (single-color, inherit currentColor) keyed by network.
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.3 0-1.3-.1-2.45-.1-2.4 0-4.05 1.47-4.05 4.17v2.33H7.8V13h2.7v8h3z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 5.9c-.7.32-1.5.53-2.3.63a4 4 0 0 0 1.76-2.2c-.78.46-1.64.8-2.56.98a4 4 0 0 0-6.82 3.65A11.36 11.36 0 0 1 3.9 4.75a4 4 0 0 0 1.24 5.34c-.65-.02-1.26-.2-1.8-.5v.05a4 4 0 0 0 3.2 3.92c-.6.16-1.23.18-1.84.07a4 4 0 0 0 3.73 2.78A8.02 8.02 0 0 1 2 18.28a11.32 11.32 0 0 0 6.13 1.8c7.35 0 11.37-6.09 11.37-11.37v-.52A8.1 8.1 0 0 0 22 5.9z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 3.05A6.75 6.75 0 1 0 18.75 12 6.75 6.75 0 0 0 12 5.25zm0 11.13A4.38 4.38 0 1 1 16.38 12 4.38 4.38 0 0 1 12 16.38zm6.96-11.4a1.58 1.58 0 1 1-1.58-1.57 1.58 1.58 0 0 1 1.58 1.57z"/></svg>',
};

/**
 * Detect the social network from a link's text/href.
 * @param {HTMLAnchorElement} a
 * @returns {string|null}
 */
function detectNetwork(a) {
  const hay = `${a.textContent} ${a.getAttribute('href') || ''}`.toLowerCase();
  if (hay.includes('facebook')) return 'facebook';
  if (hay.includes('twitter')) return 'twitter';
  if (hay.includes('insta')) return 'instagram';
  return null;
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-contributor-card-image';
      else div.className = 'cards-contributor-card-body';
    });
    // tag the social row (a paragraph whose content is only links) and swap
    // each label for its inline SVG icon
    li.querySelectorAll('.cards-contributor-card-body p').forEach((p) => {
      const links = p.querySelectorAll('a');
      if (links.length >= 2 && p.textContent.trim() === [...links].map((a) => a.textContent.trim()).join(' ')) {
        p.className = 'cards-contributor-social';
        links.forEach((a) => {
          const network = detectNetwork(a);
          if (network && SOCIAL_ICONS[network]) {
            a.setAttribute('aria-label', a.textContent.trim() || network);
            a.innerHTML = SOCIAL_ICONS[network];
          }
        });
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
