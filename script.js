const scroller = document.querySelector(".content");

const header = document.getElementById("header");
const box = document.getElementById("sticky");
const trigger = document.getElementById("trigger");
const placeholder = document.getElementById("sticky-placeholder");

const HEADER_H = 60;
const BOX_H = 80;

let lastScrollY = 0;
let isFixed = false;

// Set padding-top ONCE to the max possible overlay height.
// It never changes again — so scrolled content never jumps.
document.documentElement.style.setProperty(
  "--top-offset",
  HEADER_H + BOX_H + "px"
);

// Cache trigger position after padding is applied
const triggerOffset = trigger.offsetTop;

scroller.addEventListener("scroll", () => {
  const scrollY = scroller.scrollTop;
  const scrollingDown = scrollY > lastScrollY;

  // =========================
  // HEADER — slides in/out, content stays put
  // =========================
  if (scrollingDown) {
    header.classList.add("hidden");
  } else {
    header.classList.remove("hidden");
  }

  // =========================
  // STICKY BOX — become fixed
  // =========================
  if (!isFixed && scrollY >= triggerOffset) {
    placeholder.classList.add("active");
    box.classList.add("fixed");
    isFixed = true;
  }

  if (isFixed && scrollY < triggerOffset) {
    box.classList.remove("fixed", "hidden");
    placeholder.classList.remove("active");
    isFixed = false;
  }

  // =========================
  // SCROLL DIRECTION VISIBILITY
  // =========================
  if (isFixed) {
    if (scrollingDown) {
      box.classList.add("hidden");
    } else {
      box.classList.remove("hidden");
    }
  }

  // Box always sits just below the header (header slides away, box follows via CSS transition)
  box.style.top = !header.classList.contains("hidden") ? `${HEADER_H}px` : "0px";

  lastScrollY = scrollY;
});
