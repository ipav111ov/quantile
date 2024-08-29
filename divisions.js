const divisionsSheetName = 'Divisions'
const spreadsheetTeams = CONSTANTS.speadsheetControlPanel
const divisionsSheet = spreadsheetTeams.getSheetByName(divisionsSheetName)

function getDivisions() {
  Logger.log('Creating divisions...')
  let connection
  const current_period = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('B2').getValue()
  const previous_period = current_period - 1
  const arrayForWrite = [['long_uid', 'leader_name', 'period', 'avg_points', 'division', 'place', 'previous_place', 'difference']]
  try {
    connection = connectToSql();
    connection.setAutoCommit(false);
    const stmt = connection.prepareStatement(`CALL get_Divisions_Sandbox(?,?)`)
    stmt.setInt(1, current_period)
    stmt.setInt(2, previous_period)

    const result = stmt.executeQuery()
    while (result.next()) {
      const long_uid = result.getString('long_uid')
      const leader_name = result.getString('leader_name')
      const period_id = result.getInt('period')
      const avg_points = result.getDouble('average_points')
      const division = result.getString('division')
      const place = result.getInt('place')
      const previous_place = result.getInt('previous_place')
      const difference = result.getInt('difference')
      arrayForWrite.push([long_uid, leader_name, period_id, avg_points, division, place, previous_place, difference])
    }


    if (!spreadsheetTeams.getSheetByName(divisionsSheetName)) {
      spreadsheetTeams.insertSheet(divisionsSheetName)
    }
    const sheetTeams = spreadsheetTeams.getSheetByName(divisionsSheetName)
    sheetTeams.clear()
    sheetTeams.getRange(1, 1, arrayForWrite.length, arrayForWrite[0].length).setValues(arrayForWrite)

    stmt.close()
    connection.commit()
    Logger.log('Divisions created')

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

function uploadToDatabaseDivisions() {
  Logger.log('Uploading divisions...')
  const statement = 'INSERT INTO game_divisions (long_uid, leader_name, cutoff_id, average_points,division, place, previous_place, difference) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  uploadToDatabase(divisionsSheet, statement)
  Logger.log('Divisions Uploaded')
}
