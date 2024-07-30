function getOrders(values) {
  values.sort((a, b) => new Date(a[0]) - new Date(b[0]))
  const orders = {}
  for (let indexRow in values) {
    const row = values[indexRow];
    const date = row[indexColumnDate_];
    const orderId = row[indexColumnOrderId_];
    const platform = row[indexColumnPlatform_];
    const creator = row[indexColumnCreator_];
    const creatorUid = row[indexColumnCreatorUID_]
    const recipients = row[indexColumnRecipients_];
    const recipientsUid = row[indexColumnRecipientsUID_];
    const type = row[indexColumnType_];
    const mark = row[indexColumnMark_];
    const square = row[indexColumnSquare_];
    const cameras = row[indexColumnCameras_];
    const st = row[indexColumnSpentTime_];
    const reviewST = row[indexColumnReviewSpentTime_];
    const recipientsArr = recipients ? recipients.split(',') : [];
    const recipientsArrUid = recipientsUid ? recipientsUid.split(',') : [];
    const isConverter = row[indexColumnConverter_];

    if (!orders[orderId]) {
      orders[orderId] = {}
    }
    if (!orders[orderId][type]) {
      orders[orderId][type] = {}
    }
    if (!orders[orderId][type][date]) {
      orders[orderId][type][date] = row
    }
    else {
      const oldDate = orders[orderId][type][date]
      const newDate = date

      if (new Date(newDate) - new Date(oldDate) >= 0) {
        orders[orderId][type][date] = row
      }

    }
  }
  return orders
}

function filterOrders(orders) {
  for (const order in orders) {
    if (order === 1853325){
      console.log('he')
    }
    for (const fpEsx in orders[order]) {
      if (Object.keys(orders[order][fpEsx].length > 1)) {
        let i = 0
        while (i < Object.keys(orders[order][fpEsx]).length - 1) {
          const oldOrder = Object.values(orders[order][fpEsx])[i]
          const newOrder = Object.values(orders[order][fpEsx])[i + 1]

          //mark все случаи
          oldOrder[indexColumnMark_] = 0

          //recipients все случаи
          oldOrder[indexColumnRecipients_] = '' // don't touch
          oldOrder[indexColumnRecipientsUID_] = '' // don't touch

          //spentTime все случаи
          oldOrder[indexColumnSpentTime_] = 0
          i++

        }
      }
    }
  }
  return orders
}


function createRecord_(date, orderId, platform, type, mark, square, cameras, st, reviewST, recipientBoolean, creatorBoolean, recipientArray, converterBoolean) {
  const result = {};
  result['date'] = date
  result['orderId'] = orderId;
  result['platform'] = platform;
  result['type'] = type;
  result['mark'] = mark;
  result['square'] = square;
  result['cameras'] = cameras;
  result['st'] = st;
  result['reviewST'] = reviewST;
  result['isRecipient'] = recipientBoolean;
  result['isCreator'] = creatorBoolean;
  result['recipientArray'] = recipientArray;
  result['isConverter'] = converterBoolean;
  return result;
}

