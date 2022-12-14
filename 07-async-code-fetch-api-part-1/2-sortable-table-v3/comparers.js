const options = { sensitivity: "case", caseFirst: "upper" };
const locales = ["ru", "en"];

export default {
  comparers: {
    string: {
      asc: (a, b) => a.localeCompare(b, locales, options),
      desc: (a, b) => b.localeCompare(a, locales, options),
    },

    number: {
      asc: (a, b) => a - b,
      desc: (a, b) => b - a,
    },
  },

  get(type, order) {
    const sortType = this.comparers[type];
    if (!sortType) throw new Error(`Unknow sort type ${type}`);

    const comparer = sortType[order];
    if (!comparer)
      throw new Error(`Unknow order ${order} for sort type: ${type}`);

    return comparer;
  },
};
