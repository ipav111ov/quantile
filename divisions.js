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


function modifyDivisions(array) {
  const playingTeams = getPlayingTeams()
  array = array.slice(1)
  const header = ['long_uid', 'leader_name', 'cutoff_id', 'avg_points', 'division', 'place', 'previous_place', 'difference', 'division_place', 'division_previous_place', 'division_difference', 'is_playing']
  const arrayForWrite = []
  const arrayForWriteFinal = []
  const indexes = {
    longUid: 0,
    leaderName: 1,
    period: 2,
    avgPoints: 3,
    division: 4,
    place: 5,
    previousPlace: 6,
    difference: 7,
    divisionPlace: 8,
    divisionPreviousPlace: 9,
    divisionDifference: 10,
    isPlaying: 11,
  }
  const notPlayingTeams = []
  let place = 1
  for (const row of array) {
    const longUid = row[indexes.longUid]
    const previousPlace = row[indexes.previousPlace]
    if (playingTeams[longUid]) {
      row[indexes.place] = place
      row[indexes.difference] = previousPlace - row[indexes.place]
      arrayForWrite.push(row)
      place++
    }
    else {
      row[indexes.place] = -1
      row[indexes.difference] = 0

      notPlayingTeams.push(row)
    }
  }
  for (const row of notPlayingTeams) {
    arrayForWrite.push(row)
  }
  const divisions = {}
  for (const row of arrayForWrite) {
    if (!divisions[row[indexes.division]]) {
      divisions[row[indexes.division]] = []
    }
    divisions[row[indexes.division]].push(row)
  }
  for (const division in divisions) {
    arrayForWriteFinal.push(modifyPlaces(divisions[division], playingTeams, indexes))
  }
  return arrayForWriteFinal.flat(1)
}
function modifyPlaces(array, playingTeams, indexes) {
  const arrayForWrite = []
  const notPlayingTeams = []
  let place = 1
  for (const row of array) {
    const longUid = row[indexes.longUid]
    const previousPlace = row[indexes.divisionPreviousPlace]
    if (playingTeams[longUid]) {
      row[indexes.divisionPlace] = place
      row[indexes.division_difference] = previousPlace - row[indexes.divisionPlace]
      row.push(1) // isPlaying}
      arrayForWrite.push(row)
      place++
    }
    else {
      row[indexes.place] = -1
      row[indexes.difference] = 0

      row.push(0) // isPlaying
      notPlayingTeams.push(row)
    }
  }
  for (const row of notPlayingTeams) {
    arrayForWrite.push(row)
  }
  return arrayForWrite
}

function getDivisions() {
  Logger.log('Creating divisions...')
  let connection
  const current_period = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D6').getValue()
  const previous_period = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D21').getValue()
  if (!current_period || !previous_period) {
    Browser.msgBox("Выбирите cutoff")
  }
  const arrayForWrite = [['long_uid', 'leader_name', 'cutoff_id', 'avg_points', 'division', 'place', 'previous_place', 'difference', 'division_place', 'division_previous_place', 'division_difference']]
  try {
    connection = connectToSql()
    connection.setAutoCommit(false)
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
      const division_place = result.getInt('division_place')
      const division_previous_place = result.getInt('division_previous_place')
      const division_difference = result.getInt('division_difference')
      arrayForWrite.push([long_uid, leader_name, period_id, avg_points, division, place, previous_place, difference, division_place, division_previous_place, division_difference])
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
  let arrayForWrite = getDivisions()
  arrayForWrite = modifyDivisions(arrayForWrite)
  const sheetName = 'Divisions'
  const ss = CONSTANTS.speadsheetControlPanel
  pasteToSheet(arrayForWrite, sheetName, ss)
}

function uploadToDatabaseDivisions() {
  Logger.log('Uploading divisions...')
  const statement = 'REPLACE INTO game_divisions (long_uid, leader_name, cutoff_id, average_points,division, place, previous_place, difference, is_playing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  uploadToDatabase(divisionsSheet, statement)
  Logger.log('Divisions Uploaded')
  Browser.msgBox('Дивизионы загружены в БД')
}
