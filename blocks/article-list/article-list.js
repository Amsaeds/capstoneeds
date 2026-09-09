import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Read "key | value" configuration rows from the block, then remove them.
 * Supported keys: path (prefix filter), limit (max cards), exclude (path to skip),
 * tabs (comma-separated category labels — renders a filter tab bar),
 * mode ("share" renders a "Share This Story" title+date list, no images).
 * @param {Element} block
 * @returns {{path:string, limit:number, exclude:string, tabs:string[], mode:string}}
 */
function readConfig(block) {
  const cfg = {
    path: '', limit: 0, exclude: '', tabs: [], mode: '',
  };
  [...block.children].forEach((row) => {
    const cells = row.children;
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase();
    const value = cells[1].textContent.trim();
    if (key === 'path') cfg.path = value;
    else if (key === 'limit') cfg.limit = parseInt(value, 10) || 0;
    else if (key === 'exclude') cfg.exclude = value;
    else if (key === 'tabs') cfg.tabs = value.split(',').map((t) => t.trim()).filter(Boolean);
    else if (key === 'mode') cfg.mode = value.toLowerCase();
  });
  return cfg;
}

/**
 * Format an index date value (seconds/ms epoch or parseable string) as
 * "Weekday, D Mon YYYY" (matching WKND). Returns '' when unavailable.
 * @param {string|number} value
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return '';
  let d;
  const num = Number(value);
  if (!Number.isNaN(num) && num > 0) {
    // query-index dates are epoch seconds
    d = new Date(num < 1e12 ? num * 1000 : num);
  } else {
    d = new Date(value);
  }
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  });
}

/**
 * Fetch a page's <meta name="date"> value (fallback when the query index does
 * not carry a date column). Returns '' on any failure.
 * @param {string} path
 * @returns {Promise<string>}
 */
async function fetchPageDate(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return '';
    const html = await resp.text();
    const m = html.match(/<meta\s+name="date"\s+content="([^"]*)"/i);
    return m ? m[1] : '';
  } catch (e) {
    return '';
  }
}

/**
 * Build one "share this story" row (title + optional date, no image).
 * The date span is populated later (async) when a date is available.
 * @param {{path:string, title:string, date:string}} row
 * @returns {Element}
 */
function buildShareItem(row) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = row.path;
  a.className = 'article-list-share-link';
  const title = document.createElement('span');
  title.className = 'article-list-share-title';
  title.textContent = row.title || '';
  a.append(title);
  const date = document.createElement('span');
  date.className = 'article-list-share-date';
  const dateText = formatDate(row.date);
  if (dateText) date.textContent = dateText;
  else date.hidden = true;
  a.append(date);
  li.append(a);
  return li;
}

/**
 * Fetch and cache the site query index.
 * @returns {Promise<Array>} index rows (empty array when unavailable)
 */
async function fetchIndex() {
  try {
    const resp = await fetch('/query-index.json');
    if (!resp.ok) return [];
    const json = await resp.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (e) {
    return [];
  }
}

/**
 * Build one card element from an index row (image + title only).
 * @param {{path:string, title:string, image:string, category:string}} row
 * @returns {Element}
 */
function buildCard(row) {
  const li = document.createElement('li');
  if (row.category) li.dataset.category = row.category.toLowerCase();

  if (row.image) {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'article-list-card-image';
    const pic = createOptimizedPicture(row.image, row.title || '', false, [{ width: '750' }]);
    const a = document.createElement('a');
    a.href = row.path;
    a.append(pic);
    imgWrap.append(a);
    li.append(imgWrap);
  }

  const body = document.createElement('div');
  body.className = 'article-list-card-body';
  if (row.title) {
    const title = document.createElement('a');
    title.href = row.path;
    title.className = 'article-list-card-title';
    title.textContent = row.title;
    body.append(title);
  }
  if (row.description) {
    const desc = document.createElement('p');
    desc.className = 'article-list-card-description';
    desc.textContent = row.description;
    body.append(desc);
  }
  li.append(body);
  return li;
}

/**
 * Build the category filter tab bar. Clicking a tab toggles card visibility
 * by the card's data-category; "All" shows everything.
 * @param {string[]} categories
 * @param {Element} ul the card list to filter
 * @returns {Element}
 */
function buildTabs(categories, ul) {
  const nav = document.createElement('div');
  nav.className = 'article-list-tabs';
  const labels = ['All', ...categories];
  labels.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.addEventListener('click', () => {
      nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');
      const cat = label.toLowerCase();
      ul.querySelectorAll(':scope > li').forEach((li) => {
        li.hidden = !(label === 'All' || li.dataset.category === cat);
      });
    });
    nav.append(btn);
  });
  return nav;
}

export default async function decorate(block) {
  const cfg = readConfig(block);
  block.textContent = '';

  const index = await fetchIndex();
  const here = window.location.pathname;

  let rows = index.filter((row) => {
    if (!row.path) return false;
    if (cfg.path && !row.path.startsWith(cfg.path)) return false;
    if (cfg.exclude && row.path.startsWith(cfg.exclude)) return false;
    if (row.path === here || row.path === cfg.path || row.path === `${cfg.path}/`) return false;
    return true;
  });

  if (cfg.limit > 0) rows = rows.slice(0, cfg.limit);

  if (rows.length === 0) {
    block.classList.add('article-list-empty');
    return;
  }

  if (cfg.mode === 'share') {
    block.classList.add('article-list-share');
    const heading = document.createElement('p');
    heading.className = 'article-list-share-heading';
    heading.textContent = 'Share This Story';
    const ul = document.createElement('ul');
    rows.forEach((row) => ul.append(buildShareItem(row)));
    block.append(heading, ul);
    // fill in dates the query index lacks by reading each page's date meta
    rows.forEach(async (row, i) => {
      if (formatDate(row.date)) return;
      const dateEl = ul.children[i]?.querySelector('.article-list-share-date');
      if (!dateEl) return;
      const text = formatDate(await fetchPageDate(row.path));
      if (text) {
        dateEl.textContent = text;
        dateEl.hidden = false;
      }
    });
    return;
  }

  const ul = document.createElement('ul');
  rows.forEach((row) => ul.append(buildCard(row)));

  if (cfg.tabs.length > 0) {
    block.append(buildTabs(cfg.tabs, ul));
  }
  block.append(ul);
}
