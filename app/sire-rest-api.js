/* global module,require*/
// This module is dependent on a valid SIRE DB API.
let logger = null;
let sireDbApi = null;

let ip = function(req) {
    return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
};

// eslint-disable-next-line new-cap
let router = require("express").Router();

router.get("/", function(req, res) {
    res.status(204).end();
});

// Get Meeting
let getMeeting = function(req, res) {
    logger.info(ip(req) + " Retrieving meetings from agenda management system.");
    sireDbApi.getMeetings().then(function(data) {
        logger.info(ip(req) + " Meeting retrieved successfully.");
        res.send(data);
    }, function(err) {
        logger.error(ip(req) + " Error retrieving meeting from database.", err);
        res.status(500).send(err);
    });
};
router.get("/meeting", getMeeting);

// Get Item By Id
let getItems = function(req, res) {
    let meetingId = req.params.meetingId;
    logger.info(ip(req) + " Retrieving items from agenda management system for meetingId: " + meetingId);
    sireDbApi.getItems(meetingId).then(function(data) {
        logger.info(ip(req) + "Items retrieved successfully.");
        res.send(data);
    }, function(err) {
        logger.error(ip(req) + " Error retrieving items from the database.", err);
        res.status(500).send(err);
    });
};
router.get("/item/:meetingId", getItems);

module.exports = function(log, db) {
    logger = log;
    sireDbApi = db;

    return router;
};
