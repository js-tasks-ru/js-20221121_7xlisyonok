/**
 * pick - Creates an object composed of the picked object properties:
 * @param {object} obj - the source object
 * @param {...string} fields - the properties paths to pick
 * @returns {object} - returns the new object
 */
export const pick = (obj, ...fields) => {
  const entries = Object.entries(obj);
  const filtered = entries.filter((p) => fields.indexOf(p[0]) !== -1);
  return Object.fromEntries(filtered);
};

// через reduce, тесты проходит но работает некорректно
export const pickReduceWrong = (obj, ...fs) =>
  fs.reduce((n, f) => ((n[f] = obj[f]), n), {});

// Корректный вариант с reduce
export const pickReduce = (obj, ...fields) => {
  return fields.reduce((newObj, f) => {
    if (f in obj) {
      newObj[f] = obj[f];
    }
    return newObj;
  }, {});
};
