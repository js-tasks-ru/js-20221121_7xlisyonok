/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = "asc") {
  const options = { sensitivity: "case", caseFirst: "upper" };
  const locales = ["ru", "en"];

  const comparers = {
    asc: (a, b) => a.localeCompare(b, locales, options),
    desc: (a, b) => b.localeCompare(a, locales, options),
  };

  return [...arr].sort(comparers[param]);
}
