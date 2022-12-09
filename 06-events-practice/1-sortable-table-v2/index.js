import SortableTableComparers from "./comparers.js";

export default class SortableTable {
  /** @type {[TableColumn]} */
  columns = [];

  /** @type {[TableRow]} */
  rows = [];

  constructor(headerConfig = [], rowsData = []) {
    this.columns = headerConfig.map((conf) => new TableColumn(conf));
    this.rows = rowsData.map((row) => new TableRow(row, this.columns));
    this.render();
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
    this.renderBody();
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
    this.columns.forEach((column) => column.remove());
    this.rows.forEach((row) => row.remove());
  }

  destroy() {
    this.remove();
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

  getTemplate() {
    return `
      <div class="sortable-table__cell" data-id="images" data-sortable="${this.sortable}">
        <span>${this.title}</span>
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>
      </div>
    `;
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
  }

  remove() {
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

  remove() {
    this.element.remove();
  }
}
