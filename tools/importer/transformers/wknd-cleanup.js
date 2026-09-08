/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 *
 * Strips auto-populated AEM WCM chrome so the import contains only page-level
 * authorable content. All selectors are taken from the captured DOM in
 * migration-work/cleaned.html — none are guessed.
 *
 * Kept (authorable / mapped as blocks): breadcrumb (.cmp-breadcrumb ->
 * breadcrumb-nav), byline (.cmp-byline -> cards-contributor), and all main
 * content (titles, content fragments, teasers, carousels, tabs, accordions).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Adobe ID-syncing iframe (demdex) — non-authorable, remove before parsing
    // so it never interferes with block matching.
    // Found in cleaned.html: <iframe id="destination_publishing_iframe_..." ...>
    WebImporter.DOMUtils.remove(element, ['iframe']);
  }

  if (hookName === TransformHook.afterTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Global header experience fragment: sign-in buttons, language navigation,
      // logo, main navigation, and site search.
      // Found in cleaned.html (line 5): <header class="experiencefragment cmp-experiencefragment--header ...">
      'header',
      // Global footer experience fragment: footer nav, follow-us, copyright.
      // Found in cleaned.html (line 378): <footer class="experiencefragment cmp-experiencefragment--footer ...">
      'footer',
      // Article "share this story" / "up next" related-content rail.
      // Found in cleaned.html (line 330): <aside class="container responsivegrid cmp-layoutcontainer--sidebar ...">
      'aside.cmp-layoutcontainer--sidebar',
      // Mobile navigation chrome.
      // Found in cleaned.html (line 481): <div id="toggleNav">
      '#toggleNav',
      // Found in cleaned.html (line 487): <div id="mobileNav" class="cmp-navigation--mobile">
      '#mobileNav',
    ]);
  }
}
