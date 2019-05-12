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
    const timestamp = dateObj.getTime();
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

    const observations = (await this.listAllKeys(s3Params)).map(obj => obj.Key);
    console.log(`${observations.length} observations fetched in total.`)
    const collator = new Intl.Collator(undefined, {
        numeric: true
    });
    const latestObservation = observations.sort(collator.compare)[observations.length - 1];

    const s3SignUrlParams = {
        Bucket: `o9y.observations`,
        Key: latestObservation,
        Expires: 60
    };

    return {
        url: s3.getSignedUrl('getObject', s3SignUrlParams),
        dateTime: `${latestObservation}`
    }
};

module.exports.listAllKeys = async function (s3Params) {
    console.log("fetching a page of observations...")
    var keys = []
    if (s3Params.data) {
        keys = keys.concat(s3Params.data)
    }
    delete s3Params['data']

    await s3.listObjectsV2(s3Params).promise().then(async (data) => {
        if (data.IsTruncated) {
            console.log(`found another page of observations.`)
            s3Params['ContinuationToken'] = data.NextContinuationToken
            s3Params['data'] = data.Contents
            keys = keys.concat(await this.listAllKeys(s3Params));
        } else {
            keys = keys.concat(data.Contents)
        }
    });
    return keys;
}