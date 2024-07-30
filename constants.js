const SS = SpreadsheetApp.openByUrl('https://docs.google.com/spreadsheets/d/12QeL_19UjhEXXJZv5aNhO4km3gzT4WQZlTKsN6NpZ5I/edit?gid=1913073617#gid=1913073617');

const sheetName_ = 'emplanner';
const indexColumnDate_ = 0;
const indexColumnOrderId_ = 1;
const indexColumnPlatform_ = 2;
const indexColumnCreator_ = 3;
const indexColumnRecipients_ = 4;
const indexColumnType_ = 5;
const indexColumnMark_ = 6;
const indexColumnComment_ = 7;
const indexColumnSquare_ = 8;
const indexColumnCameras_ = 9;
const indexColumnSpentTime_ = 10;
const indexColumnReviewSpentTime_ = 11;
const indexColumnCreatorUID_ = 12;
const indexColumnRecipientsUID_ = 13;
const indexColumnConverter_ = 19;

const ROUNDING = {
  points: 0,
  standard: 3,
};

const SHEET_NAMES = {
  programs: 'Programs',
  teams: 'TeamsList',
  total: 'Total',
  teamsOutput: 'Teams'
}

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
};

let PROGRAMS_SHEET = {
  nameIndex: 0,
  isEnabledIndex: 1,
  dataStartIndex: 2,
  groups: {
    indicators: {
      length: 9,
      counterIndex: 1
    },
    coefficients: {
      length: 10,
      counterIndex: 0,
    },
  },
  programs: {},
  fpOrEsxKeysList: [TYPES_OF_ORDERS.fp, TYPES_OF_ORDERS.esx],
  normalBigKeysList: [TYPES_OF_ORDERS.normal, TYPES_OF_ORDERS.big],
};

const factoryCategories = () => {
  return {
    speedNoConverter: {},
    speedConverter: {},
    rating: {},
    soloPercent: {},
    speedReview: {},
  };
};


class Formulas {

  static getRounding(number) {
    return Number(Number(number).toFixed(ROUNDING.standard))
  };

  static getSpeed(time, cameras) {
    if (time == 0 || cameras == 0) return 0
    return Formulas.getRounding(time / cameras)
  };

  static getAverage(array) {
    if (array.length === 0) return 0
    const sum = array.reduce((acc, current) => acc + current)
    return Formulas.getRounding(sum / array.length)
  };

  static getSoloPercent(solo, share) {
    if (solo == 0) return 0
    return Formulas.getRounding(solo / (solo + share) * 100)
  };

  static getCoefficient(myIndicator, indicators, coefficients) {

    if (typeof myIndicator == 'undefined') {
      throw Error("myIndicator is undefined")
    }
    const getFormattedArray = (array) => {
      let arrayCopy = [...array]
      arrayCopy = arrayCopy.filter(element => element !== '' && element !== 0)
      return arrayCopy
    };

    const indicatorsFormattedArray = getFormattedArray(indicators);
    const coefficientsFormattedArray = getFormattedArray(coefficients);

    const minIndicator = indicatorsFormattedArray.at(0);
    const maxIndicator = indicatorsFormattedArray.at(-1);
    const minCoefficient = coefficientsFormattedArray.at(0);
    const maxCoefficient = coefficientsFormattedArray.at(-1);

    if (myIndicator >= maxIndicator) return maxCoefficient;
    if (myIndicator < minIndicator) return minCoefficient;

    for (let index = 0; index < indicatorsFormattedArray.length; index++) {

      const currentIndicator = indicators[index];
      const nextIndicator = indicatorsFormattedArray[index + 1] || maxIndicator;

      if (index === 0 && myIndicator < currentIndicator) {
        return minCoefficient;
      } else if (currentIndicator <= myIndicator && myIndicator < nextIndicator) {
        return coefficientsFormattedArray[index + 1];
      } else if (index === indicators.length - 1 && currentIndicator < myIndicator) {
        return maxCoefficient;
      };
    };
    throw Error("Не выбран коэффициент")
  };


  static getPoints(program, type) {
    let points;
    if (type === TYPES_OF_ORDERS.review) {
      points = (program.review.orders * program.review.speedCoefficient)
      if (typeof points === 'undefined' || typeof points === 'null' || isNaN(points)) {
        throw Error('Something with points review')
      };
    } else {
      points = (program.noConverter.totalOrders * program.noConverter.speedCoefficient + program.converter.totalOrders * program.converter.speedCoefficient) * program.soloCoefficient * program.markCoefficient;
      if (typeof points === 'undefined' || typeof points === 'null' || isNaN(points)) {
        throw Error('Something with points bigNormal')
      };
    };
    return Formulas.getRounding(points);
  };

  static getTotalPointsArr(points, program) {
    if (points[program]) {
      const sum = points[program].drawing + points[program].review
      return [sum];
    } else {
      let arr = [];
      for (let subCatalog of Object.values(points)) {
        arr.push(...this.getTotalPointsArr(subCatalog, program));
      };
      return arr;
    };
  };

  static getTotalPointsArrProgram(members, program) {
    let arr = [];
    for (const member of Object.values(members)) {
      arr.push(member.totalPointsArr[program].reduce((acc, current) => acc + current, 0))
    };
    return arr.filter(a => a !== 0).sort((a, b) => a - b)
  };

  static getQuartile(arr) {

    function getQuartilePosition(arr, quartile) {
      return (arr.length - 1) * quartile;
    };

    function interpolate(arr, pos) {
      const lower = Math.floor(pos);
      const upper = Math.ceil(pos);
      if (lower === upper) {
        return arr[lower];
      };
      return arr[lower] + (arr[upper] - arr[lower]) * (pos - lower);
    };
    const q0Pos = getQuartilePosition(arr, 0);
    const q1Pos = getQuartilePosition(arr, 0.25);
    const q2Pos = getQuartilePosition(arr, 0.50);
    const q3Pos = getQuartilePosition(arr, 0.75);
    const q4Pos = getQuartilePosition(arr, 1);

    const q0 = interpolate(arr, q0Pos);
    const q1 = interpolate(arr, q1Pos);
    const q2 = interpolate(arr, q2Pos);
    const q3 = interpolate(arr, q3Pos);
    const q4 = interpolate(arr, q4Pos);

    return {
      q0: q0,
      q1: q1,
      q2: q2,
      q3: q3,
      q4: q4
    };
  };

  static getPercentile(arr, number, type, ordersPercentile) {
    let copyArr = [...arr]
    const higerIsBetter = ['orders', 'cameras', 'mark', 'soloPercent']
    const lessIsBetter = ['speed']
    let result
    const upIndex = copyArr.filter(num => num >= number)
    const lowIndex = copyArr.filter(num => num <= number)

    if (arr.includes(number)) {
      switch (type) {
        case 'speed':
          if (ordersPercentile) {
            copyArr = copyArr.sort((a, b) => b - a)
            result = upIndex.length / copyArr.length * 100
            break;
          }
          else {
            return 0
          }
        case 'soloPercent':
          if (ordersPercentile) {
            result = lowIndex.length / copyArr.length * 100
            break;
          }
          else {
            return 0
          }
        default:
          result = lowIndex.length / copyArr.length * 100
          break;
      }
    }
    else {
      return 0
    }
    return Number((result / 100).toFixed(3))
  }


  // static getPercentile(arr, number, type) {
  //   // else {
  //   //   const lowP = (copyArr.indexOf(lowIndex) + 1) / copyArr.length * 100 //  перцентиля для нижней границы
  //   //   const upP = (copyArr.indexOf(upIndex) + 1) / copyArr.length * 100 //  перцентиля для верхней границы
  //   //   result = (lowP + (number - lowIndex) / (upIndex - lowIndex) * (upP - lowP)) // линейная интерполяция 
  //   // }

  //   let copyArr = [...arr]
  //   const higerIsBetter = ['orders', 'cameras', 'mark', 'soloPercent']
  //   const lessIsBetter = ['speed']
  //   let result
  //   if (type && lessIsBetter.includes(type)) {
  //     copyArr = copyArr.sort((a, b) => b - a)
  //     if (!number) {
  //       const lowIndex = copyArr.filter(num => num <= number)
  //       result = (lowIndex.length / copyArr.length * 100)
  //     }
  //     else {
  //       result = (upIndex.length / copyArr.length * 100)
  //     }
  //   }
  //   else {
  //     if (!number) {
  //       const upIndex = copyArr.filter(num => num >= number)
  //       result = (upIndex.length / copyArr.length * 100)

  //     }
  //     else {
  //       const lowIndex = copyArr.filter(num => num <= number)
  //       result = (lowIndex.length / copyArr.length * 100)
  //     }
  //   }
  //   return Number((result / 100).toFixed(3)) // квантиль
  // }

  static getPlace(arr, number, type) {
    let copyArr = [...arr]
    const higerIsBetter = ['mark', 'orders', 'cameras', 'soloPercent']
    const lessIsBetter = ['speed']
    if (!arr.includes(number)) {
      return {
        place: 0,
        places: copyArr.length
      }
    }
    let result, lowIndex, upIndex
    if (type && lessIsBetter.includes(type)) {

      lowIndex = copyArr.filter(num => num <= number).at(-1) // нижняя граница [1,2,2,3]
      // upIndex = copyArr.filter(num => num <= number).at(0) // верхняя граница
      result = {
        place: copyArr.indexOf(lowIndex) + 1,
        places: copyArr.length
      }
    }
    else {
      copyArr = copyArr.sort((a, b) => b - a)
      // lowIndex = copyArr.filter(num => num >= number).at(-1) // нижняя граница
      upIndex = copyArr.filter(num => num <= number).at(0) // верхняя граница [3,2,2,1]
      result = {
        place: copyArr.indexOf(upIndex) + 1,
        places: copyArr.length
      }
    }

    return result
  }
}

