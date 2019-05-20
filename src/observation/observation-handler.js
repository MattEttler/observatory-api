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