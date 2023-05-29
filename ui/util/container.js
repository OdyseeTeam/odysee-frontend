// @flow

export class Container {
  static Arr = class {
    static EMPTY: Array<any> = Object.freeze([]);

    static isEmpty(input: Array<any>) {
      return input.length === 0;
    }

    static useStableEmpty(input: Array<any>): Array<any> {
      return input.length === 0 ? Container.Arr.EMPTY : input;
    }
  };

  static Obj = class {
    static EMPTY: { ... } = Object.freeze({});

    static isEmpty(input: { ... }) {
      return Object.keys(input).length === 0;
    }

    static useStableEmpty(input: { ... }) {
      return Object.keys(input).length === 0 ? Container.Obj.EMPTY : input;
    }

    static shallowCompare(obj1: { ... }, obj2: { ... }) {
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
    }
  };
}
