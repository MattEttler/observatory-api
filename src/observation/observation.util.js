'use strict';

const uuidv4 = require('uuid/v4')
const AWS = require('aws-sdk')
var getPixels = require("get-pixels")
var ndarray = require("ndarray")

AWS.config.update({
    region: process.env.REGION || 'us-east-1'
})
const s3 = new AWS.S3();
var dynamoClient = new AWS.DynamoDB.DocumentClient();

module.exports.requestObservationUploadLink = function (fileType) {

    var dateObj = new Date();
    dateObj.utc
    var month = dateObj.getUTCMonth();
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    const date_stamp = year + "-" + (month + 1) + "-" + day;
    const timestamp = dateObj.getTime();
    const s3Params = {
        Bucket: `o9y.soil.observations/${date_stamp}`,
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
        Bucket: `o9y.soil.observations`,
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
        Bucket: `o9y.soil.observations`,
        Key: latestObservation,
        Expires: 60
    };

    return {
        url: s3.getSignedUrl('getObject', s3SignUrlParams),
        dateTime: `${latestObservation.split('/')[1]}`
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

module.exports.measureFoliage = async function (bucketName, objectKey) {
    var getParams = {
        Bucket: bucketName,
        Key: objectKey
    }
    const objectKeyParts = objectKey.split('/');
    const timestamp = objectKeyParts[objectKeyParts.length - 1];

    await s3.getObject(getParams).promise().then(async data => {
        const objectData = data.Body;
        const RED_CHANNEL = 0;
        const GREEN_CHANNEL = 1;
        const BLUE_CHANNEL = 2;

        getPixels(objectData, "image/jpg", async function (err, pixels) {
            if (err) {
                console.log("Bad image path")
                console.log(err);
                return
            }
            console.log("pixel data retrieved");
            console.log(pixels.shape.slice());

            let foliagePixelCount = 0;
            let nonFoliageCount = 0;
            for (var y = 0; y < pixels.shape[1]; y++) {
                for (var x = 0; x < pixels.shape[0]; x++) {
                    var greenValue = pixels.get(x, y, GREEN_CHANNEL);
                    greenValue = greenValue - pixels.get(x, y, RED_CHANNEL);
                    greenValue = greenValue - pixels.get(x, y, BLUE_CHANNEL);
                    greenValue > 0 ? foliagePixelCount++ : nonFoliageCount++;
                }
            }
            console.log("pixelCount: ", pixels.shape[0] * pixels.shape[1]);
            console.log("foliagePixelCount: ", foliagePixelCount);
            console.log("nonFoliagePixelCount: ", nonFoliageCount);
            console.log("foliageCoverage: ", 100 * (foliagePixelCount / (pixels.shape[0] * pixels.shape[1])));

            await dynamoClient.put({
                TableName: "events",
                Item: {
                    "event_type": "observation",
                    "date_time": Number(timestamp),
                    "foliage_coverage_percentage": 100 * (foliagePixelCount / (pixels.shape[0] * pixels.shape[1]))
                }
            }).promise();
        })
    });
}

module.exports.getFoliageTimeSeries = async function () {
    //Generating a string of the last X hours back
    var ts = new Date().getTime();
    var tsYesterday = (ts - (
        ((24 * 3600) * 1000) * 30));
    var d = new Date(tsYesterday);
    const eventToFind = "observation";

    console.log("fetching foliage time-series data between ", new Date(tsYesterday).toISOString(), " and ", new Date(ts).toISOString());

    var params = {
        TableName: "events_daily_rollup",
        Limit: 30,
        ConsistentRead: false,
        ScanIndexForward: true,
        ExpressionAttributeValues: {
            ":today": ts,
            ":look_back": tsYesterday,
            ":event_to_find": eventToFind
        },
        ExpressionAttributeNames: {
            "#date": "date_time"
        },
        KeyConditionExpression: "event_type = :event_to_find AND #date BETWEEN :look_back AND :today"
    }
    return (await dynamoClient.query(params).promise())["Items"];
}

module.exports.rollupFoliageByDate = async function (date) {

    //Generating a string of the last X hours back
    var rollupDayStart = new Date(date);
    rollupDayStart.setUTCHours(0, 0, 0, 0);
    var rollupDayEnd = new Date(date);
    rollupDayEnd.setUTCHours(23, 59, 59, 999);

    console.log("fetching foliage time-series data between ", rollupDayStart.getTime(), " and ", rollupDayEnd.getTime())

    var params = {
        TableName: "events",
        Limit: 5000,
        ConsistentRead: false,
        ScanIndexForward: true,
        ExpressionAttributeValues: {
            ":start": rollupDayStart.getTime(),
            ":end": rollupDayEnd.getTime(),
            ":event_to_find": 'observation'
        },
        KeyConditionExpression: "event_type = :event_to_find AND date_time BETWEEN :start AND :end"
    }

    let dynamoDbItems = await dynamoClient.query(params).promise();
    let dayAvgFoliage = 0;
    if (dynamoDbItems["Items"] && dynamoDbItems["Items"].length) {
        let foliageMeasurements = dynamoDbItems["Items"].map(event => event.foliage_coverage_percentage);
        console.log(dynamoDbItems["Items"].length, " observation event(s) found.");
        let sum = foliageMeasurements.reduce(function (a, b) {
            return a + b;
        });
        dayAvgFoliage = sum / foliageMeasurements.length;

        return await dynamoClient.update({
            TableName: "events_daily_rollup",
            Key: {
                "event_type": "observation",
                "date_time": rollupDayStart.getTime(),
            },
            UpdateExpression: "set foliage_coverage_percentage=:f",
            ExpressionAttributeValues: {
                ":f": dayAvgFoliage
            },
            ReturnValues: "UPDATED_NEW"
        }).promise();
    }
    console.log("No observation events found.");
    return undefined;
}

module.exports.rollupFoliageByDateRange = async function (fromDate, toDate) {
    for (var d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        await this.rollupFoliageByDate(new Date(d));
    }
}