function getEmblemLinks() {
  const lions = DriveApp.getFileById('1_g-bksnrpg-BoVAqpAYabWR1-tv2G7tZ')
  console.log(lions.isFile())
  const files = lions.getFiles()
  const arrayForWrite = [['uid', 'link']]
  const template = `https://drive.google.com/thumbnail?id=`
  const ext = '.png'
  while (files.hasNext()) {
    console.log(file.getMimeType())
    const file = files.next()
        console.log(file.isFile())
    const uid = file.getName().replace(ext, '')
    const id = file.getId()
    const link = template + id
    arrayForWrite.push([uid, link])
  }
  return arrayForWrite
}
