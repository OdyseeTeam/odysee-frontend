const SECP256K1_P = BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
const SECP256K1_N = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
const SECP256K1_GX = BigInt('0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798');
const SECP256K1_GY = BigInt('0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8');
const SECP256K1_G = { x: SECP256K1_GX, y: SECP256K1_GY };
const SECP256K1_INFINITY = null;
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const THREE = BigInt(3);
const FOUR = BigInt(4);
const SEVEN = BigInt(7);

type Point = { x: bigint; y: bigint } | null;

function mod(value: bigint, modulo: bigint) {
  const result = value % modulo;
  return result >= ZERO ? result : result + modulo;
}

function modPow(base: bigint, exponent: bigint, modulo: bigint) {
  let result = ONE;
  let b = mod(base, modulo);
  let e = exponent;
  while (e > ZERO) {
    if (e & ONE) result = mod(result * b, modulo);
    b = mod(b * b, modulo);
    e >>= ONE;
  }
  return result;
}

function modInv(value: bigint, modulo: bigint) {
  if (value === ZERO) throw new Error('division by zero');
  return modPow(value, modulo - TWO, modulo);
}

function hexBytes(hexString?: string | null) {
  if (!hexString || hexString.length % 2 !== 0 || /[^0-9a-f]/i.test(hexString)) {
    throw new Error('invalid hex bytes');
  }

  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hexString.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function hexFromBytes(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToBigInt(bytes: Uint8Array) {
  return BigInt(`0x${hexFromBytes(bytes)}`);
}

function pointDouble(point: Point) {
  if (!point || point.y === ZERO) return SECP256K1_INFINITY;
  const slope = mod(THREE * point.x * point.x * modInv(TWO * point.y, SECP256K1_P), SECP256K1_P);
  const x = mod(slope * slope - TWO * point.x, SECP256K1_P);
  const y = mod(slope * (point.x - x) - point.y, SECP256K1_P);
  return { x, y };
}

function pointAdd(left: Point, right: Point): Point {
  if (!left) return right;
  if (!right) return left;
  if (left.x === right.x) {
    return mod(left.y + right.y, SECP256K1_P) === ZERO ? SECP256K1_INFINITY : pointDouble(left);
  }

  const slope = mod((right.y - left.y) * modInv(right.x - left.x, SECP256K1_P), SECP256K1_P);
  const x = mod(slope * slope - left.x - right.x, SECP256K1_P);
  const y = mod(slope * (left.x - x) - left.y, SECP256K1_P);
  return { x, y };
}

function pointMultiply(scalar: bigint, point: { x: bigint; y: bigint }) {
  let n = scalar;
  let addend: Point = point;
  let result: Point = SECP256K1_INFINITY;

  while (n > ZERO) {
    if (n & ONE) result = pointAdd(result, addend);
    addend = pointDouble(addend);
    n >>= ONE;
  }

  return result;
}

function decompressSecp256k1PublicKey(publicKeyHex: string) {
  const publicKey = hexBytes(publicKeyHex);
  if (publicKey.length === 65 && publicKey[0] === 4) {
    return { x: bytesToBigInt(publicKey.slice(1, 33)), y: bytesToBigInt(publicKey.slice(33, 65)) };
  }
  if (publicKey.length !== 33 || (publicKey[0] !== 2 && publicKey[0] !== 3)) {
    throw new Error('unsupported secp256k1 public key');
  }

  const x = bytesToBigInt(publicKey.slice(1));
  const ySquared = mod(x ** THREE + SEVEN, SECP256K1_P);
  let y = modPow(ySquared, (SECP256K1_P + ONE) / FOUR, SECP256K1_P);
  const shouldBeOdd = publicKey[0] === 3;
  if ((y & ONE) !== (shouldBeOdd ? ONE : ZERO)) y = SECP256K1_P - y;
  return { x, y };
}

export function verifySecp256k1Signature(signatureHex: string, digestHex: string, publicKeyHex: string) {
  try {
    const signature = hexBytes(signatureHex);
    if (signature.length !== 64) throw new Error('invalid compact signature length');
    const r = bytesToBigInt(signature.slice(0, 32));
    const s = bytesToBigInt(signature.slice(32, 64));
    if (r <= ZERO || r >= SECP256K1_N || s <= ZERO || s >= SECP256K1_N) {
      return { status: 'failed', reason: 'signature scalar out of range', verified: false };
    }

    const z = bytesToBigInt(hexBytes(digestHex));
    const publicKey = decompressSecp256k1PublicKey(publicKeyHex);
    const sInv = modInv(s, SECP256K1_N);
    const u1 = mod(z * sInv, SECP256K1_N);
    const u2 = mod(r * sInv, SECP256K1_N);
    const point = pointAdd(pointMultiply(u1, SECP256K1_G), pointMultiply(u2, publicKey));
    const verified = Boolean(point && mod(point.x, SECP256K1_N) === r);

    return {
      status: verified ? 'verified' : 'failed',
      verified,
      publicKey: publicKeyHex,
    };
  } catch (error) {
    return {
      status: 'failed',
      reason: String(error?.message || error),
      verified: false,
    };
  }
}
