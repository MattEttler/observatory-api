'use strict';

const reactionUtil = require('./reaction.util.js');


module.exports.recordReaction = async function (event) {
  console.log(event);
  console.log(JSON.parse(event.body)['reaction_type']);
  await reactionUtil.recordReaction(JSON.parse(event.body)['reaction_type'], event.requestContext.identity);
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      "message": "reaction successfully recorded."
    }),
  };
}