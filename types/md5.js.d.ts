declare module 'md5.js' {
  class MD5 {
    update(data: string | NodeJS.Buffer | Uint8Array): this
    digest(): NodeJS.Buffer
    digest(encoding: 'hex'): string
    read(): NodeJS.Buffer
  }

  export = MD5
}

