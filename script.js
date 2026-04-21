/**
 * initStickyScroll
 *
 * @param {object} config
 * @param {Element}   config.scroller           - The scrolling container element
 * @param {Element}   config.header             - The header element (hides/shows on mobile scroll)
 * @param {Element}   config.headerPlaceholder  - Holds space when header goes fixed on mobile
 * @param {Element}   config.trigger            - Scroll point where sticky behaviour activates
 * @param {Element}   config.hideTrigger        - Scroll point where box hides on mobile scroll-down
 * @param {Array}     config.stickyElements     - Array of { box, placeholder } objects.
 *                                                Pass one per breakpoint variant (desktop / mobile).
 *                                                The script detects which one is visible and drives
 *                                                only that element at any given time.
 * @param {number}   [config.mobileBreakpoint=768] - px width below which mobile behaviour applies
 */
function initStickyScroll({
  scroller,
  header,
  headerPlaceholder,
  trigger,
  hideTrigger,
  stickyElements = [],
  mobileBreakpoint = 768,
}) {
  // ─── state ────────────────────────────────────────────────────────────────
  let lastScrollY = 0;
  let isFixed = false;
  let showTimeout = null;

  // Measured at init and on every resize.
  let headerH = 0;
  let activeBox = null;         // currently-visible box element
  let activePlaceholder = null;
  let activeBoxH = 0;
  let triggerOffset = 0;
  let hideOffset = 0;

  // ─── helpers ──────────────────────────────────────────────────────────────

  function isMobile() {
    return window.innerWidth < mobileBreakpoint;
  }

  /** Returns true when an element is rendered and takes up space. */
  function isVisible(el) {
    return el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0;
  }

  /**
   * Walk stickyElements and return the first one whose box is currently visible.
   * Falls back to the last entry so there is always something to work with.
   */
  function resolveActiveElement() {
    for (const entry of stickyElements) {
      if (isVisible(entry.box)) return entry;
    }
    return stickyElements[stickyElements.length - 1] ?? null;
  }

  function measureAndApply() {
    headerH = header.getBoundingClientRect().height;

    const entry = resolveActiveElement();
    if (!entry) return;

    // If the active element changed (e.g. breakpoint crossed), clean up the old one.
    if (entry.box !== activeBox) {
      if (activeBox) {
        activeBox.classList.remove("fixed", "hidden");
        activeBox.style.top = "";
      }
      if (activePlaceholder) {
        activePlaceholder.classList.remove("active");
      }
      isFixed = false;
    }

    activeBox = entry.box;
    activePlaceholder = entry.placeholder;
    activeBoxH = activeBox.getBoundingClientRect().height;

    // Push CSS vars so purely-CSS consumers (placeholder height, content padding) stay in sync.
    const root = document.documentElement;
    root.style.setProperty("--header-h", headerH + "px");
    root.style.setProperty("--box-h", activeBoxH + "px");
    root.style.setProperty("--top-offset", (headerH + activeBoxH) + "px");

    // Re-read scroll thresholds after layout settles.
    triggerOffset = trigger.offsetTop;
    hideOffset = hideTrigger.offsetTop;
  }

  // ─── reset when going back to desktop ─────────────────────────────────────

  function resetMobileState() {
    header.classList.remove("hidden");
    if (isFixed && activeBox) {
      activeBox.classList.remove("hidden");
      activeBox.style.top = "0px";
    }
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }
  }

  // ─── scroll handler ────────────────────────────────────────────────────────

  function onScroll() {
    if (!activeBox) return;

    const scrollY = scroller.scrollTop;
    const scrollingDown = scrollY > lastScrollY;
    const mobile = isMobile();

    // ── Header (mobile only) ──────────────────────────────────────
    if (mobile) {
      header.classList.toggle("hidden", scrollingDown);
    }

    // ── Become fixed ──────────────────────────────────────────────
    if (!isFixed && scrollY >= triggerOffset) {
      activePlaceholder.classList.add("active");
      activeBox.classList.add("fixed");
      isFixed = true;
    }

    if (isFixed && scrollY < triggerOffset - headerH) {
      activeBox.classList.remove("fixed", "hidden");
      activePlaceholder.classList.remove("active");
      if (showTimeout) { clearTimeout(showTimeout); showTimeout = null; }
      isFixed = false;
    }

    // ── Scroll-direction visibility (mobile only) ─────────────────
    if (isFixed) {
      if (mobile) {
        if (scrollingDown && scrollY >= hideOffset) {
          activeBox.classList.add("hidden");
          if (showTimeout) { clearTimeout(showTimeout); showTimeout = null; }
        } else if (!scrollingDown && activeBox.classList.contains("hidden")) {
          activeBox.classList.remove("hidden");
          if (showTimeout) { clearTimeout(showTimeout); showTimeout = null; }
        }
      } else {
        // Desktop — always keep the box visible once fixed.
        activeBox.classList.remove("hidden");
      }
    }

    // ── Position below header when header is visible ──────────────
    const headerVisible = mobile && !header.classList.contains("hidden");
    activeBox.style.top = headerVisible ? `${headerH}px` : "0px";

    lastScrollY = scrollY;
  }

  // ─── resize handler ───────────────────────────────────────────────────────

  function onResize() {
    measureAndApply();
    if (!isMobile()) resetMobileState();
  }

  // ─── init ─────────────────────────────────────────────────────────────────

  measureAndApply();

  scroller.addEventListener("scroll", onScroll);
  window.addEventListener("resize", onResize);

  // Return a cleanup function in case the caller ever needs to tear down.
  return function destroy() {
    scroller.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    if (showTimeout) clearTimeout(showTimeout);
  };
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Wire up the elements and call the factory. Swap these IDs / selectors to
// match whatever your HTML uses.

initStickyScroll({
  scroller:          document.querySelector(".content"),
  header:            document.getElementById("header"),
  headerPlaceholder: document.getElementById("header-placeholder"),
  trigger:           document.getElementById("trigger"),
  hideTrigger:       document.getElementById("hide-trigger"),
  stickyElements: [
    // Desktop variant — hidden on mobile via CSS (display:none in media query).
    // resolveActiveElement() picks the first visible one, so desktop comes first.
    {
      box:         document.getElementById("sticky-desktop"),
      placeholder: document.getElementById("sticky-placeholder-desktop"),
    },
    // Mobile variant — hidden on desktop via CSS.
    {
      box:         document.getElementById("sticky-mobile"),
      placeholder: document.getElementById("sticky-placeholder-mobile"),
    },
  ],
  mobileBreakpoint: 768,
});
