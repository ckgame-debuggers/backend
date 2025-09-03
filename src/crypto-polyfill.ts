import './crypto-polyfill';
// crypto-polyfill.ts
import { webcrypto as nodeWebCrypto } from 'node:crypto';

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = nodeWebCrypto as unknown;
}
