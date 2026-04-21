const box = document.getElementById("sticky");
const trigger = document.getElementById("trigger");
const scroller = document.querySelector(".content");

let placeholder = null;

scroller.addEventListener("scroll", () => {
  const triggerTop = trigger.getBoundingClientRect().top;

  if (triggerTop <= 0) {
    if (!box.classList.contains("fixed")) {
      // Prevent layout jump
      placeholder = document.createElement("div");
      placeholder.style.height = box.offsetHeight + "px";
      box.parentNode.insertBefore(placeholder, box);

      box.classList.add("fixed");
    }
  } else {
    if (box.classList.contains("fixed")) {
      box.classList.remove("fixed");

      if (placeholder) {
        placeholder.remove();
        placeholder = null;
      }
    }
  }
});