function main() {
  const time = moment(new Date()).tz('Asia/Tbilisi').format('ll' + ' LTS')
  const gamification = new Gamification(CONSTANTS.spreadsheet)
  const output = new Output(gamification, time)
  output.teamsList
  output.programs
  Logger.log('Completed')
  //TODO 
}


class Gamification {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet;
    this.orders = []
    this.members = this.getCalculations(this.getMembers());
    this.teams = this.getTeams();
    this.weights = this.getWeights();
    this.arraysForQuantile = this.getArraysForQuantile()
    this.quantileAndPointsProcedure()
    this.json()
  };

  json() {
    const fileSets = {
      mimeType: 'application/json',
      name: new Date()
    }
    const json = JSON.stringify(this.members)
    const blob = Utilities.newBlob(json, 'application/json')
    const file = Drive.Files.create(fileSets, blob)
    // sendJson(json)
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

                    if (orderAsObject.isCreator && orderAsObject.recipientArray.length > 1) {
                      converterType = CONSTANTS.quantiles.review
                      if (orderAsObject.reviewST) {
                        drafter[converterType].time += Number(orderAsObject.reviewST);
                        drafter[converterType].ordersTotal++;
                        drafter[converterType].cameras += Number(orderAsObject.cameras);
                      }

                    }
                  }
                }
                else if (orderAsObject.isCreator && !orderAsObject.isRecipient) {
                  converterType = CONSTANTS.quantiles.review
                  if (orderAsObject.reviewST) {

                    drafter[converterType].time += Number(orderAsObject.reviewST);
                    drafter[converterType].ordersTotal++;
                    drafter[converterType].cameras += Number(orderAsObject.cameras);
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
    this.orders.sort((a, b) => new Date(a) - new Date(b))
    return members
  }

  getCalculations(members) {

    for (const drafterUid of Object.values(members)) {
      for (const fpEsx of CONSTANTS.fpOrEsxKeysList) {
        for (const normalBig of CONSTANTS.normalBigKeysList) {

          const program = drafterUid.data[fpEsx][normalBig];
          drafterUid.dateStart = new Date(this.orders.at(0)).getTime()

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
              };
            };
          }
        };
      };
    };
    return members;
  }

  getTeams() {
    const sheetName = 'Teams info';
    Logger.log('Creating teams...');
    const sheetTeams = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1bNNxTlfZbEwcz26y_In32__5kEE67Vibq5Vp4DIVfjc/edit?gid=550950070#gid=550950070').getSheetByName(sheetName)
    const valuesTeams = sheetTeams.getDataRange().getValues().slice(1)
    // const emailsDb = collectEmailsDb()

    const columns = {
      leaderName: 0,
      leaderUid: 1,
      assistName: 2,
      assistUid: 3,
      memberName: 4,
      memberUid: 5,
      divisionName: 6,
    };
    const teams = {}
    const team = {
      members: {},
      division: '',
      leaderName: '',
      leaderUid: '',
      assistName: '',
      assistUid: '',
    };
    let currentLeaderUid = "";
    let membersArr = []

    for (const row of valuesTeams) {
      if (row[columns.leaderName] === 'Total' || row[columns.leaderName] === 'Total Included') {
        continue
      };
      if (row[columns.leaderUid]) {
        const leaderUid = row[columns.leaderUid]
        currentLeaderUid = leaderUid;
        teams[currentLeaderUid] = {
          leaderUid: currentLeaderUid,
          leaderName: row[columns.leaderName],
          assistUid: row[columns.assistUid],
          assistName: row[columns.assistName],
          members: {},
          division: row[columns.divisionName]
        }
      };
      if (row[columns.memberUid]) {
        const memberUid = row[columns.memberUid]
        teams[currentLeaderUid].members[memberUid] = {
          name: row[columns.memberName],
          shortUid: AnotherFunctions.getShortUid(memberUid),
          longUid: memberUid,
        }
      }
    }

    Logger.log('Checking duplicates...')
    // findDuplicates(membersArr)
    Logger.log('Teams created')

    return teams
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

    const sheetWeights = CONSTANTS.spreadsheet.getSheetByName('weights')
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
        drafter[converterType].soloPercentQuantile = spQuantile

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
    this.teams = this.gamification.teams
    this.time = time;
  }

  get programs() {

    const drawSheet = CONSTANTS.spreadsheet.getSheetByName(CONSTANTS.quantiles.draw)
    const reviewSheet = CONSTANTS.spreadsheet.getSheetByName(CONSTANTS.quantiles.review)
    let drawOutput = [[
      'uid', 'date', 'type', 'orders', 'cameras', 'mark_avg', 'solo_orders', 'spent_time', 'solo_percent', 'speed', 'orders_quantile', 'cameras_quantile', 'mark_quantile', 'solo_percent_quantile', 'speed_quantile', 'orders_points', 'cameras_points', 'mark_points', 'solo_percent_points', 'speed_points', 'total_points',
    ]]
    let reviewOutput = [[
      'uid', 'date', 'type', 'orders', 'cameras', 'spent_time', 'speed', 'orders_quantile', 'cameras_quantile', 'speed_quantile', 'orders_points', 'cameras_points', 'speed_points', 'total_points',
    ]]

    // VALUES
    for (const drafterUid of Object.values(this.gamification.members)) {
      const uid = drafterUid.uid

      const date = new Date(this.gamification.orders.at(0)).getTime()
      const program = drafterUid.data

      // Draw
      const drawValues1 = Object.values(Factories.drawOutputFactory(uid, date, CONSTANTS.weights.fpNormalNoConv, program[CONSTANTS.fp][CONSTANTS.normal], 'noConverter'))
      const drawValues2 = Object.values(Factories.drawOutputFactory(uid, date, CONSTANTS.weights.fpBigNoConv, program[CONSTANTS.fp][CONSTANTS.big], 'noConverter'))
      const drawValues3 = Object.values(Factories.drawOutputFactory(uid, date, CONSTANTS.weights.esxNormalConv, program[CONSTANTS.esx][CONSTANTS.normal], 'converter'))
      const drawValues4 = Object.values(Factories.drawOutputFactory(uid, date, CONSTANTS.weights.esxBigConv, program[CONSTANTS.esx][CONSTANTS.big], 'converter'))
      const drawValues5 = Object.values(Factories.drawOutputFactory(uid, date, CONSTANTS.weights.esxNormalNoConv, program[CONSTANTS.esx][CONSTANTS.normal], 'noConverter'))

      // Review
      const reviewValues1 = Object.values(Factories.reviewOutputFactory(uid, date, 'fp_normal', program[CONSTANTS.fp][CONSTANTS.normal]))
      const reviewValues2 = Object.values(Factories.reviewOutputFactory(uid, date, 'fp_big', program[CONSTANTS.fp][CONSTANTS.big]))
      const reviewValues3 = Object.values(Factories.reviewOutputFactory(uid, date, 'esx_normal', program[CONSTANTS.esx][CONSTANTS.normal]))
      const reviewValues4 = Object.values(Factories.reviewOutputFactory(uid, date, 'esx_big', program[CONSTANTS.esx][CONSTANTS.big]))

      drawOutput.push(drawValues1, drawValues2, drawValues3, drawValues4, drawValues5)
      reviewOutput.push(reviewValues1, reviewValues2, reviewValues3, reviewValues4)
    };

    drawSheet.getDataRange().clear()
    reviewSheet.getDataRange().clear()

    drawSheet.getRange(1, 1, drawOutput.length, drawOutput[0].length).setValues(drawOutput)
    reviewSheet.getRange(1, 1, reviewOutput.length, reviewOutput[0].length).setValues(reviewOutput)
  }

  get teamsList() {
    const arrayForWrite = [['memberShortUid', 'managerUid', 'managerRole', 'teamUid', 'division', 'leaderName']]
    for (const teamAsLeaderUid in this.teams) {
      const leaderShortUid = AnotherFunctions.getShortUid(this.teams[teamAsLeaderUid].leaderUid)
      const assistShortUid = AnotherFunctions.getShortUid(this.teams[teamAsLeaderUid].assistUid)
      const managerArray = [leaderShortUid, assistShortUid]
      for (const manager of managerArray) {
        for (const memberAsObject in this.teams[teamAsLeaderUid].members) {
          const memberShortUid = this.teams[teamAsLeaderUid].members[memberAsObject].shortUid
          const managerUid = manager
          const managerRole = manager === leaderShortUid ? 'leader' : 'assist'
          const teamUid = leaderShortUid
          // const managerEmail = this.teams[teamAsLeaderUid].members[memberAsObject].email
          const division = this.teams[teamAsLeaderUid].division
          const leaderName = this.teams[teamAsLeaderUid].leaderName
          arrayForWrite.push([memberShortUid, managerUid, managerRole, teamUid,leaderName,division])
        }
      }
    }
    const sheetNameTeams = 'TeamsForDatabase'
    const spreadsheetTeams = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1bNNxTlfZbEwcz26y_In32__5kEE67Vibq5Vp4DIVfjc/edit?gid=550950070#gid=550950070')
    if (!spreadsheetTeams.getSheetByName(sheetNameTeams)) {
      spreadsheetTeams.insertSheet(sheetNameTeams)
    }
    const sheetTeams = spreadsheetTeams.getSheetByName(sheetNameTeams)
    sheetTeams.clear()
    sheetTeams.getRange(1, 1, arrayForWrite.length, arrayForWrite[0].length).setValues(arrayForWrite)
  }
}

class Member {
  constructor() {
    this[CONSTANTS.fp] = Factories.factoryNormalBig();
    this[CONSTANTS.esx] = Factories.factoryNormalBig();
  };
};