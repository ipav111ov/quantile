function getValuesFromSS() {
  const isSmall = false 
  const link = isSmall ? '1IgNIG1Z8VExm9-oXux-KDgBFcock-KNK' : '1Qg7M6_21EgqZcMiRFbiv0p7f0alMHweL'
  const folder = DriveApp.getFolderById(link);
  const files = folder.getFiles();
  let result = [];
  while (files.hasNext()) {
    const file = files.next()
    let currentValues = SpreadsheetApp.openById(file.getId()).getSheets()[0].getDataRange().getValues()
    currentValues = currentValues[1][0] == '' ? currentValues.slice(2) : currentValues.slice(1)
    result = result.concat(currentValues)
  }
  return result
}



