import Arweave from 'arweave';

const arweave = new Arweave({
  host: 'ar-io.net',
  port: 443,
  protocol: 'https',
});

export default arweave;
