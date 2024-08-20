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
  // const url = PropertiesService.getScriptProperties().getProperty('url')
  // const user = PropertiesService.getScriptProperties().getProperty('user')
  // const password = PropertiesService.getScriptProperties().getProperty('pass')
  const url = 'jdbc:mysql://3kw.5b2.mytemp.website:3306/DocusketchShop'
  const user = 'Ilia'
  const password = '(V[X^y0@NIzh'


  try {
    const connection = Jdbc.getConnection(url, user, password)
    Logger.log('Connected to database')
    return connection
  } catch (e) {
    Logger.log('Error connecting: ' + e.message)
  }
}



