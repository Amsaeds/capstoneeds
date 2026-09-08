import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Read "key | value" configuration rows from the block, then remove them.
 * Supported keys: path (prefix filter), limit (max cards), exclude (path to skip),
 * tabs (comma-separated category labels — renders a filter tab bar).
 * @param {Element} block
 * @returns {{path:string, limit:number, exclude:string, tabs:string[]}}
 */
function readConfig(block) {
  const cfg = {
    path: '', limit: 0, exclude: '', tabs: [],
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
  });
  return cfg;
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
  // description intentionally omitted — cards show image + title only (per design)
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

  const ul = document.createElement('ul');
  rows.forEach((row) => ul.append(buildCard(row)));

  if (cfg.tabs.length > 0) {
    block.append(buildTabs(cfg.tabs, ul));
  }
  block.append(ul);
}
