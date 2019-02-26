/* global module,require*/
// This module is dependent on a valid RTS DB API and WS API.
let logger = null;
let rtsWsApi = null;
let rtsDbApi = null;

let ip = function(req) {
    return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
};

// eslint-disable-next-line new-cap
let router = require("express").Router();

// Setup REST handlers
// Get Request
let getRequest = function(req, res) {
    let requestId = req.params.requestId;
    logger.info(ip(req) + " Retrieving request from database.");
    rtsDbApi.getRequest(requestId).then(function(data) {
        logger.info(ip(req) + " Requests retrieved successfully.");
        res.send(data);
    }, function(err) {
        logger.error(ip(req) + " Error retrieving request from database.", err);
        res.status(500).send(err);
    });
};
router.get("/request/:requestId", getRequest);

// Post Request
let postRequest = function(req, res) {
    let request = req.body;
    logger.info(ip(req) + " Adding request." + req._remoteAddress);
    logger.debug(ip(req) + "Request data.", request);

    logger.trace("Set datetime added.");
    request.timeSubmitted = new Date();

    logger.trace("Upcase name and agency.");
    request.firstName = request.firstName.toUpperCase();
    request.lastName = request.lastName.toUpperCase();
    request.agency = request.agency.toUpperCase();
    request.dateAdded = new Date();
    if(request.official === "constituent") {
        request.official = false;
    } else if(request.official === "official") {
        request.official = true;
    }

    logger.trace("Add request with DbApi");
    rtsDbApi.addRequest(request).then(function(id) {
        request.requestId = id;
        logger.trace("Notify WS clients of new request");
        rtsWsApi.addRequest(request).then(function() {
            logger.info(ip(req) + " Request added: " + request.requestId);
            res.status(204).end();
        }, function(err) {
            logger.error(ip(req) + "Error notifying WS clients of new request.", err);
            res.status(500).send("Unable to send request to admin.");
        });
    }, function(err) {
        logger.error(ip(req) + " Error adding request to database.", err);
        res.status(500).send("Unable to add request to database.");
    });
};
router.post("/request", postRequest);

// Put Request
let putRequest = function(req, res) {
    let request = req.body;
    logger.info(ip(req) + " Updating request from: " + req._remoteAddress);
    logger.debug(ip(req) + " Request data.", request);

    logger.trace("Upcase name and agency.");
    request.firstName = request.firstName.toUpperCase();
    request.lastName = request.lastName.toUpperCase();
    request.agency = request.agency.toUpperCase();

    logger.trace("Update request with DbApi");
    rtsDbApi.updateRequest(request).then(function() {
        logger.trace("Notify WS clients of updated request");
        rtsWsApi.updateRequest(request).then(function() {
            logger.info(ip(req) + " Request updated.");
            res.status(204).end();
        }, function(err) {
            logger.error(ip(req) + " Error notifying WS clients of updated request.", err);
            res.status(500).send("Unable to send updated request to admin.");
        });
    }, function(err) {
        logger.error(ip(req) + " Error updating request to database.", err);
        res.status(500).send("Unable to update request to database.");
    });
};
router.put("/request", putRequest);

// Activate Request
let activateRequest = function(req, res) {
    let request = req.body;
    logger.info(ip(req) + " Activating request from: " + req._remoteAddress);
    logger.debug(ip(req) + " Request data.", request);

    logger.trace("Update request with DbApi");
    rtsDbApi.updateRequest(request).then(function() {
        logger.trace("Notify WS clients of activated request");
        rtsWsApi.activateRequest(request).then(function() {
            logger.info(ip(req) + " Request activated.");
            res.status(204).end();
        }, function(err) {
            logger.error(ip(req) + " Error notifying WS clients of activated request.", err);
            res.status(500).send("Unable to send updated request to admin.");
        });
    }, function(err) {
        logger.error(ip(req) + " Error updating request to database.", err);
        res.status(500).send("Unable to update request to database.");
    });
};
router.post("/activateRequest", activateRequest);

// Remove Request
let removeRequest = function(req, res) {
    let request = req.body;
    logger.info(ip(req) + " Removing request from: " + req._remoteAddress);
    logger.debug(ip(req) + " Request data.", request);

    logger.trace("Update request with DbApi");
    rtsDbApi.updateRequest(request).then(function() {
        logger.trace("Notify WS clients of removed request");
        rtsWsApi.deleteRequest(request.requestId).then(function() {
            logger.info(ip(req) + " Request removed.");
            res.status(204).end();
        }, function(err) {
            logger.error(ip(req) + " Error notifying WS clients of removed request.", err);
            res.status(500).send("Unable to send remove request from admin.");
        });
    }, function(err) {
        logger.error(ip(req) + "Error updating request to database.", err);
        res.status(500).send("Unable to update request to database.");
    });
};
router.post("/removeRequest", removeRequest);

// Delete Request
let deleteRequest = function(req, res) {
    let requestId = req.params.requestId;
    logger.info(ip(req) + " Deleting request from: " + req._remoteAddress);
    logger.debug(ip(req) + " Request ID.", requestId);

    logger.trace("Delete request with DbApi");
    rtsDbApi.deleteRequest(requestId).then(function() {
        logger.trace("Notify WS clients of new request");
        rtsWsApi.deleteRequest(requestId).then(function() {
            logger.info(ip(req) + " Request deleted: " + requestId);
            res.status(204).end();
        }, function(err) {
            logger.error(ip(req) + " Error notifying WS clients of deleted request.", err);
            res.status(500).send("Unable to send update to admin.");
        });
    }, function(err) {
        logger.error(ip(req) + " Error deleting request from database: ", err);
        res.status(500).send("Unable to delete request from database.");
    });
};
router.delete("/request/:requestId", deleteRequest);

// Post Meeting
let postMeeting = function(req, res) {
    let meeting = req.body;
    logger.info(ip(req) + " Adding meeting sireId: " + meeting.sireId);
    rtsDbApi.addMeeting(meeting).then(function(response) {
        res.status(200).send(response);
    }, function(err) {
        logger.error(ip(req) + " Error addmin meeting to database.", err);
        res.status(500).send(err);
    });
};
router.post("/meeting", postMeeting);

// Put Meeting
let putMeeting = function(req, res) {
    let meeting = req.body;
    let meetingId = req.params.meetingId;
    logger.info(ip(req) + " Updating meeting id: " + meeting.meetingId);
    rtsDbApi.updateMeeting(meetingId, meeting).then(function() {
        res.status(204).end();
    }, function(err) {
        logger.error(ip(req) + " Error addmin meeting to database.", err);
        res.status(500).send(err);
    });
};
router.put("/meeting/:meetingId", putMeeting);

// Delete Meeting
let deleteMeeting = function(req, res) {
    let meetingId = req.params.meetingId;
    logger.info(ip(req) + " Deleting meeting from: " + req._remoteAddress);
    logger.debug(ip(req) + " Meeting ID.", meetingId);

    logger.trace("Delete meeting with DbApi");
    rtsDbApi.deleteMeeting(meetingId).then(function() {
        logger.info(ip(req) + " Meeting deleted: " + meetingId);
        res.status(204).end();
    }, function(err) {
        logger.error(ip(req) + " Error deleting meeting from database.", err);
        res.status(500).send("Unable to delete meeting from database.");
    });
};
router.delete("/meeting/:meetingId", deleteMeeting);

// Start Meeting
let startMeeting = function(req, res) {
    let meetingId = req.params.meetingId;
    logger.info(ip(req) + " Starting meeeting id: " + meetingId);
    rtsDbApi.getActiveMeeting().then(function(meeting) {
        if (meeting) {
            res.status(500).send("There is already an active meeting. RTS can only have one active meeting at a time.");
        } else {
            rtsDbApi.startMeeting(meetingId).then(function() {
                rtsDbApi.getActiveMeeting().then(function(meeting) {
                    rtsWsApi.startMeeting(meeting).then(function() {
                        logger.info(ip(req) + " Meeting started: " + meetingId);
                        res.status(204).end();
                    }, function(err) {
                        logger.error(ip(req) + " Error communicating started meeting.", err);
                        res.status(500).send(err);
                    });
                }, function(err) {
                    logger.error(ip(req) + " Error getting active meeting.", err);
                    res.status(500).send(err);
                });
            }, function(err) {
                logger.error(ip(req) + " Error starting meeting.", err);
                res.status(500).send(err);
            });
        }
    }, function(err) {
        logger.error(ip(req) + " Error checking active meeting.", err);
        res.status(500).send(err);
    });
};
router.post("/startMeeting/:meetingId", startMeeting);

// End Meeting
let endMeeting = function(req, res) {
    let meetingId = req.params.meetingId;
    logger.info(ip(req) + " Ending meeeting id: " + meetingId);
    rtsDbApi.endMeeting(meetingId).then(function() {
        rtsWsApi.endActiveMeeting();
        res.status(204).end();
    }, function(err) {
        logger.error(ip(req) + " Error ending active meeting.", err);
        res.status(500).send(err);
    });
};
router.post("/endMeeting/:meetingId", endMeeting);

// Refresh Wall
let refreshWall = function(req, res) {
    logger.info(ip(req) + " Refreshing display wall.");
    rtsWsApi.refreshWall().then(function() {
        res.status(204).end();
    }, function(err) {
        logger.error(ip(req) + " Error refreshing wall.", err);
        res.status(500).send(err);
    });
};
router.post("/refreshWall", refreshWall);

// Get Meeting
let getMeeting = function(req, res) {
    logger.info(ip(req) + " Retrieving meetings from database.");
    rtsDbApi.getMeetings(req.query).then(function(data) {
        logger.info(ip(req) + " Meetings retrieved successfully.");
        res.send(data);
    }, function(err) {
        logger.error(ip(req) + " Error getting meeting from database.", err);
        res.status(500).send(err);
    });
};
router.get("/meeting", getMeeting);

// Get Meeting by Id
let getMeetingById = function(req, res) {
    let meetingId = req.params.meetingId;
    logger.info(ip(req) + " Retrieving meeting from database.");
    rtsDbApi.getMeetings({meetingId}).then(function(data) {
        res.send(data);
    }, function(err) {
        logger.error(ip(req) + " Error getting meeting from database.", err);
        res.status(500).send(err);
    });
};
router.get("/meeting/:meetingId", getMeetingById);

// Post Item
let postItem = function(req, res) {
    let item = req.body;
    logger.info(ip(req) + " Adding item.");
    logger.debug(ip(req) + " Adding item: ", item);
    rtsDbApi.addItem(item).then(function(id) {
        res.status(200).send({
            itemId: id
        });
    }, function(err) {
        logger(ip() + " Error adding item.", err);
        res.status(500).send(err);
    });
};
router.post("/item", postItem);

// Get Report
let getReport = function(req, res) {
    let meetingId = req.params.meetingId;
    logger.info(ip(req) + " Retrieving requests from database.");
    rtsDbApi.getRequests(meetingId).then(function(data) {
        let requests = data;

        let excel = require("node-excel-export");

        const styles = {
            headerDark: {
                fill: {
                    fgColor: {
                        rgb: "FF000000"
                    }
                },
                font: {
                    color: {
                        rgb: "FFFFFFFF"
                    },
                    sz: 14,
                    bold: true,
                    underline: true
                }
            }
        };

        let specification = {
            itemOrder: {
                displayName: "Item",
                headerStyle: styles.headerDark,
                width: "4"
            },
            firstName: {
                displayName: "First Name",
                headerStyle: styles.headerDark,
                width: "10"
            },
            lastName: {
                displayName: "Last Name",
                headerStyle: styles.headerDark,
                width: "10"
            },
            official: {
                displayName: "Official",
                headerStyle: styles.headerDark,
                width: "5"
            },
            agency: {
                displayName: "Agency",
                headerStyle: styles.headerDark,
                width: "6"
            },
            stance: {
                displayName: "Stance",
                headerStyle: styles.headerDark,
                width: "7"
            },
            address: {
                displayName: "Address",
                headerStyle: styles.headerDark,
                width: "10"
            },
            phone: {
                displayName: "Phone",
                headerStyle: styles.headerDark,
                width: "10"
            },
            email: {
                displayName: "Email",
                headerStyle: styles.headerDark,
                width: "10"
            },
            notes: {
                displayName: "Notes",
                headerStyle: styles.headerDark,
                width: "20"
            }
        };

        let report = excel.buildExport(
            [{
                name: meetingId,
                merges: [],
                specification: specification,
                data: requests
            }]
        );
        res.setHeader("Content-Type", "application/vnd.ms-excel");
        res.setHeader("Content-disposition", "attachment;filename=report-" + meetingId + ".xls");
        res.send(report);
    }, function(err) {
        logger(ip(req) + " Error generating report.", err);
        res.status(500).send(err);
    });
};
router.get("/report/:meetingId", getReport);

module.exports = function(log, db, ws) {
    logger = log;
    rtsDbApi = db;
    rtsWsApi = ws;

    return router;
};
