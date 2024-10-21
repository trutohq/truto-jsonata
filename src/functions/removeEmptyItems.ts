function removeEmptyItems(arg: Array<unknown>) {
  if (!Array.isArray(arg)) {
    return arg
  }
  return arg.filter(item => {
    if (item && typeof item === 'object') {
      return Object.keys(item).length > 0
    }
    return item
  })
}

export default removeEmptyItems
