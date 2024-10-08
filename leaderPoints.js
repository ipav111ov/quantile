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
      longUid: longUid,
      points: avgPoints,
    }
  }
  const teams = createTeams()
  const arrayForWrite = [['cutoff_id', 'short_uid', 'points', 'name', 'source']]
  const cutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D33').getValue()
  for (const teamAsLeaderUid in teams) {
    const leaderShortUid = AnotherFunctions.getShortUid(teams[teamAsLeaderUid].leaderUid)
    const assistShortUid = AnotherFunctions.getShortUid(teams[teamAsLeaderUid].assistUid)
    const managerArray = [leaderShortUid, assistShortUid]
    for (const manager of managerArray) {
      if (manager) {
        const points = manager === leaderShortUid ?
          divisions[leaderShortUid].points * leaderCoof :
          divisions[leaderShortUid].points * assistCoof
        const name = manager === leaderShortUid ? 'Leader Bonus' : 'Assist Bonus'
        const source = 'Team manager points Control Panel'
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
  outputManagerPoints()
  const sheet = CONSTANTS.speadsheetControlPanel.getSheetByName('Team manager Points For Database')
  const statement = 'REPLACE INTO game_extras (cutoff_id, short_uid, points, name, source) VALUES (?,?,?,?,?)'
  uploadToDatabase(sheet, statement)
  Browser.msgBox('Очки для менеджеров команд загружены в БД')
  outputManagerPoints()
}

function deleteLeaderPointsForCutoff(){
    const cutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D33').getValue()
  const table = 'game_extras'
  const query = `DELETE FROM ${table} WHERE cutoff_id = ${cutoffId} AND source = Team manager points Control Panel;`
  deleteFromDatabase(query)
  Browser.msgBox('Очки менеджеров команд за выбранный катофф удалены из БД')
}
