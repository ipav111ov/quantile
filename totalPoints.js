function getTotalPointsForCutoffFromDatabase() {
  Logger.log('Getting total points...')
  let connection
  const currentCutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D33').getValue()
  if (!currentCutoffId) {
    Browser.msgBox("Выбирите cutoff")
  }
  else {
    const arrayForWrite = [['email', 'points', 'details']]
    try {
      connection = connectToSql()
      // connection.setAutoCommit(false)
      const stmt = connection.prepareStatement(`CALL get_total_points_for_cutoff(?)`)
      stmt.setInt(1, currentCutoffId)

      const result = stmt.executeQuery()
      while (result.next()) {
        const email = result.getString('email')
        const points = result.getFloat('total_points')
        const cutoffId = result.getInt('cutoff_id')
        const name = result.getString('name')
        arrayForWrite.push([email, points,name])
      }

      // stmt.close()
      // connection.commit()
      Logger.log('Total points calculated')
      return arrayForWrite
    }
    catch (e) {
      // if (connection) {
      //   connection.rollback()
      // }
      Logger.log('Error: ' + e.message)
    }
    finally {
      if (connection) {
        connection.close()
      }
    }
  }
}

function sendJsonTotalPointsForCutoff(values) {
  const arrayForWrite = []
  for (const row of values) {
    const obj = {
      email: row[0],
      points: row[1],
      details: row[3]
    }
    arrayForWrite.push(obj)
  }
  const json = JSON.stringify(arrayForWrite)
  const url = 'https://docusketch.shop/wp-json/ds-shop/mass-credit/'
  sendJson(json, url)
  Logger.log('json sended')
}
function sendJsonByBatches() {
  const batchSize = 1
  const sheet = CONSTANTS.speadsheetControlPanel.getSheetByName('Total Points')
  try {
    const lastRowTotal = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    let dataIndex = 0;
    Logger.log('Uploading data...')

    while (dataIndex < lastRowTotal) {
      let batchSizeCount = 0;

      const currentLastRow = sheet.getLastRow()

      let data;
      if (currentLastRow >= batchSize) {
        data = sheet.getRange((currentLastRow - batchSize) + 1, 1, batchSize, lastColumn).getValues();
      } else {
        data = sheet.getRange(2, 1, currentLastRow - 1, lastColumn).getValues();
        Logger.log('Last batch')
      }
      const json = JSON.stringify(prepareJson(data.reverse()))
      const url = 'https://docusketch.shop/wp-json/ds-shop/mass-credit/'
      Logger.log("ready to send")

      if (data.length >= batchSize) {
        sheet.getRange((currentLastRow - batchSize) + 1, 1, batchSize, lastColumn).clear()
      }
      else {
        sheet.getRange(2, 1, data.length, lastColumn).clear()
      }
      SpreadsheetApp.flush()
      sendJson(json, url)
      Logger.log("ok")

      while (batchSizeCount <= batchSize && batchSizeCount < data.length) {
        batchSizeCount++;
        dataIndex++;
      }
      Logger.log(data.at(0))
      Logger.log(data.at(-1))
      Logger.log(`${dataIndex} rows uploaded to Database`)
    }
    Logger.log('Uploaded to Database');
  }
  catch (e) {
    Logger.log('Error: ' + e.message);
  }
}

// function sendJsonTotalPointsForCutoff() {
//   const values = CONSTANTS.speadsheetControlPanel.getSheetByName('Total Points').getDataRange().getValues().slice(1)
//   const arrayForWrite = []
//   for (const row of values) {
//     const obj = {
//       email: row[0],
//       points: row[1],
//       details: row[3]
//     }
//     arrayForWrite.push(obj)
//   }
//   const json = JSON.stringify(arrayForWrite)
//   const url = 'https://docusketch.shop/wp-json/ds-shop/mass-credit/'
//   sendJson(json, url)
//   Logger.log('json sended')
// }

function outputTotalPointsForCutoff() {
  let arrayForWrite = getTotalPointsForCutoffFromDatabase()
  const sheetName = 'Total Points'
  const ss = CONSTANTS.speadsheetControlPanel
  pasteToSheet(arrayForWrite, sheetName, ss)
}