function calculatePoints() {
  Logger.log('Calculating points...')
  const cutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D6').getValue()

  if (cutoffId) {
    const time = cutoffId
    const gamification = new Gamification(CONSTANTS.speadsheetControlPanel, time)
    const output = new Output(gamification, time)
    output.programs
    const url = 'https://docusketch.shop/wp-json/ds-shop/record-gamification-data/' // docusketchShop
    // const url = 'https://sandbox3.docusketch.shop/wp-json/ds-shop/record-gamification-data/' // sandbox3
    sendJson(gamification.json, url)
    Logger.log('Points calculated')
  }
  else {
    Browser.msgBox("Выбирите cutoff для points")
  }
}


class Gamification {
  constructor(spreadsheet, time) {
    this.spreadsheet = spreadsheet;
    this.orders = []
    this.time = time
    this.members = this.getCalculations(this.getMembers());
    this.weights = this.getWeights();
    this.arraysForQuantile = this.getArraysForQuantile()
    this.quantileAndPointsProcedure()
    this.json = this.json()
  }

  json() {
    const fileSets = {
      mimeType: 'application/json',
      name: moment().tz('Asia/Tbilisi').format('DD MMM YYYY HH:mm:ss')
    }
    const json = JSON.stringify(this.members)
    // const blob = Utilities.newBlob(json, 'application/json')
    // const file = Drive.Files.create(fileSets, blob)
    // sendJson(json)
    return json

  }

  getMembers() {

    const orders = filterOrders(getOrders(getValuesFromSS()));

    const members = {};
    for (const order in orders) {
      for (const fpEsx in orders[order]) {
        for (const orderInstance in orders[order][fpEsx]) {
          const feedback = {}
          const row = orders[order][fpEsx][orderInstance];
          const date = row[CONSTANTS.indexes.indexDate];
          const orderId = parseInt(row[CONSTANTS.indexes.indexOrderId]);
          const platform = row[CONSTANTS.indexes.indexPlatform];
          const creator = row[CONSTANTS.indexes.indexCreator];
          const creatorUid = row[CONSTANTS.indexes.indexCreatorUID]
          const recipients = row[CONSTANTS.indexes.indexRecipients];
          const recipientsUid = row[CONSTANTS.indexes.indexRecipientsUID];
          const type = row[CONSTANTS.indexes.indexType];
          const mark = row[CONSTANTS.indexes.indexMark];
          const square = row[CONSTANTS.indexes.indexSquare];
          const cameras = row[CONSTANTS.indexes.indexCameras];
          const st = row[CONSTANTS.indexes.indexSpentTime]
          const reviewST = row[CONSTANTS.indexes.indexReviewSpentTime]
          const recipientsArr = recipients ? recipients.split(',') : [];
          const recipientsArrUid = recipientsUid ? recipientsUid.split(',') : [];
          const isConverter = row[CONSTANTS.indexes.indexConverter];

          let creatorFlag = false;
          for (let indexRecipient in recipientsArrUid) {
            const recipientUid = recipientsArrUid[indexRecipient];
            if (!feedback[recipientUid]) {
              feedback[recipientUid] = {};
              feedback[recipientUid].orders = {};
              feedback[recipientUid].name = recipientsArr[indexRecipient]
            }
            if (recipientUid == creatorUid) {
              feedback[recipientUid].orders[date] = createRecord(date, orderId, platform, type, mark, square, cameras, st, reviewST, true, true, recipientsArrUid, isConverter);
              creatorFlag = true;
            }
            else {
              feedback[recipientUid].orders[date] = createRecord(date, orderId, platform, type, mark, square, cameras, st, reviewST, true, false, recipientsArrUid, isConverter);
            }
          }
          if (!creatorFlag && creatorUid) {
            if (!feedback[creatorUid]) {
              feedback[creatorUid] = {};
              feedback[creatorUid].orders = {};
              feedback[creatorUid].name = creator;

            }
            feedback[creatorUid].orders[date] = createRecord(date, orderId, platform, type, mark, square, cameras, st, reviewST, false, true, recipientsArrUid, isConverter);

          }

          for (let drafterUid in feedback) {
            if (!members[drafterUid]) {
              members[drafterUid] = {}
              members[drafterUid].data = new Member();
              members[drafterUid].name = feedback[drafterUid].name;
              members[drafterUid].uid = drafterUid;

            }
            // заказы
            for (const orderAsDateString in feedback[drafterUid].orders) {
              const orderAsObject = feedback[drafterUid].orders[orderAsDateString]

              if (!this.orders.includes(orderAsDateString)) {
                this.orders.push(orderAsDateString)
              }

              if (orderAsObject.type === CONSTANTS.fp || orderAsObject.type === CONSTANTS.esx) {

                let converterType;

                const square = typeof orderAsObject.square == 'number' ? orderAsObject.square : typeof orderAsObject.square == 'string' ? orderAsObject.square : 0;
                const cameras = typeof orderAsObject.cameras == 'number' ? orderAsObject.cameras : typeof orderAsObject.cameras == 'string' ? orderAsObject.cameras : 0;

                const normalBig = square >= CONSTANTS.bigOrderReqs.square || cameras >= CONSTANTS.bigOrderReqs.cameras ? CONSTANTS.big : CONSTANTS.normal;

                if (orderAsObject.type === CONSTANTS.esx && normalBig === CONSTANTS.big) {
                  converterType = 'converter'
                }
                else if (orderAsObject.type === CONSTANTS.fp) {
                  converterType = 'noConverter'
                }
                else {
                  converterType = orderAsObject.type === CONSTANTS.esx && orderAsObject.isConverter ? 'converter' : 'noConverter';
                }

                const drafter = members[drafterUid].data[orderAsObject.type][normalBig]

                if (orderAsObject.isRecipient) {
                  if (orderAsObject.st) {
                    drafter[converterType].time += Number(orderAsObject.st);
                    drafter[converterType].cameras += Number(orderAsObject.cameras);
                    if (orderAsObject.recipientArray.length != 0) {
                      orderAsObject.recipientArray.length < 2 ? drafter[converterType].ordersSolo++ : drafter[converterType].ordersShared++;
                    }
                    drafter[converterType].square += orderAsObject.square;
                    drafter[converterType].markArray.push(Number(orderAsObject.mark));

                  }
                }
                else if (orderAsObject.isCreator && !orderAsObject.isRecipient) {
                  converterType = CONSTANTS.quantiles.review
                  if (orderAsObject.reviewST) {
                    drafter[converterType].time += Number(orderAsObject.reviewST)
                    if (!drafter[converterType].ordersArray.includes(orderAsObject.orderId)) {
                      drafter[converterType].ordersTotal++
                      drafter[converterType].cameras += Number(orderAsObject.cameras)
                    }
                  }
                }
                else {
                  throw new Error('!isRecipient && !isCreator')
                }

                if (!drafter[converterType].ordersArray.includes(orderAsObject.orderId)) {
                  drafter[converterType].ordersArray.push(orderAsObject.orderId)
                }

              }
            }
          }

        }
      }
    }
    const isExclude = CONSTANTS.speadsheetControlPanel.getSheetByName('excludedUid').getRange('A2').getValue()
    if (isExclude) {
      const excludedUidObject = {}
      const valuesExcludedUid = CONSTANTS.speadsheetControlPanel.getSheetByName('excludedUid').getDataRange().getValues().slice(2).flat(1)
      for (const uid of valuesExcludedUid) {
        excludedUidObject[uid] = true
      }
      for (const uidToDelete in excludedUidObject) {
        if (members[uidToDelete]) {
          delete members[uidToDelete]
        }
      }
    }
    // this.orders.sort((a, b) => new Date(a) - new Date(b))
    return members
  }

  getCalculations(members) {

    for (const drafterUid of Object.values(members)) {
      for (const fpEsx of CONSTANTS.fpOrEsxKeysList) {
        for (const normalBig of CONSTANTS.normalBigKeysList) {

          const program = drafterUid.data[fpEsx][normalBig];
          drafterUid.cutoff_id = this.time

          //SPEED
          let time, cameras

          for (const converterType of Object.values(CONSTANTS.converterType)) {

            if (program[converterType].time) {

              if (converterType == CONSTANTS.converterType.review) {
                time = program.review.time;
                cameras = program.review.cameras;
                program.review.speed = Formulas.getSpeed(time, cameras);
              }
              else {
                time = program[converterType].time;
                cameras = program[converterType].cameras;
                program[converterType].speed = Formulas.getSpeed(time, cameras);

                //TOTAL
                const ordersSolo = program[converterType].ordersSolo;
                const ordersShared = program[converterType].ordersShared;
                program[converterType].ordersTotal = ordersSolo + ordersShared;

                //RATING
                program[converterType].markAverage = Formulas.getAverage(program[converterType].markArray);

                //SOLO_PERCENT
                const soloOrders = program[converterType].ordersSolo;
                const shareOrders = program[converterType].ordersShared;
                program[converterType].soloPercent = Formulas.getSoloPercent(soloOrders, shareOrders);
              }
            }
          }
        }
      }
    }
    return members
  }

  getArraysForQuantile() {
    const array = Factories.typeFactory()

    function draw(programData, quantileCategory, converterType) {
      quantileCategory.orders.push(programData[converterType].ordersTotal)
      quantileCategory.cameras.push(programData[converterType].cameras)
      quantileCategory.mark.push(programData[converterType].markAverage)
      quantileCategory.soloPercent.push(programData[converterType].soloPercent)
      quantileCategory.speed.push(programData[converterType].speed)
    }

    function review(programData, quantileCategory) {
      quantileCategory.orders.push(programData.ordersTotal)
      quantileCategory.cameras.push(programData.cameras)
      quantileCategory.speed.push(programData.speed)
    }

    for (const drafterUid of Object.values(this.members)) {
      const uid = drafterUid.uid
      const programFpNormal = drafterUid.data[CONSTANTS.fp][CONSTANTS.normal]
      const programFpBig = drafterUid.data[CONSTANTS.fp][CONSTANTS.big]
      const programEsxNormal = drafterUid.data[CONSTANTS.esx][CONSTANTS.normal]
      const programEsxBig = drafterUid.data[CONSTANTS.esx][CONSTANTS.big]

      // DRAW
      draw(programFpNormal, array.draw.fp_normal_noConv, CONSTANTS.converterType.noConverter)
      draw(programFpBig, array.draw.fp_big_noConv, CONSTANTS.converterType.noConverter)
      draw(programEsxNormal, array.draw.esx_normal_conv, CONSTANTS.converterType.converter)
      draw(programEsxBig, array.draw.esx_big_conv, CONSTANTS.converterType.converter)
      draw(programEsxNormal, array.draw.esx_normal_noConv, CONSTANTS.converterType.noConverter)

      // REVIEW
      review(programFpNormal.review, array.review.fp_normal_noConv)
      review(programFpBig.review, array.review.fp_big_noConv)
      review(programEsxNormal.review, array.review.esx_normal_conv)
      review(programEsxBig.review, array.review.esx_big_conv)
    }

    let targetLength
    for (const type of Object.values(array)) {
      for (const groups of Object.values(type)) {
        for (let group in groups) {
          let newGroup = groups[group]
          newGroup = newGroup.filter(a => a != 0)
          if (group !== 'soloPercent') {
            targetLength = newGroup.length
          }
          else {
            while (newGroup.length < targetLength) {
              newGroup.push(0)
            }
          }
          newGroup.sort((a, b) => a - b)
          groups[group] = newGroup
        }
      }
    }
    return array
  }

  getWeights() {
    function reviewObj(array) {
      const obj = {}
      for (const row of array) {
        obj[row[0]] = {
          orders: row[1],
          cameras: row[2],
          speed: row[3],
        }
      }
      return obj
    }
    function drawObj(array) {
      const obj = {}
      for (const row of array) {
        obj[row[0]] = {
          orders: row[1],
          cameras: row[2],
          mark: row[3],
          solo: row[4],
          speed: row[5],
        }
      }
      return obj
    }

    const sheetWeights = this.spreadsheet.getSheetByName('weights2')
    // const reviewWeights = sheetWeights.getRange('A1:E5').getValues().slice(1)
    const reviewWeights = sheetWeights.getRange('A1:E5').getValues()
    // const drawWeights = sheetWeights.getRange('A7:F12').getValues().slice(1)
    const drawWeights = sheetWeights.getRange('A7:F12').getValues()
    // Logger.log(reviewWeights)
    // Logger.log(drawWeights)
    let obj = {
      review: reviewObj(reviewWeights.slice(1)),
      draw: drawObj(drawWeights.slice(1)),
    }
    return obj
  }


  quantileAndPointsProcedure() {
    const weights = this.weights

    for (const drafterUid of Object.values(this.members)) {
      for (const fpEsx of CONSTANTS.fpOrEsxKeysList) {
        for (const normalBig of CONSTANTS.normalBigKeysList) {

          let drafter = drafterUid.data[fpEsx][normalBig]

          for (let drawReview of Object.keys(this.arraysForQuantile)) {
            let drawReviewObj = this.arraysForQuantile[drawReview]
            let converterType

            if (fpEsx === CONSTANTS.fp && normalBig === CONSTANTS.normal) {
              let group = CONSTANTS.weights.fpNormalNoConv

              switch (drawReview) {
                case CONSTANTS.quantiles.draw:
                  converterType = CONSTANTS.converterType.noConverter
                  this.getQuantileAndPlace(drafter, converterType, drawReviewObj, weights, drawReview, group)
                  break;

                case CONSTANTS.quantiles.review:
                  converterType = CONSTANTS.converterType.review
                  this.getQuantileAndPlace(drafter, converterType, drawReviewObj, weights, drawReview, group)
                  break;
                default:
                  'Choose correct type'
                  break;
              }
            }
            if (fpEsx === CONSTANTS.fp && normalBig === CONSTANTS.big) {
              let group = CONSTANTS.weights.fpBigNoConv
              switch (drawReview) {
                // сделать так чтобы квантиль был 0 для драфетров только для солоперцент
                case CONSTANTS.quantiles.draw:
                  converterType = CONSTANTS.converterType.noConverter
                  this.getQuantileAndPlace(drafter, converterType, drawReviewObj, weights, drawReview, group)
                  break;

                case CONSTANTS.quantiles.review:
                  converterType = CONSTANTS.converterType.review
                  this.getQuantileAndPlace(drafter, converterType, drawReviewObj, weights, drawReview, group)
                  break;
                default:
                  'Choose correct type'
                  break;
              }
            }
            if (fpEsx === CONSTANTS.esx && normalBig === CONSTANTS.normal) {
              let group = CONSTANTS.weights.esxNormalConv
              let groupNoConv = CONSTANTS.weights.esxNormalNoConv

              switch (drawReview) {
                case CONSTANTS.quantiles.draw:
                  converterType = CONSTANTS.converterType.noConverter
                  this.getQuantileAndPlace(drafter, converterType, drawReviewObj, weights, drawReview, groupNoConv)
                  this.getQuantileAndPlace(drafter, CONSTANTS.converterType.converter, drawReviewObj, weights, drawReview, group)
                  break;

                case CONSTANTS.quantiles.review:
                  converterType = CONSTANTS.converterType.review
                  this.getQuantileAndPlace(drafter, converterType, drawReviewObj, weights, drawReview, group)
                  break;
                default:
                  'Choose correct type'
                  break;
              }
            }
            if (fpEsx === CONSTANTS.esx && normalBig === CONSTANTS.big) {
              let group = CONSTANTS.weights.esxBigConv
              switch (drawReview) {
                // сделать так чтобы квантиль был 0 для драфетров только для солоперцент
                case CONSTANTS.quantiles.draw:
                  converterType = CONSTANTS.converterType.converter
                  this.getQuantileAndPlace(drafter, converterType, drawReviewObj, weights, drawReview, group)
                  break;

                case CONSTANTS.quantiles.review:
                  converterType = CONSTANTS.converterType.review
                  this.getQuantileAndPlace(drafter, converterType, drawReviewObj, weights, drawReview, group)
                  break;
                default:
                  'Choose correct type'
                  break;
              }
            }
          }
        }
      }
    }
  }

  getQuantileAndPlace(drafter, converterType, typeObj, weights, type, group) {

    let markPoints = 0
    let soloPercentPoints = 0

    //Orders
    const { place: oPlace, places: oPlaces, quantile: oQuantile } = Formulas.getPlace(typeObj[group].orders, drafter[converterType].ordersTotal)
    drafter[converterType].ordersPlace = oPlace
    drafter[converterType].ordersPlaces = oPlaces
    drafter[converterType].ordersQuantile = oQuantile

    let ordersQuantile = drafter[converterType].ordersQuantile
    let ordersWeight = weights[type][group].orders
    drafter[converterType].ordersPoints = ordersQuantile * ordersWeight
    let ordersPoints = drafter[converterType].ordersPoints

    if (ordersQuantile) {
      if (type === CONSTANTS.quantiles.draw) {
        const { place: mPlace, places: mPlaces, quantile: mQuantile } = Formulas.getPlace(typeObj[group].mark, drafter[converterType].markAverage)
        drafter[converterType].markAveragePlace = mPlace
        drafter[converterType].markAveragePlaces = mPlaces
        drafter[converterType].markQuantile = mQuantile

        let markQuantile = drafter[converterType].markQuantile
        let markWeight = weights[type][group].mark
        drafter[converterType].markPoints = markQuantile * markWeight
        markPoints = drafter[converterType].markPoints


        const { place: spPlace, places: spPlaces, quantile: spQuantile } = Formulas.getPlace(typeObj[group].soloPercent, drafter[converterType].soloPercent)
        drafter[converterType].soloPercentPlace = spPlace
        drafter[converterType].soloPercentPlaces = spPlaces
        if (group == 'esx_big_conv' || group == 'fp_big_noConv') {
          drafter[converterType].soloPercentQuantile = 0
        }
        else {
          drafter[converterType].soloPercentQuantile = spQuantile
        }
        let soloPercentQuantile = drafter[converterType].soloPercentQuantile
        let soloPercentWeight = weights[type][group].solo
        drafter[converterType].soloPercentPoints = soloPercentQuantile * soloPercentWeight
        soloPercentPoints = drafter[converterType].soloPercentPoints

      }

      const { place: cPlace, places: cPlaces, quantile: cQuantile } = Formulas.getPlace(typeObj[group].cameras, drafter[converterType].cameras)
      drafter[converterType].camerasPlace = cPlace
      drafter[converterType].camerasPlaces = cPlaces
      drafter[converterType].camerasQuantile = cQuantile

      let camerasQuantile = drafter[converterType].camerasQuantile
      let camerasWeight = weights[type][group].cameras
      drafter[converterType].camerasPoints = camerasQuantile * camerasWeight
      let camerasPoints = drafter[converterType].camerasPoints


      const { place: sPlace, places: sPlaces, quantile: sQuantile } = Formulas.getPlace(typeObj[group].speed, drafter[converterType].speed, 'speed')
      drafter[converterType].speedPlace = sPlace
      drafter[converterType].speedPlaces = sPlaces
      drafter[converterType].speedQuantile = sQuantile

      let speedQuantile = drafter[converterType].speedQuantile
      let speedWeight = weights[type][group].speed
      drafter[converterType].speedPoints = speedQuantile * speedWeight
      let speedPoints = drafter[converterType].speedPoints

      drafter[converterType].totalPoints = ordersPoints + camerasPoints + markPoints + soloPercentPoints + speedPoints

    }
  }
}

class Output {
  constructor(gamification, time) {
    this.gamification = gamification;
    this.time = time;
  }

  get programs() {

    const drawSheet = this.gamification.spreadsheet.getSheetByName('draw')
    const reviewSheet = this.gamification.spreadsheet.getSheetByName('review')
    let drawOutput = [[
      'uid', 'cutoff_id', 'type', 'orders', 'cameras', 'mark_avg', 'solo_orders', 'spent_time', 'solo_percent', 'speed', 'orders_quantile', 'cameras_quantile', 'mark_quantile', 'solo_percent_quantile', 'speed_quantile', 'orders_points', 'cameras_points', 'mark_points', 'solo_percent_points', 'speed_points', 'total_points',
    ]]
    let reviewOutput = [[
      'uid', 'cutoff_id', 'type', 'orders', 'cameras', 'spent_time', 'speed', 'orders_quantile', 'cameras_quantile', 'speed_quantile', 'orders_points', 'cameras_points', 'speed_points', 'total_points',
    ]]

    // VALUES
    for (const drafterUid of Object.values(this.gamification.members)) {
      const uid = drafterUid.uid
      const program = drafterUid.data

      // Draw
      const drawValues1 = Object.values(Factories.drawOutputFactory(uid, this.time, CONSTANTS.weights.fpNormalNoConv, program[CONSTANTS.fp][CONSTANTS.normal], 'noConverter'))
      const drawValues2 = Object.values(Factories.drawOutputFactory(uid, this.time, CONSTANTS.weights.fpBigNoConv, program[CONSTANTS.fp][CONSTANTS.big], 'noConverter'))
      const drawValues3 = Object.values(Factories.drawOutputFactory(uid, this.time, CONSTANTS.weights.esxNormalConv, program[CONSTANTS.esx][CONSTANTS.normal], 'converter'))
      const drawValues4 = Object.values(Factories.drawOutputFactory(uid, this.time, CONSTANTS.weights.esxBigConv, program[CONSTANTS.esx][CONSTANTS.big], 'converter'))
      const drawValues5 = Object.values(Factories.drawOutputFactory(uid, this.time, CONSTANTS.weights.esxNormalNoConv, program[CONSTANTS.esx][CONSTANTS.normal], 'noConverter'))

      // Review
      const reviewValues1 = Object.values(Factories.reviewOutputFactory(uid, this.time, 'fp_normal', program[CONSTANTS.fp][CONSTANTS.normal]))
      const reviewValues2 = Object.values(Factories.reviewOutputFactory(uid, this.time, 'fp_big', program[CONSTANTS.fp][CONSTANTS.big]))
      const reviewValues3 = Object.values(Factories.reviewOutputFactory(uid, this.time, 'esx_normal', program[CONSTANTS.esx][CONSTANTS.normal]))
      const reviewValues4 = Object.values(Factories.reviewOutputFactory(uid, this.time, 'esx_big', program[CONSTANTS.esx][CONSTANTS.big]))

      drawOutput.push(drawValues1, drawValues2, drawValues3, drawValues4, drawValues5)
      reviewOutput.push(reviewValues1, reviewValues2, reviewValues3, reviewValues4)
    };

    drawSheet.getDataRange().clear()
    reviewSheet.getDataRange().clear()

    drawSheet.getRange(1, 1, drawOutput.length, drawOutput[0].length).setValues(drawOutput)
    reviewSheet.getRange(1, 1, reviewOutput.length, reviewOutput[0].length).setValues(reviewOutput)
  }
}

class Member {
  constructor() {
    this[CONSTANTS.fp] = Factories.factoryNormalBig();
    this[CONSTANTS.esx] = Factories.factoryNormalBig();
  };
};

function deleteDrawingReviewForCutoff() {
  const cutoffId = CONSTANTS.speadsheetControlPanel.getSheetByName('main').getRange('D6').getValue()
  const tableDrawing = 'game_drawing'
  const tableReview = 'game_review'
  const queryDrawing = `DELETE FROM ${tableDrawing} WHERE cutoff_id = ${cutoffId};`
  deleteFromDatabase(queryDrawing)
  const queryReview = `DELETE FROM ${tableReview} WHERE cutoff_id = ${cutoffId};`
  deleteFromDatabase(queryReview)
  Browser.msgBox('Метрики за выбранный катофф удалены из БД')
}