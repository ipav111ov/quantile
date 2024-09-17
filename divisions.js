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
  let arrayForWrite = []
  const header = [['long_uid', 'leader_name', 'cutoff_id', 'avg_points', 'division', 'place', 'previous_place', 'difference', 'division_place', 'division_previous_place', 'division_difference', 'is_playing']]
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
  array = modifyPlaces(array, playingTeams, indexes, 'generalRank')
  const divisions = {}
  for (const row of array) {
    if (!divisions[row[indexes.division]]) {
      divisions[row[indexes.division]] = []
    }
    divisions[row[indexes.division]].push(row)
  }
  for (const division in divisions) {
    arrayForWrite.push(modifyPlaces(divisions[division], playingTeams, indexes, ''))
  }
  arrayForWrite = arrayForWrite.flat(1)
  const arrayForWriteFinal = [...header, ...arrayForWrite]
  return arrayForWriteFinal
}

function modifyPlaces(array, playingTeams, indexes, generalRank) {
  let indexPlace, indexPreviousPlace, indexDifference
  if (generalRank) {
    indexPlace = indexes.place
    indexPreviousPlace = indexes.previousPlace
    indexDifference = indexes.difference
  }
  else {
    indexPlace = indexes.divisionPlace
    indexPreviousPlace = indexes.divisionPreviousPlace
    indexDifference = indexes.divisionDifference
  }
  const arrayForWrite = []
  const notPlayingTeams = []
  let place = 1
  for (const row of array) {
    const longUid = row[indexes.longUid]
    if (playingTeams[longUid]) {
      row[indexPlace] = place
      row[indexDifference] = row[indexPreviousPlace] ? row[indexPreviousPlace] - row[indexPlace] : 0
      if (!generalRank) {
        row.push(1) // isPlaying
      }
      arrayForWrite.push(row)
      place++
    }
    else {
      row[indexPlace] = -1
      row[indexDifference] = 0
      if (!generalRank) {
        row.push(0) // isPlaying
      }
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
  const currentCutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D6').getValue()
  const previousCutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D21').getValue()
  if (!currentCutoffId || !previousCutoffId) {
    Browser.msgBox("Выбирите cutoff")
  }
  else {
    const arrayForWrite = [['long_uid', 'leader_name', 'cutoff_id', 'avg_points', 'division', 'place', 'previous_place', 'difference', 'division_place', 'division_previous_place', 'division_difference']]
    try {
      connection = connectToSql()
      connection.setAutoCommit(false)
      const stmt = connection.prepareStatement(`CALL getDivisions(?,?)`)
      stmt.setInt(1, currentCutoffId)
      stmt.setInt(2, previousCutoffId)

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
  const statement = 'REPLACE INTO game_divisions (long_uid, leader_name, cutoff_id, average_points, division, place, previous_place, difference, division_place, division_previous_place, division_difference, is_playing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)'
  uploadToDatabase(divisionsSheet, statement)
  Logger.log('Divisions Uploaded')
  Browser.msgBox('Дивизионы загружены в БД')
  outputDivisions()
}


function deleteDivisionsForCutoff() {
  const cutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D6').getValue()
  const table = 'game_divisions'
  const query = `DELETE FROM ${table} WHERE cutoff_id = ${cutoffId};`
  deleteFromDatabase(query)
  Browser.msgBox('Дивизионая таблица за выбранный катофф удалена из БД')
}