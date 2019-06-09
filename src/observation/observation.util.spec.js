'use strict';

const sinon = require('sinon');
const AWS = require('aws-sdk')

afterEach(() => {
    sinon.restore();
});

describe("Observation Utility", () => {
    const observationUtil = require('./observation.util');

    it("Should provide a secure url to upload an observation file to S3", () => {
        const uploadUrl = observationUtil.requestObservationUploadLink();
        expect(uploadUrl.url.startsWith('https://s3.amazonaws.com/o9y.soil.observations/')).toBeTruthy();
    });
});