const SS = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/12QeL_19UjhEXXJZv5aNhO4km3gzT4WQZlTKsN6NpZ5I/edit?gid=1913073617#gid=1913073617');

const sheetName_ = 'emplanner';
const indexDate = 0;
const indexOrderId = 1;
const indexPlatform = 2;
const indexCreator = 3;
const indexRecipients = 4;
const indexType = 5;
const indexMark = 6;
const indexComment = 7;
const indexSquare = 8;
const indexCameras = 9;
const indexSpentTime = 10;
const indexReviewSpentTime = 11;
const indexCreatorUID = 12;
const indexRecipientsUID = 13;
const indexConverter = 19;

const ROUNDING = {
  points: 0,
  standard: 3,
};

const TYPES_OF_ORDERS = {
  fp: "DRAWING",
  esx: "DRAWING_ESX",
  big: "BIG",
  normal: "NORMAL",
  review: 'REVIEW',
  converterType: {
    converter: 'converter',
    noConverter: 'noConverter',
  },
  bigOrderReqs: {
    cameras: 75,
    square: 500,
  },
  fpOrEsxKeysList: ["DRAWING", "DRAWING_ESX"],
  normalBigKeysList: ["NORMAL", "BIG"],
};

















class Formulas {

  static getRounding(number, rounding) {
    return Number(Number(number).toFixed(rounding))
  };

  static getSpeed(time, cameras) {
    if (time == 0 || cameras == 0) return 0
    return time / cameras
  };

  static getAverage(array) {
    if (array.length === 0) return 0
    const sum = array.reduce((acc, current) => acc + current)
    return sum / array.length
  };

  static getSoloPercent(soloOrders, shareOrders) {
    if (soloOrders == 0) return 0
    return soloOrders / (soloOrders + shareOrders) * 100
  };

  static getQuantile(arr, number, type, ordersQuantile) {
    let [copyArr, result] = [[...arr], 0]
    const [moreIsBetter, lessIsBetter] = [['orders', 'cameras', 'mark', 'soloPercent'], ['speed']]
    let upIndex = copyArr.filter(num => num >= number)
    const lowIndex = copyArr.filter(num => num <= number)

    if (arr.includes(number)) {
      switch (type) {
        case 'speed':
          if (ordersQuantile) {
            copyArr = copyArr.sort((a, b) => b - a)
            upIndex = copyArr.filter(num => num >= number)
            result = upIndex.length / copyArr.length
            break;
          }
          else {
            return 0
          }
        case 'soloPercent':
          if (ordersQuantile) {
            result = lowIndex.length / copyArr.length
            break;
          }
          else {
            return 0
          }
        default:
          result = lowIndex.length / copyArr.length
          break;
      }
    }
    else {
      return 0
    }
    return result
  }

  static getPlace(arr, number, type) {
    let copyArr = [...arr]
    const [moreIsBetter, lessIsBetter] = [['orders', 'cameras', 'mark', 'soloPercent'], ['speed']]
    if (!arr.includes(number)) {
      return {
        place: 0,
        places: copyArr.length
      }
    }
    if (!type) {
      copyArr = copyArr.sort((a, b) => b - a)// [4,3,2,2,2,1] 6 - 1 = 5/6
    }

    return {
      place: copyArr.indexOf(number) + 1, //[1,2,2,2,3,4] 6 - 4 = 2/6 
      places: copyArr.length,
      quantile: (copyArr.length - copyArr.indexOf(number)) / copyArr.length
    }
  }
}












// FACTORIES

const typeFactory = () => {
  const groupFactory = () => {
    return {
      orders: [],
      cameras: [],
      mark: [],
      soloPercent: [],
      speed: [],
    }
  }
  return {
    draw: {
      fp_normal_noConv: groupFactory(),
      fp_big_noConv: groupFactory(),
      esx_normal_conv: groupFactory(),
      esx_big_conv: groupFactory(),
      esx_normal_noConv: groupFactory(),
    },
    review: {
      fp_normal_noConv: groupFactory(),
      fp_big_noConv: groupFactory(),
      esx_normal_conv: groupFactory(),
      esx_big_conv: groupFactory(),
    }
  }
}
const factoryReview = () => {
  return {
    time: 0,

    ordersTotal: 0,
    ordersQuantile: 0,
    ordersPoints: 0,
    ordersArray: [],
    ordersPlace: 0,
    ordersPlaces: 0,

    cameras: 0,
    camerasQuantile: 0,
    camerasPoints: 0,
    camerasPlace: 0,
    camerasPlaces: 0,

    speed: 0,
    speedQuantile: 0,
    speedPoints: 0,
    speedPlace: 0,
    speedPlaces: 0,

    totalPoints: 0,
  };
};

const factoryNormalBig = () => {
  const factoryFields = () => {
    const factoryConverterType = () => {
      return {
        time: 0,
        square: 0,

        ordersSolo: 0,
        ordersShared: 0,
        ordersTotal: 0,
        ordersQuantile: 0,
        ordersPoints: 0,
        ordersArray: [],
        ordersPlace: 0,
        ordersPlaces: 0,

        cameras: 0,
        camerasQuantile: 0,
        camerasPoints: 0,
        camerasPlace: 0,
        camerasPlaces: 0,

        markArray: [],
        markAverage: 0,
        markQuantile: 0,
        markPoints: 0,
        markAveragePlace: 0,
        markAveragePlaces: 0,

        soloPercent: 0,
        soloPercentQuantile: 0,
        soloPercentPoints: 0,
        soloPercentPlace: 0,
        soloPercentPlaces: 0,

        speed: 0,
        speedQuantile: 0,
        speedPoints: 0,
        speedPlace: 0,
        speedPlaces: 0,

        totalPoints: 0,

      };
    };

    return {
      converter: factoryConverterType(),
      noConverter: factoryConverterType(),
      review: factoryReview(),

      points: 0,
      reviewPoints: 0,
    };
  };

  return {
    [TYPES_OF_ORDERS.normal]: factoryFields(),
    [TYPES_OF_ORDERS.big]: factoryFields(),
  };
};

const factoryPointsFpOrEsx = () => {
  const factoryPointsNormalBig = () => {
    return {
      drawing: 0,
      review: 0,
    };
  };
  return {
    fp: factoryPointsNormalBig(),
    esx: factoryPointsNormalBig()
  };
};

const reviewOutputFactory = (uid, date, type, program) => {
  return {
    'uid': uid,
    'date': date,
    'type': type,
    'orders': program.review.ordersTotal || '',
    'cameras': program.review.cameras || '',
    "review_st": program.review.time || '',
    'review_speed': program.review.speed || '',

    'orders_quantile': program.review.ordersQuantile || '',
    'cameras_quantile': program.review.camerasQuantile || '',
    'speed_quantile': program.review.speedQuantile || '',

    'order_points': program.review.ordersPoints || '',
    'cameras_points': program.review.camerasPoints || '',
    'speed_points': program.review.speedPoints || '',

    'total_points': program.review.totalPoints || '',
    // 'orders_array': program.review.ordersArray.join(', '),
  };
};

const drawOutputFactory = (uid, date, type, program, converterType) => {
  return {
    'uid': uid,
    'date': date,
    'type': type,
    'orders': program[converterType].ordersTotal || '',
    'cameras': program[converterType].cameras || '',
    'mark_avg': program[converterType].markAverage || '',
    'solo_orders': program[converterType].ordersSolo || '',
    "spent_time": program[converterType].time || '',
    'solo_percent': program[converterType].soloPercent || '',
    'speed': program[converterType].speed || '',

    'orders_quantile': program[converterType].ordersQuantile || '',
    'cameras_quantile': program[converterType].camerasQuantile || '',
    'mark_quantile': program[converterType].markQuantile || '',
    'solo_percent_quantile': program[converterType].soloPercentQuantile || '',
    'speed_quantile': program[converterType].speedQuantile || '',

    'orders_points': program[converterType].ordersPoints || '',
    'cameras_points': program[converterType].camerasPoints || '',
    'mark_points': program[converterType].markPoints || '',
    'solo_percent_points': program[converterType].soloPercentPoints || '',
    'speed_points': program[converterType].speedPoints || '',

    'total_points': program[converterType].totalPoints || '',
    // 'orders_array': program[converterType].ordersArray.join(', '),
  };
};











// Misc functions 

const getExcludedZeros = (array) => {
  const newArray = array.map(value => value === 0 ? '' : value)
  return newArray
};

function findDuplicates(array) {
  const duplicates = [];
  const seen = {};

  for (let i = 0; i < array.length; i++) {
    const currentItem = array[i];
    if (seen[currentItem]) {
      if (!duplicates.includes[currentItem]) {
        duplicates.push(currentItem)
      }
    } else {
      seen[currentItem] = true;
    };
  }
  duplicates.length > 0 ? Logger.log(`Обнаружены дубликаты - ${duplicates}`) : Logger.log(`Дупликатов нет`);
  return duplicates;
};
