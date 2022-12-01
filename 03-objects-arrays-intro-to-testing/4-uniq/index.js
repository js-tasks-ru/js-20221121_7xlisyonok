/**
 * uniq - returns array of uniq values:
 * @param {*[]} arr - the array of primitive values
 * @returns {*[]} - the new array with uniq values
 */
export function uniq(arr) {
  if (!Array.isArray(arr)) return [];

  const uniques = new Set();
  arr.forEach((e) => uniques.add(e));
  return [...uniques];
}
