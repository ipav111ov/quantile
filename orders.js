function getOrders(values) {
  values.sort((a, b) => new Date(a[0]) - new Date(b[0]))
  const orders = {}
  for (let indexRow in values) {
    const row = values[indexRow];
    const date = row[CONSTANTS.indexes.indexDate];
    const orderId = row[CONSTANTS.indexes.indexOrderId];
    const platform = row[CONSTANTS.indexes.indexPlatform];
    const creator = row[CONSTANTS.indexes.indexCreator];
    const creatorUid = row[CONSTANTS.indexes.indexCreatorUID]
    const recipients = row[CONSTANTS.indexes.indexRecipients];
    const recipientsUid = row[CONSTANTS.indexes.indexRecipientsUID];
    const type = row[CONSTANTS.indexes.indexType];
    const mark = row[CONSTANTS.indexes.indexMark];
    const square = row[CONSTANTS.indexes.indexSquare];
    const cameras = row[CONSTANTS.indexes.indexCameras];
    const st = row[CONSTANTS.indexes.indexSpentTime];
    const reviewST = row[CONSTANTS.indexes.indexReviewSpentTime];
    const recipientsArr = recipients ? recipients.split(',') : [];
    const recipientsArrUid = recipientsUid ? recipientsUid.split(',') : [];
    const isConverter = row[CONSTANTS.indexes.indexConverter];

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
    for (const fpEsx in orders[order]) {
      if (Object.keys(orders[order][fpEsx].length > 1)) {
        let i = 0
        while (i < Object.keys(orders[order][fpEsx]).length - 1) {
          const oldOrder = Object.values(orders[order][fpEsx])[i]
          const newOrder = Object.values(orders[order][fpEsx])[i + 1]

          //mark все случаи

          //recipients нет авторевью
          if (oldOrder[CONSTANTS.indexes.indexCreatorUID] != oldOrder[CONSTANTS.indexes.indexRecipientsUID]) {
            oldOrder[CONSTANTS.indexes.indexMark] = 0

            const oldOrderRecipientsUidArray = oldOrder[CONSTANTS.indexes.indexRecipientsUID].split(',')
            const newOrderRecipientsUidArray = newOrder[CONSTANTS.indexes.indexRecipientsUID].split(',')
            let mergedArrayUid = [... new Set([...oldOrderRecipientsUidArray, ...newOrderRecipientsUidArray])].filter(a => a != '')
            let mergedStringUid
            if (mergedArrayUid.length == 1) {
              mergedStringUid = mergedArrayUid.join('')
            }
            else {
              mergedStringUid = mergedArrayUid.join(',')
            }

            newOrder[CONSTANTS.indexes.indexRecipientsUID] = mergedStringUid
            oldOrder[CONSTANTS.indexes.indexRecipientsUID] = '' // don't touch

            const oldOrderRecipientsArray = oldOrder[CONSTANTS.indexes.indexRecipients].split(',')
            const newOrderRecipientsArray = newOrder[CONSTANTS.indexes.indexRecipients].split(',')
            let mergedArray = [... new Set([...oldOrderRecipientsArray, ...newOrderRecipientsArray])].filter(a => a != '')
            let mergedString
            if (mergedArray.length == 1) {
              mergedString = mergedArray.join('')
            }
            else {
              mergedString = mergedArray.join(',')
            }

            newOrder[CONSTANTS.indexes.indexRecipients] = mergedString
            oldOrder[CONSTANTS.indexes.indexRecipients] = '' // don't touch
            if (oldOrder[CONSTANTS.indexes.indexSpentTime] && !newOrder[CONSTANTS.indexes.indexSpentTime]) {
              newOrder[CONSTANTS.indexes.indexSpentTime] = oldOrder[CONSTANTS.indexes.indexSpentTime]
              oldOrder[CONSTANTS.indexes.indexSpentTime] = 0
            } else {
              oldOrder[CONSTANTS.indexes.indexSpentTime] = 0
            }
          }
          else {
            oldOrder[CONSTANTS.indexes.indexCreator] = ''
            oldOrder[CONSTANTS.indexes.indexCreatorUID] = ''
          }

          //spentTime все случаи

          i++

        }
      }
    }
  }
  return orders
}


function createRecord(date, orderId, platform, type, mark, square, cameras, st, reviewST, recipientBoolean, creatorBoolean, recipientArray, converterBoolean) {
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

