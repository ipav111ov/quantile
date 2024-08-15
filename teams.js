function addStatementTeams(stmt, row) {
  stmt.setInt(1, row[0]);
  stmt.setInt(2, row[1]);
  stmt.setString(3, row[2]);
  stmt.setInt(4, row[3]);
  stmt.setString(5, row[4]);
  stmt.setString(6, row[5]);
  stmt.addBatch();
};

function cleanFeedback_temp() {
  const msSqlToDelete =
    `
MERGE INTO feedback AS target
USING feedback_temp AS s
ON(target.uid_member = s.uid_member AND target.date_order = s.date_order AND target.id_order = s.id_order)
WHEN NOT MATCHED BY TARGET THEN
INSERT(uid_member, date_order, id_order, type_order, square, cameras, spent_time, mark, is_recipient, is_creator, is_shared, is_converter)
VALUES(s.uid_member, s.date_order, s.id_order, s.type_order, s.square, s.cameras, s.spent_time, s.mark, s.is_recipient, s.is_creator, s.is_shared, s.is_converter);
   
DELETE FROM feedback_temp
FROM feedback_temp JOIN feedback
ON feedback_temp.uid_member = feedback.uid_member
    AND feedback_temp.date_order = feedback.date_order
    AND feedback_temp.id_order = feedback.id_order; 
`

  const mySqlToDelete = `
REPLACE или IGNORE INTO feedback (uid_member, date_order, id_order, type_order, square, cameras, spent_time, mark, is_recipient, is_creator, is_shared, is_converter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`
  try {
    const conn = connectToSql();
    const stmt = conn.prepareStatement(msSqlToDelete)
    stmt.execute();
    Logger.log('feedback_temp cleaned')
  } catch (e) {
    Logger.log('Error' + e.message)
  }
}


function uploadDataToDbTeams() {
  const batchSize = 100;
  let conn;
  try {
    conn = connectToSql();
    conn.setAutoCommit(false);

    const sheetName = 'Teams'
    const sheet = CONSTANTS.spreadsheet.getSheetByName(sheetName);

    // const sheetToLog = ss.getSheetByName('batchSpeedLog');
    // sheetToLog.clear();

    const lastRowTotal = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    let dataIndex = 0;
    Logger.log('Uploading data...');

    while (dataIndex < lastRowTotal) {
      let batchSizeCount = 0;

      let startBatch = new Date()

      let start = new Date()
      const currentLastRow = sheet.getLastRow();
      const logCurrentLastRow = (new Date() - start) / 1000;

      let data;
      start = new Date()
      if (currentLastRow >= batchSize) {
        data = sheet.getRange((currentLastRow - batchSize) + 1, 1, batchSize, lastColumn).getValues();
      } else {
        data = sheet.getRange(2, 1, currentLastRow - 1, lastColumn).getValues();
        Logger.log('Last batch')
      }
      const logValues = (new Date() - start) / 1000;
      start = new Date()
      const stmt = conn.prepareStatement('INSERT INTO game_teams (member_short_uid, manager_short_uid, manager_role, team_uid, leader_name,division) VALUES (?, ?, ?, ?, ?, ?)');
      const logStmt = (new Date() - start) / 1000;

      while (batchSizeCount <= batchSize && batchSizeCount < data.length) {

        start = new Date()
        addStatementTeams(stmt, data[batchSizeCount]);
        const logAddStatement = (new Date() - start) / 1000;
        Logger.log(logAddStatement)

        batchSizeCount++;
        dataIndex++;
      }
      const logBatchTime = (new Date() - start) / 1000;


      start = new Date()
      stmt.executeBatch();
      const logExecute = (new Date() - start) / 1000;


      start = new Date()
      stmt.close();
      const logClose = (new Date() - start) / 1000;


      start = new Date()
      conn.commit();
      const logCommit = (new Date() - start) / 1000;



      if (data.length >= batchSize) {
        start = new Date()
        sheet.getRange((currentLastRow - batchSize) + 1, 1, batchSize, lastColumn).clear();
        const logDelete = (new Date() - start) / 1000;
        const logUpload = (new Date() - startBatch) / 1000;
        // sheetToLog.appendRow([logUpload])
        Logger.log(`${dataIndex} rows uploaded to Database`);
      }

      else {
        start = new Date()
        sheet.getRange(2, 1, data.length, lastColumn).clear();
        const logDelete = (new Date() - start) / 1000;
        const logUpload = (new Date() - startBatch) / 1000;
        // sheetToLog.appendRow([logUpload])
        Logger.log(`${dataIndex} rows uploaded to Database`);
      }
    }

    Logger.log('Feedback uploaded to Database');
  }
  catch (e) {
    if (conn) {
      conn.rollback();
    }
    Logger.log('Error: ' + e.message);
  } finally {
    if (conn) {
      conn.close();
    };
  };
};