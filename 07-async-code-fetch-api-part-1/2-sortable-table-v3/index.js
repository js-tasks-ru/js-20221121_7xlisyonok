import SortableTableComparers from "./comparers.js";
import fetchJson from "./utils/fetch-json.js";
const BACKEND_URL = "https://course-js.javascript.ru";

export default class SortableTable {
  /** @type {[TableColumn]} */
  columns = [];

  /** @type {[TableRow]} */
  rows = [];

  /** @type {id: string, order: "asc"|"desc"} */
  sorted = {};

  /**
   * @param {[ Object ]} headers - Массив конструкторов для TableColumn
   * @param {{ data: [], sorted: {id: string, order: "asc"|"desc"} }} param1 Данные и параметры сортировки
   */
  constructor(
    headers,
    { data = [], sorted = null, url, perPage = 30, isSortLocally = false } = {}
  ) {
    this.columns = headers.map((conf) => new TableColumn(conf));
    this.rows = data.map((row) => new TableRow(row, this.columns));
    this.url = url;
    this.isSortLocally = isSortLocally;
    this.perPage = perPage;

    if (sorted) {
      this.sorted = sorted;
    } else {
      const sortColumnId = this.columns.find((column) => column.sortable)?.id;
      this.sorted = { id: sortColumnId, order: "asc" };
    }

    this.render();
  }

  getColumn(id) {
    return this.columns.find((column) => column.id === id);
  }

  clearData() {
    this.rows.forEach((row) => row.destroy());
    this.rows = [];
  }

  async loadNextPage(columnId = this.sorted.id, order = this.sorted.order) {
    this.isLoading = true;

    const url = new URL(this.url, BACKEND_URL);
    const { searchParams: sp } = url;
    const count = this.rows.length;
    sp.append("_sort", columnId);
    sp.append("_order", order);
    sp.append("_start", count);
    sp.append("_end", count + this.perPage);
    const result = await fetchJson(url);
    this.rows.push(...result.map((row) => new TableRow(row, this.columns)));

    if (this.isBodyRendered) this.renderBody();
    this.isLoading = false;
  }

  async sortOnServer(columnId, order) {
    this.clearData();
    return this.loadNextPage(columnId, order);
  }

  async sortOnClient(columnId, order) {
    const column = this.getColumn(columnId);
    const comparer = SortableTableComparers.get(column.sortType, order);
    this.rows.sort((a, b) => comparer(a.data[columnId], b.data[columnId]));
    if (this.isBodyRendered) this.renderBody();
  }

  async sort(columnId, order = "asc") {
    const column = this.getColumn(columnId);
    this.columns.forEach((column) => column.setSort());
    column.setSort(order);

    if (this.isSortLocally) {
      await this.sortOnClient(columnId, order);
    } else {
      await this.sortOnServer(columnId, order);
    }
  }

  getTemplate() {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row"></div>
        <div data-element="body" class="sortable-table__body"></div>
      </div>
    `;
  }

  renderHeader() {
    const header = this.subElements.header;
    header.innerHTML = "";
    this.columns.forEach((column) => header.append(column.element));
    this.initEventListeners();
  }

  renderBody() {
    const body = this.subElements.body;
    body.innerHTML = "";
    this.rows.forEach((row) => body.append(row.element));
  }

  get isBodyRendered() {
    return Boolean(this.subElements);
  }

  async render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;

    const header = element.querySelector("div[data-element=header]");
    const body = element.querySelector("div[data-element=body]");
    this.subElements = { header, body };

    this.renderHeader();
    this.renderBody();

    await this.sort(this.sorted.id, this.sorted.order);
  }

  initEventListeners() {
    this.listeners = {
      headerClick: (event) => {
        /** @type {HTMLElement} */
        const columnElement = event.target.closest("[data-sortable=true]");
        if (!columnElement) return;

        const columnId = columnElement.getAttribute("data-id");
        const columnOrder = columnElement.getAttribute("data-order");
        const newOrder = columnOrder === "desc" ? "asc" : "desc";
        this.sort(columnId, newOrder);
      },

      windowScroll: () => {
        if (this.isLoading) return;

        const myRect = this.element.getBoundingClientRect();
        const docHeight = document.documentElement.clientHeight;
        const realBottom = myRect.bottom - docHeight;

        if (realBottom < 0) {
          this.loadNextPage();
        }
      },
    };

    const { header } = this.subElements;
    const { headerClick, windowScroll } = this.listeners;
    header.addEventListener("pointerdown", headerClick);
    window.addEventListener("scroll", windowScroll);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.columns.forEach((column) => column.destroy());
    this.rows.forEach((row) => row.destroy());

    const { header } = this.subElements;
    const { headerClick, windowScroll } = this.listeners;
    header.removeEventListener("pointerdown", headerClick);
    window.removeEventListener("scroll", windowScroll);
  }
}

class TableColumn {
  constructor({
    id = "",
    title = "",
    sortable = false,
    sortType = "asc",
    template = (value) => `<div class="sortable-table__cell">${value}</div>`,
  } = {}) {
    this.id = id;
    this.title = title;
    this.sortable = sortable;
    this.sortType = sortType;
    this.template = template;

    this.order = null;
    this.render();
  }

  setSort(order = null) {
    this.order = order;
    this.element.setAttribute("data-order", this.order);
  }

  getArrowTemplate() {
    if (!this.sortable) return "";
    return `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `;
  }

  getTemplate() {
    const { id, sortable, title } = this;
    return `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
        <span>${title}</span>
        ${this.getArrowTemplate()}
      </div>
    `;
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
  }

  destroy() {
    this.element.remove();
  }
}

class TableRow {
  constructor(data, columns) {
    this.data = data;
    this.columns = columns;
    this.render();
  }

  getCellsTemplate() {
    return this.columns
      .map((column) => column.template(this.data[column.id]))
      .join("");
  }

  getTemplate() {
    return `
      <a href="/products/${this.data.id}" class="sortable-table__row">
        ${this.getCellsTemplate()}
      </a>
    `;
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
  }

  destroy() {
    this.element.remove();
  }
}
