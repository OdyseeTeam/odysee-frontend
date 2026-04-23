const Arr = {
  EMPTY: Object.freeze([]) as Array<any>,

  isEmpty(input: Array<any>) {
    return input.length === 0;
  },

  useStableEmpty(input: Array<any>): Array<any> {
    return input.length === 0 ? Arr.EMPTY : input;
  },
};

const Obj = {
  EMPTY: Object.freeze({}) as {},

  isEmpty(input: {}) {
    return Object.keys(input).length === 0;
  },

  useStableEmpty(input: {}) {
    return Object.keys(input).length === 0 ? Obj.EMPTY : input;
  },

  shallowCompare(obj1: {}, obj2: {}) {
    const obj1Keys = Object.keys(obj1);
    const obj2Keys = Object.keys(obj2);

    if (obj1Keys.length !== obj2Keys.length) {
      return false;
    }

    for (let key of obj1Keys) {
      if (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  },
};

export const Container = { Arr, Obj };
