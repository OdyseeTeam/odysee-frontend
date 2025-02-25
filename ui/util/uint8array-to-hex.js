const byteToHex = new Array(256);

for (let n = 0; n <= 0xff; ++n) {
  byteToHex[n] = n.toString(16).padStart(2, '0');
}

export function bufferToHex(arrayBuffer) {
  const buff = new Uint8Array(arrayBuffer);
  const hexOctets = new Array(buff.length); // preallocate for speed

  for (let i = 0; i < buff.length; ++i) {
    hexOctets[i] = byteToHex[buff[i]];
  }

  return hexOctets.join('');
}
