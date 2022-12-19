// TODO: Компонент перерисовывает дни, надо нормально разделить по режимам,
// и при клике по дням, не перерисовывать копонент, только при клике влево / вправо
export default class RangePicker {
  documentClick = (event) => {
    // Клик по одному из дней
    const dayButton = event.target.closest("[data-element=select-day]");
    if (dayButton) {
      const date = new Date(Date.parse(dayButton.getAttribute("data-value")));

      if (this.selectFrom) {
        this.from = date;
        this.to = date;
        this.refreshRange();
      } else {
        this.to = date;
        const { from, to } = this;

        if (from.getTime() > to.getTime()) {
          this.from = to;
          this.to = from;
        }

        this.refreshValue();
        this.refreshRange();

        const dateSelect = new Event("date-select");
        this.element.dispatchEvent(dateSelect);
      }

      this.selectFrom = !this.selectFrom;
      return;
    }

    //
    const arrowLeft = event.target.closest("[data-element=arrow-left]");
    if (arrowLeft) {
      this.view = this.viewPrev;
      this.refreshDayList();
      return;
    }

    //
    const arrowRight = event.target.closest("[data-element=arrow-right]");
    if (arrowRight) {
      this.view = this.viewNext;
      this.refreshDayList();
      return;
    }

    // Клик вне компонента
    const selector = event.target.closest("[data-element=selector]");
    const input = event.target.closest("[data-element=input]");
    if (!selector && !input) {
      this.close();
      return;
    }
  };

  /** Текущий режим выбора, если true - выбираем дату from, иначе дату to */
  selectFrom = true;

  /**
   * @param {Object}  p
   * @param {Date} p.from начало периода
   * @param {Date} p.to конец периода
   * @param {Date} p.view текущий месяц для выбора даты (тот что справа)
   */
  constructor({ from = new Date(), to = new Date(), view } = {}) {
    this.from = from;
    this.to = to;
    view = view ?? this.to;
    this.view = new Date(view.getFullYear(), view.getMonth(), 1);
    this.render();
    this.initEventListeners();
    this.refreshValue();
  }

  /**
   * this.view = текущий месяц (в selector это тот что справа)
   * Предыдущий месяц относительно this.view, дата
   */
  get viewPrev() {
    const yy = this.view.getFullYear();
    const mm = this.view.getMonth();
    const prevMonthDate = new Date(yy, mm - 1, 1);
    return prevMonthDate;
  }

  /**
   * this.view = текущий месяц (в selector это тот что справа)
   * Следующий месяц относительно this.view, дата
   */
  get viewNext() {
    const yy = this.view.getFullYear();
    const mm = this.view.getMonth();
    const prevMonthDate = new Date(yy, mm + 1, 1);
    return prevMonthDate;
  }

  get prevMonthName() {
    return this.viewPrev.toLocaleString("default", { month: "long" });
  }

  get currMonthName() {
    return this.view.toLocaleString("default", { month: "long" });
  }

  /**
   * Определяет количество дней в месяце
   * @param {Number} year год
   * @param {Number} month месяц как в js от 0 до 11
   */
  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Определяет как дата относиться к текущему выбранному периоду
   * 'rangepicker__selected-from' = первый день
   * 'rangepicker__selected-to' = последний день
   * 'rangepicker__selected-between' = день внутри периода
   * '' = день вне периода
   */
  getDateRelation(date) {
    const to = this.to.getTime();
    const from = this.from.getTime();
    const curr = date.getTime();
    if (from === curr) return "rangepicker__selected-from";
    if (to === curr) return "rangepicker__selected-to";
    if (curr > from && curr < to) return "rangepicker__selected-between";
    return "";
  }

  /**
   * Шаблон для заданного одного дня
   * @param {Date} value конкретный день
   */
  getDayTemplate(value) {
    const day = value.getDate();
    const valueStr = value.toISOString();
    const startFrom =
      day === 1 ? `style="--start-from: ${value.getDay() || 7}"` : "";
    return `
      <button
        type="button"
        class="rangepicker__cell"
        data-value="${valueStr}"
        data-element="select-day"
        ${startFrom}
      >${day}</button>
    `;
  }

  /**
   * Шаблон для календаря на месяц
   * @param {Date} value месяц и год для которого будет сгенерирован календарь
   */
  getDaysTemplate(date) {
    const viewYY = date.getFullYear();
    const viewMM = date.getMonth();
    const daysCount = this.getDaysInMonth(viewYY, viewMM);
    const emptyArr = new Array(daysCount);
    return Array.from(emptyArr, (empty, index) => {
      const value = new Date(viewYY, viewMM, index + 1);
      return this.getDayTemplate(value);
    }).join("");
  }

  /** Показать календари с выбором периода */
  open() {
    this.element.classList.add("rangepicker_open");
    document.addEventListener("click", this.documentClick);
    const { selector } = this.subElements;
    selector.innerHTML = this.getSelectorTemplate();

    const els = this.subElements;
    els.monthPrev = selector.querySelector("[data-element=month-prev]");
    els.monthCurr = selector.querySelector("[data-element=month-curr]");
    els.daysPrev = selector.querySelector("[data-element=days-prev]");
    els.daysCurr = selector.querySelector("[data-element=days-curr]");
    this.refreshDayList();
    this.isOpen = true;
  }

  /** Скрыть выбор периода */
  close() {
    this.element.classList.remove("rangepicker_open");
    this.subElements.selector.innerHTML = "";
    const els = this.subElements;
    els.monthPrev = null;
    els.monthCurr = null;
    els.daysPrev = null;
    els.daysCurr = null;
    document.removeEventListener("click", this.documentClick);
    this.isOpen = false;
  }

  /** Переключить выбор периода */
  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  /** Перерисовывает календари */
  refreshDayList() {
    const els = this.subElements;
    const { monthCurr, monthPrev, selector } = els;
    monthCurr.innerHTML = this.currMonthName;
    monthPrev.innerHTML = this.prevMonthName;

    els.daysCurr.innerHTML = this.getDaysTemplate(this.view);
    els.daysPrev.innerHTML = this.getDaysTemplate(this.viewPrev);
    els.daysList = selector.querySelectorAll("[data-element=select-day]");
    this.refreshRange();
  }

  /** Обновляет состояние дней на календарях (отношение к выбранному периоду) */
  refreshRange() {
    const { daysList } = this.subElements;

    daysList.forEach((day) => {
      const dtUtc = day.getAttribute("data-value");
      const dt = new Date(Date.parse(dtUtc));
      const relation = this.getDateRelation(dt);
      day.className = `rangepicker__cell ${relation}`;
    });
  }

  /** Обновляет выбранные значения */
  refreshValue() {
    const { from, to } = this.subElements;

    from.innerHTML = this.from.toLocaleDateString();
    to.innerHTML = this.to.toLocaleDateString();
  }

  render() {
    const element = document.createElement("div");
    element.innerHTML = this.getTemplate();
    this.element = element.firstElementChild;
    this.subElements = {
      from: element.querySelector("[data-element=from]"),
      to: element.querySelector("[data-element=to]"),
      input: element.querySelector("[data-element=input]"),
      selector: element.querySelector("[data-element=selector]"),
      monthPrev: null,
      monthCurr: null,
      daysPrev: null,
      daysCurr: null,
      daysList: null,
    };
  }

  initEventListeners() {
    const { input } = this.subElements;

    input.addEventListener("click", () => {
      this.toggle();
    });
  }

  getDayOfWeekTemplate() {
    return `
      <div class="rangepicker__day-of-week">
        <div>Пн</div>
        <div>Вт</div>
        <div>Ср</div>
        <div>Чт</div>
        <div>Пт</div>
        <div>Сб</div>
        <div>Вс</div>
      </div>
    `;
  }

  getTemplate() {
    return `
      <div class="rangepicker">
        <div class="rangepicker__input" data-element="input">
          <span data-element="from">11/26/19</span> -
          <span data-element="to">12/26/19</span>
        </div>
        <div class="rangepicker__selector" data-element="selector"></div>
      </div>
    `;
  }

  getSelectorTemplate() {
    return `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left" data-element="arrow-left"></div>
      <div class="rangepicker__selector-control-right" data-element="arrow-right"></div>
      <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time data-element="month-prev">November</time>
        </div>
        ${this.getDayOfWeekTemplate()}
        <div class="rangepicker__date-grid" data-element="days-prev"></div>
      </div>
      <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time datetime="December" data-element="month-curr">December</time>
        </div>
        ${this.getDayOfWeekTemplate()}
        <div class="rangepicker__date-grid" data-element="days-curr"></div>
      </div>
    `;
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    document.removeEventListener("click", this.documentClick);
  }
}
