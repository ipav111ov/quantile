function createPlayingLeadersList() {
  const values = CONSTANTS.speadsheetControlPanel.getSheetByName('Playing Teams').getDataRange().getValues().slice(1)
  const arrayForWrite = [['leader', 'leader name', 'points']]

  for (const row of values) {
    const leader = row[0]
    const leaderName = row[1]
    const points = ''
    arrayForWrite.push([leader, leaderName, points])
  }
  return arrayForWrite
}

function outputPlayingLeadersList() {
  const arrayForWrite = createPlayingLeadersList()
  const sheetName = 'Trophy Points'
  const ss = CONSTANTS.speadsheetControlPanel
  pasteToSheet(arrayForWrite, sheetName, ss)
}

function getTrophyPoints() {
  const sheetName = 'Trophy Points'
  const ss = CONSTANTS.speadsheetControlPanel
  const values = ss.getSheetByName(sheetName).getDataRange().getValues().slice(1)
  const leaders = {}
  const indexes = {
    uid: 0,
    leaderName: 1,
    points: 2
  }
  for (const row of values) {
    leaders[row[indexes.uid]] = row[indexes.points]
  }
  return leaders
}

function createTrophyPointsForDatabase() {
  const trophyPoints = getTrophyPoints();
  const teams = createTeams()
  const playingTeams = getPlayingTeams()
  const arrayForWrite = [['cutoff_id', 'short_uid', 'points', 'name', 'source']]
  const cutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D33').getValue()
  if (cutoffId) {
    for (const teamAsLeaderUid in teams) {
      if (playingTeams[teamAsLeaderUid]) {
        for (const memberAsObject in teams[teamAsLeaderUid].members) {
          const memberShortUid = teams[teamAsLeaderUid].members[memberAsObject].shortUid
          const points = trophyPoints[teamAsLeaderUid] || 0
          const name = 'Points for next play-off'
          const source = 'Trophy points Control Panel'
          arrayForWrite.push([cutoffId, memberShortUid, points, name, source])
        }
      }
    }
  }
  else {
    Browser.msgBox('Выбирите cutoff для дополнительных очков')
  }
  return arrayForWrite
}

function outputTrophyPoints() {
  const arrayForWrite = createTrophyPointsForDatabase()
  const sheetName = 'Trophy Points For Database'
  const ss = CONSTANTS.speadsheetControlPanel
  pasteToSheet(arrayForWrite, sheetName, ss)
}

function uploadToDatabaseTrophyPoints() {
  const sheet = CONSTANTS.speadsheetControlPanel.getSheetByName('Trophy Points For Database')
  const statement = 'REPLACE INTO game_extras (cutoff_id, short_uid, points, name, source) VALUES (?,?,?,?,?)'
  uploadToDatabase(sheet, statement)
  Browser.msgBox('Trophy Очки загружены в БД')
  outputTrophyPoints()
}

function deleteLeaderPointsForCutoff() {
  const cutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D33').getValue()
  const table = 'game_extras'
  const query = `DELETE FROM ${table} WHERE cutoff_id = ${cutoffId} AND source = Trophy points Control Panel;`
  deleteFromDatabase(query)
  Browser.msgBox('Trophy очки за выбранный катофф удалены из БД')
}