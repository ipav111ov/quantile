function uploadToDatabaseTeams() {
  const teamsSheetName = 'TeamsForDatabase'
  const sheet = CONSTANTS.spredsheetTeams.getSheetByName(teamsSheetName)
  const statement  = 'INSERT INTO game_teams (member_short_uid, manager_short_uid, manager_role, team_uid, leader_name,division) VALUES (?, ?, ?, ?, ?, ?)'
  uploadToDatabase(sheet, statement)
}
