'use strict';

const observationUtil = require('./observation.util.js');

module.exports.getUploadURL = async function (event) {
  const fileLocation = observationUtil.requestObservationUploadLink(event.queryStringParameters.fileType);
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      uploadUrl: fileLocation.url,
      fileName: fileLocation.fileName
    }),
  };
};

module.exports.getLatest = async function (event) {
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(
      await observationUtil.getLatestObservation()
    )
  };

  return response;
};

module.exports.measureFoliage = async function (event) {
  event.Records.forEach(record => {
    console.log(record.s3.object.bucket + "/" + record.s3.object.key);
  });
  console.log(event.Records);
  console.log("observation captured");
  console.log(event.Records[0].s3.object.key);
  await observationUtil.measureFoliage(event.Records[0].s3.bucket.name, event.Records[0].s3.object.key);
};

module.exports.getFoliageTimeSeries = async function (event) {
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(
      await observationUtil.getFoliageTimeSeries()
    )
  };
  return response;
};

module.exports.rollupFoliageTimeSeries = async function (event) {
  console.log(JSON.stringify(event.Records));
  const eventDate = parseInt(event.Records[0].dynamodb.Keys.date_time.N);
  await observationUtil.rollupFoliageByDate(new Date(eventDate));
};