'use strict';

const observationUtil = require('./observation.util.js');

module.exports.getUploadURL = async function (event) {
  const fileLocation = observationUtil.requestObservationUploadLink();
  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl: fileLocation.url,
      fileName: fileLocation.fileName
    }),
  };
};