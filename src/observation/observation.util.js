'use strict';

const uuidv4 = require('uuid/v4')
const AWS = require('aws-sdk')

AWS.config.update({
    region: process.env.REGION || 'us-east-1'
})
const s3 = new AWS.S3();

module.exports.requestObservationUploadLink = function (fileType) {

    var dateObj = new Date();
    dateObj.utc
    var month = dateObj.getUTCMonth();
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    const date_stamp = year + "-" + (month + 1) + "-" + day;
    const timestamp = Math.floor(dateObj / 1000)
    const s3Params = {
        Bucket: `o9y.observations/${date_stamp}`,
        Key: `${timestamp}`,
        ContentType: fileType,
        Expires: 900000
    }
    return {
        url: s3.getSignedUrl('putObject', s3Params),
        fileName: `${timestamp}`
    };
};

module.exports.getLatestObservation = async function () {
    var dateObj = new Date();
    dateObj.utc
    var month = dateObj.getUTCMonth();
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    const date_stamp = year + "-" + (month + 1) + "-" + day;

    const s3Params = {
        Bucket: `o9y.observations`,
        Prefix: `${date_stamp}/`,
        MaxKeys: 1000
    };
    let response = await s3.listObjects(s3Params).promise();
    console.log(response);
    let men = response.Contents.map(obj => Number(obj.Key.substring(9)));
    console.log(men);
    console.log(...men);

    return `${date_stamp}/${Math.max(...men)}`
};