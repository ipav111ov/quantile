function main() {
  const time = moment(new Date()).tz('Asia/Tbilisi').format('ll' + ' LTS')
  const gamification = new Gamification(SS);
  const output = new Output(gamification, time);
  output.programs
  Logger.log('Completed')
  //TODO 
}


class Gamification {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet;
    this.orders = []
    this.members = this.getCalculations(this.getMembers());
    // this.teams = this.getTeams();
    this.weights = this.getWeights();
    this.arraysForQuantile = this.getArraysForQuantile()
    this.quantileAndPointsProcedure()
    this.json()
  };

  json() {
    const fileSets = {
      mimeType: 'application/json',
      name: new Date()
    };
    const json = JSON.stringify(this.members)
    const blob = Utilities.newBlob(json, 'application/json')
    const file = Drive.Files.create(fileSets, blob)
  }

  getMembers() {

    const orders = filterOrders(getOrders(getValuesFromSS()));

    const members = {};
    for (const order in orders) {
      for (const fpEsx in orders[order]) {
        for (const orderInstance in orders[order][fpEsx]) {
          const feedback = {}
          const row = orders[order][fpEsx][orderInstance];
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

          let creatorFlag = false;
          for (let indexRecipient in recipientsArrUid) {
            const recipientUid = recipientsArrUid[indexRecipient];
            if (!feedback[recipientUid]) {
              feedback[recipientUid] = {};
              feedback[recipientUid].orders = {};
              feedback[recipientUid].name = recipientsArr[indexRecipient]
            }
            if (creatorUid.indexOf(recipientUid) == 0 && creatorUid.length == recipientUid.length) {
              feedback[recipientUid].orders[date] = createRecord_(date, orderId, platform, type, mark, square, cameras, st, reviewST, true, true, recipientsArrUid, isConverter);
              creatorFlag = true;
            }

            feedback[recipientUid].orders[date] = createRecord_(date, orderId, platform, type, mark, square, cameras, st, reviewST, true, false, recipientsArrUid, isConverter);

          }
          if (!creatorFlag && creatorUid) {
            if (!feedback[creatorUid]) {
              feedback[creatorUid] = {};
              feedback[creatorUid].orders = {};
              feedback[creatorUid].name = creator;

            }
            feedback[creatorUid].orders[date] = createRecord_(date, orderId, platform, type, mark, square, cameras, st, reviewST, false, true, recipientsArrUid, isConverter);
            feedback[creatorUid].order //todo += reviewST

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

              this.orders.push(orderAsDateString)

              if (orderAsObject.type === TYPES_OF_ORDERS.fp || orderAsObject.type === TYPES_OF_ORDERS.esx) {

                let converterType;

                const square = typeof orderAsObject.square == 'number' ? orderAsObject.square : typeof orderAsObject.square == 'string' ? orderAsObject.square : 0;
                const cameras = typeof orderAsObject.cameras == 'number' ? orderAsObject.cameras : typeof orderAsObject.cameras == 'string' ? orderAsObject.cameras : 0;

                const normalBig = square >= TYPES_OF_ORDERS.bigOrderReqs.square || cameras >= TYPES_OF_ORDERS.bigOrderReqs.cameras ? TYPES_OF_ORDERS.big : TYPES_OF_ORDERS.normal;

                if (orderAsObject.type === TYPES_OF_ORDERS.esx && normalBig === TYPES_OF_ORDERS.big) {
                  converterType = 'converter'
                }
                else if (orderAsObject.type === TYPES_OF_ORDERS.fp) {
                  converterType = 'noConverter'
                }
                else {
                  converterType = orderAsObject.type === TYPES_OF_ORDERS.esx && orderAsObject.isConverter ? 'converter' : 'noConverter';
                }

                const drafter = members[drafterUid].data[orderAsObject.type][normalBig]

                if (orderAsObject.isRecipient) {
                  if (orderAsObject.st) {

                    drafter[converterType].time += Number(orderAsObject.st);
                    drafter[converterType].cameras += Number(orderAsObject.cameras);
                    orderAsObject.recipientArray.length < 2 ? drafter[converterType].ordersSolo++ : drafter[converterType].ordersShared++;
                    drafter[converterType].square += Formulas.getRounding(orderAsObject.square);
                    drafter[converterType].markArray.push(Number(orderAsObject.mark));
                  }
                }
                else if (orderAsObject.isCreator && !orderAsObject.isRecipient) {
                  converterType = 'review'
                  if (orderAsObject.reviewST) {

                    drafter[converterType].time += Number(orderAsObject.reviewST);
                    drafter[converterType].ordersTotal++;
                    drafter[converterType].cameras += Number(orderAsObject.cameras);
                  }
                }
                else {
                  throw new Error('!isRecipient && !isCreator')
                }

                if (!drafter[converterType].ordersArray.includes(orderAsDateString)) {
                  drafter[converterType].ordersArray.push(orderAsDateString)
                }

              };
            };
          };
        }
      }
    }
    this.orders.sort((a, b) => new Date(a) - new Date(b))
    return members
  }

  getCalculations(members) {

    for (const drafterUid of Object.values(members)) {
      for (const fpEsx of TYPES_OF_ORDERS.fpOrEsxKeysList) {
        for (const normalBig of TYPES_OF_ORDERS.normalBigKeysList) {

          const program = drafterUid.data[fpEsx][normalBig];
          drafterUid.dateStart = new Date(this.orders.at(0)).getTime()


          //SPEED
          let time, cameras

          if (program.review.time || program.review.cameras) {
            time = program.review.time;
            cameras = program.review.cameras;
            program.review.speed = Formulas.getSpeed(time, cameras);
          };

          for (const converterType of Object.values(TYPES_OF_ORDERS.converterType)) {

            if (program[converterType].time) {

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
              let totalSoloOrders = 0;
              let totalShareOrders = 0;

              for (const converterType1 of Object.values(TYPES_OF_ORDERS.converterType)) {
                totalSoloOrders += program[converterType1].ordersSolo;
                totalShareOrders += program[converterType1].ordersShared;
              };
              program[converterType].soloPercent = Formulas.getSoloPercent(totalSoloOrders, totalShareOrders);
            };
          };
        };
      };
    };
    return members;
  }

  getTeams() {
    const sheetName = 'TeamsList';
    Logger.log('Creating teams...');
    const sheetTeams = ss.getSheetByName(sheetName);
    const valuesTeams = sheetTeams.getDataRange().getValues().slice(4);
    const emailsDb = collectEmailsDb();

    const columns = {
      leaderName: 0,
      leaderUid: 1,
      memberName: 2,
      memberUid: 3,
    };
    const teams = {};
    let currentLeaderUid = "";
    let membersArr = []

    for (const row of valuesTeams) {
      if (row[columns.leaderName] === 'Total' || row[columns.leaderName] === 'Total Included') {
        continue
      };
      if (row[columns.leaderUid]) {
        const leaderUid = row[columns.leaderUid]
        currentLeaderUid = leaderUid;
        teams[currentLeaderUid] = {};
      };
      if (row[columns.memberUid]) {
        const memberUid = row[columns.memberUid]
        teams[currentLeaderUid][memberUid] = emailsDb[memberUid]
      }
    };
    Logger.log('Checking duplicates...');
    findDuplicates(membersArr)
    Logger.log('Teams created');

    return teams
  };

  getArraysForQuantile() {
    const array = typeFactory()

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
      const programFpNormal = drafterUid.data['DRAWING']["NORMAL"]
      const programFpBig = drafterUid.data['DRAWING']["BIG"]
      const programEsxNormal = drafterUid.data['DRAWING_ESX']["NORMAL"]
      const programEsxBig = drafterUid.data['DRAWING_ESX']["BIG"]

      // DRAW
      draw(programFpNormal, array.draw.fp_normal_noConv, 'noConverter')
      draw(programFpBig, array.draw.fp_big_noConv, 'noConverter')
      draw(programEsxNormal, array.draw.esx_normal_conv, 'converter')
      draw(programEsxBig, array.draw.esx_big_conv, 'converter')
      draw(programEsxNormal, array.draw.esx_normal_noConv, 'noConverter')

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

    const sheetWeights = SS.getSheetByName('weights')
    const reviewWeights = sheetWeights.getRange('A1:E5').getValues().slice(1)
    const drawWeights = sheetWeights.getRange('A7:F12').getValues().slice(1)
    let obj = {
      review: reviewObj(reviewWeights),
      draw: drawObj(drawWeights),
    }
    return obj
  }


  quantileAndPointsProcedure() {
    const weights = this.weights

    for (const drafterUid of Object.values(this.members)) {
      for (const fpEsx of TYPES_OF_ORDERS.fpOrEsxKeysList) {
        for (const normalBig of TYPES_OF_ORDERS.normalBigKeysList) {

          let program = drafterUid.data[fpEsx][normalBig]

          for (let drawReview of Object.keys(this.arraysForQuantile)) {
            let drawReviewObj = this.arraysForQuantile[drawReview]
            let converterType

            if (fpEsx === 'DRAWING' && normalBig === 'NORMAL') {
              let group = 'fp_normal_noConv'

              switch (drawReview) {
                case 'draw':
                  converterType = 'noConverter'
                  this.getQuantileAndPlace(program, converterType, drawReviewObj, weights, drawReview, group)
                  break;

                case 'review':
                  converterType = 'review'
                  this.getQuantileAndPlace(program, converterType, drawReviewObj, weights, drawReview, group)
                  break;
                default:
                  'Choose correct type'
                  break;
              }
            }
            if (fpEsx === 'DRAWING' && normalBig === 'BIG') {
              let group = 'fp_big_noConv'

              switch (drawReview) {
                case 'draw':
                  converterType = 'noConverter'
                  this.getQuantileAndPlace(program, converterType, drawReviewObj, weights, drawReview, group)
                  break;

                case 'review':
                  converterType = 'review'
                  this.getQuantileAndPlace(program, converterType, drawReviewObj, weights, drawReview, group)
                  break;
                default:
                  'Choose correct type'
                  break;
              }
            }
            if (fpEsx === 'DRAWING_ESX' && normalBig === 'NORMAL') {
              let group = 'esx_normal_conv'
              let groupNoConv = 'esx_normal_noConv'

              switch (drawReview) {
                case 'draw':
                  converterType = 'noConverter'
                  this.getQuantileAndPlace(program, converterType, drawReviewObj, weights, drawReview, groupNoConv)
                  this.getQuantileAndPlace(program, 'converter', drawReviewObj, weights, drawReview, group)
                  break;

                case 'review':
                  converterType = 'review'
                  this.getQuantileAndPlace(program, converterType, drawReviewObj, weights, drawReview, group)
                  break;
                default:
                  'Choose correct type'
                  break;
              }
            }
            if (fpEsx === 'DRAWING_ESX' && normalBig === 'BIG') {
              let group = 'esx_big_conv'
              switch (drawReview) {
                case 'draw':
                  converterType = 'converter'
                  this.getQuantileAndPlace(program, converterType, drawReviewObj, weights, drawReview, group)
                  break;

                case 'review':
                  converterType = 'review'
                  this.getQuantileAndPlace(program, converterType, drawReviewObj, weights, drawReview, group)
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

  getQuantileAndPlace(program, converterType, typeObj, weights, type, group) {

    let markPoints = 0
    let soloPercentPoints = 0

    //Orders
    const { place: oPlace, places: oPlaces, quantile: oQuantile } = Formulas.getPlace(typeObj[group].orders, program[converterType].ordersTotal)
    program[converterType].ordersPlace = oPlace
    program[converterType].ordersPlaces = oPlaces
    program[converterType].ordersQuantile = oQuantile

    let ordersQuantile = program[converterType].ordersQuantile
    let ordersWeight = weights[type][group].orders
    program[converterType].ordersPoints = ordersQuantile * ordersWeight
    let ordersPoints = program[converterType].ordersPoints

    if (ordersQuantile) {
      if (type === 'draw') {
        const { place: mPlace, places: mPlaces, quantile: mQuantile } = Formulas.getPlace(typeObj[group].mark, program[converterType].markAverage)
        program[converterType].markAveragePlace = mPlace
        program[converterType].markAveragePlaces = mPlaces
        program[converterType].markQuantile = mQuantile

        const { place: spPlace, places: spPlaces, quantile: spQuantile } = Formulas.getPlace(typeObj[group].soloPercent, program[converterType].soloPercent)
        program[converterType].soloPercentPlace = spPlace
        program[converterType].soloPercentPlaces = spPlaces
        program[converterType].soloPercentQuantile = spQuantile

        let markQuantile = program[converterType].markQuantile
        let soloPercentQuantile = program[converterType].soloPercentQuantile

        let markWeight = weights[type][group].mark
        let soloPercentWeight = weights[type][group].solo

        program[converterType].markPoints = markQuantile * markWeight
        program[converterType].soloPercentPoints = soloPercentQuantile * soloPercentWeight

        markPoints = program[converterType].markPoints
        soloPercentPoints = program[converterType].soloPercentPoints

      }

      const { place: cPlace, places: cPlaces, quantile: cQuantile } = Formulas.getPlace(typeObj[group].cameras, program[converterType].cameras)
      program[converterType].camerasPlace = cPlace
      program[converterType].camerasPlaces = cPlaces
      program[converterType].camerasQuantile = cQuantile

      const { place: sPlace, places: sPlaces, quantile: sQuantile } = Formulas.getPlace(typeObj[group].speed, program[converterType].speed, 'speed')
      program[converterType].speedPlace = sPlace
      program[converterType].speedPlaces = sPlaces
      program[converterType].speedQuantile = sQuantile

      let camerasQuantile = program[converterType].camerasQuantile
      let speedQuantile = program[converterType].speedQuantile

      let camerasWeight = weights[type][group].cameras
      let speedWeight = weights[type][group].speed

      program[converterType].camerasPoints = camerasQuantile * camerasWeight
      program[converterType].speedPoints = speedQuantile * speedWeight

      let camerasPoints = program[converterType].camerasPoints
      let speedPoints = program[converterType].speedPoints

      program[converterType].totalPoints = ordersPoints + camerasPoints + markPoints + soloPercentPoints + speedPoints

    }
  }
}





class Output {
  constructor(gamification, time) {
    this.gamification = gamification;
    this.time = time;
  }

  get programs() {

    const drawSheet = SS.getSheetByName('draw')
    const reviewSheet = SS.getSheetByName('review')
    let drawOutput = [[
      'uid', 'date', 'type', 'orders', 'cameras', 'mark_avg', 'solo_orders', 'spent_time', 'solo_percent', 'speed', 'orders_quantile', 'cameras_quantile', 'mark_quantile', 'solo_percent_quantile', 'speed_quantile', 'orders_points', 'cameras_points', 'mark_points', 'solo_percent_points', 'speed_points', 'total_points',
    ]]
    let reviewOutput = [[
      'uid', 'date', 'type', 'orders', 'cameras', 'spent_time', 'speed', 'orders_quantile', 'cameras_quantile', 'speed_quantile', 'orders_points', 'cameras_points', 'speed_points', 'total_points',
    ]]

    // VALUES
    for (const drafterUid of Object.values(this.gamification.members)) {
      const uid = drafterUid.uid

      const date = this.gamification.orders.at(0);
      const program = drafterUid.data

      // Draw
      const drawValues1 = Object.values(drawOutputFactory(uid, date, 'fp_normal_noConv', program[TYPES_OF_ORDERS.fp][TYPES_OF_ORDERS.normal], 'noConverter'))
      const drawValues2 = Object.values(drawOutputFactory(uid, date, 'fp_big_noConv', program[TYPES_OF_ORDERS.fp][TYPES_OF_ORDERS.big], 'noConverter'))
      const drawValues3 = Object.values(drawOutputFactory(uid, date, 'esx_normal_conv', program[TYPES_OF_ORDERS.esx][TYPES_OF_ORDERS.normal], 'converter'))
      const drawValues4 = Object.values(drawOutputFactory(uid, date, 'esx_big_conv', program[TYPES_OF_ORDERS.esx][TYPES_OF_ORDERS.big], 'converter'))
      const drawValues5 = Object.values(drawOutputFactory(uid, date, 'esx_normal_noConv', program[TYPES_OF_ORDERS.esx][TYPES_OF_ORDERS.normal], 'noConverter'))

      // Review
      const reviewValues1 = Object.values(reviewOutputFactory(uid, date, 'fp_normal', program[TYPES_OF_ORDERS.fp][TYPES_OF_ORDERS.normal]))
      const reviewValues2 = Object.values(reviewOutputFactory(uid, date, 'fp_big', program[TYPES_OF_ORDERS.fp][TYPES_OF_ORDERS.big]))
      const reviewValues3 = Object.values(reviewOutputFactory(uid, date, 'esx_normal', program[TYPES_OF_ORDERS.esx][TYPES_OF_ORDERS.normal]))
      const reviewValues4 = Object.values(reviewOutputFactory(uid, date, 'esx_big', program[TYPES_OF_ORDERS.esx][TYPES_OF_ORDERS.big]))

      drawOutput.push(drawValues1, drawValues2, drawValues3, drawValues4, drawValues5)
      reviewOutput.push(reviewValues1, reviewValues2, reviewValues3, reviewValues4)


    };

    drawSheet.getDataRange().clear();
    reviewSheet.getDataRange().clear();

    drawSheet.getRange(1, 1, drawOutput.length, drawOutput[0].length).setValues(drawOutput);
    reviewSheet.getRange(1, 1, reviewOutput.length, reviewOutput[0].length).setValues(reviewOutput);
  }
}


class Member {
  constructor() {
    this.time = 0;
    this.totalPointsArr = [];
    this.points = factoryPointsFpOrEsx();
    this[TYPES_OF_ORDERS.fp] = factoryNormalBig();
    this[TYPES_OF_ORDERS.esx] = factoryNormalBig();
  };
};