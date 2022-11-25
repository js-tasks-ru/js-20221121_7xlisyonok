/**
 * omit - creates an object composed of enumerable property fields
 * @param {object} obj - the source object
 * @param {...string} fields - the properties paths to omit
 * @returns {object} - returns the new object
 */
export const omit = (obj, ...fields) => {
  const entries = Object.entries(obj);
  const filtered = entries.filter((p) => fields.indexOf(p[0]) === -1);
  return Object.fromEntries(filtered);
};
