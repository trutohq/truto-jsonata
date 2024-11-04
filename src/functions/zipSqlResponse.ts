function zipSqlResponse(columns: any, data: any, key: any) {
  // @ts-ignore
  const columnKeys = columns.map(col => col[key])
  // @ts-ignore
  return data.map(row => {
    const obj = {}
    for (let i = 0; i < columnKeys.length; i++) {
      // @ts-ignore
      obj[columnKeys[i]] = row[i]
    }
    return obj
  })
}

export default zipSqlResponse
