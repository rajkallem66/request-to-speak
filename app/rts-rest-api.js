/* global module,require*/
// This module is dependent on a valid RTS DB API and WS API.
let logger = null;
let rtsWsApi = null;
let rtsDbApi = null;

// eslint-disable-next-line new-cap
let router = require("express").Router();

// Setup REST handlers
router.post("/request", function(req, res) {
    let request = req.body;
    logger.info("Adding request from: " + req._remoteAddress);
    logger.debug("Request data.", request);

    logger.trace("Set datetime added.");
    request.timeSubmitted = new Date();

    logger.trace("Upcase name and agency.");
    request.firstName = request.firstName.toUpperCase();
    request.lastName = request.lastName.toUpperCase();
    request.agency = request.agency.toUpperCase();
    request.dateAdded = new Date();

    logger.trace("Add request with DbApi");
    rtsDbApi.addRequest(request).then(function(id) {
        request.requestId = id;

        logger.trace("Notify WS clients of new request");
        rtsWsApi.addRequest(request).then(function() {
            logger.info("Request added: " + id);
            res.status(204).end();
        }, function(err) {
            logger.error("Error notifying WS clients of new request.", err);
            res.status(500).send("Unable to send request to admin.");
        });
    }, function(err) {
        logger.error("Error adding request to database: " + err);
        res.status(500).send("Unable to add request to database.");
    });
});

router.patch("/request", function(req, res) {
    let request = req.body;
    logger.info("Updating request from: " + req._remoteAddress);
    logger.debug("Request data.", request);

    logger.trace("Upcase name and agency.");
    request.firstName = request.firstName.toUpperCase();
    request.lastName = request.lastName.toUpperCase();
    request.agency = request.agency.toUpperCase();

    logger.trace("Update request with DbApi");
    rtsDbApi.updateRequest(request).then(function() {
        logger.trace("Notify WS clients of updated request");
        rtsWsApi.updateRequest(request).then(function() {
            logger.info("Request updated.");
            res.status(204).end();
        }, function(err) {
            logger.error("Error notifying WS clients of updated request.", err);
            res.status(500).send("Unable to send updated request to admin.");
        });
    }, function(err) {
        logger.error("Error updating request to database: " + err);
        res.status(500).send("Unable to update request to database.");
    });
});

router.delete("/request/:requestId", function(req, res) {
    let requestId = req.params.requestId;
    logger.info("Deleting request from: " + req._remoteAddress);
    logger.debug("Request ID.", requestId);

    logger.trace("Delete request with DbApi");
    rtsDbApi.deleteRequest(requestId).then(function() {
        logger.trace("Notify WS clients of new request");
        rtsWsApi.deleteRequest(requestId).then(function() {
            logger.info("Request deleted: " + requestId);
            res.status(204).end();
        }, function(err) {
            logger.error("Error notifying WS clients of deleted request.", err);
            res.status(500).send("Unable to send update to admin.");
        });
    }, function(err) {
        logger.error("Error deleting request from database: " + err);
        res.status(500).send("Unable to delete request from database.");
    });
});

router.post("/meeting", function(req, res) {
    let meeting = req.body;
    logger.info("Adding meeting sireId: " + meeting.sireId);
    rtsDbApi.addMeeting(meeting).then(function(id) {
        res.status(200).send({meetingId: id});
    }, function(err) {
        res.status(500).send(err);
    });
});

router.put("/meeting/:meetingId", function(req, res) {
    let meeting = req.body;
    let meetingId = req.params.meetingId;
    logger.info("Updating meeting id: " + meeting.meetingId);
    rtsDbApi.saveMeeting(meetingId, meeting).then(function() {
        res.status(204).end();
    }, function(err) {
        res.status(500).send(err);
    });
});

router.post("/startMeeting/:meetingId", function(req, res) {
    let meetingId = req.params.meetingId;
    logger.info("Starting meeeting id: " + meetingId);
    rtsDbApi.startMeeting(meetingId).then(function() {
        rtsDbApi.getActiveMeeting().then(function(meeting) {
            rtsWsApi.startMeeting(meeting).then(function() {
                res.status(204).end();
            }, function(err) {
                logger.error("Error communicating started meeting.", err);
                res.status(500).send(err);
            });
        }, function(err) {
            logger.error("Error getting active meeting.", err);
            res.status(500).send(err);
        });
    }, function(err) {
        logger.error("Error starting meeting.", err);
        res.status(500).send(err);
    });
});

router.post("/endMeeting/:meetingId", function(req, res) {
    let meetingId = req.params.meetingId;
    logger.info("Ending meeeting id: " + meetingId);
    rtsDbApi.endMeeting(meetingId).then(function() {
        rtsWsApi.endActiveMeeting();
        res.status(204).end();
    }, function(err) {
        res.status(500).send(err);
    });
});

router.post("/refreshWall", function(req, res) {
    logger.info("Refreshing display wall.");
    rtsWsApi.refreshWall();
    res.status(204).end();
});

router.get("/meeting", function(req, res) {
    logger.info("Retrieving meetings from database.");
    rtsDbApi.getMeetings().then(function(data) {
        res.send(data);
    }, function(err) {
        res.status(500).send(err);
    });
});

module.exports = function(log, db, ws) {
    logger = log;
    rtsDbApi = db;
    rtsWsApi = ws;

    return router;
};
