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
    this.createColumns(headers);
    this.createRows(data);

    if (sorted) {
      this.sort(sorted.id, sorted.order);
    } else {
      this.sortByColumn(this.columns.find((column) => column.sortable));
    }

    this.render();
  }

  createColumns(headers) {
    this.columns = headers.map((conf) => {
      const column = new TableColumn(conf);

      if (column.sortable) {
        column.onClick(() => {
          this.sortByColumn(column);
        });
      }
      return column;
    });
  }

  createRows(data) {
    this.rows = data.map((row) => new TableRow(row, this.columns));
  }

  /** @param {TableColumn} column */
  sortByColumn(column) {
    const newOrder = column.order === "desc" ? "asc" : "desc";
    this.sort(column.id, newOrder);
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
    if (this.body) this.renderBody();
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

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.columns.forEach((column) => column.destroy());
    this.rows.forEach((row) => row.destroy());
  }
}

class TableColumn {
  /** @type {[{type: string, callback: function}]} */
  listeners = [];

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

  onClick(callback) {
    const type = "pointerdown";
    this.element.addEventListener(type, callback);
    this.listeners.push({ type, callback });
  }

  destroy() {
    this.listeners.forEach((event) => {
      this.element.removeEventListener(event.type, event.callback);
    });

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
