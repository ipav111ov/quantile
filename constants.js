const CONSTANTS = {
  speadsheetControlPanel : SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/1lzcIm1Y0anh3YQZLToeEzp6S9qJhSWSuCtb9jvfwUH4/edit?gid=1546049928#gid=1546049928'),

  fp: "DRAWING",
  esx: "DRAWING_ESX",
  big: "BIG",
  normal: "NORMAL",
  review: 'REVIEW',
  converterType: {
    converter: 'converter',
    noConverter: 'noConverter',
    review: 'review',
  },
  bigOrderReqs: {
    cameras: 75,
    square: 500,
  },
  fpOrEsxKeysList: ["DRAWING", "DRAWING_ESX"],
  normalBigKeysList: ["NORMAL", "BIG"],
  quantiles: {
    draw: 'draw',
    review: 'review',
  },
  weights: {
    fpNormalNoConv: 'fp_normal_noConv',
    fpBigNoConv: 'fp_big_noConv',
    esxNormalConv: 'esx_normal_conv',
    esxBigConv: 'esx_big_conv',
    esxNormalNoConv: 'esx_normal_noConv',
  },
  rounding: {
    points: 0,
    standard: 3,
  },
  indexes: {
    sheetName: 'emplanner',
    indexDate: 0,
    indexOrderId: 1,
    indexPlatform: 2,
    indexCreator: 3,
    indexRecipients: 4,
    indexType: 5,
    indexMark: 6,
    indexComment: 7,
    indexSquare: 8,
    indexCameras: 9,
    indexSpentTime: 10,
    indexReviewSpentTime: 11,
    indexCreatorUID: 12,
    indexRecipientsUID: 13,
    indexConverter: 17,
  },

}



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

  static getPlace(arr, number, speed) {
    let copyArr = [...arr]
    const [moreIsBetter, lessIsBetter] = [['orders', 'cameras', 'mark', 'soloPercent'], ['speed']]
    if (!arr.includes(number)) {
      return {
        place: 0,
        places: copyArr.length,
        quantile: 0
      }
    }
    if (!speed) {
      copyArr = copyArr.sort((a, b) => b - a)// [4,3,2,2,2,1] 6 - 1 = 5/6
    }

    return {
      place: copyArr.indexOf(number) + 1, //[1,2,2,2,3,4] 6 - 4 = 2/6 
      places: copyArr.length,
      quantile: (copyArr.length - copyArr.indexOf(number)) / copyArr.length || 0
    }
  }
}

class Factories {

  static typeFactory() {
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
  static factoryReview() {
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

  static factoryNormalBig() {
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
        review: this.factoryReview(),

        points: 0,
        reviewPoints: 0,
      };
    };

    return {
      [CONSTANTS.normal]: factoryFields(),
      [CONSTANTS.big]: factoryFields(),
    };
  };

  static factoryPointsFpOrEsx() {
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

  static reviewOutputFactory(uid, date, type, program) {
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

  static drawOutputFactory(uid, date, type, program, converterType) {
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
}

class AnotherFunctions {

  static getExcludedZeros(array) {
    const newArray = array.map(value => value === 0 ? '' : value)
    return newArray
  };

  static getShortUid(uid = '23-000111') {
    return Number(uid.replace(/\s+/g, '').substring(3));
  }


  static findDuplicates(array) {
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
  static arraysEqual(cArr1, cArr2) {
    let arr1 = [...cArr1]
    let arr2 = [...cArr2]
    arr1 = cArr1.sort()
    arr2 = cArr2.sort()
    if (arr1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }



}