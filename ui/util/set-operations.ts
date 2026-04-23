export const setDifference = <T>(setA: Set<T>, setB: Set<T>): Set<T> => {
  let _difference = new Set(setA);

  for (let el of setB) {
    _difference.delete(el);
  }

  return _difference;
};
export const setUnion = <T>(setA: Set<T>, setB: Set<T>): Set<T> => {
  let _union = new Set(setA);

  for (let el of setB) {
    _union.add(el);
  }

  return _union;
};
