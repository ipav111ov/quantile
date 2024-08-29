const cutoffSelectorSheetName = 'cutoffSelector'
const spreadsheetCutoffs = CONSTANTS.speadsheetControlPanel
const sheet = spreadsheetCutoffs.getSheetByName('CutoffsForDatabase')
const cutoffSelectorSheet = spreadsheetCutoffs.getSheetByName(cutoffSelectorSheetName)

function createCutoffs() {
  Logger.log('Creating cutoffs...')
  const arrayForWrite = [['id', 'timestamp', 'name']]
  let startDate = moment().month('June').startOf('month')
  const format = 'DD MMM YYYY'

  for (let i = 1; i <= 30; i = i + 2) {
    const startCutoff1 = moment(startDate).format(format)
    const startCutoff1Timestamp = moment(startCutoff1).valueOf()
    const endCutoff1 = moment(startDate).add(14, 'days').format(format)

    const startCutoff2 = moment(startDate).add(15, 'days').format(format)
    const startCutoff2Timestamp = moment(startCutoff2).valueOf()
    const endCutoff2 = moment(startDate).endOf('month').format(format)

    arrayForWrite.push([i, startCutoff1Timestamp, `${startCutoff1} - ${endCutoff1}`], [i + 1, startCutoff2Timestamp, `${startCutoff2} - ${endCutoff2}`])

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
    const stmt = connection.prepareStatement(`SELECT * FROM game_cutoffs WHERE timestamp <= ${now} ORDER BY id DESC LIMIT 5;`)

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