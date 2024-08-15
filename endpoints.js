function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
}

function doPost(e) {

}



function sendJson(json) {
  const url = 'https://docusketch.shop/wp-json/ds-shop/record-gamification-data/';

  Logger.log('fetching data now...');

  const key = PropertiesService.getScriptProperties().getProperty('key')

  try {
    let options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': json,
      'headers': { 'auth': key },
      'muteHttpExceptions': true
    };

    let response = UrlFetchApp.fetch(url, options);
    let responseCode = response.getResponseCode();
    let responseBody = response.getContentText();

    if (responseCode >= 200 && responseCode < 300) {
      let data = JSON.parse(responseBody);
      Logger.log(data);

      // Example: Do something with the response data
      if (data.status === 'success') {
        Logger.log(data.message);
      } else {
        Logger.log('API call failed');
      }
    } else {
      throw new Error('Not ok ' + responseBody);
    }
  } catch (error) {
    Logger.log('There has been a problem with your fetch operation: ' + error);
  }
}




function connectToSql() {
  // const url = PropertiesService.getScriptProperties().getProperty('url');
  // const user = PropertiesService.getScriptProperties().getProperty('user');
  // const password = PropertiesService.getScriptProperties().getProperty('pass');
  const url = 'jdbc:mysql://3kw.5b2.mytemp.website:3306/i9931417_bkc31'
  const user = 'testI'
  const password = '#2TvQfGB*4oD'


  try {
    const connection = Jdbc.getConnection(url, user, password);
    Logger.log('Connected to database');
    return connection;
  } catch (e) {
    Logger.log('Error connecting: ' + e.message);
  };
};


function addStatement(stmt, row) {
  stmt.setInt(1, row[0]);
  stmt.setInt(2, row[1]);
  stmt.setString(3, row[2]);
  stmt.setInt(4, row[3]);
  stmt.setString(5, row[4]);
  stmt.setString(6, row[5]);
  stmt.setString(7, row[6]);
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


function uploadDataToDb() {
  const batchSize = 100;
  let conn;
  try {
    conn = connectToSql();
    conn.setAutoCommit(false);

    const sheetName = 'Teams'
    const sheet = ss.getSheetByName(sheetName);

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
      const stmt = conn.prepareStatement('INSERT INTO teams (member_short_uid, manager_short_uid, manager_role, team_uid, manager_email, division, leader_name) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const logStmt = (new Date() - start) / 1000;

      while (batchSizeCount <= batchSize && batchSizeCount < data.length) {

        start = new Date()
        addStatement(stmt, data[batchSizeCount]);
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
        sheetToLog.appendRow([logUpload])
        Logger.log(`${dataIndex} rows uploaded to Database`);
      }

      else {
        start = new Date()
        sheet.getRange(2, 1, data.length, lastColumn).clear();
        const logDelete = (new Date() - start) / 1000;
        const logUpload = (new Date() - startBatch) / 1000;
        sheetToLog.appendRow([logUpload])
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
