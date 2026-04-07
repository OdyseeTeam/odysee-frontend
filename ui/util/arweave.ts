import ArweaveModule from 'arweave';
const Arweave = (ArweaveModule as any).default || ArweaveModule;
const arweave = new Arweave({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});
export default arweave;
