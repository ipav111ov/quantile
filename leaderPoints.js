function getManagerPoints() {
  const leaderCoof = 1
  const assistCoof = .5
  const values = getDivisions()
  values.slice(1)
  const indexes = {
    longUid: 0,
    period: 2,
    avgPoints: 3,
  }
  const divisions = {}
  for (const row of values) {
    const longUid = row[indexes.longUid]
    const shortUid = AnotherFunctions.getShortUid(longUid)
    const period = row[indexes.period]
    const avgPoints = row[indexes.avgPoints]
    divisions[shortUid] = {
      cutoffId: period,
      longUid: longUid,
      points: avgPoints,
    }
  }
  const teams = createTeams()
  const arrayForWrite = [['cutoff_id', 'short_uid', 'points', 'name', 'source']]
  for (const teamAsLeaderUid in teams) {
    const leaderShortUid = AnotherFunctions.getShortUid(teams[teamAsLeaderUid].leaderUid)
    const assistShortUid = AnotherFunctions.getShortUid(teams[teamAsLeaderUid].assistUid)
    const managerArray = [leaderShortUid, assistShortUid]
    for (const manager of managerArray) {
      if (manager) {
        const cutoffId = divisions[leaderShortUid].cutoffId
        const points = manager === leaderShortUid ?
          divisions[leaderShortUid].points * leaderCoof :
          divisions[leaderShortUid].points * assistCoof
        const name = manager === leaderShortUid ? 'leader bonus' : 'assist bonus'
        const source = 'team manager points'
        arrayForWrite.push([cutoffId, manager, points, name, source])
      }
    }
  }
  return arrayForWrite
}

function outputManagerPoints() {
  const arrayForWrite = getManagerPoints()
  const sheetName = 'Team manager Points For Database'
  const ss = CONSTANTS.speadsheetControlPanel
  pasteToSheet(arrayForWrite, sheetName, ss)
}

function uploadToDatabaseManagerPoints() {
  const sheet = CONSTANTS.speadsheetControlPanel.getSheetByName('Team manager Points For Database')
  const statement = 'INSERT INTO game_extras (cutoff_id, short_uid, points, name, source) VALUES (?,?,?,?,?)'
  uploadToDatabase(sheet, statement)
}
