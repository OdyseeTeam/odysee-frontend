// flow-typed signature: 7ad7b27f60b77c629c060330e018f9b8
// flow-typed version: c6154227d1/tempy_v0.x.x/flow_>=v0.47.x <=v0.103.x

type $npm$tempy$Options = {
  extension?: string,
  name?: string
};

declare module "tempy" {
  declare module.exports: {
    directory: () => string,
    file: (options?: $npm$tempy$Options) => string,
    root: string
  };
}
