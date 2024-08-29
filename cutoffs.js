const cutoffSelectorSheetName = 'cutoffSelector'
const spreadsheetCutoffs = CONSTANTS.speadsheetControlPanel
const sheet = spreadsheetCutoffs.getSheetByName('CutoffsForDatabase')
const cutoffSelectorSheet = spreadsheetCutoffs.getSheetByName(cutoffSelectorSheetName)

function createCutoffs() {
  Logger.log('Creating cutoffs...')
  const arrayForWrite = [['id', 'timestamp', 'name']]
  let startDate = moment().month('June').startOf('month')
  const format = 'DD.MM.YY'

  for (let i = 1; i <= 30; i = i + 2) {
    const startCutoff1 = moment(startDate)
    const startCutoff1Timestamp = moment(startCutoff1).valueOf()
    const endCutoff1 = moment(startDate).add(14, 'days')

    const startCutoff2 = moment(startDate).add(15, 'days')
    const startCutoff2Timestamp = moment(startCutoff2).valueOf()
    const endCutoff2 = moment(startDate).endOf('month')

    arrayForWrite.push([i, startCutoff1Timestamp, `${startCutoff1.format(format)} - ${endCutoff1.format(format)}`], [i + 1, startCutoff2Timestamp, `${startCutoff2.format(format)} - ${endCutoff2.format(format)}`])

    startDate = startDate.add(1, 'month')
  }
  sheet.clear()
  sheet.getRange(1, 1, arrayForWrite.length, arrayForWrite[0].length).setValues(arrayForWrite)
  Logger.log('Cutoffs created')

}

function uploadToDatabaseCutoffs() {
  Logger.log('Uploading cutoffs...')
  const statement = 'REPLACE INTO game_cutoffs (id, timestamp, name) VALUES (?, ?, ?)'
  uploadToDatabase(sheet, statement)
  Logger.log('Cutoffs uploaded')
}

function getCutoffs() {
  Logger.log('Fetching cutoffs...')
  let connection
  const arrayForWrite = []
  const now = moment().valueOf()
  try {
    connection = connectToSql();
    connection.setAutoCommit(false);
    const stmt = connection.prepareStatement(`SELECT * FROM game_cutoffs WHERE timestamp <= ${now} ORDER BY id DESC;`)

    const result = stmt.executeQuery()
    while (result.next()) {
      const id = result.getInt('id')
      const timestamp = parseInt(result.getBigDecimal('timestamp').toSource())
      const name = result.getString('name')
      arrayForWrite.push([name, id, timestamp])
    }
    if (!spreadsheetCutoffs.getSheetByName(cutoffSelectorSheetName)) {
      spreadsheetCutoffs.insertSheet(cutoffSelectorSheetName)
    }
    cutoffSelectorSheet.clear()
    cutoffSelectorSheet.getRange(1, 1, arrayForWrite.length, arrayForWrite[0].length).setValues(arrayForWrite)

    stmt.close()
    connection.commit()
    Logger.log('Cutoffs recieved')
  }
  catch (e) {
    if (connection) {
      connection.rollback()
    }
    Logger.log('Error: ' + e.message)
  }
  finally {
    if (connection) {
      connection.close()
    }
  }
}