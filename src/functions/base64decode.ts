function decodeBase64(input: string): Uint8Array {
  return Uint8Array.from(Buffer.from(input, 'base64'));
}

function base64decode(arg: string, urlSafe = false) {
  if (urlSafe) {
    arg = arg.replace(/-/g, '+').replace(/_/g, '/');
  }
  try {
    return new TextDecoder('utf-8').decode(decodeBase64(arg));
  } catch (error) {
    throw new Error('Invalid base64 string');
  }
}

export default base64decode;