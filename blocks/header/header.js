// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * @returns {Promise<Document|null>} parsed fragment document
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Toggle a dropdown/menu open state.
 * @param {Element} el element carrying aria-expanded
 * @param {boolean} [force] optional forced state
 */
function toggleExpanded(el, force) {
  const expanded = force !== undefined ? force : el.getAttribute('aria-expanded') === 'true';
  el.setAttribute('aria-expanded', expanded ? 'false' : 'true');
}

/**
 * Detect the current page's locale prefix (e.g. "/ca/en") from the path.
 * @returns {string} locale prefix, or '' when none
 */
function currentLocale() {
  const m = window.location.pathname.match(/^\/([a-z]{2})\/([a-z]{2})(?=\/|$)/);
  return m ? `/${m[1]}/${m[2]}` : '';
}

/**
 * Rewrite an in-site nav href to the current page's locale.
 * "/us/en/magazine" on a /ca/en page becomes "/ca/en/magazine".
 * @param {string} href
 * @param {string} locale current locale prefix
 * @returns {string}
 */
function localizeHref(href, locale) {
  if (!locale || !href.startsWith('/')) return href;
  const m = href.match(/^\/[a-z]{2}\/[a-z]{2}(\/.*)?$/);
  if (!m) return href;
  const rest = m[1] || '';
  return `${locale}${rest}`;
}

/**
 * Build the header search form.
 * @returns {Element}
 */
function buildSearch() {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/search';
  form.innerHTML = `
    <input type="search" name="q" aria-label="Search" placeholder="Search" />
    <button type="submit" aria-label="Submit search"><span class="nav-search-icon"></span></button>`;
  return form;
}

/**
 * loads and decorates the header nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');
  while (fragment.body.firstElementChild) nav.append(fragment.body.firstElementChild);

  // three sections: brand, sections (main nav), tools (sign-in + locale)
  ['brand', 'sections', 'tools'].forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const locale = currentLocale();

  // brand: strip button decoration from the logo link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a.button');
    if (brandLink) {
      brandLink.className = '';
      const container = brandLink.closest('.button-container');
      if (container) container.className = '';
    }
    const logoAnchor = navBrand.querySelector('a');
    if (logoAnchor && locale) logoAnchor.href = locale || '/';
  }

  // main nav: localize hrefs to the current locale + highlight current page
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const here = window.location.pathname;
    navSections.querySelectorAll(':scope a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href) a.href = localizeHref(href, locale);
      if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
    });
  }

  // tools: sign-in link + locale dropdown (moved to the top utility bar)
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const localeList = navTools.querySelector('ul');
    if (localeList) {
      const wrapper = document.createElement('div');
      wrapper.className = 'nav-locale';
      const current = localeList.querySelector(`a[href$="${locale || '/us/en'}"]`)
        || localeList.querySelector('a');
      const currentLabel = current ? current.textContent.trim() : 'en-US';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-locale-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-haspopup', 'true');
      toggle.textContent = currentLabel;
      localeList.classList.add('nav-locale-list');
      wrapper.append(toggle, localeList);
      navTools.append(wrapper);
      toggle.addEventListener('click', () => toggleExpanded(toggle));
      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) toggle.setAttribute('aria-expanded', 'false');
      });
    }
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  const hamburgerBtn = hamburger.querySelector('button');
  hamburgerBtn.addEventListener('click', () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    hamburgerBtn.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // search sits in the main bar (with brand + sections)
  if (navSections) navSections.append(buildSearch());

  isDesktop.addEventListener('change', () => {
    nav.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Open navigation');
    document.body.style.overflowY = '';
    const localeToggle = nav.querySelector('.nav-locale-toggle');
    if (localeToggle) localeToggle.setAttribute('aria-expanded', 'false');
  });

  // group the main-bar items (hamburger + brand + sections) into one row so the
  // black utility bar (tools) can sit above it as a separate full-width band
  const mainRow = document.createElement('div');
  mainRow.className = 'nav-main-row';
  [nav.querySelector('.nav-hamburger'), navBrand, navSections]
    .filter(Boolean)
    .forEach((el) => mainRow.append(el));
  nav.append(mainRow);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
