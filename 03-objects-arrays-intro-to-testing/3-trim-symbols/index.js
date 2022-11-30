/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size = Infinity) {
  const chars = string.split("");

  const resultDefaults = {
    chars: [], // Символы  новой строки
    index: 0, // Количество повторений
    prevChar: null, // Предыдущий символ
  };

  const result = chars.reduce((result, char) => {
    if (char !== result.prevChar) {
      result.prevChar = char;
      result.index = 0;
    } else {
      result.index++;
    }

    if (result.index < size) {
      result.chars.push(char);
    }

    return result;
  }, resultDefaults);

  return result.chars.join("");
}
