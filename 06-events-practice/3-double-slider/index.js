export default class DoubleSlider {
  subElements = {};

  constructor({
    min = 0,
    max = 100,
    formatValue = (value) => Math.round(value),
    selected = {},
  } = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;

    const thumbLeftValue = this.userToPc(selected.from ?? this.min);
    const thumbRightValue = this.userToPc(selected.to ?? this.max);

    this.thumbLeft = new SliderThumb({
      type: "left",
      value: thumbLeftValue,
      min: 0,
      max: thumbRightValue,
      moveCb: () => this.refreshState(),
      changeCb: () => (this.setThumbsMinMax(), this.change()),
    });

    this.thumbRight = new SliderThumb({
      type: "right",
      value: thumbRightValue,
      min: thumbLeftValue,
      max: 100,
      moveCb: () => this.refreshState(),
      changeCb: () => (this.setThumbsMinMax(), this.change()),
    });

    this.render();
    this.refreshState();
  }

  setThumbsMinMax() {
    this.thumbLeft.max = this.thumbRight.value;
    this.thumbRight.min = this.thumbLeft.value;
  }

  /**
   * percent value to user value
   * @param {number} valuePc percent value (0..100)
   * @returns {number} user value (min..max)
   */
  pcToUser(valuePc) {
    const userWidth = this.max - this.min;
    const valueUser = (valuePc / 100) * userWidth + this.min;
    return valueUser;
  }

  /**
   * user value to percent value
   * @param {number} valueUser user value (min..max)
   * @returns {number} percent value (0..100)
   */
  userToPc(valueUser) {
    const userWidth = this.max - this.min;
    const valuePc = ((valueUser - this.min) / userWidth) * 100;
    return valuePc;
  }

  change() {
    const from = this.pcToUser(this.thumbLeft.value);
    const to = this.pcToUser(this.thumbRight.value);
    const changeEvent = new Event("range-select");
    changeEvent.detail = { from, to };
    this.element.dispatchEvent(changeEvent);
  }

  refreshState() {
    const { progress } = this.subElements;
    const { thumbLeft, thumbRight } = this;
    progress.style.left = `${thumbLeft.value}%`;
    progress.style.right = `${100 - thumbRight.value}%`;

    const leftUserValue = this.pcToUser(thumbLeft.value);
    const rightUserValue = this.pcToUser(thumbRight.value);
    this.subElements.from.innerHTML = this.formatValue(leftUserValue);
    this.subElements.to.innerHTML = this.formatValue(rightUserValue);
  }

  getTemplate() {
    return `
      <div class="range-slider">
        <span data-element="from"></span>
        <div class="range-slider__inner" data-element="container">
          <span class="range-slider__progress" data-element="progress"></span>
        </div>
        <span data-element="to"></span>
      </div>
    `;
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;

    const subs = this.subElements;
    subs.container = element.querySelector("div[data-element=container]");
    subs.progress = element.querySelector("span[data-element=progress]");
    subs.from = element.querySelector("span[data-element=from]");
    subs.to = element.querySelector("span[data-element=to]");

    subs.container.append(this.thumbLeft.element);
    subs.container.append(this.thumbRight.element);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}

class SliderThumb {
  /**
   * event listeners
   * @type {[{element: HTMLElement, type: String, callback: Function}]}
   */
  listeners = [];

  /** value while thumb moving */
  newValue;

  /** value, while thumb not move */
  prevValue;

  constructor({
    type = "left",
    value = 0,
    min = 0,
    max = 100,
    moveCb = () => {},
    changeCb = () => {},
  } = {}) {
    this.type = type;
    this.max = max;
    this.min = min;
    this.moveCb = moveCb;
    this.changeCb = changeCb;

    this.render();
    this.initEventListeners();
    this.setPrevValue(value);
  }

  /**
   * current actual value
   */
  get value() {
    return this.newValue ?? this.prevValue;
  }

  /**
   * pixel value to percent value
   * @param {number} valuePx pixel value (0..parentWidth)
   * @returns {number} percent value (0..100)
   */
  pxToPс(valuePx) {
    return (valuePx / this.parentWidth) * 100;
  }

  get parentWidth() {
    const { width } = this.element.parentElement.getBoundingClientRect();
    return width;
  }

  get parentLeft() {
    const { left } = this.element.parentElement.getBoundingClientRect();
    return left;
  }

  getTemplate() {
    return `
      <span class="range-slider__thumb-${this.type}"></span>
    `;
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
  }

  setNewValue(newValuePc) {
    this.newValue = newValuePc;
    this.refreshState();
  }

  setPrevValue(newValuePc) {
    this.prevValue = newValuePc;
    this.refreshState();
  }

  refreshState() {
    const currentValue = this.value;
    this.element.style.left = `${currentValue}%`;
  }

  initEventListeners() {
    this.initEvent(this.element, "pointerdown", (event) => {
      this.startX = event.clientX;
      this.pointerId = event.pointerId;
      this.startMove();
    });
  }

  startMove() {
    this.initEvent(document, "pointerup", (event) => {
      if (this.pointerId !== event.pointerId) return;

      this.setPrevValue(this.newValue);
      this.newValue = null;
      this.removeListeners("pointerup", "pointermove");
      this.changeCb();
    });

    this.initEvent(document, "pointermove", (event) => {
      if (this.pointerId !== event.pointerId) return;

      const newValuePx = event.clientX - this.parentLeft;
      let newValuePc = this.pxToPс(newValuePx);
      if (newValuePc < this.min) newValuePc = this.min;
      if (newValuePc > this.max) newValuePc = this.max;

      this.setNewValue(newValuePc);
      this.moveCb();
    });
  }

  /**
   * Создаёт событие, сохраняет его в listeners
   * @param {HTMLElement} element
   * @param {String} type
   * @param {Function} callback
   */
  initEvent(element, type, callback) {
    element.addEventListener(type, callback);
    this.listeners.push({ element, type, callback });
  }

  /**
   * Remove event listeners with selected types
   * Remove all event listeners if types not specified
   * @param  {...String} types
   */
  removeListeners(...types) {
    this.listeners = this.listeners.filter((listener) => {
      const { type, element, callback } = listener;
      const isInclude = types.includes(type) || types.length === 0;
      if (isInclude) element.removeEventListener(type, callback);
      return !isInclude;
    });
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.removeListeners();
    this.remove();
  }
}
