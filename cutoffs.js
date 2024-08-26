function createCutoffs() {
  const arrayForWrite = [['id', 'timestamp', 'name']]
  let startDate = moment('08/16/2024')
  const format = 'DD MMM YYYY'

  for (let i = 1; i <= 30; i = i + 2) {
    const startCutoff1 = moment(startDate).format(format)
    const startCutoff1Timestamp = moment(startCutoff1).valueOf()
    const endCutoff1 = moment(startDate).add(14, 'days').format(format)

    const startCutoff2 = moment(startDate).add(15, 'days').format(format)
    const startCutoff2Timestamp = moment(startCutoff2).valueOf()
    const endCutoff2 = moment(startDate).endOf('month').format(format)
    arrayForWrite.push([i, startCutoff1Timestamp, `${startCutoff1} - ${endCutoff1}`], [i+1, startCutoff2Timestamp, `${startCutoff2} - ${endCutoff2}`])
    startDate = startDate.add(1, 'month')
  }
  return
}