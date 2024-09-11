function getValuesFromSS() {
  const url = 'https://docs.google.com/spreadsheets/d/1ZhjL_yr5Gtx-_SdCxhExNz_44ZOSH8C0H2lcjEFeY-c/edit?gid=1269428899#gid=1269428899'
  let currentValues = SpreadsheetApp.openByUrl(url).getSheets()[0].getDataRange().getValues()
  currentValues = currentValues[1][0] == '' ? currentValues.slice(2) : currentValues.slice(1)
  return currentValues
}



