function getDivisions() {
  let connection
  const current_period = 38
  const previous_period = 36
  const arrayForWrite = [['long_uid', 'leader_name', 'period', 'avg_points', 'division', 'place', 'previous_place', 'difference']]
  try {
    connection = connectToSql();
    connection.setAutoCommit(false);
    const stmt = connection.prepareStatement(`CALL getDivisions(?,?)`)
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

    const sheetNameTeams = 'Divisions'
    const spreadsheetTeams = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1bNNxTlfZbEwcz26y_In32__5kEE67Vibq5Vp4DIVfjc/edit?gid=550950070#gid=550950070')
    if (!spreadsheetTeams.getSheetByName(sheetNameTeams)) {
      spreadsheetTeams.insertSheet(sheetNameTeams)
    }
    const sheetTeams = spreadsheetTeams.getSheetByName(sheetNameTeams)
    sheetTeams.clear()
    sheetTeams.getRange(1, 1, arrayForWrite.length, arrayForWrite[0].length).setValues(arrayForWrite)

    stmt.close()
    connection.commit()
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