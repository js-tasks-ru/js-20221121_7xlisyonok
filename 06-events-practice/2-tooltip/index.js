const LEFT_OFFSET = 20;
const TOP_OFFSET = 20;

class Tooltip {
  /** @type {Tooltip} */
  static instance = null;

  constructor() {
    if (!Tooltip.instance) Tooltip.instance = this;
    return Tooltip.instance;
  }

  initialize() {
    document.addEventListener("pointerover", this.pointerOver);
    document.addEventListener("pointerout", this.pointerOut);
  }

  /** @param {PointerEvent} event */
  pointerOver(event) {
    const closest = event.target.closest("[data-tooltip]");
    if (!closest) return;

    const text = closest.getAttribute("data-tooltip");
    Tooltip.instance.render(text);
    Tooltip.instance.move(
      event.clientX + LEFT_OFFSET,
      event.clientY + TOP_OFFSET
    );
  }

  /** @param {PointerEvent} event */
  pointerOut(event) {
    Tooltip.instance.remove();
  }

  /** @param {PointerEvent} event */
  pointerMove(event) {
    Tooltip.instance.move(
      event.clientX + LEFT_OFFSET,
      event.clientY + TOP_OFFSET
    );
  }

  move(x, y) {
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  getTemplate(text) {
    return `
      <div class="tooltip">${text}</div>
    `;
  }

  render(text) {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate(text);
    this.element = element.firstElementChild;
    document.body.append(this.element);
    document.addEventListener("pointermove", this.pointerMove);
  }

  remove() {
    if (!this.element) return;
    document.removeEventListener("pointermove", this.pointerMove);
    this.element.remove();
    this.element = null;
  }

  destroy() {
    document.removeEventListener("pointerover", this.pointerOver);
    document.removeEventListener("pointerout", this.pointerOut);
    this.remove();
  }
}

export default Tooltip;
