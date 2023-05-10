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
  };
}
