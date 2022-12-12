import SortableTableComparers from "./comparers.js";

export default class SortableTable {
  /** @type {[TableColumn]} */
  columns = [];

  /** @type {[TableRow]} */
  rows = [];

  /**
   * @param {[ Object ]} headers - Массив конструкторов для TableColumn
   * @param {{ data: [], sorted: {id: string, order: "asc"|"desc">} }} param1 Данные и параметры сортировки
   */
  constructor(headers, { data = [], sorted = null } = {}) {
    this.columns = headers.map((conf) => new TableColumn(conf));
    this.rows = data.map((row) => new TableRow(row, this.columns));

    if (sorted) {
      this.sort(sorted.id, sorted.order);
    } else {
      this.sortByColumn(this.columns.find((column) => column.sortable));
    }

    this.render();
    this.initEventListeners();
  }

  getColumn(id) {
    return this.columns.find((column) => column.id === id);
  }

  sort(columnId, order = "asc") {
    const column = this.getColumn(columnId);
    this.columns.forEach((column) => column.setSort());
    column.setSort(order);

    const comparer = SortableTableComparers.get(column.sortType, order);
    this.rows.sort((a, b) => comparer(a.data[columnId], b.data[columnId]));

    // is body rendered?
    if (this.isBodyRendered) this.renderBody();
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
  }

  renderBody() {
    const body = this.subElements.body;
    body.innerHTML = "";
    this.rows.forEach((row) => body.append(row.element));
  }

  get isBodyRendered() {
    return Boolean(this.subElements);
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;

    const header = element.querySelector("div[data-element=header]");
    const body = element.querySelector("div[data-element=body]");
    this.subElements = { header, body };

    this.renderHeader();
    this.renderBody();
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
    };

    const { header } = this.subElements;
    const { headerClick } = this.listeners;
    header.addEventListener("pointerdown", headerClick);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.columns.forEach((column) => column.destroy());
    this.rows.forEach((row) => row.destroy());

    const { header } = this.subElements;
    const { headerClick } = this.listeners;
    header.removeEventListener("pointerdown", headerClick);
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
