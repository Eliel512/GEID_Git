/**
 *
 * @param {number} length
 * @param {number[]} [data]
 * @returns {{ randomNumbers: number[], screenNumbers: number[] }}
 */

const generateUId = (length, data = []) => {
  const randomSet = new Set();
  const screenSet = new Set();
  const dataSet = new Set(data);
  const randomNumbers = [];
  const screenNumbers = [];

  const getUniqueNumber = (excludeSets) => {
    let num;
    do {
      num = Math.floor(Math.random() * 10000) + 1;
    } while (excludeSets.some((set) => set.has(num)));
    excludeSets[0].add(num);
    return num;
  };

  for (let i = 0; i < length; i++) {
    const randomNumber = getUniqueNumber([randomSet, screenSet, dataSet]);
    const screenNumber = getUniqueNumber([screenSet, randomSet, dataSet]);
    randomNumbers.push(randomNumber);
    screenNumbers.push(screenNumber);
  }
  return { randomNumbers, screenNumbers };
};

module.exports = generateUId;
