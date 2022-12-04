export default class ColumnChart {
  constructor({
    chartHeight = 50,
    label = "",
    link = "",
    value = "",
    data = [],
    formatHeading = (data) => data,
  } = {}) {
    this.chartHeight = chartHeight;
    this.label = label;
    this.link = link;
    this.value = value;
    this.data = data;
    this.formatHeading = formatHeading;

    this.render();
    this.initEventListeners();
  }

  getColumnProps() {
    const maxValue = Math.max(...this.data);
    const scale = this.chartHeight / maxValue;

    return this.data.map((item) => {
      return {
        percent: ((item / maxValue) * 100).toFixed(0) + "%",
        value: String(Math.floor(item * scale)),
      };
    });
  }

  lineTemplate(lineData) {
    return `<div style="--value: ${lineData.value}" data-tooltip="${lineData.percent}"></div>`;
  }

  getLinesTemplate() {
    return this.getColumnProps().map(this.lineTemplate).join("");
  }

  hasData() {
    return this.data.length > 0;
  }

  getTemplate() {
    const chartLoadingClass = this.hasData() ? "" : "column-chart_loading";

    return `
      <div class="column-chart ${chartLoadingClass}" style="--chart-height: 50">
        <div class="column-chart__title">
          ${this.label}
          <a href="/sales" class="column-chart__link">View all</a>
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">
            ${this.formatHeading(this.value)}
          </div>
          <div data-element="body" class="column-chart__chart">
            ${this.getLinesTemplate()}
          </div>
        </div>
      </div>
    `;
  }

  update(data) {
    this.data = data;
    this.chartBody.innerHTML = this.getLinesTemplate();
  }

  render() {
    const element = document.createElement("div"); // (*)
    element.innerHTML = this.getTemplate();

    // NOTE: в этой строке мы избавляемся от обертки-пустышки в виде `div`
    // который мы создали на строке (*)
    this.element = element.firstElementChild;
    this.chartBody = element.querySelector("div[data-element=body]");
  }

  initEventListeners() {
    // NOTE: в данном методе добавляем обработчики событий, если они есть
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    // NOTE: удаляем обработчики событий, если они есть
  }
}
