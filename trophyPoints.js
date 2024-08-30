function createLeaderList() {
  const leaders = createTeams()
  const arrayForWrite = [['leader', 'leader name', 'points']]

  for (const leaderAsUid in leaders) {
    const leader = leaders[leaderAsUid].leaderUid
    const leaderName = leaders[leaderAsUid].leaderName
    const points = ''
    arrayForWrite.push([leader, leaderName, points])
  }
  return arrayForWrite
}

function outputLeaderList() {
  const arrayForWrite = createLeaderList()
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
  const arrayForWrite = [['cutoff_id', 'short_uid', 'points', 'name', 'source']]
  const cutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('B5').getValue()

  for (const teamAsLeaderUid in teams) {
    for (const memberAsObject in teams[teamAsLeaderUid].members) {
      const memberShortUid = teams[teamAsLeaderUid].members[memberAsObject].shortUid
      const points = trophyPoints[teamAsLeaderUid]
      const name = 'next playoff'
      const source = 'trophy points'
      arrayForWrite.push([cutoffId, memberShortUid, points, name, source])
    }
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
  const statement = 'INSERT INTO game_extras (cutoff_id, short_uid, points, name, source) VALUES (?,?,?,?,?)'
  uploadToDatabase(sheet, statement)
}