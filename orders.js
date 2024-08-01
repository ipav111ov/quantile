function getOrders(values) {
  values.sort((a, b) => new Date(a[0]) - new Date(b[0]))
  const orders = {}
  for (let indexRow in values) {
    const row = values[indexRow];
    const date = row[indexDate];
    const orderId = row[indexOrderId];
    const platform = row[indexPlatform];
    const creator = row[indexCreator];
    const creatorUid = row[indexCreatorUID]
    const recipients = row[indexRecipients];
    const recipientsUid = row[indexRecipientsUID];
    const type = row[indexType];
    const mark = row[indexMark];
    const square = row[indexSquare];
    const cameras = row[indexCameras];
    const st = row[indexSpentTime];
    const reviewST = row[indexReviewSpentTime];
    const recipientsArr = recipients ? recipients.split(',') : [];
    const recipientsArrUid = recipientsUid ? recipientsUid.split(',') : [];
    const isConverter = row[indexConverter];

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
          if (oldOrder[indexCreatorUID] != oldOrder[indexRecipientsUID]) {
            oldOrder[indexMark] = 0

            const oldOrderRecipientsUidArray = oldOrder[indexRecipientsUID].split(',')
            const newOrderRecipientsUidArray = newOrder[indexRecipientsUID].split(',')
            let mergedArrayUid = [... new Set([...oldOrderRecipientsUidArray, ...newOrderRecipientsUidArray])].filter(a => a != '')
            let mergedStringUid
            if (mergedArrayUid.length == 1) {
              mergedStringUid = mergedArrayUid.join('')
            }
            else {
              mergedStringUid = mergedArrayUid.join(',')
            }

            newOrder[indexRecipientsUID] = mergedStringUid
            oldOrder[indexRecipientsUID] = '' // don't touch

            const oldOrderRecipientsArray = oldOrder[indexRecipients].split(',')
            const newOrderRecipientsArray = newOrder[indexRecipients].split(',')
            let mergedArray = [... new Set([...oldOrderRecipientsArray, ...newOrderRecipientsArray])].filter(a => a != '')
            let mergedString
            if (mergedArray.length == 1) {
              mergedString = mergedArray.join('')
            }
            else {
              mergedString = mergedArray.join(',')
            }

            newOrder[indexRecipients] = mergedString
            oldOrder[indexRecipients] = '' // don't touch
            if (oldOrder[indexSpentTime] && !newOrder[indexSpentTime]) {
              newOrder[indexSpentTime] = oldOrder[indexSpentTime]
              oldOrder[indexSpentTime] = 0
            } else {
              oldOrder[indexSpentTime] = 0
            }
          }
          else {
            oldOrder[indexCreator] = ''
            oldOrder[indexCreatorUID] = ''
          }

          //spentTime все случаи

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

