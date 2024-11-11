import { Buffer } from 'buffer';

function encodeBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

function base64encode(arg: string, urlSafe = false) {
  const encoded = encodeBase64(new TextEncoder().encode(arg));
  if (urlSafe) {
    return encoded.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  return encoded;
}

export default base64encode;