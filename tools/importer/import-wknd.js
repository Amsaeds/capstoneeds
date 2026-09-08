/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionFaqParser from './parsers/accordion-faq.js';
import breadcrumbNavParser from './parsers/breadcrumb-nav.js';
import cardsContributorParser from './parsers/cards-contributor.js';
import cardsTeaserParser from './parsers/cards-teaser.js';
import carouselHeroParser from './parsers/carousel-hero.js';
import carouselImageParser from './parsers/carousel-image.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import heroPromoParser from './parsers/hero-promo.js';
import tabsFilterParser from './parsers/tabs-filter.js';
import tabsInfoParser from './parsers/tabs-info.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'accordion-faq': accordionFaqParser,
  'breadcrumb-nav': breadcrumbNavParser,
  'cards-contributor': cardsContributorParser,
  'cards-teaser': cardsTeaserParser,
  'carousel-hero': carouselHeroParser,
  'carousel-image': carouselImageParser,
  'columns-featured': columnsFeaturedParser,
  'hero-promo': heroPromoParser,
  'tabs-filter': tabsFilterParser,
  'tabs-info': tabsInfoParser,
};

// TRANSFORMER REGISTRY (site-wide)
const transformers = [cleanupTransformer];

// ALL PAGE TEMPLATES — embedded from tools/importer/page-templates.json.
// Each URL routes to the matching template's block list.
const PAGE_TEMPLATES = [
  {
    name: 'homepage',
    urls: ['https://wknd.site/', 'https://wknd.site/ca/en.html', 'https://wknd.site/ca/fr.html', 'https://wknd.site/ch/de.html', 'https://wknd.site/ch/fr.html', 'https://wknd.site/ch/it.html', 'https://wknd.site/de/de.html', 'https://wknd.site/es/es.html', 'https://wknd.site/fr/fr.html', 'https://wknd.site/it/it.html', 'https://wknd.site/us/en.html', 'https://wknd.site/us/es.html'],
    blocks: [
      { name: 'carousel-hero', instances: ['.carousel.cmp-carousel--hero', '.cmp-carousel--hero'] },
      { name: 'columns-featured', instances: ['.teaser.cmp-teaser--featured', '.cmp-teaser--featured'] },
      { name: 'cards-teaser', instances: ['.image-list', '.cmp-image-list'] },
      { name: 'hero-promo', instances: ['.teaser.cmp-teaser--hero.cmp-teaser--imagebottom', '.cmp-teaser--imagebottom'] },
    ],
  },
  {
    name: 'content-landing',
    urls: ['https://wknd.site/ca/en/about-us.html', 'https://wknd.site/ca/en/magazine.html', 'https://wknd.site/ca/en/magazine/members-only.html', 'https://wknd.site/us/en/about-us.html', 'https://wknd.site/us/en/magazine.html'],
    blocks: [
      { name: 'cards-contributor', instances: ['.cmp-experience-fragment--contributor', '.experiencefragment.cmp-experience-fragment--contributor'] },
    ],
  },
  {
    name: 'adventure-detail',
    urls: ['https://wknd.site/ca/en/adventures/bali-surf-camp.html', 'https://wknd.site/us/en/adventures/bali-surf-camp.html'],
    blocks: [
      { name: 'breadcrumb-nav', instances: ['.breadcrumb.cmp-breadcrumb--fixed', '.cmp-breadcrumb'] },
      { name: 'carousel-image', instances: ['.carousel.cmp-carousel--mini', '.cmp-carousel--mini'] },
      { name: 'tabs-info', instances: ['.tabs.panelcontainer', '.cmp-tabs'] },
    ],
  },
  {
    name: 'adventures-listing',
    urls: ['https://wknd.site/ca/en/adventures.html', 'https://wknd.site/us/en/adventures.html'],
    blocks: [
      { name: 'hero-promo', instances: ['.teaser.cmp-teaser--hero', '.cmp-teaser--hero'] },
      { name: 'tabs-filter', instances: ['.tabs.panelcontainer', '.cmp-tabs'] },
      { name: 'cards-teaser', instances: ['.image-list', '.cmp-image-list'] },
    ],
  },
  {
    name: 'faq',
    urls: ['https://wknd.site/ca/en/faqs.html', 'https://wknd.site/us/en/faqs.html'],
    blocks: [
      { name: 'accordion-faq', instances: ['.accordion.panelcontainer', '.cmp-accordion'] },
    ],
  },
  {
    name: 'magazine-article',
    urls: ['https://wknd.site/ca/en/magazine/arctic-surfing.html', 'https://wknd.site/us/en/magazine/arctic-surfing.html'],
    blocks: [
      { name: 'breadcrumb-nav', instances: ['.breadcrumb.cmp-breadcrumb--fixed', '.breadcrumb', '.cmp-breadcrumb'] },
      { name: 'cards-contributor', instances: ['.byline', '.cmp-byline', '.cmp-experience-fragment--contributor'] },
    ],
  },
];

/**
 * Pick the template for a given URL. Match by exact URL membership first;
 * fall back to a path-shape heuristic so unseen sibling pages still route.
 */
function selectTemplate(url) {
  const u = new URL(url);
  const href = `${u.origin}${u.pathname}`;
  const exact = PAGE_TEMPLATES.find((t) => t.urls.some((tu) => {
    const p = new URL(tu);
    return `${p.origin}${p.pathname}` === href;
  }));
  if (exact) return exact;

  const path = u.pathname;
  if (path === '/' || /\/[a-z]{2}(\/[a-z]{2})?\.html$/.test(path)) return byName('homepage');
  if (/\/adventures\/[^/]+\.html$/.test(path)) return byName('adventure-detail');
  if (/\/adventures\.html$/.test(path)) return byName('adventures-listing');
  if (/\/faqs\.html$/.test(path)) return byName('faq');
  if (/\/magazine\/.+\.html$/.test(path)) return byName('magazine-article');
  if (/\/(about-us|magazine)\.html$/.test(path)) return byName('content-landing');
  return byName('homepage');
}

function byName(name) {
  return PAGE_TEMPLATES.find((t) => t.name === name);
}

function executeTransformers(hookName, element, payload) {
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, payload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        // Avoid double-registering the same element under multiple selectors.
        if (pageBlocks.some((b) => b.element === element)) return;
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const originalURL = (params && params.originalURL) || url;
    const main = document.body;

    const template = selectTemplate(originalURL);

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. find + parse blocks for this template
    const pageBlocks = findBlocksOnPage(document, template);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced
      const parser = parsers[block.name];
      if (!parser) {
        console.warn(`No parser for block: ${block.name}`);
        return;
      }
      try {
        parser(block.element, { document, url, params });
      } catch (e) {
        console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
      }
    });

    // 3. afterTransform cleanup
    executeTransformers('afterTransform', main, payload);

    // 4. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, originalURL);

    // 5. path — map root to /index (empty path crashes the bundled importer)
    const rawPath = new URL(originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: template.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
