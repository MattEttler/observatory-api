'use strict';

const observationUtil = require('./observation.util.js');

module.exports.getUploadURL = async function (event) {
  const fileLocation = observationUtil.requestObservationUploadLink();
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