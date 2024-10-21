function firstNonEmpty(...args) {
  for (const arg of args) {
    if (arg !== undefined && arg !== null) {
      return arg
    }
  }
}

export default firstNonEmpty
