'use strict';

const sinon = require('sinon');
const AWS = require('aws-sdk')

afterEach(() => {
    sinon.restore();
});

describe("Reaction Utility", () => {
    const observationUtil = require('./reaction.util');
});