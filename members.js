function uploadToDatabaseMembers() {
  const sheetNameMembers = 'users_ver3'
  const spreadsheetMembers = CONSTANTS.speadsheetControlPanel
  const sheetMembers = spreadsheetMembers.getSheetByName(sheetNameMembers)
  let copySheet
  try {
    const copySheetName = 'membersForDatabase'
    if (!spreadsheetMembers.getSheetByName(copySheetName)) {
      spreadsheetMembers.insertSheet(copySheetName)
    }
    copySheet = spreadsheetMembers.getSheetByName(copySheetName)
    prepareMembersForDatabase(copySheet, sheetMembers)
    const statement = 'REPLACE INTO game_members (short_uid, full_name, corporate_email, long_uid) VALUES (?,?,?,?)'
    uploadToDatabase(copySheet, statement)
  }
  catch (e) {
    Logger.log(e.message)
  }
  finally {
    spreadsheetMembers.deleteSheet(copySheet)
  }

}

function prepareMembersForDatabase(sheet, originalSheet) {
  const values = originalSheet.getDataRange().getValues().slice(1)
  const indexes = {
    memberLongUid: 0,
    firstName: 1,
    lastName: 2,
    fullName: 3,
    corporateEmail: 4,
    personalEmail: 5,
    country: 6,
  }
  const keyWords = ['emplanner', 'docusketch', 'immoviewer']
  const arrayForWrite = [['short_uid', 'full_name', 'corporate_email', 'long_uid']]
  for (const row of values) {
    const short_uid = AnotherFunctions.getShortUid(row[indexes.memberLongUid])
    const full_name = `${row[indexes.firstName]} ${row[indexes.lastName]}`
    const email = keyWords.some(word => row[indexes.corporateEmail].includes(word)) ? 
    row[indexes.corporateEmail] : 
    keyWords.some(word => row[indexes.personalEmail].includes(word)) ? 
    row[indexes.personalEmail] : ''
    const long_uid = row[indexes.memberLongUid]
    
    if (email) {
      arrayForWrite.push([short_uid, full_name, email, long_uid])
    }
  }
  sheet.clear()
  sheet.getRange(1, 1, arrayForWrite.length, arrayForWrite[0].length).setValues(arrayForWrite)
}

