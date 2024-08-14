function hideUnhideChild(item) {
  const s = item.getAttribute("data-parent-key");
  const h = item.getAttribute("data-hide-child");
  const elements = document.querySelectorAll(`[data-child-key="${s}"]`);
  for (const e of elements) {
    if (h == "0") {
      e.style.display = "none";
      item.setAttribute("data-hide-child", "1");
    } else {
      e.style.display = "flex";
      item.setAttribute("data-hide-child", "0");
    }
  }
}
function sett() {
  console.log("sett");
}
