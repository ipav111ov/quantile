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

