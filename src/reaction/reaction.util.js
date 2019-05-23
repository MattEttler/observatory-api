'use strict';

const uuidv4 = require('uuid/v4')
const AWS = require('aws-sdk')

AWS.config.update({
    region: process.env.REGION || 'us-east-1'
})
var dynamoClient = new AWS.DynamoDB.DocumentClient

module.exports.recordReaction = async function (reactionType, actor) {

    var dateObj = new Date();
    dateObj.utc
    const timestamp = dateObj.getTime();
    return dynamoClient.put({
        TableName: "reactions",
        Item: {
            "reaction_type": reactionType,
            "datetime": timestamp,
            "actor": actor
        }
    }).promise();
};