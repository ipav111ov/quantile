function getOrders(values) {
  values.sort((a, b) => new Date(a[0]) - new Date(b[0]))
  const orders = {}
  for (let indexRow in values) {
    const row = values[indexRow];
    const date = row[CONSTANTS.indexes.indexDate];
    const orderId = row[CONSTANTS.indexes.indexOrderId];

    if (!excludeUid(row)) {

      row[CONSTANTS.indexes.indexMark] = parseInt(row[CONSTANTS.indexes.indexMark])
      row[CONSTANTS.indexes.indexSquare] = parseFloat(row[CONSTANTS.indexes.indexSquare])
      row[CONSTANTS.indexes.indexCameras] = parseInt(row[CONSTANTS.indexes.indexCameras])
      row[CONSTANTS.indexes.indexSpentTime] = parseInt(row[CONSTANTS.indexes.indexSpentTime])
      row[CONSTANTS.indexes.indexReviewSpentTime] = parseInt(row[CONSTANTS.indexes.indexReviewSpentTime])
      row[CONSTANTS.indexes.indexConverter] = parseInt(row[CONSTANTS.indexes.indexConverter])

      const type = row[CONSTANTS.indexes.indexType]


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
  }
  return orders
}

function excludeUid(row) {
  const excludedUidObject = {
    '12312': true,
    '12312': true,
    '12312': true,
    '12312': true,
  }

  const creatorUid = row[CONSTANTS.indexes.indexCreatorUID]
  const recipientsUidArray = row[CONSTANTS.indexes.indexRecipientsUID].split(',')

  if (!excludedUidObject[creatorUid]) {
    const found = recipientsUidArray.find(uid => excludeUid[uid] != true)
    if (!found) {
      return false
    }
  }
  return true
}

function filterOrders(orders) {
  for (const order in orders) {
    for (const fpEsx in orders[order]) {
      if (Object.keys(orders[order][fpEsx].length > 1)) {
        let i = 0

        while (i < Object.keys(orders[order][fpEsx]).length - 1) {
          const oldOrder = Object.values(orders[order][fpEsx])[i]
          const newOrder = Object.values(orders[order][fpEsx])[i + 1]


          mergeOrdersProcedure(oldOrder, newOrder, 'uid', orders, order, fpEsx, i)
          i = mergeOrdersProcedure(oldOrder, newOrder, '', orders, order, fpEsx, i)
          if (i === 0) {
            continue
          }
        }
      }
    }
  }
  return orders
}

function mergeOrdersProcedure(oldOrder, newOrder, type, orders, order, fpEsx, i) {
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

  if (type) {
    newOrder[recipients] = mergeString(oldOrderRecipientsArray, newOrderRecipientsArray)
  }
  else {
    // старый ордер когда реципиентов много
    if (oldOrderRecipientsArray.length > 1) {
      // новый ордер нет реципиентов
      if (newOrderRecipientsArray.length == 0) {
        newOrder[CONSTANTS.indexes.indexSpentTime] += oldOrder[CONSTANTS.indexes.indexSpentTime]
      }
      // новый ордер есть 1 реципиент
      else if (newOrderRecipientsArray.length == 1) {
        if (oldOrderRecipientsArray.includes(newOrderRecipientsArray[0])) {
          newOrder[CONSTANTS.indexes.indexSpentTime] = oldOrder[CONSTANTS.indexes.indexSpentTime]
        } else {
          newOrder[CONSTANTS.indexes.indexSpentTime] += oldOrder[CONSTANTS.indexes.indexSpentTime]
        }
      }
      // новый ордер реципиентов от 2 
      else if (newOrderRecipientsArray.length > 1) {
        if (!AnotherFunctions.arraysEqual(newOrderRecipientsArray, oldOrderRecipientsArray)) {
          newOrder[CONSTANTS.indexes.indexSpentTime] += oldOrder[CONSTANTS.indexes.indexSpentTime]
        }
      }
    }

    // старый ордер когда реципиент 1              
    else if (oldOrderRecipientsArray.length = 1) {
      // новый ордер
      if (!newOrderRecipientsArray.includes(oldOrderRecipientsArray[0])) {
        newOrder[CONSTANTS.indexes.indexSpentTime] += oldOrder[CONSTANTS.indexes.indexSpentTime]
      }
      if (oldOrderRecipientsArray[0] == oldOrder[creator]) {
        oldOrder[CONSTANTS.indexes.indexReviewSpentTime] = 0
      }
    }
    newOrder[recipients] = mergeString(oldOrderRecipientsArray, newOrderRecipientsArray)

    oldOrder[recipients] = ''
    oldOrder[CONSTANTS.indexes.indexSpentTime] = 0

    //mark
    oldOrder[CONSTANTS.indexes.indexMark] = 0

    if (!oldOrder[CONSTANTS.indexes.indexReviewSpentTime]) {
      delete orders[order][fpEsx][oldOrder[CONSTANTS.indexes.indexDate]]
      i = 0
      return i
    }
    i++
    return i
  }
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

