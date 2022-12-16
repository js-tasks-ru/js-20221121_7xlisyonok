import escapeHtml from "./utils/escape-html.js";
import fetchJson from "./utils/fetch-json.js";

const IMGUR_CLIENT_ID = "28aaa2e823b03b1";
const BACKEND_URL = "https://course-js.javascript.ru";

export default class ProductForm {
  fieldsInfo = {
    description: { type: "string", defValue: "" },
    discount: { type: "number", defValue: 0 },
    id: { type: "string", defValue: "" },
    images: { type: "string", defValue: "" },
    price: { type: "number", defValue: 100 },
    quantity: { type: "number", defValue: 1 },
    status: { type: "number", defValue: 1 },
    subcategory: { type: "string", defValue: "" },
    title: { type: "string", defValue: "" },
  };

  saveClick = (event) => {
    event.preventDefault();
    this.save();
  };

  constructor(productId) {
    this.productId = productId;
  }

  async getSubCategories() {
    const categoriesUrl = new URL("api/rest/categories", BACKEND_URL);
    const { searchParams: sp } = categoriesUrl;
    sp.append("_sort", "weight");
    sp.append("_refs", "subcategory");

    const result = await fetchJson(categoriesUrl);
    this.createFlatCategoriesList(result);
  }

  async getProductInfo() {
    if (!this.productId) return;

    const productUrl = new URL("api/rest/products", BACKEND_URL);
    const { searchParams: sp } = productUrl;
    sp.append("id", this.productId);
    const [product] = await fetchJson(productUrl);

    this.product = product;
  }

  createFlatCategoriesList(categories, namePrefix = "") {
    if (!namePrefix) this.categories = [];

    categories.forEach((category) => {
      if ("subcategories" in category) {
        this.createFlatCategoriesList(
          category.subcategories,
          namePrefix + category.title + " &gt; "
        );
      } else {
        category.text = namePrefix + category.title;
        this.categories.push(category);
      }
    });
  }

  getImagesTemplate() {
    const images = this.product?.images ?? [];

    return images
      .map(({ url, source }) => {
        return `
        <li class="products-edit__imagelist-item sortable-list__item" style="">
          <input type="hidden" name="url" value="${url}">
          <input type="hidden" name="source" value="${source}">
          <span>
            <img src="icon-grab.svg" data-grab-handle="" alt="grab">
            <img class="sortable-table__cell-img" alt="Image" src="${url}">
            <span>${source}</span>
          </span>
          <button type="button">
            <img src="icon-trash.svg" data-delete-handle="" alt="delete">
          </button>
        </li>
      `;
      })
      .join("");
  }

  getCategoriesTemplate() {
    return this.categories.map(({ id, text }) => {
      return `<option value="${id}">${text}</option>`;
    });
  }

  getTemplate() {
    // TODO: Прикрутить компонент SortableList
    return `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">
          <input id="id" type="hidden">

          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input id="title" required="" type="text" name="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>

          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea id="description" required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
          </div>

          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer">
              <ul class="sortable-list">
                ${this.getImagesTemplate()}
              </ul>
            </div>
            <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
          </div>

          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select id="subcategory" class="form-control" name="subcategory">
              ${this.getCategoriesTemplate()}
            </select>
          </div>

          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input id="price" required="" type="number" name="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input id="discount" required="" type="number" name="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>

          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input id="quantity" required="" type="number" class="form-control" name="quantity" placeholder="1">
          </div>

          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select id="status" class="form-control" name="status">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>

          <div class="form-buttons">
            <button data-element="submit" type="submit" name="save" class="button-primary-outline">
              Сохранить товар
            </button>
          </div>
        </form>
      </div>
    `;
  }

  showProduct() {
    const product = this.product ?? {};
    const { fields } = this.subElements;
    fields.forEach((element) => {
      const id = element.getAttribute("id");
      element.value = product[id] ?? "";
    });
  }

  readProduct() {
    const product = {};
    const { fields } = this.subElements;
    fields.forEach((element) => {
      const id = element.getAttribute("id");
      const info = this.fieldsInfo[id];
      const { type, defValue } = info;
      if (type === "number") {
        product[id] = Number(element.value || defValue);
      } else {
        product[id] = escapeHtml(element.value || defValue);
      }
    });

    // TODO: Прикрутить компонент SortableList
    product.images = this.product?.images ?? [];
    return product;
  }

  async save() {
    const newProduct = this.readProduct();

    const patchProductUrl = new URL("api/rest/products", BACKEND_URL);

    await fetchJson(patchProductUrl, {
      method: "PATCH",
      body: JSON.stringify(newProduct),
    });

    const productUpdated = new Event("product-updated");
    this.element.dispatchEvent(productUpdated);
  }

  async render() {
    await this.getSubCategories();
    await this.getProductInfo();

    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;

    const productForm = element.querySelector("[data-element=productForm]");
    const fields = productForm.querySelectorAll("[id]");
    const submit = element.querySelector("[data-element=submit]");
    const imageListContainer = element.querySelector(
      "[data-element=imageListContainer]"
    );

    this.subElements = { submit, productForm, fields, imageListContainer };

    this.showProduct();
    this.readProduct();

    submit.addEventListener("click", this.saveClick);

    return element;
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    const { submit } = this.subElements;
    submit.removeEventListener("click", this.saveClick);
    this.remove();
  }
}
