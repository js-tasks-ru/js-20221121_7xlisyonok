import fetchJson from "./utils/fetch-json.js";

const BACKEND_URL = "https://course-js.javascript.ru";

export default class ColumnChart {
  constructor({
    chartHeight = 50,
    label = "",
    link = "",

    value = "",
    data = [],
    formatHeading = (data) => data,

    url = null,
    range = {
      from: new Date(),
      to: new Date(),
    },
  } = {}) {
    this.chartHeight = chartHeight;
    this.label = label;
    this.link = link;
    this.value = value;
    this.data = data;
    this.formatHeading = formatHeading;

    this.render();

    if (url) {
      this.url = url;
      this.update(range.from, range.to);
    }
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

  clearData() {
    this.data = [];
    this.refresh();
  }

  getTemplate() {
    return `
      <div class="column-chart" style="--chart-height: 50">
        <div class="column-chart__title">
          ${this.label}
          <a href="/sales" class="column-chart__link">View all</a>
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header"></div>
          <div data-element="body" class="column-chart__chart"></div>
        </div>
      </div>
    `;
  }

  async update(from, to) {
    this.clearData();

    const url = new URL(this.url, BACKEND_URL);
    const { searchParams } = url;
    searchParams.append("from", from);
    searchParams.append("to", to);

    const result = await fetchJson(url);
    const resultArr = Object.entries(result);
    this.data = resultArr.map(([key, value]) => value);
    this.value = this.data.reduce((sum, value) => value + sum);

    this.refresh();
    return result;
  }

  refresh() {
    if (this.hasData()) {
      this.element.classList.remove("column-chart_loading");
    } else {
      this.element.classList.add("column-chart_loading");
    }

    this.subElements.body.innerHTML = this.getLinesTemplate();
    this.subElements.header.innerHTML = this.formatHeading(this.value);
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;

    this.subElements = {
      body: element.querySelector("div[data-element=body]"),
      header: element.querySelector("div[data-element=header]"),
    };

    this.refresh();
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
