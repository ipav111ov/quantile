function createTeams() {
  Logger.log('Creating teams...')
  const sheetTeamsInfo = CONSTANTS.speadsheetControlPanel.getSheetByName('Teams info')
  const valuesTeams = sheetTeamsInfo.getDataRange().getValues().slice(1)
  let valuesMembers = CONSTANTS.speadsheetControlPanel.getSheetByName('Copy of membersForDatabase').getDataRange().getValues().slice(1)
  const membersEmails = {}
  for (const row of valuesMembers) {
    membersEmails[row[0]] = row[2]
  }

  const columns = {
    leaderName: 0,
    leaderUid: 1,
    assistName: 2,
    assistUid: 3,
    memberName: 4,
    memberUid: 5,
    divisionName: 6,
    managerEmail: 7,
  }
  const teams = {}

  let currentLeaderUid = "";

  for (const row of valuesTeams) {
    if (row[columns.leaderName] === 'Total' || row[columns.leaderName] === 'Total Included') {
      continue
    };
    if (row[columns.leaderUid]) {
      const leaderUid = row[columns.leaderUid]
      currentLeaderUid = leaderUid.trim();
      teams[currentLeaderUid] = {
        leaderUid: currentLeaderUid,
        leaderName: row[columns.leaderName],
        assistUid: row[columns.assistUid],
        assistName: row[columns.assistName],
        members: {},
        division: row[columns.divisionName],
      }
    };
    if (row[columns.memberUid]) {
      const memberUid = row[columns.memberUid].trim()
      teams[currentLeaderUid].members[memberUid] = {
        name: row[columns.memberName],
        shortUid: AnotherFunctions.getShortUid(memberUid),
        longUid: memberUid,
      }
    }
  }
  return teams
}

function prepareTeamsForDatabase() {
  const teams = createTeams()
  const arrayForWrite = [['memberShortUid', 'managerUid', 'managerRole', 'teamUid', 'division', 'leaderName', 'managerEmail']]
  for (const teamAsLeaderUid in teams) {
    const leaderShortUid = AnotherFunctions.getShortUid(teams[teamAsLeaderUid].leaderUid)
    const assistShortUid = AnotherFunctions.getShortUid(teams[teamAsLeaderUid].assistUid)
    const managerArray = [leaderShortUid, assistShortUid]
    for (const manager of managerArray) {
      if (manager) {
        for (const memberAsObject in teams[teamAsLeaderUid].members) {
          const memberShortUid = teams[teamAsLeaderUid].members[memberAsObject].shortUid
          const managerUid = manager
          const managerRole = manager === leaderShortUid ? 'leader' : 'assist'
          const teamUid = leaderShortUid
          const managerEmail = membersEmails[managerUid]
          const division = teams[teamAsLeaderUid].division
          const leaderName = teams[teamAsLeaderUid].leaderName
          arrayForWrite.push([memberShortUid, managerUid, managerRole, teamUid, leaderName, division, managerEmail])
        }
      }
    }
  }
  return arrayForWrite
}

function outputTeams() {
  const arrayForWrite = prepareTeamsForDatabase()
  const sheetName = 'TeamsForDatabase'
  const ss = CONSTANTS.speadsheetControlPanel
  pasteToSheet(arrayForWrite, sheetName, ss)
}

function uploadToDatabaseTeams() {
  Logger.log('Uploading teams to database...')
  const sheet = CONSTANTS.speadsheetControlPanel.getSheetByName('TeamsForDatabase')
  const statement = 'REPLACE INTO game_teams (member_short_uid, manager_short_uid, manager_role, team_uid,leader_name,division, manager_email) VALUES (?, ?, ?, ?, ?, ?, ?)'
  uploadToDatabase(sheet, statement)
  Logger.log('Teams uploaded')
}
