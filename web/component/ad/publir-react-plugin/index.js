var da = Object.defineProperty;
var Vr = Object.getOwnPropertySymbols;
var ha = Object.prototype.hasOwnProperty,
  pa = Object.prototype.propertyIsEnumerable;
var Wr = (t, e, r) => (e in t ? da(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : (t[e] = r)),
  Qr = (t, e) => {
    for (var r in e || (e = {})) ha.call(e, r) && Wr(t, r, e[r]);
    if (Vr) for (var r of Vr(e)) pa.call(e, r) && Wr(t, r, e[r]);
    return t;
  };
var st = (t, e, r) =>
  new Promise((n, i) => {
    var a = (l) => {
        try {
          s(r.next(l));
        } catch (c) {
          i(c);
        }
      },
      o = (l) => {
        try {
          s(r.throw(l));
        } catch (c) {
          i(c);
        }
      },
      s = (l) => (l.done ? n(l.value) : Promise.resolve(l.value).then(a, o));
    s((r = r.apply(t, e)).next());
  });
import * as Be from 'react';
import oe, {
  useRef as gn,
  useMemo as Oe,
  useCallback as ar,
  useState as ht,
  useEffect as Fe,
  useContext as ba,
  useLayoutEffect as xa,
} from 'react';
import va from 'react-dom';
var wn =
  typeof globalThis != 'undefined'
    ? globalThis
    : typeof window != 'undefined'
    ? window
    : typeof global != 'undefined'
    ? global
    : typeof self != 'undefined'
    ? self
    : {};
function ma(t) {
  if (t.__esModule) return t;
  var e = t.default;
  if (typeof e == 'function') {
    var r = function n() {
      if (this instanceof n) {
        var i = [null];
        i.push.apply(i, arguments);
        var a = Function.bind.apply(e, i);
        return new a();
      }
      return e.apply(this, arguments);
    };
    r.prototype = e.prototype;
  } else r = {};
  return (
    Object.defineProperty(r, '__esModule', { value: !0 }),
    Object.keys(t).forEach(function (n) {
      var i = Object.getOwnPropertyDescriptor(t, n);
      Object.defineProperty(
        r,
        n,
        i.get
          ? i
          : {
              enumerable: !0,
              get: function () {
                return t[n];
              },
            }
      );
    }),
    r
  );
}
var or = {},
  ya = {
    get exports() {
      return or;
    },
    set exports(t) {
      or = t;
    },
  },
  ut = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var $r;
function ga() {
  if ($r) return ut;
  $r = 1;
  var t = oe,
    e = Symbol.for('react.element'),
    r = Symbol.for('react.fragment'),
    n = Object.prototype.hasOwnProperty,
    i = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    a = { key: !0, ref: !0, __self: !0, __source: !0 };
  function o(s, l, c) {
    var x,
      O = {},
      b = null,
      v = null;
    c !== void 0 && (b = '' + c), l.key !== void 0 && (b = '' + l.key), l.ref !== void 0 && (v = l.ref);
    for (x in l) n.call(l, x) && !a.hasOwnProperty(x) && (O[x] = l[x]);
    if (s && s.defaultProps) for (x in ((l = s.defaultProps), l)) O[x] === void 0 && (O[x] = l[x]);
    return { $$typeof: e, type: s, key: b, ref: v, props: O, _owner: i.current };
  }
  return (ut.Fragment = r), (ut.jsx = o), (ut.jsxs = o), ut;
}
var ct = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Hr;
function wa() {
  return (
    Hr ||
      ((Hr = 1),
      process.env.NODE_ENV !== 'production' &&
        (function () {
          var t = oe,
            e = Symbol.for('react.element'),
            r = Symbol.for('react.portal'),
            n = Symbol.for('react.fragment'),
            i = Symbol.for('react.strict_mode'),
            a = Symbol.for('react.profiler'),
            o = Symbol.for('react.provider'),
            s = Symbol.for('react.context'),
            l = Symbol.for('react.forward_ref'),
            c = Symbol.for('react.suspense'),
            x = Symbol.for('react.suspense_list'),
            O = Symbol.for('react.memo'),
            b = Symbol.for('react.lazy'),
            v = Symbol.for('react.offscreen'),
            f = Symbol.iterator,
            m = '@@iterator';
          function S(u) {
            if (u === null || typeof u != 'object') return null;
            var C = (f && u[f]) || u[m];
            return typeof C == 'function' ? C : null;
          }
          var U = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
          function F(u) {
            {
              for (var C = arguments.length, _ = new Array(C > 1 ? C - 1 : 0), k = 1; k < C; k++)
                _[k - 1] = arguments[k];
              R('error', u, _);
            }
          }
          function R(u, C, _) {
            {
              var k = U.ReactDebugCurrentFrame,
                K = k.getStackAddendum();
              K !== '' && ((C += '%s'), (_ = _.concat([K])));
              var X = _.map(function ($) {
                return String($);
              });
              X.unshift('Warning: ' + C), Function.prototype.apply.call(console[u], console, X);
            }
          }
          var I = !1,
            B = !1,
            j = !1,
            ce = !1,
            pe = !1,
            xe;
          xe = Symbol.for('react.module.reference');
          function re(u) {
            return !!(
              typeof u == 'string' ||
              typeof u == 'function' ||
              u === n ||
              u === a ||
              pe ||
              u === i ||
              u === c ||
              u === x ||
              ce ||
              u === v ||
              I ||
              B ||
              j ||
              (typeof u == 'object' &&
                u !== null &&
                (u.$$typeof === b ||
                  u.$$typeof === O ||
                  u.$$typeof === o ||
                  u.$$typeof === s ||
                  u.$$typeof === l || // This needs to include all possible module reference object
                  // types supported by any Flight configuration anywhere since
                  // we don't know which Flight build this will end up being used
                  // with.
                  u.$$typeof === xe ||
                  u.getModuleId !== void 0))
            );
          }
          function w(u, C, _) {
            var k = u.displayName;
            if (k) return k;
            var K = C.displayName || C.name || '';
            return K !== '' ? _ + '(' + K + ')' : _;
          }
          function y(u) {
            return u.displayName || 'Context';
          }
          function p(u) {
            if (u == null) return null;
            if (
              (typeof u.tag == 'number' &&
                F(
                  'Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.'
                ),
              typeof u == 'function')
            )
              return u.displayName || u.name || null;
            if (typeof u == 'string') return u;
            switch (u) {
              case n:
                return 'Fragment';
              case r:
                return 'Portal';
              case a:
                return 'Profiler';
              case i:
                return 'StrictMode';
              case c:
                return 'Suspense';
              case x:
                return 'SuspenseList';
            }
            if (typeof u == 'object')
              switch (u.$$typeof) {
                case s:
                  var C = u;
                  return y(C) + '.Consumer';
                case o:
                  var _ = u;
                  return y(_._context) + '.Provider';
                case l:
                  return w(u, u.render, 'ForwardRef');
                case O:
                  var k = u.displayName || null;
                  return k !== null ? k : p(u.type) || 'Memo';
                case b: {
                  var K = u,
                    X = K._payload,
                    $ = K._init;
                  try {
                    return p($(X));
                  } catch (Q) {
                    return null;
                  }
                }
              }
            return null;
          }
          var d = Object.assign,
            h = 0,
            g,
            T,
            D,
            P,
            N,
            V,
            J;
          function ue() {}
          ue.__reactDisabledLog = !0;
          function Se() {
            {
              if (h === 0) {
                (g = console.log),
                  (T = console.info),
                  (D = console.warn),
                  (P = console.error),
                  (N = console.group),
                  (V = console.groupCollapsed),
                  (J = console.groupEnd);
                var u = {
                  configurable: !0,
                  enumerable: !0,
                  value: ue,
                  writable: !0,
                };
                Object.defineProperties(console, {
                  info: u,
                  log: u,
                  warn: u,
                  error: u,
                  group: u,
                  groupCollapsed: u,
                  groupEnd: u,
                });
              }
              h++;
            }
          }
          function ye() {
            {
              if ((h--, h === 0)) {
                var u = {
                  configurable: !0,
                  enumerable: !0,
                  writable: !0,
                };
                Object.defineProperties(console, {
                  log: d({}, u, {
                    value: g,
                  }),
                  info: d({}, u, {
                    value: T,
                  }),
                  warn: d({}, u, {
                    value: D,
                  }),
                  error: d({}, u, {
                    value: P,
                  }),
                  group: d({}, u, {
                    value: N,
                  }),
                  groupCollapsed: d({}, u, {
                    value: V,
                  }),
                  groupEnd: d({}, u, {
                    value: J,
                  }),
                });
              }
              h < 0 && F('disabledDepth fell below zero. This is a bug in React. Please file an issue.');
            }
          }
          var Z = U.ReactCurrentDispatcher,
            $e;
          function He(u, C, _) {
            {
              if ($e === void 0)
                try {
                  throw Error();
                } catch (K) {
                  var k = K.stack.trim().match(/\n( *(at )?)/);
                  $e = (k && k[1]) || '';
                }
              return (
                `
` +
                $e +
                u
              );
            }
          }
          var it = !1,
            Pe;
          {
            var wt = typeof WeakMap == 'function' ? WeakMap : Map;
            Pe = new wt();
          }
          function De(u, C) {
            if (!u || it) return '';
            {
              var _ = Pe.get(u);
              if (_ !== void 0) return _;
            }
            var k;
            it = !0;
            var K = Error.prepareStackTrace;
            Error.prepareStackTrace = void 0;
            var X;
            (X = Z.current), (Z.current = null), Se();
            try {
              if (C) {
                var $ = function () {
                  throw Error();
                };
                if (
                  (Object.defineProperty($.prototype, 'props', {
                    set: function () {
                      throw Error();
                    },
                  }),
                  typeof Reflect == 'object' && Reflect.construct)
                ) {
                  try {
                    Reflect.construct($, []);
                  } catch (Ae) {
                    k = Ae;
                  }
                  Reflect.construct(u, [], $);
                } else {
                  try {
                    $.call();
                  } catch (Ae) {
                    k = Ae;
                  }
                  u.call($.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (Ae) {
                  k = Ae;
                }
                u();
              }
            } catch (Ae) {
              if (Ae && k && typeof Ae.stack == 'string') {
                for (
                  var Q = Ae.stack.split(`
`),
                    be = k.stack.split(`
`),
                    ie = Q.length - 1,
                    ae = be.length - 1;
                  ie >= 1 && ae >= 0 && Q[ie] !== be[ae];

                )
                  ae--;
                for (; ie >= 1 && ae >= 0; ie--, ae--)
                  if (Q[ie] !== be[ae]) {
                    if (ie !== 1 || ae !== 1)
                      do
                        if ((ie--, ae--, ae < 0 || Q[ie] !== be[ae])) {
                          var Ee =
                            `
` + Q[ie].replace(' at new ', ' at ');
                          return (
                            u.displayName &&
                              Ee.includes('<anonymous>') &&
                              (Ee = Ee.replace('<anonymous>', u.displayName)),
                            typeof u == 'function' && Pe.set(u, Ee),
                            Ee
                          );
                        }
                      while (ie >= 1 && ae >= 0);
                    break;
                  }
              }
            } finally {
              (it = !1), (Z.current = X), ye(), (Error.prepareStackTrace = K);
            }
            var Ze = u ? u.displayName || u.name : '',
              Br = Ze ? He(Ze) : '';
            return typeof u == 'function' && Pe.set(u, Br), Br;
          }
          function Zt(u, C, _) {
            return De(u, !1);
          }
          function at(u) {
            var C = u.prototype;
            return !!(C && C.isReactComponent);
          }
          function Te(u, C, _) {
            if (u == null) return '';
            if (typeof u == 'function') return De(u, at(u));
            if (typeof u == 'string') return He(u);
            switch (u) {
              case c:
                return He('Suspense');
              case x:
                return He('SuspenseList');
            }
            if (typeof u == 'object')
              switch (u.$$typeof) {
                case l:
                  return Zt(u.render);
                case O:
                  return Te(u.type, C, _);
                case b: {
                  var k = u,
                    K = k._payload,
                    X = k._init;
                  try {
                    return Te(X(K), C, _);
                  } catch ($) {}
                }
              }
            return '';
          }
          var ke = Object.prototype.hasOwnProperty,
            Et = {},
            ot = U.ReactDebugCurrentFrame;
          function ze(u) {
            if (u) {
              var C = u._owner,
                _ = Te(u.type, u._source, C ? C.type : null);
              ot.setExtraStackFrame(_);
            } else ot.setExtraStackFrame(null);
          }
          function ge(u, C, _, k, K) {
            {
              var X = Function.call.bind(ke);
              for (var $ in u)
                if (X(u, $)) {
                  var Q = void 0;
                  try {
                    if (typeof u[$] != 'function') {
                      var be = Error(
                        (k || 'React class') +
                          ': ' +
                          _ +
                          ' type `' +
                          $ +
                          '` is invalid; it must be a function, usually from the `prop-types` package, but received `' +
                          typeof u[$] +
                          '`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.'
                      );
                      throw ((be.name = 'Invariant Violation'), be);
                    }
                    Q = u[$](C, $, k, _, null, 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED');
                  } catch (ie) {
                    Q = ie;
                  }
                  Q &&
                    !(Q instanceof Error) &&
                    (ze(K),
                    F(
                      '%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).',
                      k || 'React class',
                      _,
                      $,
                      typeof Q
                    ),
                    ze(null)),
                    Q instanceof Error &&
                      !(Q.message in Et) &&
                      ((Et[Q.message] = !0), ze(K), F('Failed %s type: %s', _, Q.message), ze(null));
                }
            }
          }
          var Me = Array.isArray;
          function Ne(u) {
            return Me(u);
          }
          function W(u) {
            {
              var C = typeof Symbol == 'function' && Symbol.toStringTag,
                _ = (C && u[Symbol.toStringTag]) || u.constructor.name || 'Object';
              return _;
            }
          }
          function z(u) {
            try {
              return q(u), !1;
            } catch (C) {
              return !0;
            }
          }
          function q(u) {
            return '' + u;
          }
          function te(u) {
            if (z(u))
              return (
                F(
                  'The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.',
                  W(u)
                ),
                q(u)
              );
          }
          var L = U.ReactCurrentOwner,
            Ge = {
              key: !0,
              ref: !0,
              __self: !0,
              __source: !0,
            },
            G,
            je,
            ve;
          ve = {};
          function Ot(u) {
            if (ke.call(u, 'ref')) {
              var C = Object.getOwnPropertyDescriptor(u, 'ref').get;
              if (C && C.isReactWarning) return !1;
            }
            return u.ref !== void 0;
          }
          function Ct(u) {
            if (ke.call(u, 'key')) {
              var C = Object.getOwnPropertyDescriptor(u, 'key').get;
              if (C && C.isReactWarning) return !1;
            }
            return u.key !== void 0;
          }
          function Zi(u, C) {
            if (typeof u.ref == 'string' && L.current && C && L.current.stateNode !== C) {
              var _ = p(L.current.type);
              ve[_] ||
                (F(
                  'Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref',
                  p(L.current.type),
                  u.ref
                ),
                (ve[_] = !0));
            }
          }
          function ea(u, C) {
            {
              var _ = function () {
                G ||
                  ((G = !0),
                  F(
                    '%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)',
                    C
                  ));
              };
              (_.isReactWarning = !0),
                Object.defineProperty(u, 'key', {
                  get: _,
                  configurable: !0,
                });
            }
          }
          function ta(u, C) {
            {
              var _ = function () {
                je ||
                  ((je = !0),
                  F(
                    '%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)',
                    C
                  ));
              };
              (_.isReactWarning = !0),
                Object.defineProperty(u, 'ref', {
                  get: _,
                  configurable: !0,
                });
            }
          }
          var ra = function (u, C, _, k, K, X, $) {
            var Q = {
              // This tag allows us to uniquely identify this as a React Element
              $$typeof: e,
              // Built-in properties that belong on the element
              type: u,
              key: C,
              ref: _,
              props: $,
              // Record the component responsible for creating this element.
              _owner: X,
            };
            return (
              (Q._store = {}),
              Object.defineProperty(Q._store, 'validated', {
                configurable: !1,
                enumerable: !1,
                writable: !0,
                value: !1,
              }),
              Object.defineProperty(Q, '_self', {
                configurable: !1,
                enumerable: !1,
                writable: !1,
                value: k,
              }),
              Object.defineProperty(Q, '_source', {
                configurable: !1,
                enumerable: !1,
                writable: !1,
                value: K,
              }),
              Object.freeze && (Object.freeze(Q.props), Object.freeze(Q)),
              Q
            );
          };
          function na(u, C, _, k, K) {
            {
              var X,
                $ = {},
                Q = null,
                be = null;
              _ !== void 0 && (te(_), (Q = '' + _)),
                Ct(C) && (te(C.key), (Q = '' + C.key)),
                Ot(C) && ((be = C.ref), Zi(C, K));
              for (X in C) ke.call(C, X) && !Ge.hasOwnProperty(X) && ($[X] = C[X]);
              if (u && u.defaultProps) {
                var ie = u.defaultProps;
                for (X in ie) $[X] === void 0 && ($[X] = ie[X]);
              }
              if (Q || be) {
                var ae = typeof u == 'function' ? u.displayName || u.name || 'Unknown' : u;
                Q && ea($, ae), be && ta($, ae);
              }
              return ra(u, Q, be, K, k, L.current, $);
            }
          }
          var er = U.ReactCurrentOwner,
            kr = U.ReactDebugCurrentFrame;
          function Xe(u) {
            if (u) {
              var C = u._owner,
                _ = Te(u.type, u._source, C ? C.type : null);
              kr.setExtraStackFrame(_);
            } else kr.setExtraStackFrame(null);
          }
          var tr;
          tr = !1;
          function rr(u) {
            return typeof u == 'object' && u !== null && u.$$typeof === e;
          }
          function Mr() {
            {
              if (er.current) {
                var u = p(er.current.type);
                if (u)
                  return (
                    `

Check the render method of \`` +
                    u +
                    '`.'
                  );
              }
              return '';
            }
          }
          function ia(u) {
            {
              if (u !== void 0) {
                var C = u.fileName.replace(/^.*[\\\/]/, ''),
                  _ = u.lineNumber;
                return (
                  `

Check your code at ` +
                  C +
                  ':' +
                  _ +
                  '.'
                );
              }
              return '';
            }
          }
          var Nr = {};
          function aa(u) {
            {
              var C = Mr();
              if (!C) {
                var _ = typeof u == 'string' ? u : u.displayName || u.name;
                _ &&
                  (C =
                    `

Check the top-level render call using <` +
                    _ +
                    '>.');
              }
              return C;
            }
          }
          function jr(u, C) {
            {
              if (!u._store || u._store.validated || u.key != null) return;
              u._store.validated = !0;
              var _ = aa(C);
              if (Nr[_]) return;
              Nr[_] = !0;
              var k = '';
              u && u._owner && u._owner !== er.current && (k = ' It was passed a child from ' + p(u._owner.type) + '.'),
                Xe(u),
                F(
                  'Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.',
                  _,
                  k
                ),
                Xe(null);
            }
          }
          function Lr(u, C) {
            {
              if (typeof u != 'object') return;
              if (Ne(u))
                for (var _ = 0; _ < u.length; _++) {
                  var k = u[_];
                  rr(k) && jr(k, C);
                }
              else if (rr(u)) u._store && (u._store.validated = !0);
              else if (u) {
                var K = S(u);
                if (typeof K == 'function' && K !== u.entries)
                  for (var X = K.call(u), $; !($ = X.next()).done; ) rr($.value) && jr($.value, C);
              }
            }
          }
          function oa(u) {
            {
              var C = u.type;
              if (C == null || typeof C == 'string') return;
              var _;
              if (typeof C == 'function') _ = C.propTypes;
              else if (
                typeof C == 'object' &&
                (C.$$typeof === l || // Note: Memo only checks outer props here.
                  // Inner props are checked in the reconciler.
                  C.$$typeof === O)
              )
                _ = C.propTypes;
              else return;
              if (_) {
                var k = p(C);
                ge(_, u.props, 'prop', k, u);
              } else if (C.PropTypes !== void 0 && !tr) {
                tr = !0;
                var K = p(C);
                F(
                  'Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?',
                  K || 'Unknown'
                );
              }
              typeof C.getDefaultProps == 'function' &&
                !C.getDefaultProps.isReactClassApproved &&
                F(
                  'getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.'
                );
            }
          }
          function sa(u) {
            {
              for (var C = Object.keys(u.props), _ = 0; _ < C.length; _++) {
                var k = C[_];
                if (k !== 'children' && k !== 'key') {
                  Xe(u),
                    F(
                      'Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.',
                      k
                    ),
                    Xe(null);
                  break;
                }
              }
              u.ref !== null && (Xe(u), F('Invalid attribute `ref` supplied to `React.Fragment`.'), Xe(null));
            }
          }
          function qr(u, C, _, k, K, X) {
            {
              var $ = re(u);
              if (!$) {
                var Q = '';
                (u === void 0 || (typeof u == 'object' && u !== null && Object.keys(u).length === 0)) &&
                  (Q +=
                    " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
                var be = ia(K);
                be ? (Q += be) : (Q += Mr());
                var ie;
                u === null
                  ? (ie = 'null')
                  : Ne(u)
                  ? (ie = 'array')
                  : u !== void 0 && u.$$typeof === e
                  ? ((ie = '<' + (p(u.type) || 'Unknown') + ' />'),
                    (Q = ' Did you accidentally export a JSX literal instead of a component?'))
                  : (ie = typeof u),
                  F(
                    'React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s',
                    ie,
                    Q
                  );
              }
              var ae = na(u, C, _, K, X);
              if (ae == null) return ae;
              if ($) {
                var Ee = C.children;
                if (Ee !== void 0)
                  if (k)
                    if (Ne(Ee)) {
                      for (var Ze = 0; Ze < Ee.length; Ze++) Lr(Ee[Ze], u);
                      Object.freeze && Object.freeze(Ee);
                    } else
                      F(
                        'React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.'
                      );
                  else Lr(Ee, u);
              }
              return u === n ? sa(ae) : oa(ae), ae;
            }
          }
          function ua(u, C, _) {
            return qr(u, C, _, !0);
          }
          function ca(u, C, _) {
            return qr(u, C, _, !1);
          }
          var fa = ca,
            la = ua;
          (ct.Fragment = n), (ct.jsx = fa), (ct.jsxs = la);
        })()),
    ct
  );
}
(function (t) {
  process.env.NODE_ENV === 'production' ? (t.exports = ga()) : (t.exports = wa());
})(ya);
const Ve = or.jsx,
  En = oe.createContext({
    data: void 0,
    isLoading: !0,
    isError: !1,
    isPrebidSetup: !1,
    isProviderSetup: !1,
  }),
  Ea = () => {
    const t = oe.useContext(En);
    if (!t.isProviderSetup) throw new Error('useAdsContext should be used within a AdsProvider');
    return t;
  },
  gr = () => (typeof window.pbjs == 'undefined' ? (console.error('Missing Prebid.js module'), !1) : !0),
  Oa = (t, e) => t.map((r) => ({ code: e ? r.path : r.id, mediaTypes: r.mediaTypes, bids: r.bids })),
  Ca = (t) => {
    var r, n;
    const e = Oa(t.config.slots, t.config.gam);
    (r = window.pbjs) == null || r.setConfig(t.config.prebidConfig), (n = window.pbjs) == null || n.addAdUnits(e);
  },
  Sa = (t, e, r) => {
    var n;
    (n = window.pbjs) == null ||
      n.requestBids({
        adUnitCodes: [t],
        bidsBackHandler: () => {
          var a, o;
          const i = ((a = window.pbjs) == null ? void 0 : a.getHighestCpmBids(t)) || [];
          if (i.length && i[0].adId) {
            const s = i[0],
              l = e.current;
            if (l) {
              const c = l.contentDocument;
              c &&
                ((o = window.pbjs) == null || o.renderAd(c, s.adId),
                c.head.insertAdjacentHTML('beforeend', '<style>body { margin: 0; overflow: hidden; }</style>'));
            }
            return;
          }
          r();
        },
      });
  },
  On = (t) => Ta(window.pbjs.que, t),
  Ta = (t, e) =>
    new Promise((r) => {
      t.push(() => {
        try {
          e(), r();
        } catch (n) {
          console.error(n);
        }
      });
    });
var sr = /* @__PURE__ */ new Map(),
  St = /* @__PURE__ */ new WeakMap(),
  zr = 0,
  Ra = void 0;
function _a(t) {
  return t ? (St.has(t) || ((zr += 1), St.set(t, zr.toString())), St.get(t)) : '0';
}
function Pa(t) {
  return Object.keys(t)
    .sort()
    .filter(function (e) {
      return t[e] !== void 0;
    })
    .map(function (e) {
      return e + '_' + (e === 'root' ? _a(t.root) : t[e]);
    })
    .toString();
}
function Aa(t) {
  var e = Pa(t),
    r = sr.get(e);
  if (!r) {
    var n = /* @__PURE__ */ new Map(),
      i,
      a = new IntersectionObserver(function (o) {
        o.forEach(function (s) {
          var l,
            c =
              s.isIntersecting &&
              i.some(function (x) {
                return s.intersectionRatio >= x;
              });
          t.trackVisibility && typeof s.isVisible == 'undefined' && (s.isVisible = c),
            (l = n.get(s.target)) == null ||
              l.forEach(function (x) {
                x(c, s);
              });
        });
      }, t);
    (i = a.thresholds || (Array.isArray(t.threshold) ? t.threshold : [t.threshold || 0])),
      (r = {
        id: e,
        observer: a,
        elements: n,
      }),
      sr.set(e, r);
  }
  return r;
}
function Fa(t, e, r, n) {
  if (
    (r === void 0 && (r = {}),
    n === void 0 && (n = Ra),
    typeof window.IntersectionObserver == 'undefined' && n !== void 0)
  ) {
    var i = t.getBoundingClientRect();
    return (
      e(n, {
        isIntersecting: n,
        target: t,
        intersectionRatio: typeof r.threshold == 'number' ? r.threshold : 0,
        time: 0,
        boundingClientRect: i,
        intersectionRect: i,
        rootBounds: i,
      }),
      function () {}
    );
  }
  var a = Aa(r),
    o = a.id,
    s = a.observer,
    l = a.elements,
    c = l.get(t) || [];
  return (
    l.has(t) || l.set(t, c),
    c.push(e),
    s.observe(t),
    function () {
      c.splice(c.indexOf(e), 1),
        c.length === 0 && (l.delete(t), s.unobserve(t)),
        l.size === 0 && (s.disconnect(), sr.delete(o));
    }
  );
}
function Ia(t) {
  var e,
    r = t === void 0 ? {} : t,
    n = r.threshold,
    i = r.delay,
    a = r.trackVisibility,
    o = r.rootMargin,
    s = r.root,
    l = r.triggerOnce,
    c = r.skip,
    x = r.initialInView,
    O = r.fallbackInView,
    b = r.onChange,
    v = Be.useState(null),
    f = v[0],
    m = v[1],
    S = Be.useRef(),
    U = Be.useState({
      inView: !!x,
      entry: void 0,
    }),
    F = U[0],
    R = U[1];
  (S.current = b),
    Be.useEffect(
      function () {
        if (!(c || !f)) {
          var j;
          return (
            (j = Fa(
              f,
              function (ce, pe) {
                R({
                  inView: ce,
                  entry: pe,
                }),
                  S.current && S.current(ce, pe),
                  pe.isIntersecting && l && j && (j(), (j = void 0));
              },
              {
                root: s,
                rootMargin: o,
                threshold: n,
                // @ts-ignore
                trackVisibility: a,
                // @ts-ignore
                delay: i,
              },
              O
            )),
            function () {
              j && j();
            }
          );
        }
      },
      // We break the rule here, because we aren't including the actual `threshold` variable
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        // If the threshold is an array, convert it to a string, so it won't change between renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        Array.isArray(n) ? n.toString() : n,
        f,
        s,
        o,
        l,
        c,
        a,
        O,
        i,
      ]
    );
  var I = (e = F.entry) == null ? void 0 : e.target;
  Be.useEffect(
    function () {
      !f &&
        I &&
        !l &&
        !c &&
        R({
          inView: !!x,
          entry: void 0,
        });
    },
    [f, I, l, c, x]
  );
  var B = [m, F.inView, F.entry];
  return (B.ref = B[0]), (B.inView = B[1]), (B.entry = B[2]), B;
}
const $t = (t, e) => t.config.slots.find((r) => r.id === e),
  Ua = (t, e) => {
    var n;
    const r = (n = $t(t, e)) == null ? void 0 : n.autoRefresh;
    return r && r > 0 ? r * 1e3 : 0;
  },
  Da = (t, e, r, n, i) => {
    const a = () => {
      const o = setInterval(() => {
        i(t);
      }, r);
      return () => clearInterval(o);
    };
    if (r) {
      if (n && e) return a();
      if (!n) return i(t), a();
    }
  },
  ka = (t) => t.length > 0,
  Cn = (t, e) => {
    var n;
    const r = (n = $t(t, e)) == null ? void 0 : n.collapseEmptyDiv;
    return r && ka(r) ? r : [!1, !1];
  },
  Sn = (t, e) => {
    const r = $t(t, e),
      n = [0, 0];
    if (r) {
      const i = [],
        a = [];
      return (
        Object.keys(r.mediaTypes).map((o) => {
          const s = r.mediaTypes[o];
          i.push(...s.sizes.map((l) => l[0])), a.push(...s.sizes.map((l) => l[1]));
        }),
        [Math.max(...i), Math.min(...a)]
      );
    }
    return n;
  },
  Ma = (t, e) => {
    const r = Cn(t, e),
      [n, i] = Sn(t, e),
      [a, o] = r;
    return !a || !o
      ? {
          width: n,
          height: i,
        }
      : { width: 0, height: 0 };
  },
  Na = (t, e) => {
    const r = Cn(t, e),
      [n, i] = Sn(t, e),
      [a] = r;
    return a
      ? { width: 0, height: 0 }
      : {
          width: n,
          height: i,
        };
  };
var A = {},
  kt = {},
  ja = {
    get exports() {
      return kt;
    },
    set exports(t) {
      kt = t;
    },
  };
(function (t, e) {
  (function (r, n) {
    var i = '0.7.33',
      a = '',
      o = '?',
      s = 'function',
      l = 'undefined',
      c = 'object',
      x = 'string',
      O = 'major',
      b = 'model',
      v = 'name',
      f = 'type',
      m = 'vendor',
      S = 'version',
      U = 'architecture',
      F = 'console',
      R = 'mobile',
      I = 'tablet',
      B = 'smarttv',
      j = 'wearable',
      ce = 'embedded',
      pe = 350,
      xe = 'Amazon',
      re = 'Apple',
      w = 'ASUS',
      y = 'BlackBerry',
      p = 'Browser',
      d = 'Chrome',
      h = 'Edge',
      g = 'Firefox',
      T = 'Google',
      D = 'Huawei',
      P = 'LG',
      N = 'Microsoft',
      V = 'Motorola',
      J = 'Opera',
      ue = 'Samsung',
      Se = 'Sharp',
      ye = 'Sony',
      Z = 'Xiaomi',
      $e = 'Zebra',
      He = 'Facebook',
      it = function (W, z) {
        var q = {};
        for (var te in W) z[te] && z[te].length % 2 === 0 ? (q[te] = z[te].concat(W[te])) : (q[te] = W[te]);
        return q;
      },
      Pe = function (W) {
        for (var z = {}, q = 0; q < W.length; q++) z[W[q].toUpperCase()] = W[q];
        return z;
      },
      wt = function (W, z) {
        return typeof W === x ? De(z).indexOf(De(W)) !== -1 : !1;
      },
      De = function (W) {
        return W.toLowerCase();
      },
      Zt = function (W) {
        return typeof W === x ? W.replace(/[^\d\.]/g, a).split('.')[0] : n;
      },
      at = function (W, z) {
        if (typeof W === x) return (W = W.replace(/^\s\s*/, a)), typeof z === l ? W : W.substring(0, pe);
      },
      Te = function (W, z) {
        for (var q = 0, te, L, Ge, G, je, ve; q < z.length && !je; ) {
          var Ot = z[q],
            Ct = z[q + 1];
          for (te = L = 0; te < Ot.length && !je; )
            if (((je = Ot[te++].exec(W)), je))
              for (Ge = 0; Ge < Ct.length; Ge++)
                (ve = je[++L]),
                  (G = Ct[Ge]),
                  typeof G === c && G.length > 0
                    ? G.length === 2
                      ? typeof G[1] == s
                        ? (this[G[0]] = G[1].call(this, ve))
                        : (this[G[0]] = G[1])
                      : G.length === 3
                      ? typeof G[1] === s && !(G[1].exec && G[1].test)
                        ? (this[G[0]] = ve ? G[1].call(this, ve, G[2]) : n)
                        : (this[G[0]] = ve ? ve.replace(G[1], G[2]) : n)
                      : G.length === 4 && (this[G[0]] = ve ? G[3].call(this, ve.replace(G[1], G[2])) : n)
                    : (this[G] = ve || n);
          q += 2;
        }
      },
      ke = function (W, z) {
        for (var q in z)
          if (typeof z[q] === c && z[q].length > 0) {
            for (var te = 0; te < z[q].length; te++) if (wt(z[q][te], W)) return q === o ? n : q;
          } else if (wt(z[q], W)) return q === o ? n : q;
        return W;
      },
      Et = {
        '1.0': '/8',
        1.2: '/1',
        1.3: '/3',
        '2.0': '/412',
        '2.0.2': '/416',
        '2.0.3': '/417',
        '2.0.4': '/419',
        '?': '/',
      },
      ot = {
        ME: '4.90',
        'NT 3.11': 'NT3.51',
        'NT 4.0': 'NT4.0',
        2e3: 'NT 5.0',
        XP: ['NT 5.1', 'NT 5.2'],
        Vista: 'NT 6.0',
        7: 'NT 6.1',
        8: 'NT 6.2',
        8.1: 'NT 6.3',
        10: ['NT 6.4', 'NT 10.0'],
        RT: 'ARM',
      },
      ze = {
        browser: [
          [/\b(?:crmo|crios)\/([\w\.]+)/i],
          [S, [v, 'Chrome']],
          [/edg(?:e|ios|a)?\/([\w\.]+)/i],
          [S, [v, 'Edge']],
          [
            /(opera mini)\/([-\w\.]+)/i,
            /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,
            /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i,
          ],
          [v, S],
          [/opios[\/ ]+([\w\.]+)/i],
          [S, [v, J + ' Mini']],
          [/\bopr\/([\w\.]+)/i],
          [S, [v, J]],
          [
            /(kindle)\/([\w\.]+)/i,
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i,
            /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i,
            /(ba?idubrowser)[\/ ]?([\w\.]+)/i,
            /(?:ms|\()(ie) ([\w\.]+)/i,
            /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale|qqbrowserlite|qq|duckduckgo)\/([-\w\.]+)/i,
            /(weibo)__([\d\.]+)/i,
          ],
          [v, S],
          [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i],
          [S, [v, 'UC' + p]],
          [/microm.+\bqbcore\/([\w\.]+)/i, /\bqbcore\/([\w\.]+).+microm/i],
          [S, [v, 'WeChat(Win) Desktop']],
          [/micromessenger\/([\w\.]+)/i],
          [S, [v, 'WeChat']],
          [/konqueror\/([\w\.]+)/i],
          [S, [v, 'Konqueror']],
          [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i],
          [S, [v, 'IE']],
          [/yabrowser\/([\w\.]+)/i],
          [S, [v, 'Yandex']],
          [/(avast|avg)\/([\w\.]+)/i],
          [[v, /(.+)/, '$1 Secure ' + p], S],
          [/\bfocus\/([\w\.]+)/i],
          [S, [v, g + ' Focus']],
          [/\bopt\/([\w\.]+)/i],
          [S, [v, J + ' Touch']],
          [/coc_coc\w+\/([\w\.]+)/i],
          [S, [v, 'Coc Coc']],
          [/dolfin\/([\w\.]+)/i],
          [S, [v, 'Dolphin']],
          [/coast\/([\w\.]+)/i],
          [S, [v, J + ' Coast']],
          [/miuibrowser\/([\w\.]+)/i],
          [S, [v, 'MIUI ' + p]],
          [/fxios\/([-\w\.]+)/i],
          [S, [v, g]],
          [/\bqihu|(qi?ho?o?|360)browser/i],
          [[v, '360 ' + p]],
          [/(oculus|samsung|sailfish|huawei)browser\/([\w\.]+)/i],
          [[v, /(.+)/, '$1 ' + p], S],
          [/(comodo_dragon)\/([\w\.]+)/i],
          [[v, /_/g, ' '], S],
          [
            /(electron)\/([\w\.]+) safari/i,
            /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,
            /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i,
          ],
          [v, S],
          [/(metasr)[\/ ]?([\w\.]+)/i, /(lbbrowser)/i, /\[(linkedin)app\]/i],
          [v],
          [/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i],
          [[v, He], S],
          [/safari (line)\/([\w\.]+)/i, /\b(line)\/([\w\.]+)\/iab/i, /(chromium|instagram)[\/ ]([-\w\.]+)/i],
          [v, S],
          [/\bgsa\/([\w\.]+) .*safari\//i],
          [S, [v, 'GSA']],
          [/headlesschrome(?:\/([\w\.]+)| )/i],
          [S, [v, d + ' Headless']],
          [/ wv\).+(chrome)\/([\w\.]+)/i],
          [[v, d + ' WebView'], S],
          [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i],
          [S, [v, 'Android ' + p]],
          [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i],
          [v, S],
          [/version\/([\w\.\,]+) .*mobile\/\w+ (safari)/i],
          [S, [v, 'Mobile Safari']],
          [/version\/([\w(\.|\,)]+) .*(mobile ?safari|safari)/i],
          [S, v],
          [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i],
          [v, [S, ke, Et]],
          [/(webkit|khtml)\/([\w\.]+)/i],
          [v, S],
          [/(navigator|netscape\d?)\/([-\w\.]+)/i],
          [[v, 'Netscape'], S],
          [/mobile vr; rv:([\w\.]+)\).+firefox/i],
          [S, [v, g + ' Reality']],
          [
            /ekiohf.+(flow)\/([\w\.]+)/i,
            /(swiftfox)/i,
            /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i,
            /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i,
            /(firefox)\/([\w\.]+)/i,
            /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i,
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,
            /(links) \(([\w\.]+)/i,
          ],
          [v, S],
          [/(cobalt)\/([\w\.]+)/i],
          [v, [S, /master.|lts./, '']],
        ],
        cpu: [
          [/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i],
          [[U, 'amd64']],
          [/(ia32(?=;))/i],
          [[U, De]],
          [/((?:i[346]|x)86)[;\)]/i],
          [[U, 'ia32']],
          [/\b(aarch64|arm(v?8e?l?|_?64))\b/i],
          [[U, 'arm64']],
          [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i],
          [[U, 'armhf']],
          [/windows (ce|mobile); ppc;/i],
          [[U, 'arm']],
          [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i],
          [[U, /ower/, a, De]],
          [/(sun4\w)[;\)]/i],
          [[U, 'sparc']],
          [
            /((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i,
          ],
          [[U, De]],
        ],
        device: [
          [/\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i],
          [b, [m, ue], [f, I]],
          [/\b((?:s[cgp]h|gt|sm)-\w+|galaxy nexus)/i, /samsung[- ]([-\w]+)/i, /sec-(sgh\w+)/i],
          [b, [m, ue], [f, R]],
          [/\((ip(?:hone|od)[\w ]*);/i],
          [b, [m, re], [f, R]],
          [/\((ipad);[-\w\),; ]+apple/i, /applecoremedia\/[\w\.]+ \((ipad)/i, /\b(ipad)\d\d?,\d\d?[;\]].+ios/i],
          [b, [m, re], [f, I]],
          [/(macintosh);/i],
          [b, [m, re]],
          [/\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i],
          [b, [m, D], [f, I]],
          [/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i],
          [b, [m, D], [f, R]],
          [
            /\b(poco[\w ]+)(?: bui|\))/i,
            /\b; (\w+) build\/hm\1/i,
            /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,
            /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i,
            /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i,
          ],
          [
            [b, /_/g, ' '],
            [m, Z],
            [f, R],
          ],
          [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i],
          [
            [b, /_/g, ' '],
            [m, Z],
            [f, I],
          ],
          [/; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i],
          [b, [m, 'OPPO'], [f, R]],
          [/vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i],
          [b, [m, 'Vivo'], [f, R]],
          [/\b(rmx[12]\d{3})(?: bui|;|\))/i],
          [b, [m, 'Realme'], [f, R]],
          [
            /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,
            /\bmot(?:orola)?[- ](\w*)/i,
            /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i,
          ],
          [b, [m, V], [f, R]],
          [/\b(mz60\d|xoom[2 ]{0,2}) build\//i],
          [b, [m, V], [f, I]],
          [/((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i],
          [b, [m, P], [f, I]],
          [
            /(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,
            /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i,
            /\blg-?([\d\w]+) bui/i,
          ],
          [b, [m, P], [f, R]],
          [/(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i],
          [b, [m, 'Lenovo'], [f, I]],
          [/(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i],
          [
            [b, /_/g, ' '],
            [m, 'Nokia'],
            [f, R],
          ],
          [/(pixel c)\b/i],
          [b, [m, T], [f, I]],
          [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i],
          [b, [m, T], [f, R]],
          [/droid.+ (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i],
          [b, [m, ye], [f, R]],
          [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i],
          [
            [b, 'Xperia Tablet'],
            [m, ye],
            [f, I],
          ],
          [/ (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i],
          [b, [m, 'OnePlus'], [f, R]],
          [/(alexa)webm/i, /(kf[a-z]{2}wi)( bui|\))/i, /(kf[a-z]+)( bui|\)).+silk\//i],
          [b, [m, xe], [f, I]],
          [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i],
          [
            [b, /(.+)/g, 'Fire Phone $1'],
            [m, xe],
            [f, R],
          ],
          [/(playbook);[-\w\),; ]+(rim)/i],
          [b, m, [f, I]],
          [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i],
          [b, [m, y], [f, R]],
          [/(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i],
          [b, [m, w], [f, I]],
          [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i],
          [b, [m, w], [f, R]],
          [/(nexus 9)/i],
          [b, [m, 'HTC'], [f, I]],
          [
            /(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,
            /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,
            /(alcatel|geeksphone|nexian|panasonic|sony(?!-bra))[-_ ]?([-\w]*)/i,
          ],
          [m, [b, /_/g, ' '], [f, R]],
          [/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i],
          [b, [m, 'Acer'], [f, I]],
          [/droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i],
          [b, [m, 'Meizu'], [f, R]],
          [/\b(sh-?[altvz]?\d\d[a-ekm]?)/i],
          [b, [m, Se], [f, R]],
          [
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i,
            /(hp) ([\w ]+\w)/i,
            /(asus)-?(\w+)/i,
            /(microsoft); (lumia[\w ]+)/i,
            /(lenovo)[-_ ]?([-\w]+)/i,
            /(jolla)/i,
            /(oppo) ?([\w ]+) bui/i,
          ],
          [m, b, [f, R]],
          [
            /(archos) (gamepad2?)/i,
            /(hp).+(touchpad(?!.+tablet)|tablet)/i,
            /(kindle)\/([\w\.]+)/i,
            /(nook)[\w ]+build\/(\w+)/i,
            /(dell) (strea[kpr\d ]*[\dko])/i,
            /(le[- ]+pan)[- ]+(\w{1,9}) bui/i,
            /(trinity)[- ]*(t\d{3}) bui/i,
            /(gigaset)[- ]+(q\w{1,9}) bui/i,
            /(vodafone) ([\w ]+)(?:\)| bui)/i,
          ],
          [m, b, [f, I]],
          [/(surface duo)/i],
          [b, [m, N], [f, I]],
          [/droid [\d\.]+; (fp\du?)(?: b|\))/i],
          [b, [m, 'Fairphone'], [f, R]],
          [/(u304aa)/i],
          [b, [m, 'AT&T'], [f, R]],
          [/\bsie-(\w*)/i],
          [b, [m, 'Siemens'], [f, R]],
          [/\b(rct\w+) b/i],
          [b, [m, 'RCA'], [f, I]],
          [/\b(venue[\d ]{2,7}) b/i],
          [b, [m, 'Dell'], [f, I]],
          [/\b(q(?:mv|ta)\w+) b/i],
          [b, [m, 'Verizon'], [f, I]],
          [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i],
          [b, [m, 'Barnes & Noble'], [f, I]],
          [/\b(tm\d{3}\w+) b/i],
          [b, [m, 'NuVision'], [f, I]],
          [/\b(k88) b/i],
          [b, [m, 'ZTE'], [f, I]],
          [/\b(nx\d{3}j) b/i],
          [b, [m, 'ZTE'], [f, R]],
          [/\b(gen\d{3}) b.+49h/i],
          [b, [m, 'Swiss'], [f, R]],
          [/\b(zur\d{3}) b/i],
          [b, [m, 'Swiss'], [f, I]],
          [/\b((zeki)?tb.*\b) b/i],
          [b, [m, 'Zeki'], [f, I]],
          [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i],
          [[m, 'Dragon Touch'], b, [f, I]],
          [/\b(ns-?\w{0,9}) b/i],
          [b, [m, 'Insignia'], [f, I]],
          [/\b((nxa|next)-?\w{0,9}) b/i],
          [b, [m, 'NextBook'], [f, I]],
          [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i],
          [[m, 'Voice'], b, [f, R]],
          [/\b(lvtel\-)?(v1[12]) b/i],
          [[m, 'LvTel'], b, [f, R]],
          [/\b(ph-1) /i],
          [b, [m, 'Essential'], [f, R]],
          [/\b(v(100md|700na|7011|917g).*\b) b/i],
          [b, [m, 'Envizen'], [f, I]],
          [/\b(trio[-\w\. ]+) b/i],
          [b, [m, 'MachSpeed'], [f, I]],
          [/\btu_(1491) b/i],
          [b, [m, 'Rotor'], [f, I]],
          [/(shield[\w ]+) b/i],
          [b, [m, 'Nvidia'], [f, I]],
          [/(sprint) (\w+)/i],
          [m, b, [f, R]],
          [/(kin\.[onetw]{3})/i],
          [
            [b, /\./g, ' '],
            [m, N],
            [f, R],
          ],
          [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i],
          [b, [m, $e], [f, I]],
          [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i],
          [b, [m, $e], [f, R]],
          [/(ouya)/i, /(nintendo) ([wids3utch]+)/i],
          [m, b, [f, F]],
          [/droid.+; (shield) bui/i],
          [b, [m, 'Nvidia'], [f, F]],
          [/(playstation [345portablevi]+)/i],
          [b, [m, ye], [f, F]],
          [/\b(xbox(?: one)?(?!; xbox))[\); ]/i],
          [b, [m, N], [f, F]],
          [/smart-tv.+(samsung)/i],
          [m, [f, B]],
          [/hbbtv.+maple;(\d+)/i],
          [
            [b, /^/, 'SmartTV'],
            [m, ue],
            [f, B],
          ],
          [/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i],
          [
            [m, P],
            [f, B],
          ],
          [/(apple) ?tv/i],
          [m, [b, re + ' TV'], [f, B]],
          [/crkey/i],
          [
            [b, d + 'cast'],
            [m, T],
            [f, B],
          ],
          [/droid.+aft(\w)( bui|\))/i],
          [b, [m, xe], [f, B]],
          [/\(dtv[\);].+(aquos)/i, /(aquos-tv[\w ]+)\)/i],
          [b, [m, Se], [f, B]],
          [/(bravia[\w ]+)( bui|\))/i],
          [b, [m, ye], [f, B]],
          [/(mitv-\w{5}) bui/i],
          [b, [m, Z], [f, B]],
          [/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, /hbbtv\/\d+\.\d+\.\d+ +\([\w ]*; *(\w[^;]*);([^;]*)/i],
          [
            [m, at],
            [b, at],
            [f, B],
          ],
          [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i],
          [[f, B]],
          [/((pebble))app/i],
          [m, b, [f, j]],
          [/droid.+; (glass) \d/i],
          [b, [m, T], [f, j]],
          [/droid.+; (wt63?0{2,3})\)/i],
          [b, [m, $e], [f, j]],
          [/(quest( 2)?)/i],
          [b, [m, He], [f, j]],
          [/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i],
          [m, [f, ce]],
          [/droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i],
          [b, [f, R]],
          [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i],
          [b, [f, I]],
          [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i],
          [[f, I]],
          [/(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i],
          [[f, R]],
          [/(android[-\w\. ]{0,9});.+buil/i],
          [b, [m, 'Generic']],
        ],
        engine: [
          [/windows.+ edge\/([\w\.]+)/i],
          [S, [v, h + 'HTML']],
          [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i],
          [S, [v, 'Blink']],
          [
            /(presto)\/([\w\.]+)/i,
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i,
            /ekioh(flow)\/([\w\.]+)/i,
            /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i,
            /(icab)[\/ ]([23]\.[\d\.]+)/i,
          ],
          [v, S],
          [/rv\:([\w\.]{1,9})\b.+(gecko)/i],
          [S, v],
        ],
        os: [
          [/microsoft (windows) (vista|xp)/i],
          [v, S],
          [
            /(windows) nt 6\.2; (arm)/i,
            /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i,
            /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i,
          ],
          [v, [S, ke, ot]],
          [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i],
          [
            [v, 'Windows'],
            [S, ke, ot],
          ],
          [/ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, /cfnetwork\/.+darwin/i],
          [
            [S, /_/g, '.'],
            [v, 'iOS'],
          ],
          [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i],
          [
            [v, 'Mac OS'],
            [S, /_/g, '.'],
          ],
          [/droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i],
          [S, v],
          [
            /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i,
            /(blackberry)\w*\/([\w\.]*)/i,
            /(tizen|kaios)[\/ ]([\w\.]+)/i,
            /\((series40);/i,
          ],
          [v, S],
          [/\(bb(10);/i],
          [S, [v, y]],
          [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i],
          [S, [v, 'Symbian']],
          [/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i],
          [S, [v, g + ' OS']],
          [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i],
          [S, [v, 'webOS']],
          [/crkey\/([\d\.]+)/i],
          [S, [v, d + 'cast']],
          [/(cros) [\w]+ ([\w\.]+\w)/i],
          [[v, 'Chromium OS'], S],
          [
            /(nintendo|playstation) ([wids345portablevuch]+)/i,
            /(xbox); +xbox ([^\);]+)/i,
            /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,
            /(mint)[\/\(\) ]?(\w*)/i,
            /(mageia|vectorlinux)[; ]/i,
            /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
            /(hurd|linux) ?([\w\.]*)/i,
            /(gnu) ?([\w\.]*)/i,
            /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i,
            /(haiku) (\w+)/i,
          ],
          [v, S],
          [/(sunos) ?([\w\.\d]*)/i],
          [[v, 'Solaris'], S],
          [
            /((?:open)?solaris)[-\/ ]?([\w\.]*)/i,
            /(aix) ((\d)(?=\.|\)| )[\w\.])*/i,
            /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux)/i,
            /(unix) ?([\w\.]*)/i,
          ],
          [v, S],
        ],
      },
      ge = function (W, z) {
        if ((typeof W === c && ((z = W), (W = n)), !(this instanceof ge))) return new ge(W, z).getResult();
        var q = W || (typeof r !== l && r.navigator && r.navigator.userAgent ? r.navigator.userAgent : a),
          te = z ? it(ze, z) : ze;
        return (
          (this.getBrowser = function () {
            var L = {};
            return (L[v] = n), (L[S] = n), Te.call(L, q, te.browser), (L.major = Zt(L.version)), L;
          }),
          (this.getCPU = function () {
            var L = {};
            return (L[U] = n), Te.call(L, q, te.cpu), L;
          }),
          (this.getDevice = function () {
            var L = {};
            return (L[m] = n), (L[b] = n), (L[f] = n), Te.call(L, q, te.device), L;
          }),
          (this.getEngine = function () {
            var L = {};
            return (L[v] = n), (L[S] = n), Te.call(L, q, te.engine), L;
          }),
          (this.getOS = function () {
            var L = {};
            return (L[v] = n), (L[S] = n), Te.call(L, q, te.os), L;
          }),
          (this.getResult = function () {
            return {
              ua: this.getUA(),
              browser: this.getBrowser(),
              engine: this.getEngine(),
              os: this.getOS(),
              device: this.getDevice(),
              cpu: this.getCPU(),
            };
          }),
          (this.getUA = function () {
            return q;
          }),
          (this.setUA = function (L) {
            return (q = typeof L === x && L.length > pe ? at(L, pe) : L), this;
          }),
          this.setUA(q),
          this
        );
      };
    (ge.VERSION = i),
      (ge.BROWSER = Pe([v, S, O])),
      (ge.CPU = Pe([U])),
      (ge.DEVICE = Pe([b, m, f, F, R, B, I, j, ce])),
      (ge.ENGINE = ge.OS = Pe([v, S])),
      t.exports && (e = t.exports = ge),
      (e.UAParser = ge);
    var Me = typeof r !== l && (r.jQuery || r.Zepto);
    if (Me && !Me.ua) {
      var Ne = new ge();
      (Me.ua = Ne.getResult()),
        (Me.ua.get = function () {
          return Ne.getUA();
        }),
        (Me.ua.set = function (W) {
          Ne.setUA(W);
          var z = Ne.getResult();
          for (var q in z) Me.ua[q] = z[q];
        });
    }
  })(typeof window == 'object' ? window : wn);
})(ja, kt);
Object.defineProperty(A, '__esModule', { value: !0 });
function La(t) {
  return t && typeof t == 'object' && 'default' in t ? t.default : t;
}
var de = oe,
  ee = La(de),
  Tn = kt,
  We = new Tn(),
  he = We.getBrowser(),
  qa = We.getCPU(),
  we = We.getDevice(),
  wr = We.getEngine(),
  Qe = We.getOS(),
  bt = We.getUA(),
  Rn = function (e) {
    return We.setUA(e);
  },
  xt = function (e) {
    if (!e) {
      console.error('No userAgent string was provided');
      return;
    }
    var r = new Tn(e);
    return {
      UA: r,
      browser: r.getBrowser(),
      cpu: r.getCPU(),
      device: r.getDevice(),
      engine: r.getEngine(),
      os: r.getOS(),
      ua: r.getUA(),
      setUserAgent: function (i) {
        return r.setUA(i);
      },
    };
  },
  _n = /* @__PURE__ */ Object.freeze({
    ClientUAInstance: We,
    browser: he,
    cpu: qa,
    device: we,
    engine: wr,
    os: Qe,
    ua: bt,
    setUa: Rn,
    parseUserAgent: xt,
  });
function Kr(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(t);
    e &&
      (n = n.filter(function (i) {
        return Object.getOwnPropertyDescriptor(t, i).enumerable;
      })),
      r.push.apply(r, n);
  }
  return r;
}
function Ba(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2
      ? Kr(Object(r), !0).forEach(function (n) {
          Qa(t, n, r[n]);
        })
      : Object.getOwnPropertyDescriptors
      ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r))
      : Kr(Object(r)).forEach(function (n) {
          Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(r, n));
        });
  }
  return t;
}
function lt(t) {
  return (
    typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
      ? (lt = function (e) {
          return typeof e;
        })
      : (lt = function (e) {
          return e && typeof Symbol == 'function' && e.constructor === Symbol && e !== Symbol.prototype
            ? 'symbol'
            : typeof e;
        }),
    lt(t)
  );
}
function Va(t, e) {
  if (!(t instanceof e)) throw new TypeError('Cannot call a class as a function');
}
function Yr(t, e) {
  for (var r = 0; r < e.length; r++) {
    var n = e[r];
    (n.enumerable = n.enumerable || !1),
      (n.configurable = !0),
      'value' in n && (n.writable = !0),
      Object.defineProperty(t, n.key, n);
  }
}
function Wa(t, e, r) {
  return e && Yr(t.prototype, e), r && Yr(t, r), t;
}
function Qa(t, e, r) {
  return (
    e in t
      ? Object.defineProperty(t, e, {
          value: r,
          enumerable: !0,
          configurable: !0,
          writable: !0,
        })
      : (t[e] = r),
    t
  );
}
function ur() {
  return (
    (ur =
      Object.assign ||
      function (t) {
        for (var e = 1; e < arguments.length; e++) {
          var r = arguments[e];
          for (var n in r) Object.prototype.hasOwnProperty.call(r, n) && (t[n] = r[n]);
        }
        return t;
      }),
    ur.apply(this, arguments)
  );
}
function $a(t, e) {
  if (typeof e != 'function' && e !== null) throw new TypeError('Super expression must either be null or a function');
  (t.prototype = Object.create(e && e.prototype, {
    constructor: {
      value: t,
      writable: !0,
      configurable: !0,
    },
  })),
    e && fr(t, e);
}
function cr(t) {
  return (
    (cr = Object.setPrototypeOf
      ? Object.getPrototypeOf
      : function (r) {
          return r.__proto__ || Object.getPrototypeOf(r);
        }),
    cr(t)
  );
}
function fr(t, e) {
  return (
    (fr =
      Object.setPrototypeOf ||
      function (n, i) {
        return (n.__proto__ = i), n;
      }),
    fr(t, e)
  );
}
function Ha(t, e) {
  if (t == null) return {};
  var r = {},
    n = Object.keys(t),
    i,
    a;
  for (a = 0; a < n.length; a++) (i = n[a]), !(e.indexOf(i) >= 0) && (r[i] = t[i]);
  return r;
}
function Ce(t, e) {
  if (t == null) return {};
  var r = Ha(t, e),
    n,
    i;
  if (Object.getOwnPropertySymbols) {
    var a = Object.getOwnPropertySymbols(t);
    for (i = 0; i < a.length; i++)
      (n = a[i]), !(e.indexOf(n) >= 0) && Object.prototype.propertyIsEnumerable.call(t, n) && (r[n] = t[n]);
  }
  return r;
}
function Rt(t) {
  if (t === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return t;
}
function za(t, e) {
  if (e && (typeof e == 'object' || typeof e == 'function')) return e;
  if (e !== void 0) throw new TypeError('Derived constructors may only return object or undefined');
  return Rt(t);
}
function Ka(t, e) {
  return Ya(t) || Ja(t, e) || Ga(t, e) || Xa();
}
function Ya(t) {
  if (Array.isArray(t)) return t;
}
function Ja(t, e) {
  var r = t == null ? null : (typeof Symbol != 'undefined' && t[Symbol.iterator]) || t['@@iterator'];
  if (r != null) {
    var n = [],
      i = !0,
      a = !1,
      o,
      s;
    try {
      for (r = r.call(t); !(i = (o = r.next()).done) && (n.push(o.value), !(e && n.length === e)); i = !0);
    } catch (l) {
      (a = !0), (s = l);
    } finally {
      try {
        !i && r.return != null && r.return();
      } finally {
        if (a) throw s;
      }
    }
    return n;
  }
}
function Ga(t, e) {
  if (t) {
    if (typeof t == 'string') return Jr(t, e);
    var r = Object.prototype.toString.call(t).slice(8, -1);
    if ((r === 'Object' && t.constructor && (r = t.constructor.name), r === 'Map' || r === 'Set')) return Array.from(t);
    if (r === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)) return Jr(t, e);
  }
}
function Jr(t, e) {
  (e == null || e > t.length) && (e = t.length);
  for (var r = 0, n = new Array(e); r < e; r++) n[r] = t[r];
  return n;
}
function Xa() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
var le = {
    Mobile: 'mobile',
    Tablet: 'tablet',
    SmartTv: 'smarttv',
    Console: 'console',
    Wearable: 'wearable',
    Embedded: 'embedded',
    Browser: void 0,
  },
  me = {
    Chrome: 'Chrome',
    Firefox: 'Firefox',
    Opera: 'Opera',
    Yandex: 'Yandex',
    Safari: 'Safari',
    InternetExplorer: 'Internet Explorer',
    Edge: 'Edge',
    Chromium: 'Chromium',
    Ie: 'IE',
    MobileSafari: 'Mobile Safari',
    EdgeChromium: 'Edge Chromium',
    MIUI: 'MIUI Browser',
    SamsungBrowser: 'Samsung Browser',
  },
  rt = {
    IOS: 'iOS',
    Android: 'Android',
    WindowsPhone: 'Windows Phone',
    Windows: 'Windows',
    MAC_OS: 'Mac OS',
  },
  Za = {
    isMobile: !1,
    isTablet: !1,
    isBrowser: !1,
    isSmartTV: !1,
    isConsole: !1,
    isWearable: !1,
  },
  eo = function (e) {
    switch (e) {
      case le.Mobile:
        return {
          isMobile: !0,
        };
      case le.Tablet:
        return {
          isTablet: !0,
        };
      case le.SmartTv:
        return {
          isSmartTV: !0,
        };
      case le.Console:
        return {
          isConsole: !0,
        };
      case le.Wearable:
        return {
          isWearable: !0,
        };
      case le.Browser:
        return {
          isBrowser: !0,
        };
      case le.Embedded:
        return {
          isEmbedded: !0,
        };
      default:
        return Za;
    }
  },
  to = function (e) {
    return Rn(e);
  },
  M = function (e) {
    var r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'none';
    return e || r;
  },
  Er = function () {
    return typeof window != 'undefined' && (window.navigator || navigator) ? window.navigator || navigator : !1;
  },
  Or = function (e) {
    var r = Er();
    return (
      r &&
      r.platform &&
      (r.platform.indexOf(e) !== -1 || (r.platform === 'MacIntel' && r.maxTouchPoints > 1 && !window.MSStream))
    );
  },
  ro = function (e, r, n, i, a) {
    return {
      isBrowser: e,
      browserMajorVersion: M(r.major),
      browserFullVersion: M(r.version),
      browserName: M(r.name),
      engineName: M(n.name),
      engineVersion: M(n.version),
      osName: M(i.name),
      osVersion: M(i.version),
      userAgent: M(a),
    };
  },
  Gr = function (e, r, n, i) {
    return Ba({}, e, {
      vendor: M(r.vendor),
      model: M(r.model),
      os: M(n.name),
      osVersion: M(n.version),
      ua: M(i),
    });
  },
  no = function (e, r, n, i) {
    return {
      isSmartTV: e,
      engineName: M(r.name),
      engineVersion: M(r.version),
      osName: M(n.name),
      osVersion: M(n.version),
      userAgent: M(i),
    };
  },
  io = function (e, r, n, i) {
    return {
      isConsole: e,
      engineName: M(r.name),
      engineVersion: M(r.version),
      osName: M(n.name),
      osVersion: M(n.version),
      userAgent: M(i),
    };
  },
  ao = function (e, r, n, i) {
    return {
      isWearable: e,
      engineName: M(r.name),
      engineVersion: M(r.version),
      osName: M(n.name),
      osVersion: M(n.version),
      userAgent: M(i),
    };
  },
  oo = function (e, r, n, i, a) {
    return {
      isEmbedded: e,
      vendor: M(r.vendor),
      model: M(r.model),
      engineName: M(n.name),
      engineVersion: M(n.version),
      osName: M(i.name),
      osVersion: M(i.version),
      userAgent: M(a),
    };
  };
function so(t) {
  var e = t ? xt(t) : _n,
    r = e.device,
    n = e.browser,
    i = e.engine,
    a = e.os,
    o = e.ua,
    s = eo(r.type),
    l = s.isBrowser,
    c = s.isMobile,
    x = s.isTablet,
    O = s.isSmartTV,
    b = s.isConsole,
    v = s.isWearable,
    f = s.isEmbedded;
  if (l) return ro(l, n, i, a, o);
  if (O) return no(O, i, a, o);
  if (b) return io(b, i, a, o);
  if (c || x) return Gr(s, r, a, o);
  if (v) return ao(v, i, a, o);
  if (f) return oo(f, r, i, a, o);
}
var Pn = function (e) {
    var r = e.type;
    return r === le.Mobile;
  },
  An = function (e) {
    var r = e.type;
    return r === le.Tablet;
  },
  Fn = function (e) {
    var r = e.type;
    return r === le.Mobile || r === le.Tablet;
  },
  In = function (e) {
    var r = e.type;
    return r === le.SmartTv;
  },
  Mt = function (e) {
    var r = e.type;
    return r === le.Browser;
  },
  Un = function (e) {
    var r = e.type;
    return r === le.Wearable;
  },
  Dn = function (e) {
    var r = e.type;
    return r === le.Console;
  },
  kn = function (e) {
    var r = e.type;
    return r === le.Embedded;
  },
  Mn = function (e) {
    var r = e.vendor;
    return M(r);
  },
  Nn = function (e) {
    var r = e.model;
    return M(r);
  },
  jn = function (e) {
    var r = e.type;
    return M(r, 'browser');
  },
  Ln = function (e) {
    var r = e.name;
    return r === rt.Android;
  },
  qn = function (e) {
    var r = e.name;
    return r === rt.Windows;
  },
  Bn = function (e) {
    var r = e.name;
    return r === rt.MAC_OS;
  },
  Vn = function (e) {
    var r = e.name;
    return r === rt.WindowsPhone;
  },
  Wn = function (e) {
    var r = e.name;
    return r === rt.IOS;
  },
  Qn = function (e) {
    var r = e.version;
    return M(r);
  },
  $n = function (e) {
    var r = e.name;
    return M(r);
  },
  Hn = function (e) {
    var r = e.name;
    return r === me.Chrome;
  },
  zn = function (e) {
    var r = e.name;
    return r === me.Firefox;
  },
  Kn = function (e) {
    var r = e.name;
    return r === me.Chromium;
  },
  Nt = function (e) {
    var r = e.name;
    return r === me.Edge;
  },
  Yn = function (e) {
    var r = e.name;
    return r === me.Yandex;
  },
  Jn = function (e) {
    var r = e.name;
    return r === me.Safari || r === me.MobileSafari;
  },
  Gn = function (e) {
    var r = e.name;
    return r === me.MobileSafari;
  },
  Xn = function (e) {
    var r = e.name;
    return r === me.Opera;
  },
  Zn = function (e) {
    var r = e.name;
    return r === me.InternetExplorer || r === me.Ie;
  },
  ei = function (e) {
    var r = e.name;
    return r === me.MIUI;
  },
  ti = function (e) {
    var r = e.name;
    return r === me.SamsungBrowser;
  },
  ri = function (e) {
    var r = e.version;
    return M(r);
  },
  ni = function (e) {
    var r = e.major;
    return M(r);
  },
  ii = function (e) {
    var r = e.name;
    return M(r);
  },
  ai = function (e) {
    var r = e.name;
    return M(r);
  },
  oi = function (e) {
    var r = e.version;
    return M(r);
  },
  si = function () {
    var e = Er(),
      r = e && e.userAgent && e.userAgent.toLowerCase();
    return typeof r == 'string' ? /electron/.test(r) : !1;
  },
  et = function (e) {
    return typeof e == 'string' && e.indexOf('Edg/') !== -1;
  },
  ui = function () {
    var e = Er();
    return (
      e &&
      (/iPad|iPhone|iPod/.test(e.platform) || (e.platform === 'MacIntel' && e.maxTouchPoints > 1)) &&
      !window.MSStream
    );
  },
  Re = function () {
    return Or('iPad');
  },
  ci = function () {
    return Or('iPhone');
  },
  fi = function () {
    return Or('iPod');
  },
  li = function (e) {
    return M(e);
  };
function di(t) {
  var e = t || _n,
    r = e.device,
    n = e.browser,
    i = e.os,
    a = e.engine,
    o = e.ua;
  return {
    isSmartTV: In(r),
    isConsole: Dn(r),
    isWearable: Un(r),
    isEmbedded: kn(r),
    isMobileSafari: Gn(n) || Re(),
    isChromium: Kn(n),
    isMobile: Fn(r) || Re(),
    isMobileOnly: Pn(r),
    isTablet: An(r) || Re(),
    isBrowser: Mt(r),
    isDesktop: Mt(r),
    isAndroid: Ln(i),
    isWinPhone: Vn(i),
    isIOS: Wn(i) || Re(),
    isChrome: Hn(n),
    isFirefox: zn(n),
    isSafari: Jn(n),
    isOpera: Xn(n),
    isIE: Zn(n),
    osVersion: Qn(i),
    osName: $n(i),
    fullBrowserVersion: ri(n),
    browserVersion: ni(n),
    browserName: ii(n),
    mobileVendor: Mn(r),
    mobileModel: Nn(r),
    engineName: ai(a),
    engineVersion: oi(a),
    getUA: li(o),
    isEdge: Nt(n) || et(o),
    isYandex: Yn(n),
    deviceType: jn(r),
    isIOS13: ui(),
    isIPad13: Re(),
    isIPhone13: ci(),
    isIPod13: fi(),
    isElectron: si(),
    isEdgeChromium: et(o),
    isLegacyEdge: Nt(n) && !et(o),
    isWindows: qn(i),
    isMacOs: Bn(i),
    isMIUI: ei(n),
    isSamsungBrowser: ti(n),
  };
}
var hi = In(we),
  pi = Dn(we),
  bi = Un(we),
  uo = kn(we),
  co = Gn(he) || Re(),
  fo = Kn(he),
  Ht = Fn(we) || Re(),
  xi = Pn(we),
  vi = An(we) || Re(),
  mi = Mt(we),
  lo = Mt(we),
  yi = Ln(Qe),
  gi = Vn(Qe),
  wi = Wn(Qe) || Re(),
  ho = Hn(he),
  po = zn(he),
  bo = Jn(he),
  xo = Xn(he),
  Ei = Zn(he),
  vo = Qn(Qe),
  mo = $n(Qe),
  yo = ri(he),
  go = ni(he),
  wo = ii(he),
  Eo = Mn(we),
  Oo = Nn(we),
  Co = ai(wr),
  So = oi(wr),
  To = li(bt),
  Ro = Nt(he) || et(bt),
  _o = Yn(he),
  Po = jn(we),
  Ao = ui(),
  Fo = Re(),
  Io = ci(),
  Uo = fi(),
  Do = si(),
  ko = et(bt),
  Mo = Nt(he) && !et(bt),
  No = qn(Qe),
  jo = Bn(Qe),
  Lo = ei(he),
  qo = ti(he),
  Bo = function (e) {
    if (!e || typeof e != 'string') {
      console.error('No valid user agent string was provided');
      return;
    }
    var r = xt(e),
      n = r.device,
      i = r.browser,
      a = r.os,
      o = r.engine,
      s = r.ua;
    return di({
      device: n,
      browser: i,
      os: a,
      engine: o,
      ua: s,
    });
  },
  Vo = function (e) {
    var r = e.renderWithFragment,
      n = e.children,
      i = Ce(e, ['renderWithFragment', 'children']);
    return yi ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  Wo = function (e) {
    var r = e.renderWithFragment,
      n = e.children,
      i = Ce(e, ['renderWithFragment', 'children']);
    return mi ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  Qo = function (e) {
    var r = e.renderWithFragment,
      n = e.children,
      i = Ce(e, ['renderWithFragment', 'children']);
    return Ei ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  $o = function (e) {
    var r = e.renderWithFragment,
      n = e.children,
      i = Ce(e, ['renderWithFragment', 'children']);
    return wi ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  Ho = function (e) {
    var r = e.renderWithFragment,
      n = e.children,
      i = Ce(e, ['renderWithFragment', 'children']);
    return Ht ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  zo = function (e) {
    var r = e.renderWithFragment,
      n = e.children,
      i = Ce(e, ['renderWithFragment', 'children']);
    return vi ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  Ko = function (e) {
    var r = e.renderWithFragment,
      n = e.children,
      i = Ce(e, ['renderWithFragment', 'children']);
    return gi ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  Yo = function (e) {
    var r = e.renderWithFragment,
      n = e.children;
    e.viewClassName, e.style;
    var i = Ce(e, ['renderWithFragment', 'children', 'viewClassName', 'style']);
    return xi ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  Jo = function (e) {
    var r = e.renderWithFragment,
      n = e.children,
      i = Ce(e, ['renderWithFragment', 'children']);
    return hi ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  Go = function (e) {
    var r = e.renderWithFragment,
      n = e.children,
      i = Ce(e, ['renderWithFragment', 'children']);
    return pi ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  Xo = function (e) {
    var r = e.renderWithFragment,
      n = e.children,
      i = Ce(e, ['renderWithFragment', 'children']);
    return bi ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', i, n)) : null;
  },
  Zo = function (e) {
    var r = e.renderWithFragment,
      n = e.children;
    e.viewClassName, e.style;
    var i = e.condition,
      a = Ce(e, ['renderWithFragment', 'children', 'viewClassName', 'style', 'condition']);
    return i ? (r ? ee.createElement(de.Fragment, null, n) : ee.createElement('div', a, n)) : null;
  };
function es(t) {
  return /* @__PURE__ */ (function (e) {
    $a(r, e);
    function r(n) {
      var i;
      return (
        Va(this, r),
        (i = za(this, cr(r).call(this, n))),
        (i.isEventListenerAdded = !1),
        (i.handleOrientationChange = i.handleOrientationChange.bind(Rt(i))),
        (i.onOrientationChange = i.onOrientationChange.bind(Rt(i))),
        (i.onPageLoad = i.onPageLoad.bind(Rt(i))),
        (i.state = {
          isLandscape: !1,
          isPortrait: !1,
        }),
        i
      );
    }
    return (
      Wa(r, [
        {
          key: 'handleOrientationChange',
          value: function () {
            this.isEventListenerAdded || (this.isEventListenerAdded = !0);
            var i = window.innerWidth > window.innerHeight ? 90 : 0;
            this.setState({
              isPortrait: i === 0,
              isLandscape: i === 90,
            });
          },
        },
        {
          key: 'onOrientationChange',
          value: function () {
            this.handleOrientationChange();
          },
        },
        {
          key: 'onPageLoad',
          value: function () {
            this.handleOrientationChange();
          },
        },
        {
          key: 'componentDidMount',
          value: function () {
            (typeof window == 'undefined' ? 'undefined' : lt(window)) !== void 0 &&
              Ht &&
              (this.isEventListenerAdded
                ? window.removeEventListener('load', this.onPageLoad, !1)
                : (this.handleOrientationChange(), window.addEventListener('load', this.onPageLoad, !1)),
              window.addEventListener('resize', this.onOrientationChange, !1));
          },
        },
        {
          key: 'componentWillUnmount',
          value: function () {
            window.removeEventListener('resize', this.onOrientationChange, !1);
          },
        },
        {
          key: 'render',
          value: function () {
            return ee.createElement(
              t,
              ur({}, this.props, {
                isLandscape: this.state.isLandscape,
                isPortrait: this.state.isPortrait,
              })
            );
          },
        },
      ]),
      r
    );
  })(ee.Component);
}
function ts() {
  var t = de.useState(function () {
      var a = window.innerWidth > window.innerHeight ? 90 : 0;
      return {
        isPortrait: a === 0,
        isLandscape: a === 90,
        orientation: a === 0 ? 'portrait' : 'landscape',
      };
    }),
    e = Ka(t, 2),
    r = e[0],
    n = e[1],
    i = de.useCallback(
      function () {
        var a = window.innerWidth > window.innerHeight ? 90 : 0,
          o = {
            isPortrait: a === 0,
            isLandscape: a === 90,
            orientation: a === 0 ? 'portrait' : 'landscape',
          };
        r.orientation !== o.orientation && n(o);
      },
      [r.orientation]
    );
  return (
    de.useEffect(
      function () {
        return (
          (typeof window == 'undefined' ? 'undefined' : lt(window)) !== void 0 &&
            Ht &&
            (i(), window.addEventListener('load', i, !1), window.addEventListener('resize', i, !1)),
          function () {
            window.removeEventListener('resize', i, !1), window.removeEventListener('load', i, !1);
          }
        );
      },
      [i]
    ),
    r
  );
}
function Oi(t) {
  var e = t || window.navigator.userAgent;
  return xt(e);
}
function rs(t) {
  var e = t || window.navigator.userAgent,
    r = Oi(e),
    n = di(r);
  return [n, r];
}
A.AndroidView = Vo;
A.BrowserTypes = me;
A.BrowserView = Wo;
A.ConsoleView = Go;
A.CustomView = Zo;
A.IEView = Qo;
A.IOSView = $o;
A.MobileOnlyView = Yo;
A.MobileView = Ho;
A.OsTypes = rt;
A.SmartTVView = Jo;
A.TabletView = zo;
A.WearableView = Xo;
A.WinPhoneView = Ko;
A.browserName = wo;
A.browserVersion = go;
A.deviceDetect = so;
A.deviceType = Po;
A.engineName = Co;
A.engineVersion = So;
A.fullBrowserVersion = yo;
A.getSelectorsByUserAgent = Bo;
A.getUA = To;
A.isAndroid = yi;
A.isBrowser = mi;
A.isChrome = ho;
A.isChromium = fo;
A.isConsole = pi;
A.isDesktop = lo;
A.isEdge = Ro;
A.isEdgeChromium = ko;
A.isElectron = Do;
A.isEmbedded = uo;
A.isFirefox = po;
A.isIE = Ei;
A.isIOS = wi;
A.isIOS13 = Ao;
A.isIPad13 = Fo;
A.isIPhone13 = Io;
A.isIPod13 = Uo;
A.isLegacyEdge = Mo;
A.isMIUI = Lo;
A.isMacOs = jo;
var ns = (A.isMobile = Ht);
A.isMobileOnly = xi;
A.isMobileSafari = co;
A.isOpera = xo;
A.isSafari = bo;
A.isSamsungBrowser = qo;
A.isSmartTV = hi;
A.isTablet = vi;
A.isWearable = bi;
A.isWinPhone = gi;
A.isWindows = No;
A.isYandex = _o;
A.mobileModel = Oo;
A.mobileVendor = Eo;
A.osName = mo;
A.osVersion = vo;
A.parseUserAgent = xt;
A.setUserAgent = to;
A.useDeviceData = Oi;
A.useDeviceSelectors = rs;
A.useMobileOrientation = ts;
A.withOrientationChange = es;
const is = (t, e) => {
    const r = $t(t, e);
    return r && typeof r.lazyLoad != 'undefined' ? Xr(r.lazyLoad) : Xr(t.config.lazyLoad);
  },
  as = (t) =>
    t !== void 0
      ? typeof t == 'boolean'
        ? t
        : typeof t == 'object' && 'marginPercent' in t && 'mobileScaling' in t
      : !1,
  os = (t) => {
    if (typeof t == 'boolean' || !t.marginPercent) return;
    const { marginPercent: e, mobileScaling: r } = t;
    return `${((ns && r !== void 0 && r !== -1 ? e * r : e) / 100) * window.innerHeight}px`;
  },
  Xr = (t) =>
    typeof t == 'undefined' ? !1 : typeof t == 'boolean' ? t : t.marginPercent ? (t.marginPercent < 0 ? !1 : t) : !0,
  ss = ({ id: t, config: e }) => {
    const r = gn(null),
      n = Oe(() => is(e, t), [e, t]),
      i = Oe(() => as(n), [n]),
      a = ar(() => x(Na(e, t)), [e, t]),
      o = Oe(() => Ma(e, t), [e, t]),
      s = Oe(() => Ua(e, t), [e, t]),
      l = Oe(() => s > 0, [s]),
      [c, x] = ht(o);
    Fe(() => {
      x(o);
    }, [o]);
    const { ref: O, inView: b } = Ia({
        skip: !i,
        triggerOnce: !0,
        fallbackInView: !0,
        rootMargin: i ? os(n) : '0px',
        onChange: (f) => {
          f && v(t);
        },
      }),
      v = ar(
        (f) => {
          On(() => Sa(f, r, a));
        },
        [a]
      );
    return (
      Fe(() => {
        if (l) return Da(t, b, s, i, v);
      }, [b, s, i, t, v, l]),
      Fe(() => {
        !i && !s && v(t);
      }, [e, t, v, i, s]),
      /* @__PURE__ */ Ve('div', {
        id: t,
        ref: O,
        role: 'slot-container',
        style: { fontSize: '0 !important' },
        children: /* @__PURE__ */ Ve('iframe', Qr({ ref: r, style: { borderWidth: 0 }, role: 'iframe' }, c)),
      })
    );
  },
  Vc = ({ id: t }) => {
    const { data: e, isPrebidSetup: r } = Ea(),
      n = Oe(() => e && gr() && r, [e, r]);
    return e && n ? /* @__PURE__ */ Ve(ss, { id: t, config: e }) : /* @__PURE__ */ Ve(oe.Fragment, {});
  };
function lr(t, e) {
  return (
    (lr = Object.setPrototypeOf
      ? Object.setPrototypeOf.bind()
      : function (n, i) {
          return (n.__proto__ = i), n;
        }),
    lr(t, e)
  );
}
function vt(t, e) {
  (t.prototype = Object.create(e.prototype)), (t.prototype.constructor = t), lr(t, e);
}
var mt = /* @__PURE__ */ (function () {
  function t() {
    this.listeners = [];
  }
  var e = t.prototype;
  return (
    (e.subscribe = function (n) {
      var i = this,
        a = n || function () {};
      return (
        this.listeners.push(a),
        this.onSubscribe(),
        function () {
          (i.listeners = i.listeners.filter(function (o) {
            return o !== a;
          })),
            i.onUnsubscribe();
        }
      );
    }),
    (e.hasListeners = function () {
      return this.listeners.length > 0;
    }),
    (e.onSubscribe = function () {}),
    (e.onUnsubscribe = function () {}),
    t
  );
})();
function Y() {
  return (
    (Y = Object.assign
      ? Object.assign.bind()
      : function (t) {
          for (var e = 1; e < arguments.length; e++) {
            var r = arguments[e];
            for (var n in r) Object.prototype.hasOwnProperty.call(r, n) && (t[n] = r[n]);
          }
          return t;
        }),
    Y.apply(this, arguments)
  );
}
var jt = typeof window == 'undefined';
function fe() {}
function us(t, e) {
  return typeof t == 'function' ? t(e) : t;
}
function dr(t) {
  return typeof t == 'number' && t >= 0 && t !== 1 / 0;
}
function Lt(t) {
  return Array.isArray(t) ? t : [t];
}
function Ci(t, e) {
  return Math.max(t + (e || 0) - Date.now(), 0);
}
function _t(t, e, r) {
  return zt(t)
    ? typeof e == 'function'
      ? Y({}, r, {
          queryKey: t,
          queryFn: e,
        })
      : Y({}, e, {
          queryKey: t,
        })
    : t;
}
function qe(t, e, r) {
  return zt(t)
    ? [
        Y({}, e, {
          queryKey: t,
        }),
        r,
      ]
    : [t || {}, e];
}
function cs(t, e) {
  if ((t === !0 && e === !0) || (t == null && e == null)) return 'all';
  if (t === !1 && e === !1) return 'none';
  var r = t != null ? t : !e;
  return r ? 'active' : 'inactive';
}
function Zr(t, e) {
  var r = t.active,
    n = t.exact,
    i = t.fetching,
    a = t.inactive,
    o = t.predicate,
    s = t.queryKey,
    l = t.stale;
  if (zt(s)) {
    if (n) {
      if (e.queryHash !== Cr(s, e.options)) return !1;
    } else if (!qt(e.queryKey, s)) return !1;
  }
  var c = cs(r, a);
  if (c === 'none') return !1;
  if (c !== 'all') {
    var x = e.isActive();
    if ((c === 'active' && !x) || (c === 'inactive' && x)) return !1;
  }
  return !(
    (typeof l == 'boolean' && e.isStale() !== l) ||
    (typeof i == 'boolean' && e.isFetching() !== i) ||
    (o && !o(e))
  );
}
function en(t, e) {
  var r = t.exact,
    n = t.fetching,
    i = t.predicate,
    a = t.mutationKey;
  if (zt(a)) {
    if (!e.options.mutationKey) return !1;
    if (r) {
      if (Ye(e.options.mutationKey) !== Ye(a)) return !1;
    } else if (!qt(e.options.mutationKey, a)) return !1;
  }
  return !((typeof n == 'boolean' && (e.state.status === 'loading') !== n) || (i && !i(e)));
}
function Cr(t, e) {
  var r = (e == null ? void 0 : e.queryKeyHashFn) || Ye;
  return r(t);
}
function Ye(t) {
  var e = Lt(t);
  return fs(e);
}
function fs(t) {
  return JSON.stringify(t, function (e, r) {
    return hr(r)
      ? Object.keys(r)
          .sort()
          .reduce(function (n, i) {
            return (n[i] = r[i]), n;
          }, {})
      : r;
  });
}
function qt(t, e) {
  return Si(Lt(t), Lt(e));
}
function Si(t, e) {
  return t === e
    ? !0
    : typeof t != typeof e
    ? !1
    : t && e && typeof t == 'object' && typeof e == 'object'
    ? !Object.keys(e).some(function (r) {
        return !Si(t[r], e[r]);
      })
    : !1;
}
function Bt(t, e) {
  if (t === e) return t;
  var r = Array.isArray(t) && Array.isArray(e);
  if (r || (hr(t) && hr(e))) {
    for (
      var n = r ? t.length : Object.keys(t).length,
        i = r ? e : Object.keys(e),
        a = i.length,
        o = r ? [] : {},
        s = 0,
        l = 0;
      l < a;
      l++
    ) {
      var c = r ? l : i[l];
      (o[c] = Bt(t[c], e[c])), o[c] === t[c] && s++;
    }
    return n === a && s === n ? t : o;
  }
  return e;
}
function ls(t, e) {
  if ((t && !e) || (e && !t)) return !1;
  for (var r in t) if (t[r] !== e[r]) return !1;
  return !0;
}
function hr(t) {
  if (!tn(t)) return !1;
  var e = t.constructor;
  if (typeof e == 'undefined') return !0;
  var r = e.prototype;
  return !(!tn(r) || !r.hasOwnProperty('isPrototypeOf'));
}
function tn(t) {
  return Object.prototype.toString.call(t) === '[object Object]';
}
function zt(t) {
  return typeof t == 'string' || Array.isArray(t);
}
function ds(t) {
  return new Promise(function (e) {
    setTimeout(e, t);
  });
}
function rn(t) {
  Promise.resolve()
    .then(t)
    .catch(function (e) {
      return setTimeout(function () {
        throw e;
      });
    });
}
function Ti() {
  if (typeof AbortController == 'function') return new AbortController();
}
var hs = /* @__PURE__ */ (function (t) {
    vt(e, t);
    function e() {
      var n;
      return (
        (n = t.call(this) || this),
        (n.setup = function (i) {
          var a;
          if (!jt && (a = window) != null && a.addEventListener) {
            var o = function () {
              return i();
            };
            return (
              window.addEventListener('visibilitychange', o, !1),
              window.addEventListener('focus', o, !1),
              function () {
                window.removeEventListener('visibilitychange', o), window.removeEventListener('focus', o);
              }
            );
          }
        }),
        n
      );
    }
    var r = e.prototype;
    return (
      (r.onSubscribe = function () {
        this.cleanup || this.setEventListener(this.setup);
      }),
      (r.onUnsubscribe = function () {
        if (!this.hasListeners()) {
          var i;
          (i = this.cleanup) == null || i.call(this), (this.cleanup = void 0);
        }
      }),
      (r.setEventListener = function (i) {
        var a,
          o = this;
        (this.setup = i),
          (a = this.cleanup) == null || a.call(this),
          (this.cleanup = i(function (s) {
            typeof s == 'boolean' ? o.setFocused(s) : o.onFocus();
          }));
      }),
      (r.setFocused = function (i) {
        (this.focused = i), i && this.onFocus();
      }),
      (r.onFocus = function () {
        this.listeners.forEach(function (i) {
          i();
        });
      }),
      (r.isFocused = function () {
        return typeof this.focused == 'boolean'
          ? this.focused
          : typeof document == 'undefined'
          ? !0
          : [void 0, 'visible', 'prerender'].includes(document.visibilityState);
      }),
      e
    );
  })(mt),
  dt = new hs(),
  ps = /* @__PURE__ */ (function (t) {
    vt(e, t);
    function e() {
      var n;
      return (
        (n = t.call(this) || this),
        (n.setup = function (i) {
          var a;
          if (!jt && (a = window) != null && a.addEventListener) {
            var o = function () {
              return i();
            };
            return (
              window.addEventListener('online', o, !1),
              window.addEventListener('offline', o, !1),
              function () {
                window.removeEventListener('online', o), window.removeEventListener('offline', o);
              }
            );
          }
        }),
        n
      );
    }
    var r = e.prototype;
    return (
      (r.onSubscribe = function () {
        this.cleanup || this.setEventListener(this.setup);
      }),
      (r.onUnsubscribe = function () {
        if (!this.hasListeners()) {
          var i;
          (i = this.cleanup) == null || i.call(this), (this.cleanup = void 0);
        }
      }),
      (r.setEventListener = function (i) {
        var a,
          o = this;
        (this.setup = i),
          (a = this.cleanup) == null || a.call(this),
          (this.cleanup = i(function (s) {
            typeof s == 'boolean' ? o.setOnline(s) : o.onOnline();
          }));
      }),
      (r.setOnline = function (i) {
        (this.online = i), i && this.onOnline();
      }),
      (r.onOnline = function () {
        this.listeners.forEach(function (i) {
          i();
        });
      }),
      (r.isOnline = function () {
        return typeof this.online == 'boolean'
          ? this.online
          : typeof navigator == 'undefined' || typeof navigator.onLine == 'undefined'
          ? !0
          : navigator.onLine;
      }),
      e
    );
  })(mt),
  Pt = new ps();
function bs(t) {
  return Math.min(1e3 * Math.pow(2, t), 3e4);
}
function Vt(t) {
  return typeof (t == null ? void 0 : t.cancel) == 'function';
}
var Ri = function (e) {
  (this.revert = e == null ? void 0 : e.revert), (this.silent = e == null ? void 0 : e.silent);
};
function At(t) {
  return t instanceof Ri;
}
var _i = function (e) {
    var r = this,
      n = !1,
      i,
      a,
      o,
      s;
    (this.abort = e.abort),
      (this.cancel = function (b) {
        return i == null ? void 0 : i(b);
      }),
      (this.cancelRetry = function () {
        n = !0;
      }),
      (this.continueRetry = function () {
        n = !1;
      }),
      (this.continue = function () {
        return a == null ? void 0 : a();
      }),
      (this.failureCount = 0),
      (this.isPaused = !1),
      (this.isResolved = !1),
      (this.isTransportCancelable = !1),
      (this.promise = new Promise(function (b, v) {
        (o = b), (s = v);
      }));
    var l = function (v) {
        r.isResolved || ((r.isResolved = !0), e.onSuccess == null || e.onSuccess(v), a == null || a(), o(v));
      },
      c = function (v) {
        r.isResolved || ((r.isResolved = !0), e.onError == null || e.onError(v), a == null || a(), s(v));
      },
      x = function () {
        return new Promise(function (v) {
          (a = v), (r.isPaused = !0), e.onPause == null || e.onPause();
        }).then(function () {
          (a = void 0), (r.isPaused = !1), e.onContinue == null || e.onContinue();
        });
      },
      O = function b() {
        if (!r.isResolved) {
          var v;
          try {
            v = e.fn();
          } catch (f) {
            v = Promise.reject(f);
          }
          (i = function (m) {
            if (!r.isResolved && (c(new Ri(m)), r.abort == null || r.abort(), Vt(v)))
              try {
                v.cancel();
              } catch (S) {}
          }),
            (r.isTransportCancelable = Vt(v)),
            Promise.resolve(v)
              .then(l)
              .catch(function (f) {
                var m, S;
                if (!r.isResolved) {
                  var U = (m = e.retry) != null ? m : 3,
                    F = (S = e.retryDelay) != null ? S : bs,
                    R = typeof F == 'function' ? F(r.failureCount, f) : F,
                    I =
                      U === !0 ||
                      (typeof U == 'number' && r.failureCount < U) ||
                      (typeof U == 'function' && U(r.failureCount, f));
                  if (n || !I) {
                    c(f);
                    return;
                  }
                  r.failureCount++,
                    e.onFail == null || e.onFail(r.failureCount, f),
                    ds(R)
                      .then(function () {
                        if (!dt.isFocused() || !Pt.isOnline()) return x();
                      })
                      .then(function () {
                        n ? c(f) : b();
                      });
                }
              });
        }
      };
    O();
  },
  xs = /* @__PURE__ */ (function () {
    function t() {
      (this.queue = []),
        (this.transactions = 0),
        (this.notifyFn = function (r) {
          r();
        }),
        (this.batchNotifyFn = function (r) {
          r();
        });
    }
    var e = t.prototype;
    return (
      (e.batch = function (n) {
        var i;
        this.transactions++;
        try {
          i = n();
        } finally {
          this.transactions--, this.transactions || this.flush();
        }
        return i;
      }),
      (e.schedule = function (n) {
        var i = this;
        this.transactions
          ? this.queue.push(n)
          : rn(function () {
              i.notifyFn(n);
            });
      }),
      (e.batchCalls = function (n) {
        var i = this;
        return function () {
          for (var a = arguments.length, o = new Array(a), s = 0; s < a; s++) o[s] = arguments[s];
          i.schedule(function () {
            n.apply(void 0, o);
          });
        };
      }),
      (e.flush = function () {
        var n = this,
          i = this.queue;
        (this.queue = []),
          i.length &&
            rn(function () {
              n.batchNotifyFn(function () {
                i.forEach(function (a) {
                  n.notifyFn(a);
                });
              });
            });
      }),
      (e.setNotifyFunction = function (n) {
        this.notifyFn = n;
      }),
      (e.setBatchNotifyFunction = function (n) {
        this.batchNotifyFn = n;
      }),
      t
    );
  })(),
  ne = new xs(),
  Pi = console;
function Wt() {
  return Pi;
}
function vs(t) {
  Pi = t;
}
var ms = /* @__PURE__ */ (function () {
    function t(r) {
      (this.abortSignalConsumed = !1),
        (this.hadObservers = !1),
        (this.defaultOptions = r.defaultOptions),
        this.setOptions(r.options),
        (this.observers = []),
        (this.cache = r.cache),
        (this.queryKey = r.queryKey),
        (this.queryHash = r.queryHash),
        (this.initialState = r.state || this.getDefaultState(this.options)),
        (this.state = this.initialState),
        (this.meta = r.meta),
        this.scheduleGc();
    }
    var e = t.prototype;
    return (
      (e.setOptions = function (n) {
        var i;
        (this.options = Y({}, this.defaultOptions, n)),
          (this.meta = n == null ? void 0 : n.meta),
          (this.cacheTime = Math.max(this.cacheTime || 0, (i = this.options.cacheTime) != null ? i : 5 * 60 * 1e3));
      }),
      (e.setDefaultOptions = function (n) {
        this.defaultOptions = n;
      }),
      (e.scheduleGc = function () {
        var n = this;
        this.clearGcTimeout(),
          dr(this.cacheTime) &&
            (this.gcTimeout = setTimeout(function () {
              n.optionalRemove();
            }, this.cacheTime));
      }),
      (e.clearGcTimeout = function () {
        this.gcTimeout && (clearTimeout(this.gcTimeout), (this.gcTimeout = void 0));
      }),
      (e.optionalRemove = function () {
        this.observers.length ||
          (this.state.isFetching ? this.hadObservers && this.scheduleGc() : this.cache.remove(this));
      }),
      (e.setData = function (n, i) {
        var a,
          o,
          s = this.state.data,
          l = us(n, s);
        return (
          (a = (o = this.options).isDataEqual) != null && a.call(o, s, l)
            ? (l = s)
            : this.options.structuralSharing !== !1 && (l = Bt(s, l)),
          this.dispatch({
            data: l,
            type: 'success',
            dataUpdatedAt: i == null ? void 0 : i.updatedAt,
          }),
          l
        );
      }),
      (e.setState = function (n, i) {
        this.dispatch({
          type: 'setState',
          state: n,
          setStateOptions: i,
        });
      }),
      (e.cancel = function (n) {
        var i,
          a = this.promise;
        return (i = this.retryer) == null || i.cancel(n), a ? a.then(fe).catch(fe) : Promise.resolve();
      }),
      (e.destroy = function () {
        this.clearGcTimeout(),
          this.cancel({
            silent: !0,
          });
      }),
      (e.reset = function () {
        this.destroy(), this.setState(this.initialState);
      }),
      (e.isActive = function () {
        return this.observers.some(function (n) {
          return n.options.enabled !== !1;
        });
      }),
      (e.isFetching = function () {
        return this.state.isFetching;
      }),
      (e.isStale = function () {
        return (
          this.state.isInvalidated ||
          !this.state.dataUpdatedAt ||
          this.observers.some(function (n) {
            return n.getCurrentResult().isStale;
          })
        );
      }),
      (e.isStaleByTime = function (n) {
        return (
          n === void 0 && (n = 0),
          this.state.isInvalidated || !this.state.dataUpdatedAt || !Ci(this.state.dataUpdatedAt, n)
        );
      }),
      (e.onFocus = function () {
        var n,
          i = this.observers.find(function (a) {
            return a.shouldFetchOnWindowFocus();
          });
        i && i.refetch(), (n = this.retryer) == null || n.continue();
      }),
      (e.onOnline = function () {
        var n,
          i = this.observers.find(function (a) {
            return a.shouldFetchOnReconnect();
          });
        i && i.refetch(), (n = this.retryer) == null || n.continue();
      }),
      (e.addObserver = function (n) {
        this.observers.indexOf(n) === -1 &&
          (this.observers.push(n),
          (this.hadObservers = !0),
          this.clearGcTimeout(),
          this.cache.notify({
            type: 'observerAdded',
            query: this,
            observer: n,
          }));
      }),
      (e.removeObserver = function (n) {
        this.observers.indexOf(n) !== -1 &&
          ((this.observers = this.observers.filter(function (i) {
            return i !== n;
          })),
          this.observers.length ||
            (this.retryer &&
              (this.retryer.isTransportCancelable || this.abortSignalConsumed
                ? this.retryer.cancel({
                    revert: !0,
                  })
                : this.retryer.cancelRetry()),
            this.cacheTime ? this.scheduleGc() : this.cache.remove(this)),
          this.cache.notify({
            type: 'observerRemoved',
            query: this,
            observer: n,
          }));
      }),
      (e.getObserversCount = function () {
        return this.observers.length;
      }),
      (e.invalidate = function () {
        this.state.isInvalidated ||
          this.dispatch({
            type: 'invalidate',
          });
      }),
      (e.fetch = function (n, i) {
        var a = this,
          o,
          s,
          l;
        if (this.state.isFetching) {
          if (this.state.dataUpdatedAt && i != null && i.cancelRefetch)
            this.cancel({
              silent: !0,
            });
          else if (this.promise) {
            var c;
            return (c = this.retryer) == null || c.continueRetry(), this.promise;
          }
        }
        if ((n && this.setOptions(n), !this.options.queryFn)) {
          var x = this.observers.find(function (F) {
            return F.options.queryFn;
          });
          x && this.setOptions(x.options);
        }
        var O = Lt(this.queryKey),
          b = Ti(),
          v = {
            queryKey: O,
            pageParam: void 0,
            meta: this.meta,
          };
        Object.defineProperty(v, 'signal', {
          enumerable: !0,
          get: function () {
            if (b) return (a.abortSignalConsumed = !0), b.signal;
          },
        });
        var f = function () {
            return a.options.queryFn
              ? ((a.abortSignalConsumed = !1), a.options.queryFn(v))
              : Promise.reject('Missing queryFn');
          },
          m = {
            fetchOptions: i,
            options: this.options,
            queryKey: O,
            state: this.state,
            fetchFn: f,
            meta: this.meta,
          };
        if ((o = this.options.behavior) != null && o.onFetch) {
          var S;
          (S = this.options.behavior) == null || S.onFetch(m);
        }
        if (
          ((this.revertState = this.state),
          !this.state.isFetching || this.state.fetchMeta !== ((s = m.fetchOptions) == null ? void 0 : s.meta))
        ) {
          var U;
          this.dispatch({
            type: 'fetch',
            meta: (U = m.fetchOptions) == null ? void 0 : U.meta,
          });
        }
        return (
          (this.retryer = new _i({
            fn: m.fetchFn,
            abort: b == null || (l = b.abort) == null ? void 0 : l.bind(b),
            onSuccess: function (R) {
              a.setData(R),
                a.cache.config.onSuccess == null || a.cache.config.onSuccess(R, a),
                a.cacheTime === 0 && a.optionalRemove();
            },
            onError: function (R) {
              (At(R) && R.silent) ||
                a.dispatch({
                  type: 'error',
                  error: R,
                }),
                At(R) || (a.cache.config.onError == null || a.cache.config.onError(R, a), Wt().error(R)),
                a.cacheTime === 0 && a.optionalRemove();
            },
            onFail: function () {
              a.dispatch({
                type: 'failed',
              });
            },
            onPause: function () {
              a.dispatch({
                type: 'pause',
              });
            },
            onContinue: function () {
              a.dispatch({
                type: 'continue',
              });
            },
            retry: m.options.retry,
            retryDelay: m.options.retryDelay,
          })),
          (this.promise = this.retryer.promise),
          this.promise
        );
      }),
      (e.dispatch = function (n) {
        var i = this;
        (this.state = this.reducer(this.state, n)),
          ne.batch(function () {
            i.observers.forEach(function (a) {
              a.onQueryUpdate(n);
            }),
              i.cache.notify({
                query: i,
                type: 'queryUpdated',
                action: n,
              });
          });
      }),
      (e.getDefaultState = function (n) {
        var i = typeof n.initialData == 'function' ? n.initialData() : n.initialData,
          a = typeof n.initialData != 'undefined',
          o = a ? (typeof n.initialDataUpdatedAt == 'function' ? n.initialDataUpdatedAt() : n.initialDataUpdatedAt) : 0,
          s = typeof i != 'undefined';
        return {
          data: i,
          dataUpdateCount: 0,
          dataUpdatedAt: s ? (o != null ? o : Date.now()) : 0,
          error: null,
          errorUpdateCount: 0,
          errorUpdatedAt: 0,
          fetchFailureCount: 0,
          fetchMeta: null,
          isFetching: !1,
          isInvalidated: !1,
          isPaused: !1,
          status: s ? 'success' : 'idle',
        };
      }),
      (e.reducer = function (n, i) {
        var a, o;
        switch (i.type) {
          case 'failed':
            return Y({}, n, {
              fetchFailureCount: n.fetchFailureCount + 1,
            });
          case 'pause':
            return Y({}, n, {
              isPaused: !0,
            });
          case 'continue':
            return Y({}, n, {
              isPaused: !1,
            });
          case 'fetch':
            return Y(
              {},
              n,
              {
                fetchFailureCount: 0,
                fetchMeta: (a = i.meta) != null ? a : null,
                isFetching: !0,
                isPaused: !1,
              },
              !n.dataUpdatedAt && {
                error: null,
                status: 'loading',
              }
            );
          case 'success':
            return Y({}, n, {
              data: i.data,
              dataUpdateCount: n.dataUpdateCount + 1,
              dataUpdatedAt: (o = i.dataUpdatedAt) != null ? o : Date.now(),
              error: null,
              fetchFailureCount: 0,
              isFetching: !1,
              isInvalidated: !1,
              isPaused: !1,
              status: 'success',
            });
          case 'error':
            var s = i.error;
            return At(s) && s.revert && this.revertState
              ? Y({}, this.revertState)
              : Y({}, n, {
                  error: s,
                  errorUpdateCount: n.errorUpdateCount + 1,
                  errorUpdatedAt: Date.now(),
                  fetchFailureCount: n.fetchFailureCount + 1,
                  isFetching: !1,
                  isPaused: !1,
                  status: 'error',
                });
          case 'invalidate':
            return Y({}, n, {
              isInvalidated: !0,
            });
          case 'setState':
            return Y({}, n, i.state);
          default:
            return n;
        }
      }),
      t
    );
  })(),
  ys = /* @__PURE__ */ (function (t) {
    vt(e, t);
    function e(n) {
      var i;
      return (i = t.call(this) || this), (i.config = n || {}), (i.queries = []), (i.queriesMap = {}), i;
    }
    var r = e.prototype;
    return (
      (r.build = function (i, a, o) {
        var s,
          l = a.queryKey,
          c = (s = a.queryHash) != null ? s : Cr(l, a),
          x = this.get(c);
        return (
          x ||
            ((x = new ms({
              cache: this,
              queryKey: l,
              queryHash: c,
              options: i.defaultQueryOptions(a),
              state: o,
              defaultOptions: i.getQueryDefaults(l),
              meta: a.meta,
            })),
            this.add(x)),
          x
        );
      }),
      (r.add = function (i) {
        this.queriesMap[i.queryHash] ||
          ((this.queriesMap[i.queryHash] = i),
          this.queries.push(i),
          this.notify({
            type: 'queryAdded',
            query: i,
          }));
      }),
      (r.remove = function (i) {
        var a = this.queriesMap[i.queryHash];
        a &&
          (i.destroy(),
          (this.queries = this.queries.filter(function (o) {
            return o !== i;
          })),
          a === i && delete this.queriesMap[i.queryHash],
          this.notify({
            type: 'queryRemoved',
            query: i,
          }));
      }),
      (r.clear = function () {
        var i = this;
        ne.batch(function () {
          i.queries.forEach(function (a) {
            i.remove(a);
          });
        });
      }),
      (r.get = function (i) {
        return this.queriesMap[i];
      }),
      (r.getAll = function () {
        return this.queries;
      }),
      (r.find = function (i, a) {
        var o = qe(i, a),
          s = o[0];
        return (
          typeof s.exact == 'undefined' && (s.exact = !0),
          this.queries.find(function (l) {
            return Zr(s, l);
          })
        );
      }),
      (r.findAll = function (i, a) {
        var o = qe(i, a),
          s = o[0];
        return Object.keys(s).length > 0
          ? this.queries.filter(function (l) {
              return Zr(s, l);
            })
          : this.queries;
      }),
      (r.notify = function (i) {
        var a = this;
        ne.batch(function () {
          a.listeners.forEach(function (o) {
            o(i);
          });
        });
      }),
      (r.onFocus = function () {
        var i = this;
        ne.batch(function () {
          i.queries.forEach(function (a) {
            a.onFocus();
          });
        });
      }),
      (r.onOnline = function () {
        var i = this;
        ne.batch(function () {
          i.queries.forEach(function (a) {
            a.onOnline();
          });
        });
      }),
      e
    );
  })(mt),
  gs = /* @__PURE__ */ (function () {
    function t(r) {
      (this.options = Y({}, r.defaultOptions, r.options)),
        (this.mutationId = r.mutationId),
        (this.mutationCache = r.mutationCache),
        (this.observers = []),
        (this.state = r.state || ws()),
        (this.meta = r.meta);
    }
    var e = t.prototype;
    return (
      (e.setState = function (n) {
        this.dispatch({
          type: 'setState',
          state: n,
        });
      }),
      (e.addObserver = function (n) {
        this.observers.indexOf(n) === -1 && this.observers.push(n);
      }),
      (e.removeObserver = function (n) {
        this.observers = this.observers.filter(function (i) {
          return i !== n;
        });
      }),
      (e.cancel = function () {
        return this.retryer ? (this.retryer.cancel(), this.retryer.promise.then(fe).catch(fe)) : Promise.resolve();
      }),
      (e.continue = function () {
        return this.retryer ? (this.retryer.continue(), this.retryer.promise) : this.execute();
      }),
      (e.execute = function () {
        var n = this,
          i,
          a = this.state.status === 'loading',
          o = Promise.resolve();
        return (
          a ||
            (this.dispatch({
              type: 'loading',
              variables: this.options.variables,
            }),
            (o = o
              .then(function () {
                n.mutationCache.config.onMutate == null || n.mutationCache.config.onMutate(n.state.variables, n);
              })
              .then(function () {
                return n.options.onMutate == null ? void 0 : n.options.onMutate(n.state.variables);
              })
              .then(function (s) {
                s !== n.state.context &&
                  n.dispatch({
                    type: 'loading',
                    context: s,
                    variables: n.state.variables,
                  });
              }))),
          o
            .then(function () {
              return n.executeMutation();
            })
            .then(function (s) {
              (i = s),
                n.mutationCache.config.onSuccess == null ||
                  n.mutationCache.config.onSuccess(i, n.state.variables, n.state.context, n);
            })
            .then(function () {
              return n.options.onSuccess == null ? void 0 : n.options.onSuccess(i, n.state.variables, n.state.context);
            })
            .then(function () {
              return n.options.onSettled == null
                ? void 0
                : n.options.onSettled(i, null, n.state.variables, n.state.context);
            })
            .then(function () {
              return (
                n.dispatch({
                  type: 'success',
                  data: i,
                }),
                i
              );
            })
            .catch(function (s) {
              return (
                n.mutationCache.config.onError == null ||
                  n.mutationCache.config.onError(s, n.state.variables, n.state.context, n),
                Wt().error(s),
                Promise.resolve()
                  .then(function () {
                    return n.options.onError == null
                      ? void 0
                      : n.options.onError(s, n.state.variables, n.state.context);
                  })
                  .then(function () {
                    return n.options.onSettled == null
                      ? void 0
                      : n.options.onSettled(void 0, s, n.state.variables, n.state.context);
                  })
                  .then(function () {
                    throw (
                      (n.dispatch({
                        type: 'error',
                        error: s,
                      }),
                      s)
                    );
                  })
              );
            })
        );
      }),
      (e.executeMutation = function () {
        var n = this,
          i;
        return (
          (this.retryer = new _i({
            fn: function () {
              return n.options.mutationFn
                ? n.options.mutationFn(n.state.variables)
                : Promise.reject('No mutationFn found');
            },
            onFail: function () {
              n.dispatch({
                type: 'failed',
              });
            },
            onPause: function () {
              n.dispatch({
                type: 'pause',
              });
            },
            onContinue: function () {
              n.dispatch({
                type: 'continue',
              });
            },
            retry: (i = this.options.retry) != null ? i : 0,
            retryDelay: this.options.retryDelay,
          })),
          this.retryer.promise
        );
      }),
      (e.dispatch = function (n) {
        var i = this;
        (this.state = Es(this.state, n)),
          ne.batch(function () {
            i.observers.forEach(function (a) {
              a.onMutationUpdate(n);
            }),
              i.mutationCache.notify(i);
          });
      }),
      t
    );
  })();
function ws() {
  return {
    context: void 0,
    data: void 0,
    error: null,
    failureCount: 0,
    isPaused: !1,
    status: 'idle',
    variables: void 0,
  };
}
function Es(t, e) {
  switch (e.type) {
    case 'failed':
      return Y({}, t, {
        failureCount: t.failureCount + 1,
      });
    case 'pause':
      return Y({}, t, {
        isPaused: !0,
      });
    case 'continue':
      return Y({}, t, {
        isPaused: !1,
      });
    case 'loading':
      return Y({}, t, {
        context: e.context,
        data: void 0,
        error: null,
        isPaused: !1,
        status: 'loading',
        variables: e.variables,
      });
    case 'success':
      return Y({}, t, {
        data: e.data,
        error: null,
        status: 'success',
        isPaused: !1,
      });
    case 'error':
      return Y({}, t, {
        data: void 0,
        error: e.error,
        failureCount: t.failureCount + 1,
        isPaused: !1,
        status: 'error',
      });
    case 'setState':
      return Y({}, t, e.state);
    default:
      return t;
  }
}
var Os = /* @__PURE__ */ (function (t) {
  vt(e, t);
  function e(n) {
    var i;
    return (i = t.call(this) || this), (i.config = n || {}), (i.mutations = []), (i.mutationId = 0), i;
  }
  var r = e.prototype;
  return (
    (r.build = function (i, a, o) {
      var s = new gs({
        mutationCache: this,
        mutationId: ++this.mutationId,
        options: i.defaultMutationOptions(a),
        state: o,
        defaultOptions: a.mutationKey ? i.getMutationDefaults(a.mutationKey) : void 0,
        meta: a.meta,
      });
      return this.add(s), s;
    }),
    (r.add = function (i) {
      this.mutations.push(i), this.notify(i);
    }),
    (r.remove = function (i) {
      (this.mutations = this.mutations.filter(function (a) {
        return a !== i;
      })),
        i.cancel(),
        this.notify(i);
    }),
    (r.clear = function () {
      var i = this;
      ne.batch(function () {
        i.mutations.forEach(function (a) {
          i.remove(a);
        });
      });
    }),
    (r.getAll = function () {
      return this.mutations;
    }),
    (r.find = function (i) {
      return (
        typeof i.exact == 'undefined' && (i.exact = !0),
        this.mutations.find(function (a) {
          return en(i, a);
        })
      );
    }),
    (r.findAll = function (i) {
      return this.mutations.filter(function (a) {
        return en(i, a);
      });
    }),
    (r.notify = function (i) {
      var a = this;
      ne.batch(function () {
        a.listeners.forEach(function (o) {
          o(i);
        });
      });
    }),
    (r.onFocus = function () {
      this.resumePausedMutations();
    }),
    (r.onOnline = function () {
      this.resumePausedMutations();
    }),
    (r.resumePausedMutations = function () {
      var i = this.mutations.filter(function (a) {
        return a.state.isPaused;
      });
      return ne.batch(function () {
        return i.reduce(function (a, o) {
          return a.then(function () {
            return o.continue().catch(fe);
          });
        }, Promise.resolve());
      });
    }),
    e
  );
})(mt);
function Cs() {
  return {
    onFetch: function (e) {
      e.fetchFn = function () {
        var r,
          n,
          i,
          a,
          o,
          s,
          l = (r = e.fetchOptions) == null || (n = r.meta) == null ? void 0 : n.refetchPage,
          c = (i = e.fetchOptions) == null || (a = i.meta) == null ? void 0 : a.fetchMore,
          x = c == null ? void 0 : c.pageParam,
          O = (c == null ? void 0 : c.direction) === 'forward',
          b = (c == null ? void 0 : c.direction) === 'backward',
          v = ((o = e.state.data) == null ? void 0 : o.pages) || [],
          f = ((s = e.state.data) == null ? void 0 : s.pageParams) || [],
          m = Ti(),
          S = m == null ? void 0 : m.signal,
          U = f,
          F = !1,
          R =
            e.options.queryFn ||
            function () {
              return Promise.reject('Missing queryFn');
            },
          I = function (d, h, g, T) {
            return (U = T ? [h].concat(U) : [].concat(U, [h])), T ? [g].concat(d) : [].concat(d, [g]);
          },
          B = function (d, h, g, T) {
            if (F) return Promise.reject('Cancelled');
            if (typeof g == 'undefined' && !h && d.length) return Promise.resolve(d);
            var D = {
                queryKey: e.queryKey,
                signal: S,
                pageParam: g,
                meta: e.meta,
              },
              P = R(D),
              N = Promise.resolve(P).then(function (J) {
                return I(d, g, J, T);
              });
            if (Vt(P)) {
              var V = N;
              V.cancel = P.cancel;
            }
            return N;
          },
          j;
        if (!v.length) j = B([]);
        else if (O) {
          var ce = typeof x != 'undefined',
            pe = ce ? x : nn(e.options, v);
          j = B(v, ce, pe);
        } else if (b) {
          var xe = typeof x != 'undefined',
            re = xe ? x : Ss(e.options, v);
          j = B(v, xe, re, !0);
        } else
          (function () {
            U = [];
            var p = typeof e.options.getNextPageParam == 'undefined',
              d = l && v[0] ? l(v[0], 0, v) : !0;
            j = d ? B([], p, f[0]) : Promise.resolve(I([], f[0], v[0]));
            for (
              var h = function (D) {
                  j = j.then(function (P) {
                    var N = l && v[D] ? l(v[D], D, v) : !0;
                    if (N) {
                      var V = p ? f[D] : nn(e.options, P);
                      return B(P, p, V);
                    }
                    return Promise.resolve(I(P, f[D], v[D]));
                  });
                },
                g = 1;
              g < v.length;
              g++
            )
              h(g);
          })();
        var w = j.then(function (p) {
            return {
              pages: p,
              pageParams: U,
            };
          }),
          y = w;
        return (
          (y.cancel = function () {
            (F = !0), m == null || m.abort(), Vt(j) && j.cancel();
          }),
          w
        );
      };
    },
  };
}
function nn(t, e) {
  return t.getNextPageParam == null ? void 0 : t.getNextPageParam(e[e.length - 1], e);
}
function Ss(t, e) {
  return t.getPreviousPageParam == null ? void 0 : t.getPreviousPageParam(e[0], e);
}
var Ts = /* @__PURE__ */ (function () {
    function t(r) {
      r === void 0 && (r = {}),
        (this.queryCache = r.queryCache || new ys()),
        (this.mutationCache = r.mutationCache || new Os()),
        (this.defaultOptions = r.defaultOptions || {}),
        (this.queryDefaults = []),
        (this.mutationDefaults = []);
    }
    var e = t.prototype;
    return (
      (e.mount = function () {
        var n = this;
        (this.unsubscribeFocus = dt.subscribe(function () {
          dt.isFocused() && Pt.isOnline() && (n.mutationCache.onFocus(), n.queryCache.onFocus());
        })),
          (this.unsubscribeOnline = Pt.subscribe(function () {
            dt.isFocused() && Pt.isOnline() && (n.mutationCache.onOnline(), n.queryCache.onOnline());
          }));
      }),
      (e.unmount = function () {
        var n, i;
        (n = this.unsubscribeFocus) == null || n.call(this), (i = this.unsubscribeOnline) == null || i.call(this);
      }),
      (e.isFetching = function (n, i) {
        var a = qe(n, i),
          o = a[0];
        return (o.fetching = !0), this.queryCache.findAll(o).length;
      }),
      (e.isMutating = function (n) {
        return this.mutationCache.findAll(
          Y({}, n, {
            fetching: !0,
          })
        ).length;
      }),
      (e.getQueryData = function (n, i) {
        var a;
        return (a = this.queryCache.find(n, i)) == null ? void 0 : a.state.data;
      }),
      (e.getQueriesData = function (n) {
        return this.getQueryCache()
          .findAll(n)
          .map(function (i) {
            var a = i.queryKey,
              o = i.state,
              s = o.data;
            return [a, s];
          });
      }),
      (e.setQueryData = function (n, i, a) {
        var o = _t(n),
          s = this.defaultQueryOptions(o);
        return this.queryCache.build(this, s).setData(i, a);
      }),
      (e.setQueriesData = function (n, i, a) {
        var o = this;
        return ne.batch(function () {
          return o
            .getQueryCache()
            .findAll(n)
            .map(function (s) {
              var l = s.queryKey;
              return [l, o.setQueryData(l, i, a)];
            });
        });
      }),
      (e.getQueryState = function (n, i) {
        var a;
        return (a = this.queryCache.find(n, i)) == null ? void 0 : a.state;
      }),
      (e.removeQueries = function (n, i) {
        var a = qe(n, i),
          o = a[0],
          s = this.queryCache;
        ne.batch(function () {
          s.findAll(o).forEach(function (l) {
            s.remove(l);
          });
        });
      }),
      (e.resetQueries = function (n, i, a) {
        var o = this,
          s = qe(n, i, a),
          l = s[0],
          c = s[1],
          x = this.queryCache,
          O = Y({}, l, {
            active: !0,
          });
        return ne.batch(function () {
          return (
            x.findAll(l).forEach(function (b) {
              b.reset();
            }),
            o.refetchQueries(O, c)
          );
        });
      }),
      (e.cancelQueries = function (n, i, a) {
        var o = this,
          s = qe(n, i, a),
          l = s[0],
          c = s[1],
          x = c === void 0 ? {} : c;
        typeof x.revert == 'undefined' && (x.revert = !0);
        var O = ne.batch(function () {
          return o.queryCache.findAll(l).map(function (b) {
            return b.cancel(x);
          });
        });
        return Promise.all(O).then(fe).catch(fe);
      }),
      (e.invalidateQueries = function (n, i, a) {
        var o,
          s,
          l,
          c = this,
          x = qe(n, i, a),
          O = x[0],
          b = x[1],
          v = Y({}, O, {
            // if filters.refetchActive is not provided and filters.active is explicitly false,
            // e.g. invalidateQueries({ active: false }), we don't want to refetch active queries
            active: (o = (s = O.refetchActive) != null ? s : O.active) != null ? o : !0,
            inactive: (l = O.refetchInactive) != null ? l : !1,
          });
        return ne.batch(function () {
          return (
            c.queryCache.findAll(O).forEach(function (f) {
              f.invalidate();
            }),
            c.refetchQueries(v, b)
          );
        });
      }),
      (e.refetchQueries = function (n, i, a) {
        var o = this,
          s = qe(n, i, a),
          l = s[0],
          c = s[1],
          x = ne.batch(function () {
            return o.queryCache.findAll(l).map(function (b) {
              return b.fetch(
                void 0,
                Y({}, c, {
                  meta: {
                    refetchPage: l == null ? void 0 : l.refetchPage,
                  },
                })
              );
            });
          }),
          O = Promise.all(x).then(fe);
        return (c != null && c.throwOnError) || (O = O.catch(fe)), O;
      }),
      (e.fetchQuery = function (n, i, a) {
        var o = _t(n, i, a),
          s = this.defaultQueryOptions(o);
        typeof s.retry == 'undefined' && (s.retry = !1);
        var l = this.queryCache.build(this, s);
        return l.isStaleByTime(s.staleTime) ? l.fetch(s) : Promise.resolve(l.state.data);
      }),
      (e.prefetchQuery = function (n, i, a) {
        return this.fetchQuery(n, i, a).then(fe).catch(fe);
      }),
      (e.fetchInfiniteQuery = function (n, i, a) {
        var o = _t(n, i, a);
        return (o.behavior = Cs()), this.fetchQuery(o);
      }),
      (e.prefetchInfiniteQuery = function (n, i, a) {
        return this.fetchInfiniteQuery(n, i, a).then(fe).catch(fe);
      }),
      (e.cancelMutations = function () {
        var n = this,
          i = ne.batch(function () {
            return n.mutationCache.getAll().map(function (a) {
              return a.cancel();
            });
          });
        return Promise.all(i).then(fe).catch(fe);
      }),
      (e.resumePausedMutations = function () {
        return this.getMutationCache().resumePausedMutations();
      }),
      (e.executeMutation = function (n) {
        return this.mutationCache.build(this, n).execute();
      }),
      (e.getQueryCache = function () {
        return this.queryCache;
      }),
      (e.getMutationCache = function () {
        return this.mutationCache;
      }),
      (e.getDefaultOptions = function () {
        return this.defaultOptions;
      }),
      (e.setDefaultOptions = function (n) {
        this.defaultOptions = n;
      }),
      (e.setQueryDefaults = function (n, i) {
        var a = this.queryDefaults.find(function (o) {
          return Ye(n) === Ye(o.queryKey);
        });
        a
          ? (a.defaultOptions = i)
          : this.queryDefaults.push({
              queryKey: n,
              defaultOptions: i,
            });
      }),
      (e.getQueryDefaults = function (n) {
        var i;
        return n
          ? (i = this.queryDefaults.find(function (a) {
              return qt(n, a.queryKey);
            })) == null
            ? void 0
            : i.defaultOptions
          : void 0;
      }),
      (e.setMutationDefaults = function (n, i) {
        var a = this.mutationDefaults.find(function (o) {
          return Ye(n) === Ye(o.mutationKey);
        });
        a
          ? (a.defaultOptions = i)
          : this.mutationDefaults.push({
              mutationKey: n,
              defaultOptions: i,
            });
      }),
      (e.getMutationDefaults = function (n) {
        var i;
        return n
          ? (i = this.mutationDefaults.find(function (a) {
              return qt(n, a.mutationKey);
            })) == null
            ? void 0
            : i.defaultOptions
          : void 0;
      }),
      (e.defaultQueryOptions = function (n) {
        if (n != null && n._defaulted) return n;
        var i = Y({}, this.defaultOptions.queries, this.getQueryDefaults(n == null ? void 0 : n.queryKey), n, {
          _defaulted: !0,
        });
        return !i.queryHash && i.queryKey && (i.queryHash = Cr(i.queryKey, i)), i;
      }),
      (e.defaultQueryObserverOptions = function (n) {
        return this.defaultQueryOptions(n);
      }),
      (e.defaultMutationOptions = function (n) {
        return n != null && n._defaulted
          ? n
          : Y({}, this.defaultOptions.mutations, this.getMutationDefaults(n == null ? void 0 : n.mutationKey), n, {
              _defaulted: !0,
            });
      }),
      (e.clear = function () {
        this.queryCache.clear(), this.mutationCache.clear();
      }),
      t
    );
  })(),
  Rs = /* @__PURE__ */ (function (t) {
    vt(e, t);
    function e(n, i) {
      var a;
      return (
        (a = t.call(this) || this),
        (a.client = n),
        (a.options = i),
        (a.trackedProps = []),
        (a.selectError = null),
        a.bindMethods(),
        a.setOptions(i),
        a
      );
    }
    var r = e.prototype;
    return (
      (r.bindMethods = function () {
        (this.remove = this.remove.bind(this)), (this.refetch = this.refetch.bind(this));
      }),
      (r.onSubscribe = function () {
        this.listeners.length === 1 &&
          (this.currentQuery.addObserver(this),
          an(this.currentQuery, this.options) && this.executeFetch(),
          this.updateTimers());
      }),
      (r.onUnsubscribe = function () {
        this.listeners.length || this.destroy();
      }),
      (r.shouldFetchOnReconnect = function () {
        return pr(this.currentQuery, this.options, this.options.refetchOnReconnect);
      }),
      (r.shouldFetchOnWindowFocus = function () {
        return pr(this.currentQuery, this.options, this.options.refetchOnWindowFocus);
      }),
      (r.destroy = function () {
        (this.listeners = []), this.clearTimers(), this.currentQuery.removeObserver(this);
      }),
      (r.setOptions = function (i, a) {
        var o = this.options,
          s = this.currentQuery;
        if (
          ((this.options = this.client.defaultQueryObserverOptions(i)),
          typeof this.options.enabled != 'undefined' && typeof this.options.enabled != 'boolean')
        )
          throw new Error('Expected enabled to be a boolean');
        this.options.queryKey || (this.options.queryKey = o.queryKey), this.updateQuery();
        var l = this.hasListeners();
        l && on(this.currentQuery, s, this.options, o) && this.executeFetch(),
          this.updateResult(a),
          l &&
            (this.currentQuery !== s || this.options.enabled !== o.enabled || this.options.staleTime !== o.staleTime) &&
            this.updateStaleTimeout();
        var c = this.computeRefetchInterval();
        l &&
          (this.currentQuery !== s || this.options.enabled !== o.enabled || c !== this.currentRefetchInterval) &&
          this.updateRefetchInterval(c);
      }),
      (r.getOptimisticResult = function (i) {
        var a = this.client.defaultQueryObserverOptions(i),
          o = this.client.getQueryCache().build(this.client, a);
        return this.createResult(o, a);
      }),
      (r.getCurrentResult = function () {
        return this.currentResult;
      }),
      (r.trackResult = function (i, a) {
        var o = this,
          s = {},
          l = function (x) {
            o.trackedProps.includes(x) || o.trackedProps.push(x);
          };
        return (
          Object.keys(i).forEach(function (c) {
            Object.defineProperty(s, c, {
              configurable: !1,
              enumerable: !0,
              get: function () {
                return l(c), i[c];
              },
            });
          }),
          (a.useErrorBoundary || a.suspense) && l('error'),
          s
        );
      }),
      (r.getNextResult = function (i) {
        var a = this;
        return new Promise(function (o, s) {
          var l = a.subscribe(function (c) {
            c.isFetching || (l(), c.isError && i != null && i.throwOnError ? s(c.error) : o(c));
          });
        });
      }),
      (r.getCurrentQuery = function () {
        return this.currentQuery;
      }),
      (r.remove = function () {
        this.client.getQueryCache().remove(this.currentQuery);
      }),
      (r.refetch = function (i) {
        return this.fetch(
          Y({}, i, {
            meta: {
              refetchPage: i == null ? void 0 : i.refetchPage,
            },
          })
        );
      }),
      (r.fetchOptimistic = function (i) {
        var a = this,
          o = this.client.defaultQueryObserverOptions(i),
          s = this.client.getQueryCache().build(this.client, o);
        return s.fetch().then(function () {
          return a.createResult(s, o);
        });
      }),
      (r.fetch = function (i) {
        var a = this;
        return this.executeFetch(i).then(function () {
          return a.updateResult(), a.currentResult;
        });
      }),
      (r.executeFetch = function (i) {
        this.updateQuery();
        var a = this.currentQuery.fetch(this.options, i);
        return (i != null && i.throwOnError) || (a = a.catch(fe)), a;
      }),
      (r.updateStaleTimeout = function () {
        var i = this;
        if ((this.clearStaleTimeout(), !(jt || this.currentResult.isStale || !dr(this.options.staleTime)))) {
          var a = Ci(this.currentResult.dataUpdatedAt, this.options.staleTime),
            o = a + 1;
          this.staleTimeoutId = setTimeout(function () {
            i.currentResult.isStale || i.updateResult();
          }, o);
        }
      }),
      (r.computeRefetchInterval = function () {
        var i;
        return typeof this.options.refetchInterval == 'function'
          ? this.options.refetchInterval(this.currentResult.data, this.currentQuery)
          : (i = this.options.refetchInterval) != null
          ? i
          : !1;
      }),
      (r.updateRefetchInterval = function (i) {
        var a = this;
        this.clearRefetchInterval(),
          (this.currentRefetchInterval = i),
          !(
            jt ||
            this.options.enabled === !1 ||
            !dr(this.currentRefetchInterval) ||
            this.currentRefetchInterval === 0
          ) &&
            (this.refetchIntervalId = setInterval(function () {
              (a.options.refetchIntervalInBackground || dt.isFocused()) && a.executeFetch();
            }, this.currentRefetchInterval));
      }),
      (r.updateTimers = function () {
        this.updateStaleTimeout(), this.updateRefetchInterval(this.computeRefetchInterval());
      }),
      (r.clearTimers = function () {
        this.clearStaleTimeout(), this.clearRefetchInterval();
      }),
      (r.clearStaleTimeout = function () {
        this.staleTimeoutId && (clearTimeout(this.staleTimeoutId), (this.staleTimeoutId = void 0));
      }),
      (r.clearRefetchInterval = function () {
        this.refetchIntervalId && (clearInterval(this.refetchIntervalId), (this.refetchIntervalId = void 0));
      }),
      (r.createResult = function (i, a) {
        var o = this.currentQuery,
          s = this.options,
          l = this.currentResult,
          c = this.currentResultState,
          x = this.currentResultOptions,
          O = i !== o,
          b = O ? i.state : this.currentQueryInitialState,
          v = O ? this.currentResult : this.previousQueryResult,
          f = i.state,
          m = f.dataUpdatedAt,
          S = f.error,
          U = f.errorUpdatedAt,
          F = f.isFetching,
          R = f.status,
          I = !1,
          B = !1,
          j;
        if (a.optimisticResults) {
          var ce = this.hasListeners(),
            pe = !ce && an(i, a),
            xe = ce && on(i, o, a, s);
          (pe || xe) && ((F = !0), m || (R = 'loading'));
        }
        if (a.keepPreviousData && !f.dataUpdateCount && v != null && v.isSuccess && R !== 'error')
          (j = v.data), (m = v.dataUpdatedAt), (R = v.status), (I = !0);
        else if (a.select && typeof f.data != 'undefined')
          if (l && f.data === (c == null ? void 0 : c.data) && a.select === this.selectFn) j = this.selectResult;
          else
            try {
              (this.selectFn = a.select),
                (j = a.select(f.data)),
                a.structuralSharing !== !1 && (j = Bt(l == null ? void 0 : l.data, j)),
                (this.selectResult = j),
                (this.selectError = null);
            } catch (y) {
              Wt().error(y), (this.selectError = y);
            }
        else j = f.data;
        if (typeof a.placeholderData != 'undefined' && typeof j == 'undefined' && (R === 'loading' || R === 'idle')) {
          var re;
          if (l != null && l.isPlaceholderData && a.placeholderData === (x == null ? void 0 : x.placeholderData))
            re = l.data;
          else if (
            ((re = typeof a.placeholderData == 'function' ? a.placeholderData() : a.placeholderData),
            a.select && typeof re != 'undefined')
          )
            try {
              (re = a.select(re)),
                a.structuralSharing !== !1 && (re = Bt(l == null ? void 0 : l.data, re)),
                (this.selectError = null);
            } catch (y) {
              Wt().error(y), (this.selectError = y);
            }
          typeof re != 'undefined' && ((R = 'success'), (j = re), (B = !0));
        }
        this.selectError && ((S = this.selectError), (j = this.selectResult), (U = Date.now()), (R = 'error'));
        var w = {
          status: R,
          isLoading: R === 'loading',
          isSuccess: R === 'success',
          isError: R === 'error',
          isIdle: R === 'idle',
          data: j,
          dataUpdatedAt: m,
          error: S,
          errorUpdatedAt: U,
          failureCount: f.fetchFailureCount,
          errorUpdateCount: f.errorUpdateCount,
          isFetched: f.dataUpdateCount > 0 || f.errorUpdateCount > 0,
          isFetchedAfterMount: f.dataUpdateCount > b.dataUpdateCount || f.errorUpdateCount > b.errorUpdateCount,
          isFetching: F,
          isRefetching: F && R !== 'loading',
          isLoadingError: R === 'error' && f.dataUpdatedAt === 0,
          isPlaceholderData: B,
          isPreviousData: I,
          isRefetchError: R === 'error' && f.dataUpdatedAt !== 0,
          isStale: Sr(i, a),
          refetch: this.refetch,
          remove: this.remove,
        };
        return w;
      }),
      (r.shouldNotifyListeners = function (i, a) {
        if (!a) return !0;
        var o = this.options,
          s = o.notifyOnChangeProps,
          l = o.notifyOnChangePropsExclusions;
        if ((!s && !l) || (s === 'tracked' && !this.trackedProps.length)) return !0;
        var c = s === 'tracked' ? this.trackedProps : s;
        return Object.keys(i).some(function (x) {
          var O = x,
            b = i[O] !== a[O],
            v =
              c == null
                ? void 0
                : c.some(function (m) {
                    return m === x;
                  }),
            f =
              l == null
                ? void 0
                : l.some(function (m) {
                    return m === x;
                  });
          return b && !f && (!c || v);
        });
      }),
      (r.updateResult = function (i) {
        var a = this.currentResult;
        if (
          ((this.currentResult = this.createResult(this.currentQuery, this.options)),
          (this.currentResultState = this.currentQuery.state),
          (this.currentResultOptions = this.options),
          !ls(this.currentResult, a))
        ) {
          var o = {
            cache: !0,
          };
          (i == null ? void 0 : i.listeners) !== !1 &&
            this.shouldNotifyListeners(this.currentResult, a) &&
            (o.listeners = !0),
            this.notify(Y({}, o, i));
        }
      }),
      (r.updateQuery = function () {
        var i = this.client.getQueryCache().build(this.client, this.options);
        if (i !== this.currentQuery) {
          var a = this.currentQuery;
          (this.currentQuery = i),
            (this.currentQueryInitialState = i.state),
            (this.previousQueryResult = this.currentResult),
            this.hasListeners() && (a == null || a.removeObserver(this), i.addObserver(this));
        }
      }),
      (r.onQueryUpdate = function (i) {
        var a = {};
        i.type === 'success' ? (a.onSuccess = !0) : i.type === 'error' && !At(i.error) && (a.onError = !0),
          this.updateResult(a),
          this.hasListeners() && this.updateTimers();
      }),
      (r.notify = function (i) {
        var a = this;
        ne.batch(function () {
          i.onSuccess
            ? (a.options.onSuccess == null || a.options.onSuccess(a.currentResult.data),
              a.options.onSettled == null || a.options.onSettled(a.currentResult.data, null))
            : i.onError &&
              (a.options.onError == null || a.options.onError(a.currentResult.error),
              a.options.onSettled == null || a.options.onSettled(void 0, a.currentResult.error)),
            i.listeners &&
              a.listeners.forEach(function (o) {
                o(a.currentResult);
              }),
            i.cache &&
              a.client.getQueryCache().notify({
                query: a.currentQuery,
                type: 'observerResultsUpdated',
              });
        });
      }),
      e
    );
  })(mt);
function _s(t, e) {
  return e.enabled !== !1 && !t.state.dataUpdatedAt && !(t.state.status === 'error' && e.retryOnMount === !1);
}
function an(t, e) {
  return _s(t, e) || (t.state.dataUpdatedAt > 0 && pr(t, e, e.refetchOnMount));
}
function pr(t, e, r) {
  if (e.enabled !== !1) {
    var n = typeof r == 'function' ? r(t) : r;
    return n === 'always' || (n !== !1 && Sr(t, e));
  }
  return !1;
}
function on(t, e, r, n) {
  return r.enabled !== !1 && (t !== e || n.enabled === !1) && (!r.suspense || t.state.status !== 'error') && Sr(t, r);
}
function Sr(t, e) {
  return t.isStaleByTime(e.staleTime);
}
var Ps = va.unstable_batchedUpdates;
ne.setBatchNotifyFunction(Ps);
var As = console;
vs(As);
var sn = /* @__PURE__ */ oe.createContext(void 0),
  Ai = /* @__PURE__ */ oe.createContext(!1);
function Fi(t) {
  return t && typeof window != 'undefined'
    ? (window.ReactQueryClientContext || (window.ReactQueryClientContext = sn), window.ReactQueryClientContext)
    : sn;
}
var Fs = function () {
    var e = oe.useContext(Fi(oe.useContext(Ai)));
    if (!e) throw new Error('No QueryClient set, use QueryClientProvider to set one');
    return e;
  },
  Is = function (e) {
    var r = e.client,
      n = e.contextSharing,
      i = n === void 0 ? !1 : n,
      a = e.children;
    oe.useEffect(
      function () {
        return (
          r.mount(),
          function () {
            r.unmount();
          }
        );
      },
      [r]
    );
    var o = Fi(i);
    return /* @__PURE__ */ oe.createElement(
      Ai.Provider,
      {
        value: i,
      },
      /* @__PURE__ */ oe.createElement(
        o.Provider,
        {
          value: r,
        },
        a
      )
    );
  };
function Us() {
  var t = !1;
  return {
    clearReset: function () {
      t = !1;
    },
    reset: function () {
      t = !0;
    },
    isReset: function () {
      return t;
    },
  };
}
var Ds = /* @__PURE__ */ oe.createContext(Us()),
  ks = function () {
    return oe.useContext(Ds);
  };
function Ms(t, e, r) {
  return typeof e == 'function' ? e.apply(void 0, r) : typeof e == 'boolean' ? e : !!t;
}
function Ns(t, e) {
  var r = oe.useRef(!1),
    n = oe.useState(0),
    i = n[1],
    a = Fs(),
    o = ks(),
    s = a.defaultQueryObserverOptions(t);
  (s.optimisticResults = !0),
    s.onError && (s.onError = ne.batchCalls(s.onError)),
    s.onSuccess && (s.onSuccess = ne.batchCalls(s.onSuccess)),
    s.onSettled && (s.onSettled = ne.batchCalls(s.onSettled)),
    s.suspense && (typeof s.staleTime != 'number' && (s.staleTime = 1e3), s.cacheTime === 0 && (s.cacheTime = 1)),
    (s.suspense || s.useErrorBoundary) && (o.isReset() || (s.retryOnMount = !1));
  var l = oe.useState(function () {
      return new e(a, s);
    }),
    c = l[0],
    x = c.getOptimisticResult(s);
  if (
    (oe.useEffect(
      function () {
        (r.current = !0), o.clearReset();
        var O = c.subscribe(
          ne.batchCalls(function () {
            r.current &&
              i(function (b) {
                return b + 1;
              });
          })
        );
        return (
          c.updateResult(),
          function () {
            (r.current = !1), O();
          }
        );
      },
      [o, c]
    ),
    oe.useEffect(
      function () {
        c.setOptions(s, {
          listeners: !1,
        });
      },
      [s, c]
    ),
    s.suspense && x.isLoading)
  )
    throw c
      .fetchOptimistic(s)
      .then(function (O) {
        var b = O.data;
        s.onSuccess == null || s.onSuccess(b), s.onSettled == null || s.onSettled(b, null);
      })
      .catch(function (O) {
        o.clearReset(), s.onError == null || s.onError(O), s.onSettled == null || s.onSettled(void 0, O);
      });
  if (x.isError && !o.isReset() && !x.isFetching && Ms(s.suspense, s.useErrorBoundary, [x.error, c.getCurrentQuery()]))
    throw x.error;
  return s.notifyOnChangeProps === 'tracked' && (x = c.trackResult(x, s)), x;
}
function Tr(t, e, r) {
  var n = _t(t, e, r);
  return Ns(n, Rs);
}
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
var Ii = qs,
  un = Bs,
  js = decodeURIComponent,
  Ls = encodeURIComponent,
  Tt = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
function qs(t, e) {
  if (typeof t != 'string') throw new TypeError('argument str must be a string');
  for (var r = {}, n = e || {}, i = t.split(';'), a = n.decode || js, o = 0; o < i.length; o++) {
    var s = i[o],
      l = s.indexOf('=');
    if (!(l < 0)) {
      var c = s.substring(0, l).trim();
      if (r[c] == null) {
        var x = s.substring(l + 1, s.length).trim();
        x[0] === '"' && (x = x.slice(1, -1)), (r[c] = Vs(x, a));
      }
    }
  }
  return r;
}
function Bs(t, e, r) {
  var n = r || {},
    i = n.encode || Ls;
  if (typeof i != 'function') throw new TypeError('option encode is invalid');
  if (!Tt.test(t)) throw new TypeError('argument name is invalid');
  var a = i(e);
  if (a && !Tt.test(a)) throw new TypeError('argument val is invalid');
  var o = t + '=' + a;
  if (n.maxAge != null) {
    var s = n.maxAge - 0;
    if (isNaN(s) || !isFinite(s)) throw new TypeError('option maxAge is invalid');
    o += '; Max-Age=' + Math.floor(s);
  }
  if (n.domain) {
    if (!Tt.test(n.domain)) throw new TypeError('option domain is invalid');
    o += '; Domain=' + n.domain;
  }
  if (n.path) {
    if (!Tt.test(n.path)) throw new TypeError('option path is invalid');
    o += '; Path=' + n.path;
  }
  if (n.expires) {
    if (typeof n.expires.toUTCString != 'function') throw new TypeError('option expires is invalid');
    o += '; Expires=' + n.expires.toUTCString();
  }
  if ((n.httpOnly && (o += '; HttpOnly'), n.secure && (o += '; Secure'), n.sameSite)) {
    var l = typeof n.sameSite == 'string' ? n.sameSite.toLowerCase() : n.sameSite;
    switch (l) {
      case !0:
        o += '; SameSite=Strict';
        break;
      case 'lax':
        o += '; SameSite=Lax';
        break;
      case 'strict':
        o += '; SameSite=Strict';
        break;
      case 'none':
        o += '; SameSite=None';
        break;
      default:
        throw new TypeError('option sameSite is invalid');
    }
  }
  return o;
}
function Vs(t, e) {
  try {
    return e(t);
  } catch (r) {
    return t;
  }
}
function Ws() {
  return typeof document == 'object' && typeof document.cookie == 'string';
}
function Qs(t, e) {
  return typeof t == 'string' ? Ii(t, e) : typeof t == 'object' && t !== null ? t : {};
}
function $s(t, e) {
  return typeof e == 'undefined' && (e = !t || (t[0] !== '{' && t[0] !== '[' && t[0] !== '"')), !e;
}
function cn(t, e) {
  e === void 0 && (e = {});
  var r = Hs(t);
  if ($s(r, e.doNotParse))
    try {
      return JSON.parse(r);
    } catch (n) {}
  return t;
}
function Hs(t) {
  return t && t[0] === 'j' && t[1] === ':' ? t.substr(2) : t;
}
var Ke =
    (globalThis && globalThis.__assign) ||
    function () {
      return (
        (Ke =
          Object.assign ||
          function (t) {
            for (var e, r = 1, n = arguments.length; r < n; r++) {
              e = arguments[r];
              for (var i in e) Object.prototype.hasOwnProperty.call(e, i) && (t[i] = e[i]);
            }
            return t;
          }),
        Ke.apply(this, arguments)
      );
    },
  zs = (function () {
    function t(e, r) {
      var n = this;
      (this.changeListeners = []),
        (this.HAS_DOCUMENT_COOKIE = !1),
        (this.cookies = Qs(e, r)),
        new Promise(function () {
          n.HAS_DOCUMENT_COOKIE = Ws();
        }).catch(function () {});
    }
    return (
      (t.prototype._updateBrowserValues = function (e) {
        this.HAS_DOCUMENT_COOKIE && (this.cookies = Ii(document.cookie, e));
      }),
      (t.prototype._emitChange = function (e) {
        for (var r = 0; r < this.changeListeners.length; ++r) this.changeListeners[r](e);
      }),
      (t.prototype.get = function (e, r, n) {
        return r === void 0 && (r = {}), this._updateBrowserValues(n), cn(this.cookies[e], r);
      }),
      (t.prototype.getAll = function (e, r) {
        e === void 0 && (e = {}), this._updateBrowserValues(r);
        var n = {};
        for (var i in this.cookies) n[i] = cn(this.cookies[i], e);
        return n;
      }),
      (t.prototype.set = function (e, r, n) {
        var i;
        typeof r == 'object' && (r = JSON.stringify(r)),
          (this.cookies = Ke(Ke({}, this.cookies), ((i = {}), (i[e] = r), i))),
          this.HAS_DOCUMENT_COOKIE && (document.cookie = un(e, r, n)),
          this._emitChange({ name: e, value: r, options: n });
      }),
      (t.prototype.remove = function (e, r) {
        var n = (r = Ke(Ke({}, r), { expires: new Date(1970, 1, 1, 0, 0, 1), maxAge: 0 }));
        (this.cookies = Ke({}, this.cookies)),
          delete this.cookies[e],
          this.HAS_DOCUMENT_COOKIE && (document.cookie = un(e, '', n)),
          this._emitChange({ name: e, value: void 0, options: r });
      }),
      (t.prototype.addChangeListener = function (e) {
        this.changeListeners.push(e);
      }),
      (t.prototype.removeChangeListener = function (e) {
        var r = this.changeListeners.indexOf(e);
        r >= 0 && this.changeListeners.splice(r, 1);
      }),
      t
    );
  })();
const Ui = zs;
var Rr = Be.createContext(new Ui()),
  Ks = Rr.Provider;
Rr.Consumer;
const Ys = Rr;
var Js =
    (globalThis && globalThis.__extends) ||
    (function () {
      var t = function (e, r) {
        return (
          (t =
            Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array &&
              function (n, i) {
                n.__proto__ = i;
              }) ||
            function (n, i) {
              for (var a in i) i.hasOwnProperty(a) && (n[a] = i[a]);
            }),
          t(e, r)
        );
      };
      return function (e, r) {
        t(e, r);
        function n() {
          this.constructor = e;
        }
        e.prototype = r === null ? Object.create(r) : ((n.prototype = r.prototype), new n());
      };
    })(),
  Gs = (function (t) {
    Js(e, t);
    function e(r) {
      var n = t.call(this, r) || this;
      return r.cookies ? (n.cookies = r.cookies) : (n.cookies = new Ui()), n;
    }
    return (
      (e.prototype.render = function () {
        return Be.createElement(Ks, { value: this.cookies }, this.props.children);
      }),
      e
    );
  })(Be.Component);
const Xs = Gs;
function Zs() {
  return (
    typeof window != 'undefined' &&
    typeof window.document != 'undefined' &&
    typeof window.document.createElement != 'undefined'
  );
}
function eu(t) {
  var e = ba(Ys);
  if (!e) throw new Error('Missing <CookiesProvider>');
  var r = e.getAll(),
    n = ht(r),
    i = n[0],
    a = n[1],
    o = gn(i);
  Zs() &&
    xa(
      function () {
        function c() {
          var x = e.getAll();
          tu(t || null, x, o.current) && a(x), (o.current = x);
        }
        return (
          e.addChangeListener(c),
          function () {
            e.removeChangeListener(c);
          }
        );
      },
      [e]
    );
  var s = Oe(
      function () {
        return e.set.bind(e);
      },
      [e]
    ),
    l = Oe(
      function () {
        return e.remove.bind(e);
      },
      [e]
    );
  return [i, s, l];
}
function tu(t, e, r) {
  if (!t) return !0;
  for (var n = 0, i = t; n < i.length; n++) {
    var a = i[n];
    if (e[a] !== r[a]) return !0;
  }
  return !1;
}
const ru = new Ts({
  defaultOptions: {
    queries: {
      retry: !1,
      refetchOnWindowFocus: !1,
    },
  },
});
function Di(t, e) {
  return function () {
    return t.apply(e, arguments);
  };
}
const { toString: ki } = Object.prototype,
  { getPrototypeOf: _r } = Object,
  Pr = ((t) => (e) => {
    const r = ki.call(e);
    return t[r] || (t[r] = r.slice(8, -1).toLowerCase());
  })(/* @__PURE__ */ Object.create(null)),
  Ue = (t) => ((t = t.toLowerCase()), (e) => Pr(e) === t),
  Kt = (t) => (e) => typeof e === t,
  { isArray: nt } = Array,
  pt = Kt('undefined');
function nu(t) {
  return (
    t !== null &&
    !pt(t) &&
    t.constructor !== null &&
    !pt(t.constructor) &&
    Je(t.constructor.isBuffer) &&
    t.constructor.isBuffer(t)
  );
}
const Mi = Ue('ArrayBuffer');
function iu(t) {
  let e;
  return (
    typeof ArrayBuffer != 'undefined' && ArrayBuffer.isView
      ? (e = ArrayBuffer.isView(t))
      : (e = t && t.buffer && Mi(t.buffer)),
    e
  );
}
const au = Kt('string'),
  Je = Kt('function'),
  Ni = Kt('number'),
  Ar = (t) => t !== null && typeof t == 'object',
  ou = (t) => t === !0 || t === !1,
  Ft = (t) => {
    if (Pr(t) !== 'object') return !1;
    const e = _r(t);
    return (
      (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) &&
      !(Symbol.toStringTag in t) &&
      !(Symbol.iterator in t)
    );
  },
  su = Ue('Date'),
  uu = Ue('File'),
  cu = Ue('Blob'),
  fu = Ue('FileList'),
  lu = (t) => Ar(t) && Je(t.pipe),
  du = (t) => {
    const e = '[object FormData]';
    return (
      t &&
      ((typeof FormData == 'function' && t instanceof FormData) ||
        ki.call(t) === e ||
        (Je(t.toString) && t.toString() === e))
    );
  },
  hu = Ue('URLSearchParams'),
  pu = (t) => (t.trim ? t.trim() : t.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''));
function yt(t, e, { allOwnKeys: r = !1 } = {}) {
  if (t === null || typeof t == 'undefined') return;
  let n, i;
  if ((typeof t != 'object' && (t = [t]), nt(t))) for (n = 0, i = t.length; n < i; n++) e.call(null, t[n], n, t);
  else {
    const a = r ? Object.getOwnPropertyNames(t) : Object.keys(t),
      o = a.length;
    let s;
    for (n = 0; n < o; n++) (s = a[n]), e.call(null, t[s], s, t);
  }
}
function ji(t, e) {
  e = e.toLowerCase();
  const r = Object.keys(t);
  let n = r.length,
    i;
  for (; n-- > 0; ) if (((i = r[n]), e === i.toLowerCase())) return i;
  return null;
}
const Li = (() =>
    typeof globalThis != 'undefined'
      ? globalThis
      : typeof self != 'undefined'
      ? self
      : typeof window != 'undefined'
      ? window
      : global)(),
  qi = (t) => !pt(t) && t !== Li;
function br() {
  const { caseless: t } = (qi(this) && this) || {},
    e = {},
    r = (n, i) => {
      const a = (t && ji(e, i)) || i;
      Ft(e[a]) && Ft(n) ? (e[a] = br(e[a], n)) : Ft(n) ? (e[a] = br({}, n)) : nt(n) ? (e[a] = n.slice()) : (e[a] = n);
    };
  for (let n = 0, i = arguments.length; n < i; n++) arguments[n] && yt(arguments[n], r);
  return e;
}
const bu = (t, e, r, { allOwnKeys: n } = {}) => (
    yt(
      e,
      (i, a) => {
        r && Je(i) ? (t[a] = Di(i, r)) : (t[a] = i);
      },
      { allOwnKeys: n }
    ),
    t
  ),
  xu = (t) => (t.charCodeAt(0) === 65279 && (t = t.slice(1)), t),
  vu = (t, e, r, n) => {
    (t.prototype = Object.create(e.prototype, n)),
      (t.prototype.constructor = t),
      Object.defineProperty(t, 'super', {
        value: e.prototype,
      }),
      r && Object.assign(t.prototype, r);
  },
  mu = (t, e, r, n) => {
    let i, a, o;
    const s = {};
    if (((e = e || {}), t == null)) return e;
    do {
      for (i = Object.getOwnPropertyNames(t), a = i.length; a-- > 0; )
        (o = i[a]), (!n || n(o, t, e)) && !s[o] && ((e[o] = t[o]), (s[o] = !0));
      t = r !== !1 && _r(t);
    } while (t && (!r || r(t, e)) && t !== Object.prototype);
    return e;
  },
  yu = (t, e, r) => {
    (t = String(t)), (r === void 0 || r > t.length) && (r = t.length), (r -= e.length);
    const n = t.indexOf(e, r);
    return n !== -1 && n === r;
  },
  gu = (t) => {
    if (!t) return null;
    if (nt(t)) return t;
    let e = t.length;
    if (!Ni(e)) return null;
    const r = new Array(e);
    for (; e-- > 0; ) r[e] = t[e];
    return r;
  },
  wu = (
    (t) => (e) =>
      t && e instanceof t
  )(typeof Uint8Array != 'undefined' && _r(Uint8Array)),
  Eu = (t, e) => {
    const n = (t && t[Symbol.iterator]).call(t);
    let i;
    for (; (i = n.next()) && !i.done; ) {
      const a = i.value;
      e.call(t, a[0], a[1]);
    }
  },
  Ou = (t, e) => {
    let r;
    const n = [];
    for (; (r = t.exec(e)) !== null; ) n.push(r);
    return n;
  },
  Cu = Ue('HTMLFormElement'),
  Su = (t) =>
    t.toLowerCase().replace(/[_-\s]([a-z\d])(\w*)/g, function (r, n, i) {
      return n.toUpperCase() + i;
    }),
  fn = (
    ({ hasOwnProperty: t }) =>
    (e, r) =>
      t.call(e, r)
  )(Object.prototype),
  Tu = Ue('RegExp'),
  Bi = (t, e) => {
    const r = Object.getOwnPropertyDescriptors(t),
      n = {};
    yt(r, (i, a) => {
      e(i, a, t) !== !1 && (n[a] = i);
    }),
      Object.defineProperties(t, n);
  },
  Ru = (t) => {
    Bi(t, (e, r) => {
      if (Je(t) && ['arguments', 'caller', 'callee'].indexOf(r) !== -1) return !1;
      const n = t[r];
      if (Je(n)) {
        if (((e.enumerable = !1), 'writable' in e)) {
          e.writable = !1;
          return;
        }
        e.set ||
          (e.set = () => {
            throw Error("Can not rewrite read-only method '" + r + "'");
          });
      }
    });
  },
  _u = (t, e) => {
    const r = {},
      n = (i) => {
        i.forEach((a) => {
          r[a] = !0;
        });
      };
    return nt(t) ? n(t) : n(String(t).split(e)), r;
  },
  Pu = () => {},
  Au = (t, e) => ((t = +t), Number.isFinite(t) ? t : e),
  Fu = (t) => {
    const e = new Array(10),
      r = (n, i) => {
        if (Ar(n)) {
          if (e.indexOf(n) >= 0) return;
          if (!('toJSON' in n)) {
            e[i] = n;
            const a = nt(n) ? [] : {};
            return (
              yt(n, (o, s) => {
                const l = r(o, i + 1);
                !pt(l) && (a[s] = l);
              }),
              (e[i] = void 0),
              a
            );
          }
        }
        return n;
      };
    return r(t, 0);
  },
  E = {
    isArray: nt,
    isArrayBuffer: Mi,
    isBuffer: nu,
    isFormData: du,
    isArrayBufferView: iu,
    isString: au,
    isNumber: Ni,
    isBoolean: ou,
    isObject: Ar,
    isPlainObject: Ft,
    isUndefined: pt,
    isDate: su,
    isFile: uu,
    isBlob: cu,
    isRegExp: Tu,
    isFunction: Je,
    isStream: lu,
    isURLSearchParams: hu,
    isTypedArray: wu,
    isFileList: fu,
    forEach: yt,
    merge: br,
    extend: bu,
    trim: pu,
    stripBOM: xu,
    inherits: vu,
    toFlatObject: mu,
    kindOf: Pr,
    kindOfTest: Ue,
    endsWith: yu,
    toArray: gu,
    forEachEntry: Eu,
    matchAll: Ou,
    isHTMLForm: Cu,
    hasOwnProperty: fn,
    hasOwnProp: fn,
    // an alias to avoid ESLint no-prototype-builtins detection
    reduceDescriptors: Bi,
    freezeMethods: Ru,
    toObjectSet: _u,
    toCamelCase: Su,
    noop: Pu,
    toFiniteNumber: Au,
    findKey: ji,
    global: Li,
    isContextDefined: qi,
    toJSONObject: Fu,
  };
function H(t, e, r, n, i) {
  Error.call(this),
    Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : (this.stack = new Error().stack),
    (this.message = t),
    (this.name = 'AxiosError'),
    e && (this.code = e),
    r && (this.config = r),
    n && (this.request = n),
    i && (this.response = i);
}
E.inherits(H, Error, {
  toJSON: function () {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: E.toJSONObject(this.config),
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null,
    };
  },
});
const Vi = H.prototype,
  Wi = {};
[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED',
  'ERR_NOT_SUPPORT',
  'ERR_INVALID_URL',
  // eslint-disable-next-line func-names
].forEach((t) => {
  Wi[t] = { value: t };
});
Object.defineProperties(H, Wi);
Object.defineProperty(Vi, 'isAxiosError', { value: !0 });
H.from = (t, e, r, n, i, a) => {
  const o = Object.create(Vi);
  return (
    E.toFlatObject(
      t,
      o,
      function (l) {
        return l !== Error.prototype;
      },
      (s) => s !== 'isAxiosError'
    ),
    H.call(o, t.message, e, r, n, i),
    (o.cause = t),
    (o.name = t.name),
    a && Object.assign(o, a),
    o
  );
};
var Iu = typeof self == 'object' ? self.FormData : window.FormData;
const Uu = Iu;
function xr(t) {
  return E.isPlainObject(t) || E.isArray(t);
}
function Qi(t) {
  return E.endsWith(t, '[]') ? t.slice(0, -2) : t;
}
function ln(t, e, r) {
  return t
    ? t
        .concat(e)
        .map(function (i, a) {
          return (i = Qi(i)), !r && a ? '[' + i + ']' : i;
        })
        .join(r ? '.' : '')
    : e;
}
function Du(t) {
  return E.isArray(t) && !t.some(xr);
}
const ku = E.toFlatObject(E, {}, null, function (e) {
  return /^is[A-Z]/.test(e);
});
function Mu(t) {
  return t && E.isFunction(t.append) && t[Symbol.toStringTag] === 'FormData' && t[Symbol.iterator];
}
function Yt(t, e, r) {
  if (!E.isObject(t)) throw new TypeError('target must be an object');
  (e = e || new (Uu || FormData)()),
    (r = E.toFlatObject(
      r,
      {
        metaTokens: !0,
        dots: !1,
        indexes: !1,
      },
      !1,
      function (m, S) {
        return !E.isUndefined(S[m]);
      }
    ));
  const n = r.metaTokens,
    i = r.visitor || x,
    a = r.dots,
    o = r.indexes,
    l = (r.Blob || (typeof Blob != 'undefined' && Blob)) && Mu(e);
  if (!E.isFunction(i)) throw new TypeError('visitor must be a function');
  function c(f) {
    if (f === null) return '';
    if (E.isDate(f)) return f.toISOString();
    if (!l && E.isBlob(f)) throw new H('Blob is not supported. Use a Buffer instead.');
    return E.isArrayBuffer(f) || E.isTypedArray(f)
      ? l && typeof Blob == 'function'
        ? new Blob([f])
        : Buffer.from(f)
      : f;
  }
  function x(f, m, S) {
    let U = f;
    if (f && !S && typeof f == 'object') {
      if (E.endsWith(m, '{}')) (m = n ? m : m.slice(0, -2)), (f = JSON.stringify(f));
      else if ((E.isArray(f) && Du(f)) || E.isFileList(f) || (E.endsWith(m, '[]') && (U = E.toArray(f))))
        return (
          (m = Qi(m)),
          U.forEach(function (R, I) {
            !(E.isUndefined(R) || R === null) &&
              e.append(
                // eslint-disable-next-line no-nested-ternary
                o === !0 ? ln([m], I, a) : o === null ? m : m + '[]',
                c(R)
              );
          }),
          !1
        );
    }
    return xr(f) ? !0 : (e.append(ln(S, m, a), c(f)), !1);
  }
  const O = [],
    b = Object.assign(ku, {
      defaultVisitor: x,
      convertValue: c,
      isVisitable: xr,
    });
  function v(f, m) {
    if (!E.isUndefined(f)) {
      if (O.indexOf(f) !== -1) throw Error('Circular reference detected in ' + m.join('.'));
      O.push(f),
        E.forEach(f, function (U, F) {
          (!(E.isUndefined(U) || U === null) && i.call(e, U, E.isString(F) ? F.trim() : F, m, b)) === !0 &&
            v(U, m ? m.concat(F) : [F]);
        }),
        O.pop();
    }
  }
  if (!E.isObject(t)) throw new TypeError('data must be an object');
  return v(t), e;
}
function dn(t) {
  const e = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '~': '%7E',
    '%20': '+',
    '%00': '\0',
  };
  return encodeURIComponent(t).replace(/[!'()~]|%20|%00/g, function (n) {
    return e[n];
  });
}
function Fr(t, e) {
  (this._pairs = []), t && Yt(t, this, e);
}
const $i = Fr.prototype;
$i.append = function (e, r) {
  this._pairs.push([e, r]);
};
$i.toString = function (e) {
  const r = e
    ? function (n) {
        return e.call(this, n, dn);
      }
    : dn;
  return this._pairs
    .map(function (i) {
      return r(i[0]) + '=' + r(i[1]);
    }, '')
    .join('&');
};
function Nu(t) {
  return encodeURIComponent(t)
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']');
}
function Hi(t, e, r) {
  if (!e) return t;
  const n = (r && r.encode) || Nu,
    i = r && r.serialize;
  let a;
  if ((i ? (a = i(e, r)) : (a = E.isURLSearchParams(e) ? e.toString() : new Fr(e, r).toString(n)), a)) {
    const o = t.indexOf('#');
    o !== -1 && (t = t.slice(0, o)), (t += (t.indexOf('?') === -1 ? '?' : '&') + a);
  }
  return t;
}
class ju {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(e, r, n) {
    return (
      this.handlers.push({
        fulfilled: e,
        rejected: r,
        synchronous: n ? n.synchronous : !1,
        runWhen: n ? n.runWhen : null,
      }),
      this.handlers.length - 1
    );
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(e) {
    this.handlers[e] && (this.handlers[e] = null);
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    this.handlers && (this.handlers = []);
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(e) {
    E.forEach(this.handlers, function (n) {
      n !== null && e(n);
    });
  }
}
const hn = ju,
  zi = {
    silentJSONParsing: !0,
    forcedJSONParsing: !0,
    clarifyTimeoutError: !1,
  },
  Lu = typeof URLSearchParams != 'undefined' ? URLSearchParams : Fr,
  qu = FormData,
  Bu = (() => {
    let t;
    return typeof navigator != 'undefined' &&
      ((t = navigator.product) === 'ReactNative' || t === 'NativeScript' || t === 'NS')
      ? !1
      : typeof window != 'undefined' && typeof document != 'undefined';
  })(),
  Vu = (() =>
    typeof WorkerGlobalScope != 'undefined' && // eslint-disable-next-line no-undef
    self instanceof WorkerGlobalScope &&
    typeof self.importScripts == 'function')(),
  _e = {
    isBrowser: !0,
    classes: {
      URLSearchParams: Lu,
      FormData: qu,
      Blob,
    },
    isStandardBrowserEnv: Bu,
    isStandardBrowserWebWorkerEnv: Vu,
    protocols: ['http', 'https', 'file', 'blob', 'url', 'data'],
  };
function Wu(t, e) {
  return Yt(
    t,
    new _e.classes.URLSearchParams(),
    Object.assign(
      {
        visitor: function (r, n, i, a) {
          return _e.isNode && E.isBuffer(r)
            ? (this.append(n, r.toString('base64')), !1)
            : a.defaultVisitor.apply(this, arguments);
        },
      },
      e
    )
  );
}
function Qu(t) {
  return E.matchAll(/\w+|\[(\w*)]/g, t).map((e) => (e[0] === '[]' ? '' : e[1] || e[0]));
}
function $u(t) {
  const e = {},
    r = Object.keys(t);
  let n;
  const i = r.length;
  let a;
  for (n = 0; n < i; n++) (a = r[n]), (e[a] = t[a]);
  return e;
}
function Ki(t) {
  function e(r, n, i, a) {
    let o = r[a++];
    const s = Number.isFinite(+o),
      l = a >= r.length;
    return (
      (o = !o && E.isArray(i) ? i.length : o),
      l
        ? (E.hasOwnProp(i, o) ? (i[o] = [i[o], n]) : (i[o] = n), !s)
        : ((!i[o] || !E.isObject(i[o])) && (i[o] = []), e(r, n, i[o], a) && E.isArray(i[o]) && (i[o] = $u(i[o])), !s)
    );
  }
  if (E.isFormData(t) && E.isFunction(t.entries)) {
    const r = {};
    return (
      E.forEachEntry(t, (n, i) => {
        e(Qu(n), i, r, 0);
      }),
      r
    );
  }
  return null;
}
const Hu = {
  'Content-Type': void 0,
};
function zu(t, e, r) {
  if (E.isString(t))
    try {
      return (e || JSON.parse)(t), E.trim(t);
    } catch (n) {
      if (n.name !== 'SyntaxError') throw n;
    }
  return (r || JSON.stringify)(t);
}
const Jt = {
  transitional: zi,
  adapter: ['xhr', 'http'],
  transformRequest: [
    function (e, r) {
      const n = r.getContentType() || '',
        i = n.indexOf('application/json') > -1,
        a = E.isObject(e);
      if ((a && E.isHTMLForm(e) && (e = new FormData(e)), E.isFormData(e))) return i && i ? JSON.stringify(Ki(e)) : e;
      if (E.isArrayBuffer(e) || E.isBuffer(e) || E.isStream(e) || E.isFile(e) || E.isBlob(e)) return e;
      if (E.isArrayBufferView(e)) return e.buffer;
      if (E.isURLSearchParams(e))
        return r.setContentType('application/x-www-form-urlencoded;charset=utf-8', !1), e.toString();
      let s;
      if (a) {
        if (n.indexOf('application/x-www-form-urlencoded') > -1) return Wu(e, this.formSerializer).toString();
        if ((s = E.isFileList(e)) || n.indexOf('multipart/form-data') > -1) {
          const l = this.env && this.env.FormData;
          return Yt(s ? { 'files[]': e } : e, l && new l(), this.formSerializer);
        }
      }
      return a || i ? (r.setContentType('application/json', !1), zu(e)) : e;
    },
  ],
  transformResponse: [
    function (e) {
      const r = this.transitional || Jt.transitional,
        n = r && r.forcedJSONParsing,
        i = this.responseType === 'json';
      if (e && E.isString(e) && ((n && !this.responseType) || i)) {
        const o = !(r && r.silentJSONParsing) && i;
        try {
          return JSON.parse(e);
        } catch (s) {
          if (o) throw s.name === 'SyntaxError' ? H.from(s, H.ERR_BAD_RESPONSE, this, null, this.response) : s;
        }
      }
      return e;
    },
  ],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: _e.classes.FormData,
    Blob: _e.classes.Blob,
  },
  validateStatus: function (e) {
    return e >= 200 && e < 300;
  },
  headers: {
    common: {
      Accept: 'application/json, text/plain, */*',
    },
  },
};
E.forEach(['delete', 'get', 'head'], function (e) {
  Jt.headers[e] = {};
});
E.forEach(['post', 'put', 'patch'], function (e) {
  Jt.headers[e] = E.merge(Hu);
});
const Ir = Jt,
  Ku = E.toObjectSet([
    'age',
    'authorization',
    'content-length',
    'content-type',
    'etag',
    'expires',
    'from',
    'host',
    'if-modified-since',
    'if-unmodified-since',
    'last-modified',
    'location',
    'max-forwards',
    'proxy-authorization',
    'referer',
    'retry-after',
    'user-agent',
  ]),
  Yu = (t) => {
    const e = {};
    let r, n, i;
    return (
      t &&
        t
          .split(
            `
`
          )
          .forEach(function (o) {
            (i = o.indexOf(':')),
              (r = o.substring(0, i).trim().toLowerCase()),
              (n = o.substring(i + 1).trim()),
              !(!r || (e[r] && Ku[r])) &&
                (r === 'set-cookie' ? (e[r] ? e[r].push(n) : (e[r] = [n])) : (e[r] = e[r] ? e[r] + ', ' + n : n));
          }),
      e
    );
  },
  pn = Symbol('internals');
function ft(t) {
  return t && String(t).trim().toLowerCase();
}
function It(t) {
  return t === !1 || t == null ? t : E.isArray(t) ? t.map(It) : String(t);
}
function Ju(t) {
  const e = /* @__PURE__ */ Object.create(null),
    r = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let n;
  for (; (n = r.exec(t)); ) e[n[1]] = n[2];
  return e;
}
function Gu(t) {
  return /^[-_a-zA-Z]+$/.test(t.trim());
}
function bn(t, e, r, n) {
  if (E.isFunction(n)) return n.call(this, e, r);
  if (E.isString(e)) {
    if (E.isString(n)) return e.indexOf(n) !== -1;
    if (E.isRegExp(n)) return n.test(e);
  }
}
function Xu(t) {
  return t
    .trim()
    .toLowerCase()
    .replace(/([a-z\d])(\w*)/g, (e, r, n) => r.toUpperCase() + n);
}
function Zu(t, e) {
  const r = E.toCamelCase(' ' + e);
  ['get', 'set', 'has'].forEach((n) => {
    Object.defineProperty(t, n + r, {
      value: function (i, a, o) {
        return this[n].call(this, e, i, a, o);
      },
      configurable: !0,
    });
  });
}
class Gt {
  constructor(e) {
    e && this.set(e);
  }
  set(e, r, n) {
    const i = this;
    function a(s, l, c) {
      const x = ft(l);
      if (!x) throw new Error('header name must be a non-empty string');
      const O = E.findKey(i, x);
      (!O || i[O] === void 0 || c === !0 || (c === void 0 && i[O] !== !1)) && (i[O || l] = It(s));
    }
    const o = (s, l) => E.forEach(s, (c, x) => a(c, x, l));
    return (
      E.isPlainObject(e) || e instanceof this.constructor
        ? o(e, r)
        : E.isString(e) && (e = e.trim()) && !Gu(e)
        ? o(Yu(e), r)
        : e != null && a(r, e, n),
      this
    );
  }
  get(e, r) {
    if (((e = ft(e)), e)) {
      const n = E.findKey(this, e);
      if (n) {
        const i = this[n];
        if (!r) return i;
        if (r === !0) return Ju(i);
        if (E.isFunction(r)) return r.call(this, i, n);
        if (E.isRegExp(r)) return r.exec(i);
        throw new TypeError('parser must be boolean|regexp|function');
      }
    }
  }
  has(e, r) {
    if (((e = ft(e)), e)) {
      const n = E.findKey(this, e);
      return !!(n && (!r || bn(this, this[n], n, r)));
    }
    return !1;
  }
  delete(e, r) {
    const n = this;
    let i = !1;
    function a(o) {
      if (((o = ft(o)), o)) {
        const s = E.findKey(n, o);
        s && (!r || bn(n, n[s], s, r)) && (delete n[s], (i = !0));
      }
    }
    return E.isArray(e) ? e.forEach(a) : a(e), i;
  }
  clear() {
    return Object.keys(this).forEach(this.delete.bind(this));
  }
  normalize(e) {
    const r = this,
      n = {};
    return (
      E.forEach(this, (i, a) => {
        const o = E.findKey(n, a);
        if (o) {
          (r[o] = It(i)), delete r[a];
          return;
        }
        const s = e ? Xu(a) : String(a).trim();
        s !== a && delete r[a], (r[s] = It(i)), (n[s] = !0);
      }),
      this
    );
  }
  concat(...e) {
    return this.constructor.concat(this, ...e);
  }
  toJSON(e) {
    const r = /* @__PURE__ */ Object.create(null);
    return (
      E.forEach(this, (n, i) => {
        n != null && n !== !1 && (r[i] = e && E.isArray(n) ? n.join(', ') : n);
      }),
      r
    );
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([e, r]) => e + ': ' + r).join(`
`);
  }
  get [Symbol.toStringTag]() {
    return 'AxiosHeaders';
  }
  static from(e) {
    return e instanceof this ? e : new this(e);
  }
  static concat(e, ...r) {
    const n = new this(e);
    return r.forEach((i) => n.set(i)), n;
  }
  static accessor(e) {
    const n = (this[pn] = this[pn] =
        {
          accessors: {},
        }).accessors,
      i = this.prototype;
    function a(o) {
      const s = ft(o);
      n[s] || (Zu(i, o), (n[s] = !0));
    }
    return E.isArray(e) ? e.forEach(a) : a(e), this;
  }
}
Gt.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent']);
E.freezeMethods(Gt.prototype);
E.freezeMethods(Gt);
const Ie = Gt;
function nr(t, e) {
  const r = this || Ir,
    n = e || r,
    i = Ie.from(n.headers);
  let a = n.data;
  return (
    E.forEach(t, function (s) {
      a = s.call(r, a, i.normalize(), e ? e.status : void 0);
    }),
    i.normalize(),
    a
  );
}
function Yi(t) {
  return !!(t && t.__CANCEL__);
}
function gt(t, e, r) {
  H.call(this, t == null ? 'canceled' : t, H.ERR_CANCELED, e, r), (this.name = 'CanceledError');
}
E.inherits(gt, H, {
  __CANCEL__: !0,
});
const ec = null;
function tc(t, e, r) {
  const n = r.config.validateStatus;
  !r.status || !n || n(r.status)
    ? t(r)
    : e(
        new H(
          'Request failed with status code ' + r.status,
          [H.ERR_BAD_REQUEST, H.ERR_BAD_RESPONSE][Math.floor(r.status / 100) - 4],
          r.config,
          r.request,
          r
        )
      );
}
const rc = _e.isStandardBrowserEnv
  ? (function () {
      return {
        write: function (r, n, i, a, o, s) {
          const l = [];
          l.push(r + '=' + encodeURIComponent(n)),
            E.isNumber(i) && l.push('expires=' + new Date(i).toGMTString()),
            E.isString(a) && l.push('path=' + a),
            E.isString(o) && l.push('domain=' + o),
            s === !0 && l.push('secure'),
            (document.cookie = l.join('; '));
        },
        read: function (r) {
          const n = document.cookie.match(new RegExp('(^|;\\s*)(' + r + ')=([^;]*)'));
          return n ? decodeURIComponent(n[3]) : null;
        },
        remove: function (r) {
          this.write(r, '', Date.now() - 864e5);
        },
      };
    })()
  : (function () {
      return {
        write: function () {},
        read: function () {
          return null;
        },
        remove: function () {},
      };
    })();
function nc(t) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(t);
}
function ic(t, e) {
  return e ? t.replace(/\/+$/, '') + '/' + e.replace(/^\/+/, '') : t;
}
function Ji(t, e) {
  return t && !nc(e) ? ic(t, e) : e;
}
const ac = _e.isStandardBrowserEnv
  ? (function () {
      const e = /(msie|trident)/i.test(navigator.userAgent),
        r = document.createElement('a');
      let n;
      function i(a) {
        let o = a;
        return (
          e && (r.setAttribute('href', o), (o = r.href)),
          r.setAttribute('href', o),
          {
            href: r.href,
            protocol: r.protocol ? r.protocol.replace(/:$/, '') : '',
            host: r.host,
            search: r.search ? r.search.replace(/^\?/, '') : '',
            hash: r.hash ? r.hash.replace(/^#/, '') : '',
            hostname: r.hostname,
            port: r.port,
            pathname: r.pathname.charAt(0) === '/' ? r.pathname : '/' + r.pathname,
          }
        );
      }
      return (
        (n = i(window.location.href)),
        function (o) {
          const s = E.isString(o) ? i(o) : o;
          return s.protocol === n.protocol && s.host === n.host;
        }
      );
    })()
  : (function () {
      return function () {
        return !0;
      };
    })();
function oc(t) {
  const e = /^([-+\w]{1,25})(:?\/\/|:)/.exec(t);
  return (e && e[1]) || '';
}
function sc(t, e) {
  t = t || 10;
  const r = new Array(t),
    n = new Array(t);
  let i = 0,
    a = 0,
    o;
  return (
    (e = e !== void 0 ? e : 1e3),
    function (l) {
      const c = Date.now(),
        x = n[a];
      o || (o = c), (r[i] = l), (n[i] = c);
      let O = a,
        b = 0;
      for (; O !== i; ) (b += r[O++]), (O = O % t);
      if (((i = (i + 1) % t), i === a && (a = (a + 1) % t), c - o < e)) return;
      const v = x && c - x;
      return v ? Math.round((b * 1e3) / v) : void 0;
    }
  );
}
function xn(t, e) {
  let r = 0;
  const n = sc(50, 250);
  return (i) => {
    const a = i.loaded,
      o = i.lengthComputable ? i.total : void 0,
      s = a - r,
      l = n(s),
      c = a <= o;
    r = a;
    const x = {
      loaded: a,
      total: o,
      progress: o ? a / o : void 0,
      bytes: s,
      rate: l || void 0,
      estimated: l && o && c ? (o - a) / l : void 0,
      event: i,
    };
    (x[e ? 'download' : 'upload'] = !0), t(x);
  };
}
const uc = typeof XMLHttpRequest != 'undefined',
  cc =
    uc &&
    function (t) {
      return new Promise(function (r, n) {
        let i = t.data;
        const a = Ie.from(t.headers).normalize(),
          o = t.responseType;
        let s;
        function l() {
          t.cancelToken && t.cancelToken.unsubscribe(s), t.signal && t.signal.removeEventListener('abort', s);
        }
        E.isFormData(i) && (_e.isStandardBrowserEnv || _e.isStandardBrowserWebWorkerEnv) && a.setContentType(!1);
        let c = new XMLHttpRequest();
        if (t.auth) {
          const v = t.auth.username || '',
            f = t.auth.password ? unescape(encodeURIComponent(t.auth.password)) : '';
          a.set('Authorization', 'Basic ' + btoa(v + ':' + f));
        }
        const x = Ji(t.baseURL, t.url);
        c.open(t.method.toUpperCase(), Hi(x, t.params, t.paramsSerializer), !0), (c.timeout = t.timeout);
        function O() {
          if (!c) return;
          const v = Ie.from('getAllResponseHeaders' in c && c.getAllResponseHeaders()),
            m = {
              data: !o || o === 'text' || o === 'json' ? c.responseText : c.response,
              status: c.status,
              statusText: c.statusText,
              headers: v,
              config: t,
              request: c,
            };
          tc(
            function (U) {
              r(U), l();
            },
            function (U) {
              n(U), l();
            },
            m
          ),
            (c = null);
        }
        if (
          ('onloadend' in c
            ? (c.onloadend = O)
            : (c.onreadystatechange = function () {
                !c ||
                  c.readyState !== 4 ||
                  (c.status === 0 && !(c.responseURL && c.responseURL.indexOf('file:') === 0)) ||
                  setTimeout(O);
              }),
          (c.onabort = function () {
            c && (n(new H('Request aborted', H.ECONNABORTED, t, c)), (c = null));
          }),
          (c.onerror = function () {
            n(new H('Network Error', H.ERR_NETWORK, t, c)), (c = null);
          }),
          (c.ontimeout = function () {
            let f = t.timeout ? 'timeout of ' + t.timeout + 'ms exceeded' : 'timeout exceeded';
            const m = t.transitional || zi;
            t.timeoutErrorMessage && (f = t.timeoutErrorMessage),
              n(new H(f, m.clarifyTimeoutError ? H.ETIMEDOUT : H.ECONNABORTED, t, c)),
              (c = null);
          }),
          _e.isStandardBrowserEnv)
        ) {
          const v = (t.withCredentials || ac(x)) && t.xsrfCookieName && rc.read(t.xsrfCookieName);
          v && a.set(t.xsrfHeaderName, v);
        }
        i === void 0 && a.setContentType(null),
          'setRequestHeader' in c &&
            E.forEach(a.toJSON(), function (f, m) {
              c.setRequestHeader(m, f);
            }),
          E.isUndefined(t.withCredentials) || (c.withCredentials = !!t.withCredentials),
          o && o !== 'json' && (c.responseType = t.responseType),
          typeof t.onDownloadProgress == 'function' && c.addEventListener('progress', xn(t.onDownloadProgress, !0)),
          typeof t.onUploadProgress == 'function' &&
            c.upload &&
            c.upload.addEventListener('progress', xn(t.onUploadProgress)),
          (t.cancelToken || t.signal) &&
            ((s = (v) => {
              c && (n(!v || v.type ? new gt(null, t, c) : v), c.abort(), (c = null));
            }),
            t.cancelToken && t.cancelToken.subscribe(s),
            t.signal && (t.signal.aborted ? s() : t.signal.addEventListener('abort', s)));
        const b = oc(x);
        if (b && _e.protocols.indexOf(b) === -1) {
          n(new H('Unsupported protocol ' + b + ':', H.ERR_BAD_REQUEST, t));
          return;
        }
        c.send(i || null);
      });
    },
  Ut = {
    http: ec,
    xhr: cc,
  };
E.forEach(Ut, (t, e) => {
  if (t) {
    try {
      Object.defineProperty(t, 'name', { value: e });
    } catch (r) {}
    Object.defineProperty(t, 'adapterName', { value: e });
  }
});
const fc = {
  getAdapter: (t) => {
    t = E.isArray(t) ? t : [t];
    const { length: e } = t;
    let r, n;
    for (let i = 0; i < e && ((r = t[i]), !(n = E.isString(r) ? Ut[r.toLowerCase()] : r)); i++);
    if (!n)
      throw n === !1
        ? new H(`Adapter ${r} is not supported by the environment`, 'ERR_NOT_SUPPORT')
        : new Error(E.hasOwnProp(Ut, r) ? `Adapter '${r}' is not available in the build` : `Unknown adapter '${r}'`);
    if (!E.isFunction(n)) throw new TypeError('adapter is not a function');
    return n;
  },
  adapters: Ut,
};
function ir(t) {
  if ((t.cancelToken && t.cancelToken.throwIfRequested(), t.signal && t.signal.aborted)) throw new gt(null, t);
}
function vn(t) {
  return (
    ir(t),
    (t.headers = Ie.from(t.headers)),
    (t.data = nr.call(t, t.transformRequest)),
    ['post', 'put', 'patch'].indexOf(t.method) !== -1 &&
      t.headers.setContentType('application/x-www-form-urlencoded', !1),
    fc
      .getAdapter(t.adapter || Ir.adapter)(t)
      .then(
        function (n) {
          return ir(t), (n.data = nr.call(t, t.transformResponse, n)), (n.headers = Ie.from(n.headers)), n;
        },
        function (n) {
          return (
            Yi(n) ||
              (ir(t),
              n &&
                n.response &&
                ((n.response.data = nr.call(t, t.transformResponse, n.response)),
                (n.response.headers = Ie.from(n.response.headers)))),
            Promise.reject(n)
          );
        }
      )
  );
}
const mn = (t) => (t instanceof Ie ? t.toJSON() : t);
function tt(t, e) {
  e = e || {};
  const r = {};
  function n(c, x, O) {
    return E.isPlainObject(c) && E.isPlainObject(x)
      ? E.merge.call({ caseless: O }, c, x)
      : E.isPlainObject(x)
      ? E.merge({}, x)
      : E.isArray(x)
      ? x.slice()
      : x;
  }
  function i(c, x, O) {
    if (E.isUndefined(x)) {
      if (!E.isUndefined(c)) return n(void 0, c, O);
    } else return n(c, x, O);
  }
  function a(c, x) {
    if (!E.isUndefined(x)) return n(void 0, x);
  }
  function o(c, x) {
    if (E.isUndefined(x)) {
      if (!E.isUndefined(c)) return n(void 0, c);
    } else return n(void 0, x);
  }
  function s(c, x, O) {
    if (O in e) return n(c, x);
    if (O in t) return n(void 0, c);
  }
  const l = {
    url: a,
    method: a,
    data: a,
    baseURL: o,
    transformRequest: o,
    transformResponse: o,
    paramsSerializer: o,
    timeout: o,
    timeoutMessage: o,
    withCredentials: o,
    adapter: o,
    responseType: o,
    xsrfCookieName: o,
    xsrfHeaderName: o,
    onUploadProgress: o,
    onDownloadProgress: o,
    decompress: o,
    maxContentLength: o,
    maxBodyLength: o,
    beforeRedirect: o,
    transport: o,
    httpAgent: o,
    httpsAgent: o,
    cancelToken: o,
    socketPath: o,
    responseEncoding: o,
    validateStatus: s,
    headers: (c, x) => i(mn(c), mn(x), !0),
  };
  return (
    E.forEach(Object.keys(t).concat(Object.keys(e)), function (x) {
      const O = l[x] || i,
        b = O(t[x], e[x], x);
      (E.isUndefined(b) && O !== s) || (r[x] = b);
    }),
    r
  );
}
const Gi = '1.2.2',
  Ur = {};
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((t, e) => {
  Ur[t] = function (n) {
    return typeof n === t || 'a' + (e < 1 ? 'n ' : ' ') + t;
  };
});
const yn = {};
Ur.transitional = function (e, r, n) {
  function i(a, o) {
    return '[Axios v' + Gi + "] Transitional option '" + a + "'" + o + (n ? '. ' + n : '');
  }
  return (a, o, s) => {
    if (e === !1) throw new H(i(o, ' has been removed' + (r ? ' in ' + r : '')), H.ERR_DEPRECATED);
    return (
      r &&
        !yn[o] &&
        ((yn[o] = !0),
        console.warn(i(o, ' has been deprecated since v' + r + ' and will be removed in the near future'))),
      e ? e(a, o, s) : !0
    );
  };
};
function lc(t, e, r) {
  if (typeof t != 'object') throw new H('options must be an object', H.ERR_BAD_OPTION_VALUE);
  const n = Object.keys(t);
  let i = n.length;
  for (; i-- > 0; ) {
    const a = n[i],
      o = e[a];
    if (o) {
      const s = t[a],
        l = s === void 0 || o(s, a, t);
      if (l !== !0) throw new H('option ' + a + ' must be ' + l, H.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (r !== !0) throw new H('Unknown option ' + a, H.ERR_BAD_OPTION);
  }
}
const vr = {
    assertOptions: lc,
    validators: Ur,
  },
  Le = vr.validators;
class Qt {
  constructor(e) {
    (this.defaults = e),
      (this.interceptors = {
        request: new hn(),
        response: new hn(),
      });
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  request(e, r) {
    typeof e == 'string' ? ((r = r || {}), (r.url = e)) : (r = e || {}), (r = tt(this.defaults, r));
    const { transitional: n, paramsSerializer: i, headers: a } = r;
    n !== void 0 &&
      vr.assertOptions(
        n,
        {
          silentJSONParsing: Le.transitional(Le.boolean),
          forcedJSONParsing: Le.transitional(Le.boolean),
          clarifyTimeoutError: Le.transitional(Le.boolean),
        },
        !1
      ),
      i !== void 0 &&
        vr.assertOptions(
          i,
          {
            encode: Le.function,
            serialize: Le.function,
          },
          !0
        ),
      (r.method = (r.method || this.defaults.method || 'get').toLowerCase());
    let o;
    (o = a && E.merge(a.common, a[r.method])),
      o &&
        E.forEach(['delete', 'get', 'head', 'post', 'put', 'patch', 'common'], (f) => {
          delete a[f];
        }),
      (r.headers = Ie.concat(o, a));
    const s = [];
    let l = !0;
    this.interceptors.request.forEach(function (m) {
      (typeof m.runWhen == 'function' && m.runWhen(r) === !1) ||
        ((l = l && m.synchronous), s.unshift(m.fulfilled, m.rejected));
    });
    const c = [];
    this.interceptors.response.forEach(function (m) {
      c.push(m.fulfilled, m.rejected);
    });
    let x,
      O = 0,
      b;
    if (!l) {
      const f = [vn.bind(this), void 0];
      for (f.unshift.apply(f, s), f.push.apply(f, c), b = f.length, x = Promise.resolve(r); O < b; )
        x = x.then(f[O++], f[O++]);
      return x;
    }
    b = s.length;
    let v = r;
    for (O = 0; O < b; ) {
      const f = s[O++],
        m = s[O++];
      try {
        v = f(v);
      } catch (S) {
        m.call(this, S);
        break;
      }
    }
    try {
      x = vn.call(this, v);
    } catch (f) {
      return Promise.reject(f);
    }
    for (O = 0, b = c.length; O < b; ) x = x.then(c[O++], c[O++]);
    return x;
  }
  getUri(e) {
    e = tt(this.defaults, e);
    const r = Ji(e.baseURL, e.url);
    return Hi(r, e.params, e.paramsSerializer);
  }
}
E.forEach(['delete', 'get', 'head', 'options'], function (e) {
  Qt.prototype[e] = function (r, n) {
    return this.request(
      tt(n || {}, {
        method: e,
        url: r,
        data: (n || {}).data,
      })
    );
  };
});
E.forEach(['post', 'put', 'patch'], function (e) {
  function r(n) {
    return function (a, o, s) {
      return this.request(
        tt(s || {}, {
          method: e,
          headers: n
            ? {
                'Content-Type': 'multipart/form-data',
              }
            : {},
          url: a,
          data: o,
        })
      );
    };
  }
  (Qt.prototype[e] = r()), (Qt.prototype[e + 'Form'] = r(!0));
});
const Dt = Qt;
class Dr {
  constructor(e) {
    if (typeof e != 'function') throw new TypeError('executor must be a function.');
    let r;
    this.promise = new Promise(function (a) {
      r = a;
    });
    const n = this;
    this.promise.then((i) => {
      if (!n._listeners) return;
      let a = n._listeners.length;
      for (; a-- > 0; ) n._listeners[a](i);
      n._listeners = null;
    }),
      (this.promise.then = (i) => {
        let a;
        const o = new Promise((s) => {
          n.subscribe(s), (a = s);
        }).then(i);
        return (
          (o.cancel = function () {
            n.unsubscribe(a);
          }),
          o
        );
      }),
      e(function (a, o, s) {
        n.reason || ((n.reason = new gt(a, o, s)), r(n.reason));
      });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) throw this.reason;
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(e) {
    if (this.reason) {
      e(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(e) : (this._listeners = [e]);
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(e) {
    if (!this._listeners) return;
    const r = this._listeners.indexOf(e);
    r !== -1 && this._listeners.splice(r, 1);
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let e;
    return {
      token: new Dr(function (i) {
        e = i;
      }),
      cancel: e,
    };
  }
}
const dc = Dr;
function hc(t) {
  return function (r) {
    return t.apply(null, r);
  };
}
function pc(t) {
  return E.isObject(t) && t.isAxiosError === !0;
}
const mr = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
};
Object.entries(mr).forEach(([t, e]) => {
  mr[e] = t;
});
const bc = mr;
function Xi(t) {
  const e = new Dt(t),
    r = Di(Dt.prototype.request, e);
  return (
    E.extend(r, Dt.prototype, e, { allOwnKeys: !0 }),
    E.extend(r, e, null, { allOwnKeys: !0 }),
    (r.create = function (i) {
      return Xi(tt(t, i));
    }),
    r
  );
}
const se = Xi(Ir);
se.Axios = Dt;
se.CanceledError = gt;
se.CancelToken = dc;
se.isCancel = Yi;
se.VERSION = Gi;
se.toFormData = Yt;
se.AxiosError = H;
se.Cancel = se.CanceledError;
se.all = function (e) {
  return Promise.all(e);
};
se.spread = hc;
se.isAxiosError = pc;
se.mergeConfig = tt;
se.AxiosHeaders = Ie;
se.formToJSON = (t) => Ki(E.isHTMLForm(t) ? new FormData(t) : t);
se.HttpStatusCode = bc;
se.default = se;
const Xt = se,
  xc = Xt.create({
    baseURL: 'https://a.publir.com/',
  }),
  vc = Xt.create({
    baseURL: 'https://subs-analytics.publir.com',
  }),
  mc = Xt.create({
    baseURL: 'https://2g4qrdfrmp5sc7iaqxzkpacphm0dkxwu.lambda-url.us-east-1.on.aws',
  }),
  yc = Xt.create({
    baseURL: 'https://analytics.publir.com/',
  }),
  gc = (t) =>
    st(void 0, null, function* () {
      const { data: e } = yield xc.get(`/platform/${t}.json`);
      return e;
    }),
  wc = {
    useConfig: (t) =>
      Tr({
        queryKey: ['config', t],
        queryFn: () => gc(t),
        enabled: gr(),
        onError: console.error,
      }),
  },
  Ec = (t) =>
    st(void 0, null, function* () {
      yield vc.post('/publirSubscriptionAnalytics', t);
    }),
  Oc = {
    useEnableSubscriptions: (t, e) =>
      Tr({
        queryKey: ['enableSubscriptions', t],
        queryFn: () => Ec(t),
        enabled: e,
        retry: !1,
        onError: console.error,
      }),
  };
function Cc(t) {
  throw new Error(
    'Could not dynamically require "' +
      t +
      '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.'
  );
}
var yr = {},
  Sc = {
    get exports() {
      return yr;
    },
    set exports(t) {
      yr = t;
    },
  };
const Tc = {},
  Rc = /* @__PURE__ */ Object.freeze(
    /* @__PURE__ */ Object.defineProperty(
      {
        __proto__: null,
        default: Tc,
      },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  ),
  _c = /* @__PURE__ */ ma(Rc);
(function (t) {
  /**
   * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
   * Released under the Apache License, Version 2.0
   * see: https://github.com/dcodeIO/bcrypt.js for details
   */
  (function (e, r) {
    typeof Cc == 'function' && t && t.exports ? (t.exports = r()) : ((e.dcodeIO = e.dcodeIO || {}).bcrypt = r());
  })(wn, function () {
    var e = {},
      r = null;
    function n(w) {
      if (t && t.exports)
        try {
          return _c.randomBytes(w);
        } catch (p) {}
      try {
        var y;
        return (self.crypto || self.msCrypto).getRandomValues((y = new Uint32Array(w))), Array.prototype.slice.call(y);
      } catch (p) {}
      if (!r)
        throw Error(
          'Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative'
        );
      return r(w);
    }
    var i = !1;
    try {
      n(1), (i = !0);
    } catch (w) {}
    (r = null),
      (e.setRandomFallback = function (w) {
        r = w;
      }),
      (e.genSaltSync = function (w, y) {
        if (((w = w || m), typeof w != 'number')) throw Error('Illegal arguments: ' + typeof w + ', ' + typeof y);
        w < 4 ? (w = 4) : w > 31 && (w = 31);
        var p = [];
        return p.push('$2a$'), w < 10 && p.push('0'), p.push(w.toString()), p.push('$'), p.push(O(n(f), f)), p.join('');
      }),
      (e.genSalt = function (w, y, p) {
        if (
          (typeof y == 'function' && ((p = y), (y = void 0)),
          typeof w == 'function' && ((p = w), (w = void 0)),
          typeof w == 'undefined')
        )
          w = m;
        else if (typeof w != 'number') throw Error('illegal arguments: ' + typeof w);
        function d(h) {
          o(function () {
            try {
              h(null, e.genSaltSync(w));
            } catch (g) {
              h(g);
            }
          });
        }
        if (p) {
          if (typeof p != 'function') throw Error('Illegal callback: ' + typeof p);
          d(p);
        } else
          return new Promise(function (h, g) {
            d(function (T, D) {
              if (T) {
                g(T);
                return;
              }
              h(D);
            });
          });
      }),
      (e.hashSync = function (w, y) {
        if (
          (typeof y == 'undefined' && (y = m),
          typeof y == 'number' && (y = e.genSaltSync(y)),
          typeof w != 'string' || typeof y != 'string')
        )
          throw Error('Illegal arguments: ' + typeof w + ', ' + typeof y);
        return re(w, y);
      }),
      (e.hash = function (w, y, p, d) {
        function h(g) {
          typeof w == 'string' && typeof y == 'number'
            ? e.genSalt(y, function (T, D) {
                re(w, D, g, d);
              })
            : typeof w == 'string' && typeof y == 'string'
            ? re(w, y, g, d)
            : o(g.bind(this, Error('Illegal arguments: ' + typeof w + ', ' + typeof y)));
        }
        if (p) {
          if (typeof p != 'function') throw Error('Illegal callback: ' + typeof p);
          h(p);
        } else
          return new Promise(function (g, T) {
            h(function (D, P) {
              if (D) {
                T(D);
                return;
              }
              g(P);
            });
          });
      });
    function a(w, y) {
      for (var p = 0, d = 0, h = 0, g = w.length; h < g; ++h) w.charCodeAt(h) === y.charCodeAt(h) ? ++p : ++d;
      return p < 0 ? !1 : d === 0;
    }
    (e.compareSync = function (w, y) {
      if (typeof w != 'string' || typeof y != 'string') throw Error('Illegal arguments: ' + typeof w + ', ' + typeof y);
      return y.length !== 60 ? !1 : a(e.hashSync(w, y.substr(0, y.length - 31)), y);
    }),
      (e.compare = function (w, y, p, d) {
        function h(g) {
          if (typeof w != 'string' || typeof y != 'string') {
            o(g.bind(this, Error('Illegal arguments: ' + typeof w + ', ' + typeof y)));
            return;
          }
          if (y.length !== 60) {
            o(g.bind(this, null, !1));
            return;
          }
          e.hash(
            w,
            y.substr(0, 29),
            function (T, D) {
              T ? g(T) : g(null, a(D, y));
            },
            d
          );
        }
        if (p) {
          if (typeof p != 'function') throw Error('Illegal callback: ' + typeof p);
          h(p);
        } else
          return new Promise(function (g, T) {
            h(function (D, P) {
              if (D) {
                T(D);
                return;
              }
              g(P);
            });
          });
      }),
      (e.getRounds = function (w) {
        if (typeof w != 'string') throw Error('Illegal arguments: ' + typeof w);
        return parseInt(w.split('$')[2], 10);
      }),
      (e.getSalt = function (w) {
        if (typeof w != 'string') throw Error('Illegal arguments: ' + typeof w);
        if (w.length !== 60) throw Error('Illegal hash length: ' + w.length + ' != 60');
        return w.substring(0, 29);
      });
    var o =
      typeof process != 'undefined' && process && typeof process.nextTick == 'function'
        ? typeof setImmediate == 'function'
          ? setImmediate
          : process.nextTick
        : setTimeout;
    function s(w) {
      var y = [],
        p = 0;
      return (
        v.encodeUTF16toUTF8(
          function () {
            return p >= w.length ? null : w.charCodeAt(p++);
          },
          function (d) {
            y.push(d);
          }
        ),
        y
      );
    }
    var l = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split(''),
      c = [
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 54, 55, 56, 57, 58, 59, 60, 61,
        62, 63, -1, -1, -1, -1, -1, -1, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
        23, 24, 25, 26, 27, -1, -1, -1, -1, -1, -1, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
        45, 46, 47, 48, 49, 50, 51, 52, 53, -1, -1, -1, -1, -1,
      ],
      x = String.fromCharCode;
    function O(w, y) {
      var p = 0,
        d = [],
        h,
        g;
      if (y <= 0 || y > w.length) throw Error('Illegal len: ' + y);
      for (; p < y; ) {
        if (((h = w[p++] & 255), d.push(l[(h >> 2) & 63]), (h = (h & 3) << 4), p >= y)) {
          d.push(l[h & 63]);
          break;
        }
        if (((g = w[p++] & 255), (h |= (g >> 4) & 15), d.push(l[h & 63]), (h = (g & 15) << 2), p >= y)) {
          d.push(l[h & 63]);
          break;
        }
        (g = w[p++] & 255), (h |= (g >> 6) & 3), d.push(l[h & 63]), d.push(l[g & 63]);
      }
      return d.join('');
    }
    function b(w, y) {
      var p = 0,
        d = w.length,
        h = 0,
        g = [],
        T,
        D,
        P,
        N,
        V,
        J;
      if (y <= 0) throw Error('Illegal len: ' + y);
      for (
        ;
        p < d - 1 &&
        h < y &&
        ((J = w.charCodeAt(p++)),
        (T = J < c.length ? c[J] : -1),
        (J = w.charCodeAt(p++)),
        (D = J < c.length ? c[J] : -1),
        !(
          T == -1 ||
          D == -1 ||
          ((V = (T << 2) >>> 0), (V |= (D & 48) >> 4), g.push(x(V)), ++h >= y || p >= d) ||
          ((J = w.charCodeAt(p++)), (P = J < c.length ? c[J] : -1), P == -1) ||
          ((V = ((D & 15) << 4) >>> 0), (V |= (P & 60) >> 2), g.push(x(V)), ++h >= y || p >= d)
        ));

      )
        (J = w.charCodeAt(p++)),
          (N = J < c.length ? c[J] : -1),
          (V = ((P & 3) << 6) >>> 0),
          (V |= N),
          g.push(x(V)),
          ++h;
      var ue = [];
      for (p = 0; p < h; p++) ue.push(g[p].charCodeAt(0));
      return ue;
    }
    var v = (function () {
      var w = {};
      return (
        (w.MAX_CODEPOINT = 1114111),
        (w.encodeUTF8 = function (y, p) {
          var d = null;
          for (
            typeof y == 'number' &&
            ((d = y),
            (y = function () {
              return null;
            }));
            d !== null || (d = y()) !== null;

          )
            d < 128
              ? p(d & 127)
              : d < 2048
              ? (p(((d >> 6) & 31) | 192), p((d & 63) | 128))
              : d < 65536
              ? (p(((d >> 12) & 15) | 224), p(((d >> 6) & 63) | 128), p((d & 63) | 128))
              : (p(((d >> 18) & 7) | 240), p(((d >> 12) & 63) | 128), p(((d >> 6) & 63) | 128), p((d & 63) | 128)),
              (d = null);
        }),
        (w.decodeUTF8 = function (y, p) {
          for (
            var d,
              h,
              g,
              T,
              D = function (P) {
                P = P.slice(0, P.indexOf(null));
                var N = Error(P.toString());
                throw ((N.name = 'TruncatedError'), (N.bytes = P), N);
              };
            (d = y()) !== null;

          )
            if (!(d & 128)) p(d);
            else if ((d & 224) === 192) (h = y()) === null && D([d, h]), p(((d & 31) << 6) | (h & 63));
            else if ((d & 240) === 224)
              ((h = y()) === null || (g = y()) === null) && D([d, h, g]),
                p(((d & 15) << 12) | ((h & 63) << 6) | (g & 63));
            else if ((d & 248) === 240)
              ((h = y()) === null || (g = y()) === null || (T = y()) === null) && D([d, h, g, T]),
                p(((d & 7) << 18) | ((h & 63) << 12) | ((g & 63) << 6) | (T & 63));
            else throw RangeError('Illegal starting byte: ' + d);
        }),
        (w.UTF16toUTF8 = function (y, p) {
          for (var d, h = null; (d = h !== null ? h : y()) !== null; ) {
            if (d >= 55296 && d <= 57343 && (h = y()) !== null && h >= 56320 && h <= 57343) {
              p((d - 55296) * 1024 + h - 56320 + 65536), (h = null);
              continue;
            }
            p(d);
          }
          h !== null && p(h);
        }),
        (w.UTF8toUTF16 = function (y, p) {
          var d = null;
          for (
            typeof y == 'number' &&
            ((d = y),
            (y = function () {
              return null;
            }));
            d !== null || (d = y()) !== null;

          )
            d <= 65535 ? p(d) : ((d -= 65536), p((d >> 10) + 55296), p((d % 1024) + 56320)), (d = null);
        }),
        (w.encodeUTF16toUTF8 = function (y, p) {
          w.UTF16toUTF8(y, function (d) {
            w.encodeUTF8(d, p);
          });
        }),
        (w.decodeUTF8toUTF16 = function (y, p) {
          w.decodeUTF8(y, function (d) {
            w.UTF8toUTF16(d, p);
          });
        }),
        (w.calculateCodePoint = function (y) {
          return y < 128 ? 1 : y < 2048 ? 2 : y < 65536 ? 3 : 4;
        }),
        (w.calculateUTF8 = function (y) {
          for (var p, d = 0; (p = y()) !== null; ) d += w.calculateCodePoint(p);
          return d;
        }),
        (w.calculateUTF16asUTF8 = function (y) {
          var p = 0,
            d = 0;
          return (
            w.UTF16toUTF8(y, function (h) {
              ++p, (d += w.calculateCodePoint(h));
            }),
            [p, d]
          );
        }),
        w
      );
    })();
    Date.now =
      Date.now ||
      function () {
        return +new Date();
      };
    var f = 16,
      m = 10,
      S = 16,
      U = 100,
      F = [
        608135816, 2242054355, 320440878, 57701188, 2752067618, 698298832, 137296536, 3964562569, 1160258022, 953160567,
        3193202383, 887688300, 3232508343, 3380367581, 1065670069, 3041331479, 2450970073, 2306472731,
      ],
      R = [
        3509652390, 2564797868, 805139163, 3491422135, 3101798381, 1780907670, 3128725573, 4046225305, 614570311,
        3012652279, 134345442, 2240740374, 1667834072, 1901547113, 2757295779, 4103290238, 227898511, 1921955416,
        1904987480, 2182433518, 2069144605, 3260701109, 2620446009, 720527379, 3318853667, 677414384, 3393288472,
        3101374703, 2390351024, 1614419982, 1822297739, 2954791486, 3608508353, 3174124327, 2024746970, 1432378464,
        3864339955, 2857741204, 1464375394, 1676153920, 1439316330, 715854006, 3033291828, 289532110, 2706671279,
        2087905683, 3018724369, 1668267050, 732546397, 1947742710, 3462151702, 2609353502, 2950085171, 1814351708,
        2050118529, 680887927, 999245976, 1800124847, 3300911131, 1713906067, 1641548236, 4213287313, 1216130144,
        1575780402, 4018429277, 3917837745, 3693486850, 3949271944, 596196993, 3549867205, 258830323, 2213823033,
        772490370, 2760122372, 1774776394, 2652871518, 566650946, 4142492826, 1728879713, 2882767088, 1783734482,
        3629395816, 2517608232, 2874225571, 1861159788, 326777828, 3124490320, 2130389656, 2716951837, 967770486,
        1724537150, 2185432712, 2364442137, 1164943284, 2105845187, 998989502, 3765401048, 2244026483, 1075463327,
        1455516326, 1322494562, 910128902, 469688178, 1117454909, 936433444, 3490320968, 3675253459, 1240580251,
        122909385, 2157517691, 634681816, 4142456567, 3825094682, 3061402683, 2540495037, 79693498, 3249098678,
        1084186820, 1583128258, 426386531, 1761308591, 1047286709, 322548459, 995290223, 1845252383, 2603652396,
        3431023940, 2942221577, 3202600964, 3727903485, 1712269319, 422464435, 3234572375, 1170764815, 3523960633,
        3117677531, 1434042557, 442511882, 3600875718, 1076654713, 1738483198, 4213154764, 2393238008, 3677496056,
        1014306527, 4251020053, 793779912, 2902807211, 842905082, 4246964064, 1395751752, 1040244610, 2656851899,
        3396308128, 445077038, 3742853595, 3577915638, 679411651, 2892444358, 2354009459, 1767581616, 3150600392,
        3791627101, 3102740896, 284835224, 4246832056, 1258075500, 768725851, 2589189241, 3069724005, 3532540348,
        1274779536, 3789419226, 2764799539, 1660621633, 3471099624, 4011903706, 913787905, 3497959166, 737222580,
        2514213453, 2928710040, 3937242737, 1804850592, 3499020752, 2949064160, 2386320175, 2390070455, 2415321851,
        4061277028, 2290661394, 2416832540, 1336762016, 1754252060, 3520065937, 3014181293, 791618072, 3188594551,
        3933548030, 2332172193, 3852520463, 3043980520, 413987798, 3465142937, 3030929376, 4245938359, 2093235073,
        3534596313, 375366246, 2157278981, 2479649556, 555357303, 3870105701, 2008414854, 3344188149, 4221384143,
        3956125452, 2067696032, 3594591187, 2921233993, 2428461, 544322398, 577241275, 1471733935, 610547355,
        4027169054, 1432588573, 1507829418, 2025931657, 3646575487, 545086370, 48609733, 2200306550, 1653985193,
        298326376, 1316178497, 3007786442, 2064951626, 458293330, 2589141269, 3591329599, 3164325604, 727753846,
        2179363840, 146436021, 1461446943, 4069977195, 705550613, 3059967265, 3887724982, 4281599278, 3313849956,
        1404054877, 2845806497, 146425753, 1854211946, 1266315497, 3048417604, 3681880366, 3289982499, 290971e4,
        1235738493, 2632868024, 2414719590, 3970600049, 1771706367, 1449415276, 3266420449, 422970021, 1963543593,
        2690192192, 3826793022, 1062508698, 1531092325, 1804592342, 2583117782, 2714934279, 4024971509, 1294809318,
        4028980673, 1289560198, 2221992742, 1669523910, 35572830, 157838143, 1052438473, 1016535060, 1802137761,
        1753167236, 1386275462, 3080475397, 2857371447, 1040679964, 2145300060, 2390574316, 1461121720, 2956646967,
        4031777805, 4028374788, 33600511, 2920084762, 1018524850, 629373528, 3691585981, 3515945977, 2091462646,
        2486323059, 586499841, 988145025, 935516892, 3367335476, 2599673255, 2839830854, 265290510, 3972581182,
        2759138881, 3795373465, 1005194799, 847297441, 406762289, 1314163512, 1332590856, 1866599683, 4127851711,
        750260880, 613907577, 1450815602, 3165620655, 3734664991, 3650291728, 3012275730, 3704569646, 1427272223,
        778793252, 1343938022, 2676280711, 2052605720, 1946737175, 3164576444, 3914038668, 3967478842, 3682934266,
        1661551462, 3294938066, 4011595847, 840292616, 3712170807, 616741398, 312560963, 711312465, 1351876610,
        322626781, 1910503582, 271666773, 2175563734, 1594956187, 70604529, 3617834859, 1007753275, 1495573769,
        4069517037, 2549218298, 2663038764, 504708206, 2263041392, 3941167025, 2249088522, 1514023603, 1998579484,
        1312622330, 694541497, 2582060303, 2151582166, 1382467621, 776784248, 2618340202, 3323268794, 2497899128,
        2784771155, 503983604, 4076293799, 907881277, 423175695, 432175456, 1378068232, 4145222326, 3954048622,
        3938656102, 3820766613, 2793130115, 2977904593, 26017576, 3274890735, 3194772133, 1700274565, 1756076034,
        4006520079, 3677328699, 720338349, 1533947780, 354530856, 688349552, 3973924725, 1637815568, 332179504,
        3949051286, 53804574, 2852348879, 3044236432, 1282449977, 3583942155, 3416972820, 4006381244, 1617046695,
        2628476075, 3002303598, 1686838959, 431878346, 2686675385, 1700445008, 1080580658, 1009431731, 832498133,
        3223435511, 2605976345, 2271191193, 2516031870, 1648197032, 4164389018, 2548247927, 300782431, 375919233,
        238389289, 3353747414, 2531188641, 2019080857, 1475708069, 455242339, 2609103871, 448939670, 3451063019,
        1395535956, 2413381860, 1841049896, 1491858159, 885456874, 4264095073, 4001119347, 1565136089, 3898914787,
        1108368660, 540939232, 1173283510, 2745871338, 3681308437, 4207628240, 3343053890, 4016749493, 1699691293,
        1103962373, 3625875870, 2256883143, 3830138730, 1031889488, 3479347698, 1535977030, 4236805024, 3251091107,
        2132092099, 1774941330, 1199868427, 1452454533, 157007616, 2904115357, 342012276, 595725824, 1480756522,
        206960106, 497939518, 591360097, 863170706, 2375253569, 3596610801, 1814182875, 2094937945, 3421402208,
        1082520231, 3463918190, 2785509508, 435703966, 3908032597, 1641649973, 2842273706, 3305899714, 1510255612,
        2148256476, 2655287854, 3276092548, 4258621189, 236887753, 3681803219, 274041037, 1734335097, 3815195456,
        3317970021, 1899903192, 1026095262, 4050517792, 356393447, 2410691914, 3873677099, 3682840055, 3913112168,
        2491498743, 4132185628, 2489919796, 1091903735, 1979897079, 3170134830, 3567386728, 3557303409, 857797738,
        1136121015, 1342202287, 507115054, 2535736646, 337727348, 3213592640, 1301675037, 2528481711, 1895095763,
        1721773893, 3216771564, 62756741, 2142006736, 835421444, 2531993523, 1442658625, 3659876326, 2882144922,
        676362277, 1392781812, 170690266, 3921047035, 1759253602, 3611846912, 1745797284, 664899054, 1329594018,
        3901205900, 3045908486, 2062866102, 2865634940, 3543621612, 3464012697, 1080764994, 553557557, 3656615353,
        3996768171, 991055499, 499776247, 1265440854, 648242737, 3940784050, 980351604, 3713745714, 1749149687,
        3396870395, 4211799374, 3640570775, 1161844396, 3125318951, 1431517754, 545492359, 4268468663, 3499529547,
        1437099964, 2702547544, 3433638243, 2581715763, 2787789398, 1060185593, 1593081372, 2418618748, 4260947970,
        69676912, 2159744348, 86519011, 2512459080, 3838209314, 1220612927, 3339683548, 133810670, 1090789135,
        1078426020, 1569222167, 845107691, 3583754449, 4072456591, 1091646820, 628848692, 1613405280, 3757631651,
        526609435, 236106946, 48312990, 2942717905, 3402727701, 1797494240, 859738849, 992217954, 4005476642,
        2243076622, 3870952857, 3732016268, 765654824, 3490871365, 2511836413, 1685915746, 3888969200, 1414112111,
        2273134842, 3281911079, 4080962846, 172450625, 2569994100, 980381355, 4109958455, 2819808352, 2716589560,
        2568741196, 3681446669, 3329971472, 1835478071, 660984891, 3704678404, 4045999559, 3422617507, 3040415634,
        1762651403, 1719377915, 3470491036, 2693910283, 3642056355, 3138596744, 1364962596, 2073328063, 1983633131,
        926494387, 3423689081, 2150032023, 4096667949, 1749200295, 3328846651, 309677260, 2016342300, 1779581495,
        3079819751, 111262694, 1274766160, 443224088, 298511866, 1025883608, 3806446537, 1145181785, 168956806,
        3641502830, 3584813610, 1689216846, 3666258015, 3200248200, 1692713982, 2646376535, 4042768518, 1618508792,
        1610833997, 3523052358, 4130873264, 2001055236, 3610705100, 2202168115, 4028541809, 2961195399, 1006657119,
        2006996926, 3186142756, 1430667929, 3210227297, 1314452623, 4074634658, 4101304120, 2273951170, 1399257539,
        3367210612, 3027628629, 1190975929, 2062231137, 2333990788, 2221543033, 2438960610, 1181637006, 548689776,
        2362791313, 3372408396, 3104550113, 3145860560, 296247880, 1970579870, 3078560182, 3769228297, 1714227617,
        3291629107, 3898220290, 166772364, 1251581989, 493813264, 448347421, 195405023, 2709975567, 677966185,
        3703036547, 1463355134, 2715995803, 1338867538, 1343315457, 2802222074, 2684532164, 233230375, 2599980071,
        2000651841, 3277868038, 1638401717, 4028070440, 3237316320, 6314154, 819756386, 300326615, 590932579,
        1405279636, 3267499572, 3150704214, 2428286686, 3959192993, 3461946742, 1862657033, 1266418056, 963775037,
        2089974820, 2263052895, 1917689273, 448879540, 3550394620, 3981727096, 150775221, 3627908307, 1303187396,
        508620638, 2975983352, 2726630617, 1817252668, 1876281319, 1457606340, 908771278, 3720792119, 3617206836,
        2455994898, 1729034894, 1080033504, 976866871, 3556439503, 2881648439, 1522871579, 1555064734, 1336096578,
        3548522304, 2579274686, 3574697629, 3205460757, 3593280638, 3338716283, 3079412587, 564236357, 2993598910,
        1781952180, 1464380207, 3163844217, 3332601554, 1699332808, 1393555694, 1183702653, 3581086237, 1288719814,
        691649499, 2847557200, 2895455976, 3193889540, 2717570544, 1781354906, 1676643554, 2592534050, 3230253752,
        1126444790, 2770207658, 2633158820, 2210423226, 2615765581, 2414155088, 3127139286, 673620729, 2805611233,
        1269405062, 4015350505, 3341807571, 4149409754, 1057255273, 2012875353, 2162469141, 2276492801, 2601117357,
        993977747, 3918593370, 2654263191, 753973209, 36408145, 2530585658, 25011837, 3520020182, 2088578344, 530523599,
        2918365339, 1524020338, 1518925132, 3760827505, 3759777254, 1202760957, 3985898139, 3906192525, 674977740,
        4174734889, 2031300136, 2019492241, 3983892565, 4153806404, 3822280332, 352677332, 2297720250, 60907813,
        90501309, 3286998549, 1016092578, 2535922412, 2839152426, 457141659, 509813237, 4120667899, 652014361,
        1966332200, 2975202805, 55981186, 2327461051, 676427537, 3255491064, 2882294119, 3433927263, 1307055953,
        942726286, 933058658, 2468411793, 3933900994, 4215176142, 1361170020, 2001714738, 2830558078, 3274259782,
        1222529897, 1679025792, 2729314320, 3714953764, 1770335741, 151462246, 3013232138, 1682292957, 1483529935,
        471910574, 1539241949, 458788160, 3436315007, 1807016891, 3718408830, 978976581, 1043663428, 3165965781,
        1927990952, 4200891579, 2372276910, 3208408903, 3533431907, 1412390302, 2931980059, 4132332400, 1947078029,
        3881505623, 4168226417, 2941484381, 1077988104, 1320477388, 886195818, 18198404, 3786409e3, 2509781533,
        112762804, 3463356488, 1866414978, 891333506, 18488651, 661792760, 1628790961, 3885187036, 3141171499,
        876946877, 2693282273, 1372485963, 791857591, 2686433993, 3759982718, 3167212022, 3472953795, 2716379847,
        445679433, 3561995674, 3504004811, 3574258232, 54117162, 3331405415, 2381918588, 3769707343, 4154350007,
        1140177722, 4074052095, 668550556, 3214352940, 367459370, 261225585, 2610173221, 4209349473, 3468074219,
        3265815641, 314222801, 3066103646, 3808782860, 282218597, 3406013506, 3773591054, 379116347, 1285071038,
        846784868, 2669647154, 3771962079, 3550491691, 2305946142, 453669953, 1268987020, 3317592352, 3279303384,
        3744833421, 2610507566, 3859509063, 266596637, 3847019092, 517658769, 3462560207, 3443424879, 370717030,
        4247526661, 2224018117, 4143653529, 4112773975, 2788324899, 2477274417, 1456262402, 2901442914, 1517677493,
        1846949527, 2295493580, 3734397586, 2176403920, 1280348187, 1908823572, 3871786941, 846861322, 1172426758,
        3287448474, 3383383037, 1655181056, 3139813346, 901632758, 1897031941, 2986607138, 3066810236, 3447102507,
        1393639104, 373351379, 950779232, 625454576, 3124240540, 4148612726, 2007998917, 544563296, 2244738638,
        2330496472, 2058025392, 1291430526, 424198748, 50039436, 29584100, 3605783033, 2429876329, 2791104160,
        1057563949, 3255363231, 3075367218, 3463963227, 1469046755, 985887462,
      ],
      I = [1332899944, 1700884034, 1701343084, 1684370003, 1668446532, 1869963892];
    function B(w, y, p, d) {
      var h,
        g = w[y],
        T = w[y + 1];
      return (
        (g ^= p[0]),
        (h = d[g >>> 24]),
        (h += d[256 | ((g >> 16) & 255)]),
        (h ^= d[512 | ((g >> 8) & 255)]),
        (h += d[768 | (g & 255)]),
        (T ^= h ^ p[1]),
        (h = d[T >>> 24]),
        (h += d[256 | ((T >> 16) & 255)]),
        (h ^= d[512 | ((T >> 8) & 255)]),
        (h += d[768 | (T & 255)]),
        (g ^= h ^ p[2]),
        (h = d[g >>> 24]),
        (h += d[256 | ((g >> 16) & 255)]),
        (h ^= d[512 | ((g >> 8) & 255)]),
        (h += d[768 | (g & 255)]),
        (T ^= h ^ p[3]),
        (h = d[T >>> 24]),
        (h += d[256 | ((T >> 16) & 255)]),
        (h ^= d[512 | ((T >> 8) & 255)]),
        (h += d[768 | (T & 255)]),
        (g ^= h ^ p[4]),
        (h = d[g >>> 24]),
        (h += d[256 | ((g >> 16) & 255)]),
        (h ^= d[512 | ((g >> 8) & 255)]),
        (h += d[768 | (g & 255)]),
        (T ^= h ^ p[5]),
        (h = d[T >>> 24]),
        (h += d[256 | ((T >> 16) & 255)]),
        (h ^= d[512 | ((T >> 8) & 255)]),
        (h += d[768 | (T & 255)]),
        (g ^= h ^ p[6]),
        (h = d[g >>> 24]),
        (h += d[256 | ((g >> 16) & 255)]),
        (h ^= d[512 | ((g >> 8) & 255)]),
        (h += d[768 | (g & 255)]),
        (T ^= h ^ p[7]),
        (h = d[T >>> 24]),
        (h += d[256 | ((T >> 16) & 255)]),
        (h ^= d[512 | ((T >> 8) & 255)]),
        (h += d[768 | (T & 255)]),
        (g ^= h ^ p[8]),
        (h = d[g >>> 24]),
        (h += d[256 | ((g >> 16) & 255)]),
        (h ^= d[512 | ((g >> 8) & 255)]),
        (h += d[768 | (g & 255)]),
        (T ^= h ^ p[9]),
        (h = d[T >>> 24]),
        (h += d[256 | ((T >> 16) & 255)]),
        (h ^= d[512 | ((T >> 8) & 255)]),
        (h += d[768 | (T & 255)]),
        (g ^= h ^ p[10]),
        (h = d[g >>> 24]),
        (h += d[256 | ((g >> 16) & 255)]),
        (h ^= d[512 | ((g >> 8) & 255)]),
        (h += d[768 | (g & 255)]),
        (T ^= h ^ p[11]),
        (h = d[T >>> 24]),
        (h += d[256 | ((T >> 16) & 255)]),
        (h ^= d[512 | ((T >> 8) & 255)]),
        (h += d[768 | (T & 255)]),
        (g ^= h ^ p[12]),
        (h = d[g >>> 24]),
        (h += d[256 | ((g >> 16) & 255)]),
        (h ^= d[512 | ((g >> 8) & 255)]),
        (h += d[768 | (g & 255)]),
        (T ^= h ^ p[13]),
        (h = d[T >>> 24]),
        (h += d[256 | ((T >> 16) & 255)]),
        (h ^= d[512 | ((T >> 8) & 255)]),
        (h += d[768 | (T & 255)]),
        (g ^= h ^ p[14]),
        (h = d[g >>> 24]),
        (h += d[256 | ((g >> 16) & 255)]),
        (h ^= d[512 | ((g >> 8) & 255)]),
        (h += d[768 | (g & 255)]),
        (T ^= h ^ p[15]),
        (h = d[T >>> 24]),
        (h += d[256 | ((T >> 16) & 255)]),
        (h ^= d[512 | ((T >> 8) & 255)]),
        (h += d[768 | (T & 255)]),
        (g ^= h ^ p[16]),
        (w[y] = T ^ p[S + 1]),
        (w[y + 1] = g),
        w
      );
    }
    function j(w, y) {
      for (var p = 0, d = 0; p < 4; ++p) (d = (d << 8) | (w[y] & 255)), (y = (y + 1) % w.length);
      return { key: d, offp: y };
    }
    function ce(w, y, p) {
      for (var d = 0, h = [0, 0], g = y.length, T = p.length, D, P = 0; P < g; P++)
        (D = j(w, d)), (d = D.offp), (y[P] = y[P] ^ D.key);
      for (P = 0; P < g; P += 2) (h = B(h, 0, y, p)), (y[P] = h[0]), (y[P + 1] = h[1]);
      for (P = 0; P < T; P += 2) (h = B(h, 0, y, p)), (p[P] = h[0]), (p[P + 1] = h[1]);
    }
    function pe(w, y, p, d) {
      for (var h = 0, g = [0, 0], T = p.length, D = d.length, P, N = 0; N < T; N++)
        (P = j(y, h)), (h = P.offp), (p[N] = p[N] ^ P.key);
      for (h = 0, N = 0; N < T; N += 2)
        (P = j(w, h)),
          (h = P.offp),
          (g[0] ^= P.key),
          (P = j(w, h)),
          (h = P.offp),
          (g[1] ^= P.key),
          (g = B(g, 0, p, d)),
          (p[N] = g[0]),
          (p[N + 1] = g[1]);
      for (N = 0; N < D; N += 2)
        (P = j(w, h)),
          (h = P.offp),
          (g[0] ^= P.key),
          (P = j(w, h)),
          (h = P.offp),
          (g[1] ^= P.key),
          (g = B(g, 0, p, d)),
          (d[N] = g[0]),
          (d[N + 1] = g[1]);
    }
    function xe(w, y, p, d, h) {
      var g = I.slice(),
        T = g.length,
        D;
      if (p < 4 || p > 31)
        if (((D = Error('Illegal number of rounds (4-31): ' + p)), d)) {
          o(d.bind(this, D));
          return;
        } else throw D;
      if (y.length !== f)
        if (((D = Error('Illegal salt length: ' + y.length + ' != ' + f)), d)) {
          o(d.bind(this, D));
          return;
        } else throw D;
      p = (1 << p) >>> 0;
      var P,
        N,
        V = 0,
        J;
      Int32Array ? ((P = new Int32Array(F)), (N = new Int32Array(R))) : ((P = F.slice()), (N = R.slice())),
        pe(y, w, P, N);
      function ue() {
        if ((h && h(V / p), V < p))
          for (var ye = Date.now(); V < p && ((V = V + 1), ce(w, P, N), ce(y, P, N), !(Date.now() - ye > U)); );
        else {
          for (V = 0; V < 64; V++) for (J = 0; J < T >> 1; J++) B(g, J << 1, P, N);
          var Z = [];
          for (V = 0; V < T; V++)
            Z.push(((g[V] >> 24) & 255) >>> 0),
              Z.push(((g[V] >> 16) & 255) >>> 0),
              Z.push(((g[V] >> 8) & 255) >>> 0),
              Z.push((g[V] & 255) >>> 0);
          if (d) {
            d(null, Z);
            return;
          } else return Z;
        }
        d && o(ue);
      }
      if (typeof d != 'undefined') ue();
      else for (var Se; ; ) if (typeof (Se = ue()) != 'undefined') return Se || [];
    }
    function re(w, y, p, d) {
      var h;
      if (typeof w != 'string' || typeof y != 'string')
        if (((h = Error('Invalid string / salt: Not a string')), p)) {
          o(p.bind(this, h));
          return;
        } else throw h;
      var g, T;
      if (y.charAt(0) !== '$' || y.charAt(1) !== '2')
        if (((h = Error('Invalid salt version: ' + y.substring(0, 2))), p)) {
          o(p.bind(this, h));
          return;
        } else throw h;
      if (y.charAt(2) === '$') (g = String.fromCharCode(0)), (T = 3);
      else {
        if (((g = y.charAt(2)), (g !== 'a' && g !== 'b' && g !== 'y') || y.charAt(3) !== '$'))
          if (((h = Error('Invalid salt revision: ' + y.substring(2, 4))), p)) {
            o(p.bind(this, h));
            return;
          } else throw h;
        T = 4;
      }
      if (y.charAt(T + 2) > '$')
        if (((h = Error('Missing salt rounds')), p)) {
          o(p.bind(this, h));
          return;
        } else throw h;
      var D = parseInt(y.substring(T, T + 1), 10) * 10,
        P = parseInt(y.substring(T + 1, T + 2), 10),
        N = D + P,
        V = y.substring(T + 3, T + 25);
      w += g >= 'a' ? '\0' : '';
      var J = s(w),
        ue = b(V, f);
      function Se(ye) {
        var Z = [];
        return (
          Z.push('$2'),
          g >= 'a' && Z.push(g),
          Z.push('$'),
          N < 10 && Z.push('0'),
          Z.push(N.toString()),
          Z.push('$'),
          Z.push(O(ue, ue.length)),
          Z.push(O(ye, I.length * 4 - 1)),
          Z.join('')
        );
      }
      if (typeof p == 'undefined') return Se(xe(J, ue, N));
      xe(
        J,
        ue,
        N,
        function (ye, Z) {
          ye ? p(ye, null) : p(null, Se(Z));
        },
        d
      );
    }
    return (e.encodeBase64 = O), (e.decodeBase64 = b), e;
  });
})(Sc);
const Pc = (t, e) => {
    const r = 'publir_subscriber',
      n = 'publir_subs_hash';
    return !!(
      t != null &&
      t.config.enableSubscriptions &&
      Number(e[r]) > 0 &&
      yr.compareSync(e[r] || '', decodeURIComponent(e[n]))
    );
  },
  Ac = (t, e, r) => {
    const n = Oe(() => (t ? Pc(t, r) : !1), [t, r]),
      { refetch: i } = Oc.useEnableSubscriptions({ publir_page_url: window.location.href, site_id: e }, n);
    return (
      Fe(() => {
        n && i();
      }, [n, i]),
      { isSubscriptionEnabled: n }
    );
  },
  Fc = (t) =>
    st(void 0, null, function* () {
      yield mc.post('', t);
    }),
  Ic = (t) => !!(t != null && t.config.trackClicks),
  Uc = (t, e) => {
    const r = Oe(() => (t ? Ic(t) : !1), [t]);
    Fe(() => {
      var n;
      if (r) {
        let i;
        (n = window.pbjs) == null ||
          n.onEvent('adRenderSucceeded', (a) => {
            i = a.doc.body.querySelectorAll('a[href]');
            const o = () => {
              Fc({
                publir_page_url: window.location.href,
                site_id: e,
                adunit_id: a.adId,
              });
            };
            return (
              i.forEach((s) => {
                s.addEventListener('click', o);
              }),
              () => {
                i.forEach((s) => {
                  s.removeEventListener('click', o);
                });
              }
            );
          });
      }
    }, [r, e]);
  },
  Dc = (t) =>
    st(void 0, null, function* () {
      yield yc.post('/publirPageViewTracker', t);
    }),
  kc = {
    useTrackPageView: (t, e) =>
      Tr({
        queryKey: ['trackPageView', t],
        queryFn: () => Dc(t),
        enabled: gr() && e,
        onError: console.error,
      }),
  },
  Mc = (t) => !!(t != null && t.config.trackPageviews),
  Nc = (t, e, r) => {
    const n = Oe(() => (t ? !r && Mc(t) : !1), [t, r]),
      i = window.location.href,
      [a, o] = ht(i),
      { refetch: s } = kc.useTrackPageView({ publir_page_url: a, site_id: e }, n),
      [l, c] = ht();
    Fe(() => {
      if (n) {
        let x = '';
        const O = new MutationObserver(() => {
          const b = window.location.href;
          b !== x && ((x = b), o(b));
        });
        c(O);
      }
    }, [c, n]),
      Fe(() => {
        if (n)
          return l
            ? (l.observe(document, { subtree: !0, childList: !0 }),
              () => {
                l && l.disconnect();
              })
            : void 0;
      }, [l, n]),
      Fe(() => {
        n && s();
      }, [a, s, n]);
  },
  jc = ({ publisherId: t, children: e }) => {
    const { data: r, isLoading: n, isError: i } = wc.useConfig(t),
      [a, o] = ht(!1),
      [s] = eu(),
      l = !0,
      c = ar(() => {
        r && window.pbjs && (On(() => Ca(r)), o(!0));
      }, [r]),
      { isSubscriptionEnabled: x } = Ac(r, t, s);
    Fe(() => {
      x || c();
    }, [c, s, r, x]),
      Nc(r, t, x);
    const O = Oe(() => ({ data: r, isLoading: n, isError: i, isPrebidSetup: a, isProviderSetup: l }), [r, n, i, a, l]);
    return Uc(r, t), /* @__PURE__ */ Ve(En.Provider, { value: O, children: e });
  },
  Wc = ({ publisherId: t, children: e }) =>
    /* @__PURE__ */ Ve(Xs, {
      children: /* @__PURE__ */ Ve(Is, {
        client: ru,
        children: /* @__PURE__ */ Ve(jc, { publisherId: t, children: e }),
      }),
    });
export { Vc as AdSlot, Wc as PublirAdsProvider };
