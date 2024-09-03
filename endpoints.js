function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
}

function doPost(e) {

}

function sendJson(json) {
  const url = 'https://docusketch.shop/wp-json/ds-shop/record-gamification-data/' // docusketchShop
  // const url = 'https://sandbox3.docusketch.shop/wp-json/ds-shop/record-gamification-data/' // sandbox3

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

    let response = UrlFetchApp.fetch(url, options)
    let responseCode = response.getResponseCode()
    let responseBody = response.getContentText()

    if (responseCode >= 200 && responseCode < 300) {
      let data = JSON.parse(responseBody)
      if (!data.status == 'success') {
        Logger.log('API call failed');
      }
      else {
        CONSTANTS.speadsheetControlPanel.getSheetByName('draw').clear()
        CONSTANTS.speadsheetControlPanel.getSheetByName('review').clear()
        Browser.msgBox('Метрики посчитаны и загружены в БД')
      }
    } else {
      throw new Error('Not ok ' + responseBody);
    }

  } catch (error) {
    Logger.log('There has been a problem with your fetch operation: ' + error)
  }
}

function connectToSql() {
  const url = PropertiesService.getScriptProperties().getProperty('url')
  const user = PropertiesService.getScriptProperties().getProperty('user')
  const password = PropertiesService.getScriptProperties().getProperty('password')

  try {
    const connection = Jdbc.getConnection(url, user, password)
    Logger.log('Connected to database')
    return connection
  } catch (e) {
    Logger.log('Error connecting: ' + e.message)
  }
}

function addBatch(stmt, row) {
  for (let i = 0; i < row.length; i++) {
    row[i] == 'number' ? stmt.setInt(i + 1, row[i]) : stmt.setString(i + 1, row[i])
  }
  stmt.addBatch()
}

function uploadToDatabase(sheet, statement) {
  const batchSize = 100
  let connection;
  try {
    connection = connectToSql();
    connection.setAutoCommit(false);

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
      const stmt = connection.prepareStatement(statement)
      const logStmt = (new Date() - start) / 1000;

      while (batchSizeCount <= batchSize && batchSizeCount < data.length) {

        start = new Date()
        addBatch(stmt, data[batchSizeCount]);
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
      connection.commit();
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

    Logger.log('Uploaded to Database');
  }
  catch (e) {
    if (connection) {
      connection.rollback();
    }
    Logger.log('Error: ' + e.message);
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

function pasteToSheet(arrayForWrite, sheetName, spreadsheet) {
  if (!spreadsheet.getSheetByName(sheetName)) {
    spreadsheet.insertSheet(sheetName)
  }
  const sheet = spreadsheet.getSheetByName(sheetName)
  sheet.clear()
  sheet.getRange(1, 1, arrayForWrite.length, arrayForWrite[0].length).setValues(arrayForWrite)
}
