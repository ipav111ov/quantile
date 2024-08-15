  const memebersSpredsheet = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1xclRts3VlBRplyyr855yhqwntD-OEwOfqmjg6cscjg8/edit?gid=296050003#gid=296050003')
  const membersSheet = memebersSpredsheet.getSheetByName('users')
  const membersValues = membersSheet.getDataRange().getValues().slice(1)


function members() {
  const indexes = {
    memberLongUid: 0,
    firstName: 1,
    lastName: 2,
    fullName: 3,
    corporateEmail: 4,
    personalEmail: 5,
    country: 6,
  }
  for (const row of membersValues) {
    row.push(AnotherFunctions.getShortUid(row[indexes.memberLongUid]))
  }
  membersSheet.getRange(2, 1, membersValues.length, membersValues[0].length).setValues(membersValues)
}


function addStatementMembers(stmt, row) {
  stmt.setInt(1, row[0]);
  stmt.setString(2, row[1]);
  stmt.setString(3, row[2]);
  stmt.setString(4, row[3]);
  stmt.setString(5, row[4]);
  stmt.setString(6, row[5]);
  stmt.setString(7, row[6]);
  stmt.addBatch();
};

function uploadDataToDbMembers() {
  const batchSize = 100
  let conn
  try {
    conn = connectToSql()
    conn.setAutoCommit(false)

    const sheetName = 'users'
    const sheet = membersSheet;

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
      const stmt = conn.prepareStatement('INSERT INTO game_members (short_uid, first_name, last_name, corporate_email, personal_email, country, long_uid) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const logStmt = (new Date() - start) / 1000;

      while (batchSizeCount <= batchSize && batchSizeCount < data.length) {

        start = new Date()
        addStatementMembers(stmt, data[batchSizeCount]);
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