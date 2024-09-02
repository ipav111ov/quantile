const divisionsSheetName = 'Divisions'
const spreadsheetTeams = CONSTANTS.speadsheetControlPanel
const divisionsSheet = spreadsheetTeams.getSheetByName(divisionsSheetName)

function getPlayingTeams() {
  const values = CONSTANTS.speadsheetControlPanel.getSheetByName('Playing Teams').getDataRange().getValues().slice(1)
  const playingTeams = {}
  for (const row of values) {
    playingTeams[row[0]] = true
  }
  return playingTeams
}


function getDivisions() {
  Logger.log('Creating divisions...')
  let connection
  const current_period = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D6').getValue()
  const previous_period = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D21').getValue()
  if (!current_period || !previous_period){
    Browser.msgBox("Выбирите предыдущий cutoff")
  }
  const arrayForWrite = [['long_uid', 'leader_name', 'period', 'avg_points', 'division', 'place', 'previous_place', 'difference', 'is_playing']]
  const playingTeams = getPlayingTeams()
  try {
    connection = connectToSql()
    connection.setAutoCommit(false)
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
      let isPlaying
      if (playingTeams[long_uid]) {
        isPlaying = 1
      }
      else {
        isPlaying = 0
      }
      arrayForWrite.push([long_uid, leader_name, period_id, avg_points, division, place, previous_place, difference, isPlaying])
    }

    stmt.close()
    connection.commit()
    Logger.log('Divisions created')
    return arrayForWrite
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

function outputDivisions() {
  const arrayForWrite = getDivisions()
  const sheetName = 'Divisions'
  const ss = CONSTANTS.speadsheetControlPanel
  pasteToSheet(arrayForWrite, sheetName, ss)
}

function uploadToDatabaseDivisions() {
  Logger.log('Uploading divisions...')
  const statement = 'INSERT INTO game_divisions (long_uid, leader_name, cutoff_id, average_points,division, place, previous_place, difference, is_playing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  uploadToDatabase(divisionsSheet, statement)
  Logger.log('Divisions Uploaded')
}
