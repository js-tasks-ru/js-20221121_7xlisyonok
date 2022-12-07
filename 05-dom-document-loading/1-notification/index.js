export default class NotificationMessage {
  /**
   * Текущий NotificationMessage на странице
   * @type {NotificationMessage}
   */
  static current = null;

  constructor(text, { duration = 1000, type = "success" } = {}) {
    this.text = text;
    this.duration = duration;
    this.type = type;
    this.timeout = null;
    this.render();
  }

  get isVisible() {
    return this.timeout !== null;
  }

  show(target = document.body) {
    if (NotificationMessage.current) NotificationMessage.current.remove();
    NotificationMessage.current = this;

    this.timeout = setTimeout(() => {
      this.remove();
    }, this.duration);

    target.append(this.element);
  }

  getTemplate() {
    return `
      <div class="notification ${this.type}" style="--value:${this.duration}ms">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">
            ${this.text}
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
  }

  remove() {
    NotificationMessage.current = null;
    clearTimeout(this.timeout);
    this.timeout = null;
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
