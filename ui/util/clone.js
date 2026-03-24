// @flow

export function cloneDeep(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item));
  }

  if (value && typeof value === 'object') {
    const clone = {};
    Object.keys(value).forEach((key) => {
      clone[key] = cloneDeep(value[key]);
    });
    return clone;
  }

  return value;
}
