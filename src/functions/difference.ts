function differenceArray(arr1: any[], arr2: any[]) {
  const set1 = new Set(arr1)
  const set2 = new Set(arr2)
  return [...set1].filter(x => !set2.has(x))
}

export default differenceArray
