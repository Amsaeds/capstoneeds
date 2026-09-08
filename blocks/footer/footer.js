/**
 * Fetch the footer fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * @returns {Promise<Document|null>} parsed fragment document
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const footer = document.createElement('div');
  while (fragment.body.firstElementChild) footer.append(fragment.body.firstElementChild);

  // label the three content sections: brand/nav, social, legal
  const classes = ['footer-brand', 'footer-social', 'footer-legal'];
  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(c);
  });

  block.append(footer);
}
