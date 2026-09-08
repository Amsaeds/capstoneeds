/*
 * Breadcrumb (breadcrumb-nav) variant.
 *
 * NOTE: No vanilla "breadcrumb" block exists in the configured block library,
 * so this is a minimal implementation created for the adventure-detail template.
 * Authoring model: each row of the block is one crumb. A crumb that is a link
 * renders as a link; a plain-text crumb (typically the last one) renders as the
 * current/active page. Review and refine before production use.
 */
export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  ol.className = 'breadcrumb-nav-list';

  [...block.children].forEach((row) => {
    const cell = row.firstElementChild || row;
    const li = document.createElement('li');
    li.className = 'breadcrumb-nav-item';

    const link = cell.querySelector('a');
    if (link) {
      li.append(link);
    } else {
      li.classList.add('breadcrumb-nav-item-active');
      li.setAttribute('aria-current', 'page');
      li.textContent = cell.textContent.trim();
    }
    ol.append(li);
  });

  block.textContent = '';
  nav.append(ol);
  block.append(nav);
}
