'use strict';

const uuidv4 = require('uuid/v4')
const AWS = require('aws-sdk')

AWS.config.update({
    region: process.env.REGION || 'us-east-1'
})
const s3 = new AWS.S3();

module.exports = {
    requestObservationUploadLink: () => {
        const actionId = uuidv4()
        const s3Params = {
            Bucket: 'o9y.observations',
            Key: `${actionId}`,
            ContentType: 'image/*',
            Expires: 900000
        }
        return {
            url: s3.getSignedUrl('putObject', s3Params),
            fileName: actionId
        };
    }
};