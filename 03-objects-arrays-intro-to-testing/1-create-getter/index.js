/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  const pathArr = path.split(".");

  return (obj) => {
    return pathArr.reduce(function (currValue, nextField) {
      if (currValue && Object.hasOwn(currValue, nextField)) {
        return currValue[nextField];
      }
    }, obj);
  };
}

// Через new Function
export function createGetterNewFunction(path) {
  const pathCode = path.replace(/\./g, "?.");
  return new Function("obj", `{return obj?.${pathCode};}`);
}
