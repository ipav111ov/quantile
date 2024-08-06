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

          mergeRecipientsProcedure(oldOrder, newOrder, 'uid', orders, order, fpEsx, i)
          i = mergeRecipientsProcedure(oldOrder, newOrder, '', orders, order, fpEsx, i)
          if (i === 0) {
            continue
          }
        }
      }
    }
  }
  return orders
}

function mergeRecipientsProcedure(oldOrder, newOrder, type, orders, order, fpEsx, i) {
  let recipients, creator
  if (type === 'uid') {
    recipients = CONSTANTS.indexes.indexRecipientsUID
    creator = CONSTANTS.indexes.indexCreatorUID
  }
  else {
    recipients = CONSTANTS.indexes.indexRecipients
    creator = CONSTANTS.indexes.indexCreator
  }
  const oldOrderRecipientsArray = oldOrder[recipients].split(',')
  const newOrderRecipientsArray = newOrder[recipients].split(',')

  //mark
  oldOrder[CONSTANTS.indexes.indexMark] = 0

  //если креатор содержится в реципиентах
  if (oldOrderRecipientsArray.includes(oldOrder[creator])) {
    // если реципиент 1 => авторевью
    if (oldOrderRecipientsArray.length === 1) {
      // содержится ли креатор в новом ордере 1 или больше т.е проверка на дублирование авторевью
      if (newOrderRecipientsArray.includes(oldOrder[creator])) {
        if (newOrderRecipientsArray.length !== 1) {
          newOrder[recipients] = mergeString(oldOrderRecipientsArray, newOrderRecipientsArray)
        }
      }
    }
    // если кто-то рисовал , а после пришел другой с авторевью
    else {
      newOrder[recipients] = mergeString(oldOrderRecipientsArray, newOrderRecipientsArray)

      newOrder[CONSTANTS.indexes.indexSpentTime] += oldOrder[CONSTANTS.indexes.indexSpentTime]
    }
    delete orders[order][fpEsx][oldOrder[CONSTANTS.indexes.indexDate]]
    i = 0
    return i
  }
  // если креатор не содержится в реципиентах
  else {
    // суммировать время только в случе наличия реципиентов
    if (oldOrder[recipients]) {
      newOrder[CONSTANTS.indexes.indexSpentTime] += oldOrder[CONSTANTS.indexes.indexSpentTime]
      oldOrder[CONSTANTS.indexes.indexSpentTime] = 0

      newOrder[recipients] = mergeString(oldOrderRecipientsArray, newOrderRecipientsArray)
      oldOrder[recipients] = ''
    }
  }
  i++
  return i
}


function mergeString(oldArray, newArray) {
  let mergedArray = [... new Set([...oldArray, ...newArray])].filter(a => a != '')
  let mergedString
  if (mergedArray.length == 1) {
    mergedString = mergedArray.join('')
  }
  else {
    mergedString = mergedArray.join(',')
  }
  return mergedString
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

