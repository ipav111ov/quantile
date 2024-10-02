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
function modifyTotalPointsForCutoff(array) {
  const arrayForWrite = [['email', 'points', 'cutoff_id', 'details']]
  for (let i = 1; i < array.length; i++) {
    array[i].push('some details')
    const row = array[i]
    arrayForWrite.push(row)
  }
  return arrayForWrite
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