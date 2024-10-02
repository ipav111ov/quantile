function getEmblemLinks() {
  const folder = DriveApp.getFolderById('1tsRE6W0usr2hsVM14zenB3Nnxv36IsJ0')
  const files = folder.getFiles()
  const arrayForWrite = [['uid', 'link']]
  const template = `https://drive.google.com/thumbnail?id=`
  const ext = '.png'
  while (files.hasNext()) {
    const file = files.next()
    const name = file.getName().replace('Copy of ', '');
    // const name = file.getName();
    file.setName(name)
    const uid = name.replace(ext, '')
    const id = file.getId()
    const link = template + id
    arrayForWrite.push([uid, link])
  }
  return arrayForWrite
}

function outputEmblems() {
  const arrayForWrite = getEmblemLinks()
  const sheetName = 'Emblems'
  const ss = CONSTANTS.speadsheetControlPanel
  pasteToSheet(arrayForWrite, sheetName, ss)
}

function getEmblemsAsObject() {
  const arrayForWrite = CONSTANTS.speadsheetControlPanel.getSheetByName('Emblems').getDataRange().getValues().slice(1)
  const emblems = {}
  for (const row of arrayForWrite) {
    emblems[row[0]] = row[1]
  }
  return emblems
}
