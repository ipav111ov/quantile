// function main() {
//   const time = moment(new Date()).tz('Asia/Tbilisi').format('ll' + ' LTS')
//   const gamification = new Gamification(SS);
//   const output = new Output(gamification, time);
//   output.programs
//   Logger.log('Completed')
//   //TODO сверка speedpercentile 23-0000344 у меня считае меншье
// }


// class Gamification {
//   constructor(spreadsheet) {
//     this.spreadsheet = spreadsheet;
//     this.orders = []
//     this.members = this.getCalculations(this.getMembers());
//     // this.teams = this.getTeams();
//     // this.weights = this.getWeights();
//     // this.arraysForPercentile = this.getArraysForPercentile()
//     // this.percentileAndPointsProcedure()
//     // this.json()
//   };

//   json() {
//     const fileSets = {
//       mimeType: 'application/json',
//       name: new Date()
//     };
//     const json = JSON.stringify(this.members)
//     const blob = Utilities.newBlob(json, 'application/json')
//     const file = Drive.Files.create(fileSets, blob)
//   }

//   getMembers() {

//     const orders = getOrders(getValuesFromSS());
//     filterOrders(orders)

//     const members = {};
//     for (const order in orders) {
//       for (const fpEsx in orders[order]) {
//         const feedback = {}
//         for (const orderAsDate in orders[order][fpEsx]) {
//           const feedback = {}
//           const row = orders[order][fpEsx][orderAsDate];
//           const date = row[indexColumnDate_];
//           const orderId = row[indexColumnOrderId_];
//           const platform = row[indexColumnPlatform_];
//           const creator = row[indexColumnCreator_];
//           const creatorUid = row[indexColumnCreatorUID_]
//           const recipients = row[indexColumnRecipients_];
//           const recipientsUid = row[indexColumnRecipientsUID_];
//           const type = row[indexColumnType_];
//           const mark = row[indexColumnMark_];
//           const square = row[indexColumnSquare_];
//           const cameras = row[indexColumnCameras_];
//           const st = row[indexColumnSpentTime_];
//           const reviewST = row[indexColumnReviewSpentTime_];
//           const recipientsArr = recipients ? recipients.split(',') : [];
//           const recipientsArrUid = recipientsUid ? recipientsUid.split(',') : [];
//           const isConverter = row[indexColumnConverter_];

//           let creatorFlag = false;
//           for (let indexRecipient in recipientsArrUid) {
//             const recipientUid = recipientsArrUid[indexRecipient];
//             if (!feedback[recipientUid]) {
//               feedback[recipientUid] = {};
//               feedback[recipientUid].orders = {};
//               feedback[recipientUid].name = recipientsArr[indexRecipient]
//             }
//             if (creatorUid.indexOf(recipientUid) == 0 && creatorUid.length == recipientUid.length) {
//               feedback[recipientUid].orders[date] = createRecord_(date, orderId, platform, type, mark, square, cameras, st, reviewST, recipientsArr.length, true, true, recipientsArrUid, isConverter);
//               creatorFlag = true;
//             } else {

//               feedback[recipientUid].orders[date] = createRecord_(date, orderId, platform, type, mark, square, cameras, st, reviewST, recipientsArr.length, true, false, recipientsArrUid, isConverter);
//             }
//           }
//           if (!creatorFlag) {
//             if (!feedback[creatorUid]) {
//               feedback[creatorUid] = {};
//               feedback[creatorUid].orders = {};
//               feedback[creatorUid].name = creator;
//               feedback[creatorUid].order = createRecord_(date, orderId, platform, type, mark, square, cameras, st, reviewST, recipientsArr.length, false, true, recipientsArrUid, isConverter);
//             } else {
//               feedback[creatorUid].order //todo += reviewST
//             }
//             //todo перезаписать оценку для реципиентов
//           }
//           // todo закрываем цикл с 40 строки
//           for (let drafterUid in feedback) {
//             if (!members[drafterUid]) {
//               members[drafterUid] = {}
//               members[drafterUid].data = new Member();
//               members[drafterUid].name = feedback[drafterUid].name;
//               members[drafterUid].uid = drafterUid;

//             }
//             // заказы
//             for (const orderAsDateString in feedback[drafterUid].orders) {
//               const orderAsObject = feedback[drafterUid].orders[orderAsDateString]

//               this.orders.push(orderAsDateString)

//               if (orderAsObject.type === TYPES_OF_ORDERS.fp || orderAsObject.type === TYPES_OF_ORDERS.esx) {

//                 let converterType;

//                 const square = typeof orderAsObject.square == 'number' ? orderAsObject.square : typeof orderAsObject.square == 'string' ? orderAsObject.square : 0;
//                 const cameras = typeof orderAsObject.cameras == 'number' ? orderAsObject.cameras : typeof orderAsObject.cameras == 'string' ? orderAsObject.cameras : 0;

//                 const normalBig = square >= TYPES_OF_ORDERS.bigOrderReqs.square || cameras >= TYPES_OF_ORDERS.bigOrderReqs.cameras ? TYPES_OF_ORDERS.big : TYPES_OF_ORDERS.normal;

//                 if (orderAsObject.type === TYPES_OF_ORDERS.esx && normalBig === TYPES_OF_ORDERS.big) {
//                   converterType = 'converter'
//                 }
//                 else if (orderAsObject.type === TYPES_OF_ORDERS.fp) {
//                   converterType = 'noConverter'
//                 }
//                 else {
//                   converterType = orderAsObject.type === TYPES_OF_ORDERS.esx && orderAsObject.isConverter ? 'converter' : 'noConverter';
//                 }

//                 const drafter = members[drafterUid].data[orderAsObject.type][normalBig]

//                 if (orderAsObject.isRecipient) {
//                   if (!drafter[converterType].ordersArray[orderAsObject.orderId]) {
//                     drafter[converterType].ordersArray[orderAsObject.orderId] = orderAsObject
//                   }
//                   else {
//                     const oldDate = drafter[converterType].ordersArray[orderAsObject.orderId].date
//                     const newDate = orderAsObject.date

//                     if (new Date(newDate) - new Date(oldDate) >= 0) {
//                       drafter[converterType].ordersArray[orderAsObject.orderId] = orderAsObject
//                     }
//                   }


//                   drafter[converterType].time += Number(orderAsObject.st);
//                   drafter[converterType].cameras += Number(orderAsObject.cameras);
//                   orderAsObject.recipientArray.length < 2 ? drafter[converterType].ordersSolo++ : drafter[converterType].ordersShared++;
//                   drafter[converterType].square += Formulas.getRounding(orderAsObject.square);
//                   drafter[converterType].markArray.push(Number(orderAsObject.mark));

//                 }
//                 else if (orderAsObject.isCreator && !orderAsObject.isRecipient) {
//                   converterType = 'review'
//                   if (!drafter[converterType].ordersArray[orderAsObject.orderId]) {
//                     drafter[converterType].ordersArray[orderAsObject.orderId] = orderAsObject
//                   }
//                   else {
//                     const oldDate = drafter[converterType].ordersArray[orderAsObject.orderId].date
//                     const newDate = orderAsObject.date

//                     if (new Date(newDate) - new Date(oldDate) >= 0) {
//                       drafter[converterType].ordersArray[orderAsObject.orderId] = orderAsObject
//                     }
//                   }


//                   drafter[converterType].time += Number(orderAsObject.reviewST);
//                   drafter[converterType].cameras += Number(orderAsObject.cameras);
//                   drafter[converterType].ordersTotal++;

//                 }
//                 else {
//                   throw new Error('!isRecipient && !isCreator')
//                 }

//               };
//             };
//           };
//         }
//       }
//     }
//     this.orders.sort((a, b) => new Date(a) - new Date(b))
//     return members
//   }

//   getCalculations(members) {

//     for (const drafterUid of Object.values(members)) {
//       for (const fpEsx of PROGRAMS_SHEET.fpOrEsxKeysList) {
//         for (const normalBig of PROGRAMS_SHEET.normalBigKeysList) {

//           const program = drafterUid.data[fpEsx][normalBig];
//           drafterUid.dateStart = new Date(this.orders.at(0)).getTime()


//           //SPEED
//           let time, cameras

//           if (program.review.time || program.review.cameras) {
//             time = program.review.time;
//             cameras = program.review.cameras;
//             program.review.speed = Formulas.getSpeed(time, cameras);
//           };

//           for (const converterType of Object.values(TYPES_OF_ORDERS.converterType)) {

//             if (program[converterType].time) {

//               time = program[converterType].time;
//               cameras = program[converterType].cameras;
//               program[converterType].speed = Formulas.getSpeed(time, cameras);

//               //TOTAL
//               const ordersSolo = program[converterType].ordersSolo;
//               const ordersShared = program[converterType].ordersShared;
//               program[converterType].ordersTotal = ordersSolo + ordersShared;

//               //RATING
//               program[converterType].markAverage = Formulas.getAverage(program[converterType].markArray);

//               //SOLO_PERCENT
//               let totalSoloOrders = 0;
//               let totalShareOrders = 0;

//               for (const converterType1 of Object.values(TYPES_OF_ORDERS.converterType)) {
//                 totalSoloOrders += program[converterType1].ordersSolo;
//                 totalShareOrders += program[converterType1].ordersShared;
//               };
//               program[converterType].soloPercent = Formulas.getSoloPercent(totalSoloOrders, totalShareOrders);
//             };
//           };
//         };
//       };
//     };
//     return members;
//   }

//   getTeams() {
//     const sheetName = 'TeamsList';
//     Logger.log('Creating teams...');
//     const sheetTeams = ss.getSheetByName(sheetName);
//     const valuesTeams = sheetTeams.getDataRange().getValues().slice(4);
//     const emailsDb = collectEmailsDb();

//     const columns = {
//       leaderName: 0,
//       leaderUid: 1,
//       memberName: 2,
//       memberUid: 3,
//     };
//     const teams = {};
//     let currentLeaderUid = "";
//     let membersArr = []

//     for (const row of valuesTeams) {
//       if (row[columns.leaderName] === 'Total' || row[columns.leaderName] === 'Total Included') {
//         continue
//       };
//       if (row[columns.leaderUid]) {
//         const leaderUid = row[columns.leaderUid]
//         currentLeaderUid = leaderUid;
//         teams[currentLeaderUid] = {};
//       };
//       if (row[columns.memberUid]) {
//         const memberUid = row[columns.memberUid]
//         teams[currentLeaderUid][memberUid] = emailsDb[memberUid]
//       }
//     };
//     Logger.log('Checking duplicates...');
//     findDuplicates(membersArr)
//     Logger.log('Teams created');

//     return teams
//   };

//   getArraysForPercentile() {
//     const array = typeFactory()

//     function draw(programData, percentileCategory, converterType) {
//       percentileCategory.orders.push(programData[converterType].ordersTotal)
//       percentileCategory.cameras.push(programData[converterType].cameras)
//       percentileCategory.mark.push(programData[converterType].markAverage)
//       percentileCategory.soloPercent.push(programData[converterType].soloPercent)
//       percentileCategory.speed.push(programData[converterType].speed)
//     }

//     function review(programData, percentileCategory) {
//       percentileCategory.orders.push(programData.ordersTotal)
//       percentileCategory.cameras.push(programData.cameras)
//       percentileCategory.speed.push(programData.speed)
//     }

//     for (const drafterUid of Object.values(this.members)) {
//       const uid = drafterUid.uid
//       const programFpNormal = drafterUid.data['DRAWING']["NORMAL"]
//       const programFpBig = drafterUid.data['DRAWING']["BIG"]
//       const programEsxNormal = drafterUid.data['DRAWING_ESX']["NORMAL"]
//       const programEsxBig = drafterUid.data['DRAWING_ESX']["BIG"]

//       // DRAW
//       draw(programFpNormal, array.draw.fp_normal_noConv, 'noConverter')
//       draw(programFpBig, array.draw.fp_big_noConv, 'noConverter')
//       draw(programEsxNormal, array.draw.esx_normal_conv, 'converter')
//       draw(programEsxBig, array.draw.esx_big_conv, 'converter')
//       draw(programEsxNormal, array.draw.esx_normal_noConv, 'noConverter')

//       // REVIEW
//       review(programFpNormal.review, array.review.fp_normal_noConv)
//       review(programFpBig.review, array.review.fp_big_noConv)
//       review(programEsxNormal.review, array.review.esx_normal_conv)
//       review(programEsxBig.review, array.review.esx_big_conv)
//     }

//     let targetLength
//     for (const type of Object.values(array)) {
//       for (const groups of Object.values(type)) {
//         for (let group in groups) {
//           let newGroup = groups[group]
//           newGroup = newGroup.filter(a => a != 0)
//           if (group !== 'soloPercent') {
//             targetLength = newGroup.length
//           }
//           else {
//             while (newGroup.length < targetLength) {
//               newGroup.push(0)
//             }
//           }
//           newGroup.sort((a, b) => a - b)
//           groups[group] = newGroup
//         }

//       }
//     }
//     return array
//   }

//   getWeights() {
//     function reviewObj(array) {
//       const obj = {}
//       for (const row of array) {
//         obj[row[0]] = {
//           orders: row[1],
//           cameras: row[2],
//           speed: row[3],
//         }
//       }
//       return obj
//     }
//     function drawObj(array) {
//       const obj = {}
//       for (const row of array) {
//         obj[row[0]] = {
//           orders: row[1],
//           cameras: row[2],
//           mark: row[3],
//           solo: row[4],
//           speed: row[5],
//         }
//       }
//       return obj
//     }

//     const sheetWeights = SS.getSheetByName('weights')
//     const reviewWeights = sheetWeights.getRange('A1:E5').getValues().slice(1)
//     const drawWeights = sheetWeights.getRange('A7:F12').getValues().slice(1)
//     let obj = {
//       review: reviewObj(reviewWeights),
//       draw: drawObj(drawWeights),
//     }
//     return obj
//   }


//   percentileAndPointsProcedure() {
//     const weights = this.weights
//     for (const drafterUid of Object.values(this.members)) {

//       for (const fpOrEsx of PROGRAMS_SHEET.fpOrEsxKeysList) {
//         for (const normalBig of PROGRAMS_SHEET.normalBigKeysList) {

//           let program = drafterUid.data[fpOrEsx][normalBig]
//           for (let type of Object.keys(this.arraysForPercentile)) {
//             let typeObj = this.arraysForPercentile[type]
//             let converterType

//             if (fpOrEsx === 'DRAWING' && normalBig === 'NORMAL') {
//               let group = 'fp_normal_noConv'

//               switch (type) {
//                 case 'draw':
//                   converterType = 'noConverter'
//                   this.getPercentileAndPoints(program, converterType, typeObj, weights, type, group)
//                   break;

//                 case 'review':
//                   converterType = 'review'
//                   this.getPercentileAndPoints(program, converterType, typeObj, weights, type, group)
//                   break;
//                 default:
//                   'Choose correct type'
//                   break;
//               }
//             }
//             else if (fpOrEsx === 'DRAWING' && normalBig === 'BIG') {
//               let group = 'fp_big_noConv'

//               switch (type) {
//                 case 'draw':
//                   converterType = 'noConverter'
//                   this.getPercentileAndPoints(program, converterType, typeObj, weights, type, group)
//                   break;

//                 case 'review':
//                   converterType = 'review'
//                   this.getPercentileAndPoints(program, converterType, typeObj, weights, type, group)
//                   break;
//                 default:
//                   'Choose correct type'
//                   break;
//               }
//             }
//             else if (fpOrEsx === 'DRAWING_ESX' && normalBig === 'NORMAL') {
//               let group = 'esx_normal_conv'
//               let groupNoConv = 'esx_normal_noConv'

//               switch (type) {
//                 case 'draw':
//                   converterType = 'noConverter'
//                   this.getPercentileAndPoints(program, converterType, typeObj, weights, type, groupNoConv)
//                   this.getPercentileAndPoints(program, 'converter', typeObj, weights, type, group)
//                   break;

//                 case 'review':
//                   converterType = 'review'
//                   this.getPercentileAndPoints(program, converterType, typeObj, weights, type, group)
//                   break;
//                 default:
//                   'Choose correct type'
//                   break;
//               }
//             }
//             else if (fpOrEsx === 'DRAWING_ESX' && normalBig === 'BIG') {
//               let group = 'esx_big_conv'
//               switch (type) {
//                 case 'draw':
//                   converterType = 'converter'
//                   this.getPercentileAndPoints(program, converterType, typeObj, weights, type, group)
//                   break;

//                 case 'review':
//                   converterType = 'review'
//                   this.getPercentileAndPoints(program, converterType, typeObj, weights, type, group)
//                   break;
//                 default:
//                   'Choose correct type'
//                   break;
//               }
//             }
//           }
//         }
//       }
//     }
//   }
//   getPercentileAndPoints(program, converterType, typeObj, weights, type, group) {

//     if (type === 'draw') {
//       program[converterType].ordersPercentile = Formulas.getPercentile(typeObj[group].orders, program[converterType].ordersTotal, 'orders')
//       program[converterType].camerasPercentile = Formulas.getPercentile(typeObj[group].cameras, program[converterType].cameras, 'cameras')
//       program[converterType].markPercentile = Formulas.getPercentile(typeObj[group].mark, program[converterType].markAverage, 'mark')
//       program[converterType].soloPercentPercentile = Formulas.getPercentile(typeObj[group].soloPercent, program[converterType].soloPercent, 'soloPercent', program[converterType].ordersPercentile)
//       program[converterType].speedPercentile = Formulas.getPercentile(typeObj[group].speed, program.noConverter.speed, 'speed', program[converterType].ordersPercentile)


//       const { place: oPlace, places: oPlaces } = Formulas.getPlace(typeObj[group].orders, program[converterType].ordersTotal)
//       program[converterType].ordersPlace = oPlace
//       program[converterType].ordersPlaces = oPlaces

//       const { place: cPlace, places: cPlaces } = Formulas.getPlace(typeObj[group].cameras, program[converterType].cameras)
//       program[converterType].camerasPlace = cPlace
//       program[converterType].camerasPlaces = cPlaces

//       const { place: mPlace, places: mPlaces } = Formulas.getPlace(typeObj[group].mark, program[converterType].markAverage)
//       program[converterType].markAveragePlace = mPlace
//       program[converterType].markAveragePlaces = mPlaces

//       const { place: sPlace, places: sPlaces } = Formulas.getPlace(typeObj[group].soloPercent, program[converterType].soloPercent)
//       program[converterType].soloPercentPlace = sPlace
//       program[converterType].soloPercentPlaces = sPlaces

//       const { place: spPlace, places: spPlaces } = Formulas.getPlace(typeObj[group].speed, program[converterType].speed, 'speed')
//       program[converterType].speedPlace = spPlace
//       program[converterType].speedPlaces = spPlaces

//       let ordersPercentile = program[converterType].ordersPercentile
//       let camerasPercentile = program[converterType].camerasPercentile
//       let markPercentile = program[converterType].markPercentile
//       let soloPercentPercentile = program[converterType].soloPercentPercentile
//       let speedPercentile = program[converterType].speedPercentile

//       let ordersWeight = weights[type][group].orders
//       let camerasWeight = weights[type][group].cameras
//       let markWeight = weights[type][group].mark
//       let soloPercentWeight = weights[type][group].solo
//       let speedWeight = weights[type][group].speed

//       program[converterType].ordersPoints = ordersPercentile * ordersWeight
//       program[converterType].camerasPoints = camerasPercentile * camerasWeight
//       program[converterType].markPoints = markPercentile * markWeight
//       program[converterType].soloPercentPoints = soloPercentPercentile * soloPercentWeight
//       program[converterType].speedPoints = speedPercentile * speedWeight

//       let ordersPoints = program[converterType].ordersPoints
//       let camerasPoints = program[converterType].camerasPoints
//       let markPoints = program[converterType].markPoints
//       let soloPercentPoints = program[converterType].soloPercentPoints
//       let speedPoints = program[converterType].speedPoints

//       program[converterType].totalPoints = ordersPoints + camerasPoints + markPoints + soloPercentPoints + speedPoints
//     }
//     else {


//       program[converterType].ordersPercentile = Formulas.getPercentile(typeObj[group].orders, program[converterType].ordersTotal, 'orders')
//       program[converterType].camerasPercentile = Formulas.getPercentile(typeObj[group].cameras, program[converterType].cameras, 'cameras')
//       program[converterType].speedPercentile = Formulas.getPercentile(typeObj[group].speed, program.noConverter.speed, 'speed', program[converterType].ordersPercentile)

//       const { place: oPlace, places: oPlaces } = Formulas.getPlace(typeObj[group].orders, program[converterType].ordersTotal)
//       program[converterType].ordersPlace = oPlace
//       program[converterType].ordersPlaces = oPlaces

//       const { place: cPlace, places: cPlaces } = Formulas.getPlace(typeObj[group].cameras, program[converterType].cameras)
//       program[converterType].camerasPlace = cPlace
//       program[converterType].camerasPlaces = cPlaces

//       const { place: spPlace, places: spPlaces } = Formulas.getPlace(typeObj[group].speed, program[converterType].speed, 'speed')
//       program[converterType].speedPlace = spPlace
//       program[converterType].speedPlaces = spPlaces

//       let ordersPercentile = program[converterType].ordersPercentile
//       let camerasPercentile = program[converterType].camerasPercentile
//       let speedPercentile = program[converterType].speedPercentile

//       let ordersWeight = weights[type][group].orders
//       let camerasWeight = weights[type][group].cameras
//       let speedWeight = weights[type][group].speed

//       program[converterType].ordersPoints = ordersPercentile * ordersWeight
//       program[converterType].camerasPoints = camerasPercentile * camerasWeight
//       program[converterType].speedPoints = speedPercentile * speedWeight

//       let ordersPoints = program[converterType].ordersPoints
//       let camerasPoints = program[converterType].camerasPoints
//       let speedPoints = program[converterType].speedPoints

//       program[converterType].totalPoints = ordersPoints + camerasPoints + speedPoints
//     }
//   }

// }



// const typeFactory = () => {
//   const groupFactory = () => {
//     return {
//       orders: [],
//       cameras: [],
//       mark: [],
//       soloPercent: [],
//       speed: [],
//     }
//   }
//   return {
//     draw: {
//       fp_normal_noConv: groupFactory(),
//       fp_big_noConv: groupFactory(),
//       esx_normal_conv: groupFactory(),
//       esx_big_conv: groupFactory(),
//       esx_normal_noConv: groupFactory(),
//     },
//     review: {
//       fp_normal_noConv: groupFactory(),
//       fp_big_noConv: groupFactory(),
//       esx_normal_conv: groupFactory(),
//       esx_big_conv: groupFactory(),
//     }
//   }
// }

// class Output {
//   constructor(gamification, time) {
//     this.gamification = gamification;
//     this.time = time;
//   }

//   get programs() {

//     const drawSheet = SS.getSheetByName('draw')
//     const reviewSheet = SS.getSheetByName('review')
//     let drawOutput = [[
//       'uid', 'date', 'type', 'orders', 'cameras', 'mark_avg', 'solo_orders', 'spent_time', 'solo_percent', 'speed', 'orders_percentile', 'cameras_percentile', 'mark_percentile', 'solo_percent_percentile', 'speed_percentile', 'orders_points', 'cameras_points', 'mark_points', 'solo_percent_points', 'speed_points', 'total_points',
//     ]]
//     let reviewOutput = [[
//       'uid', 'date', 'type', 'orders', 'cameras', 'spent_time', 'speed', 'orders_percentile', 'cameras_percentile', 'speed_percentile', 'orders_points', 'cameras_points', 'speed_points', 'total_points',
//     ]]

//     // VALUES
//     for (const drafterUid of Object.values(this.gamification.members)) {
//       const uid = drafterUid.uid

//       const date = this.gamification.orders.at(0);
//       const program = drafterUid.data

//       // Draw
//       const drawValues1 = Object.values(drawOutputFactory(uid, date, 'fp_normal_noConv', program[TYPES_OF_ORDERS.fp][TYPES_OF_ORDERS.normal], 'noConverter'))
//       const drawValues2 = Object.values(drawOutputFactory(uid, date, 'fp_big_noConv', program[TYPES_OF_ORDERS.fp][TYPES_OF_ORDERS.big], 'noConverter'))
//       const drawValues3 = Object.values(drawOutputFactory(uid, date, 'esx_normal_conv', program[TYPES_OF_ORDERS.esx][TYPES_OF_ORDERS.normal], 'converter'))
//       const drawValues4 = Object.values(drawOutputFactory(uid, date, 'esx_big_conv', program[TYPES_OF_ORDERS.esx][TYPES_OF_ORDERS.big], 'converter'))
//       const drawValues5 = Object.values(drawOutputFactory(uid, date, 'esx_normal_noConv', program[TYPES_OF_ORDERS.esx][TYPES_OF_ORDERS.normal], 'noConverter'))

//       // Review
//       const reviewValues1 = Object.values(reviewOutputFactory(uid, date, 'fp_normal', program[TYPES_OF_ORDERS.fp][TYPES_OF_ORDERS.normal]))
//       const reviewValues2 = Object.values(reviewOutputFactory(uid, date, 'fp_big', program[TYPES_OF_ORDERS.fp][TYPES_OF_ORDERS.big]))
//       const reviewValues3 = Object.values(reviewOutputFactory(uid, date, 'esx_normal', program[TYPES_OF_ORDERS.esx][TYPES_OF_ORDERS.normal]))
//       const reviewValues4 = Object.values(reviewOutputFactory(uid, date, 'esx_big', program[TYPES_OF_ORDERS.esx][TYPES_OF_ORDERS.big]))

//       drawOutput.push(drawValues1, drawValues2, drawValues3, drawValues4, drawValues5)
//       reviewOutput.push(reviewValues1, reviewValues2, reviewValues3, reviewValues4)


//     };

//     drawSheet.getDataRange().clear();
//     reviewSheet.getDataRange().clear();

//     drawSheet.getRange(1, 1, drawOutput.length, drawOutput[0].length).setValues(drawOutput);
//     reviewSheet.getRange(1, 1, reviewOutput.length, reviewOutput[0].length).setValues(reviewOutput);
//   }
// }


// class Member {
//   constructor() {
//     this.time = 0;
//     this.totalPointsArr = [];
//     this.points = factoryPointsFpOrEsx();
//     this[TYPES_OF_ORDERS.fp] = factoryNormalBig();
//     this[TYPES_OF_ORDERS.esx] = factoryNormalBig();
//   };
// };

// // FACTORIES

// const factoryReview = () => {
//   return {
//     time: 0,

//     ordersTotal: 0,
//     ordersPercentile: 0,
//     ordersPoints: 0,
//     ordersArray: {},
//     ordersPlace: 0,
//     ordersPlaces: 0,

//     cameras: 0,
//     camerasPercentile: 0,
//     camerasPoints: 0,
//     camerasPlace: 0,
//     camerasPlaces: 0,

//     speed: 0,
//     speedPercentile: 0,
//     speedPoints: 0,
//     speedPlace: 0,
//     speedPlaces: 0,
//   };
// };

// const factoryNormalBig = () => {
//   const factoryFields = () => {
//     const factoryConverterType = () => {
//       return {
//         time: 0,
//         square: 0,

//         ordersSolo: 0,
//         ordersShared: 0,
//         ordersTotal: 0,
//         ordersPercentile: 0,
//         ordersPoints: 0,
//         ordersArray: {},
//         ordersPlace: 0,
//         ordersPlaces: 0,

//         cameras: 0,
//         camerasPercentile: 0,
//         camerasPoints: 0,
//         camerasPlace: 0,
//         camerasPlaces: 0,

//         markArray: [],
//         markAverage: 0,
//         markPercentile: 0,
//         markPoints: 0,
//         markAveragePlace: 0,
//         markAveragePlaces: 0,

//         soloPercent: 0,
//         soloPercentPercentile: 0,
//         soloPercentPoints: 0,
//         soloPercentPlace: 0,
//         soloPercentPlaces: 0,

//         speed: 0,
//         speedPercentile: 0,
//         speedPoints: 0,
//         speedPlace: 0,
//         speedPlaces: 0,

//       };
//     };

//     return {
//       converter: factoryConverterType(),
//       noConverter: factoryConverterType(),
//       review: factoryReview(),

//       points: 0,
//       reviewPoints: 0,
//     };
//   };

//   return {
//     [TYPES_OF_ORDERS.normal]: factoryFields(),
//     [TYPES_OF_ORDERS.big]: factoryFields(),
//   };
// };

// const factoryPointsFpOrEsx = () => {
//   const factoryPointsNormalBig = () => {
//     return {
//       drawing: 0,
//       review: 0,
//     };
//   };
//   return {
//     fp: factoryPointsNormalBig(),
//     esx: factoryPointsNormalBig()
//   };
// };

// const reviewOutputFactory = (uid, date, type, program) => {
//   return {
//     'uid': uid,
//     'date': date,
//     'type': type,
//     'orders': program.review.ordersTotal || '',
//     'cameras': program.review.cameras || '',
//     "review_st": program.review.time || '',
//     'review_speed': program.review.speed || '',

//     'orders_percentile': program.review.ordersPercentile || '',
//     'cameras_percentile': program.review.camerasPercentile || '',
//     'speed_percentile': program.review.speedPercentile || '',

//     'order_points': program.review.ordersPoints || '',
//     'cameras_points': program.review.camerasPoints || '',
//     'speed_points': program.review.speedPoints || '',

//     'total_points': program.review.totalPoints || '',
//     // 'orders_array': program.review.ordersArray.join(', '),
//   };
// };

// const drawOutputFactory = (uid, date, type, program, converterType) => {
//   return {
//     'uid': uid,
//     'date': date,
//     'type': type,
//     'orders': program[converterType].ordersTotal || '',
//     'cameras': program[converterType].cameras || '',
//     'mark_avg': program[converterType].markAverage || '',
//     'solo_orders': program[converterType].ordersSolo || '',
//     "spent_time": program[converterType].time || '',
//     'solo_percent': program[converterType].soloPercent || '',
//     'speed': program[converterType].speed || '',

//     'orders_percentile': program[converterType].ordersPercentile || '',
//     'cameras_percentile': program[converterType].camerasPercentile || '',
//     'mark_percentile': program[converterType].markPercentile || '',
//     'solo_percent_percentile': program[converterType].soloPercentPercentile || '',
//     'speed_percentile': program[converterType].speedPercentile || '',

//     'orders_points': program[converterType].ordersPoints || '',
//     'cameras_points': program[converterType].camerasPoints || '',
//     'mark_points': program[converterType].markPoints || '',
//     'solo_percent_points': program[converterType].soloPercentPoints || '',
//     'speed_points': program[converterType].speedPoints || '',

//     'total_points': program[converterType].totalPoints || '',
//     // 'orders_array': program[converterType].ordersArray.join(', '),
//   };
// };

// // Misc functions 

// const getExcludedZeros = (array) => {
//   const newArray = array.map(value => value === 0 ? '' : value)
//   return newArray
// };

// function findDuplicates(array) {
//   const duplicates = [];
//   const seen = {};

//   for (let i = 0; i < array.length; i++) {
//     const currentItem = array[i];
//     if (seen[currentItem]) {
//       if (!duplicates.includes[currentItem]) {
//         duplicates.push(currentItem)
//       }
//     } else {
//       seen[currentItem] = true;
//     };
//   }
//   duplicates.length > 0 ? Logger.log(`Обнаружены дубликаты - ${duplicates}`) : Logger.log(`Дупликатов нет`);
//   return duplicates;
// };