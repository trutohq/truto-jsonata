function firstNonEmpty(...args: any[]) {
  for (const arg of args) {
    if (arg !== undefined && arg !== null) {
      return arg
    }
  }
}

export default firstNonEmpty
