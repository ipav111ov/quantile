const spreadsheetMembers = CONSTANTS.speadsheetControlPanel
const emplannerSheet = spreadsheetMembers.getSheetByName('users_ver3')
if (!spreadsheetMembers.getSheetByName('membersForDatabase')) {
  spreadsheetMembers.insertSheet('membersForDatabase')
}
membersSheet = spreadsheetMembers.getSheetByName('membersForDatabase')

function prepareMembersForDatabase() {
  Logger.log('Preparing members...')
  const values = emplannerSheet.getDataRange().getValues().slice(1)
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
  membersSheet.clear()
  membersSheet.getRange(1, 1, arrayForWrite.length, arrayForWrite[0].length).setValues(arrayForWrite)
  Logger.log('Members prepared')
}


function uploadToDatabaseMembers() {
  Logger.log('Uploading members to database...')
  const statement = 'REPLACE INTO game_members (short_uid, full_name, corporate_email, long_uid) VALUES (?,?,?,?)'
  uploadToDatabase(membersSheet, statement)
  Logger.log('Members uploaded')
}



