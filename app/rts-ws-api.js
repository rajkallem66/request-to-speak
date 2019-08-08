/* global module,require*/
/* eslint prefer-spread: "off" */
let logger = null;
let meeting = {};
let displayRequests = [];
let wallSpark = null;
let adminSparks = [];
let kioskSparks = [];
let boardSparks = [];
let chairSparks = [];

/**
 * Function to attach to Primus events
 * @param {Primus} primus - The primus instance used for this app.
 */
function setupPrimus(primus) {
    primus.on("connection", function (spark) {
        if (spark.query.clientType) {
            switch (spark.query.clientType) {
                case "kiosk":
                    kioskSparks.push(spark);
                    notify("admins", {
                        "messageType": "device",
                        "message": {
                            "deviceType": "kiosk",
                            "event": "connected",
                            "count": kioskSparks.length
                        }
                    });
                    initializeKiosk(spark);
                    break;
                case "wall":
                    wallSpark = spark;
                    notify("admins", {
                        "messageType": "device",
                        "message": {
                            "deviceType": "wall",
                            "event": "connected"
                        }
                    });
                    initializeWall(spark);
                    break;
                case "board":
                    boardSparks.push(spark);
                    notify("admins", {
                        "messageType": "device",
                        "message": {
                            "deviceType": "board",
                            "event": "connected",
                            "count": boardSparks.length
                        }
                    });
                    initializeBoard(spark);
                    break;
                case "chair":
                    chairSparks.push(spark);
                    notify("admins", {
                        "messageType": "device",
                        "message": {
                            "deviceType": "chair",
                            "event": "connected",
                            "count": chairSparks.length
                        }
                    });
                    initializeChair(spark);
                    break;
                case "admin":
                    adminSparks.push(spark);
                    notify("admins", {
                        "messageType": "device",
                        "message": {
                            "deviceType": "admin",
                            "event": "connected",
                            "count": adminSparks.length
                        }
                    });
                    initializeAdmin(spark);
                    break;
                default:
                // bad client.
            }
            logger.info(spark.address.ip + " New connection.", {
                type: spark.query.clientType,
                identity: spark.id
            });
            spark.on("data", function (message) {
                logger.info(spark.address.ip + " Message received %s.", message);

                if (message == "ping") {
                    primus.write({ reply: "pong" });
                }
            });
            spark.on("heartbeat", function () {
                logger.trace("Hearbeat.");
            });
        }
    });

    primus.on("disconnection", function (spark) {
        switch (spark.query.clientType) {
            case "wall":
                if (spark === wallSpark) {
                    wallSpark = null;
                    notify("admins", { "messageType": "device", "message": { "deviceType": "wall", "event": "disconnected" } });
                } else {
                    // wall out of sync!!!
                }
                break;
            case "admin":
                adminSparks = adminSparks.filter(function (adminSpark) {
                    return adminSpark.id !== spark.id;
                });
                notify("admins", {
                    "messageType": "device",
                    "message": {
                        "deviceType": "admin",
                        "event": "disconnected",
                        "count": adminSparks.length
                    }
                });
                break;
            case "kiosk":
                kioskSparks = kioskSparks.filter(function (kioskSpark) {
                    return kioskSpark.id !== spark.id;
                });
                notify("admins", {
                    "messageType": "device",
                    "message": {
                        "deviceType": "kiosk",
                        "event": "disconnected",
                        "count": kioskSparks.length
                    }
                });
                break;
            case "board":
                boardSparks = boardSparks.filter(function (boardSpark) {
                    return boardSpark.id !== spark.id;
                });
                notify("admins", {
                    "messageType": "device",
                    "message": {
                        "deviceType": "board",
                        "event": "disconnected",
                        "count": boardSparks.length
                    }
                });
                break;
            case "chair":
                chairSparks = chairSparks.filter(function (chairSpark) {
                    return chairSpark.id !== spark.id;
                });
                notify("admins", {
                    "messageType": "device",
                    "message": {
                        "deviceType": "chair",
                        "event": "disconnected",
                        "count": chairSparks.length
                    }
                });
                break;
        }
        logger.info(spark.address.ip + " Connection terminated.", {
            type: spark.query.clientType,
            identity: spark.id
        });
    });

    primus.on("error", function (spark) {
        logger.error(spark.address.ip + " A websocket error occured.");
    });

    primus.on("close", function (spark) {
        logger.info(spark.address.ip + " Connection closed. May attempt to reconnect.");
    });
}

/**
 * Send data message to all connected admins
 * @param {String} group - group to notify.
 * @param {Message} data - object to send to admin sparks.
 */
function notify(group, data) {
    let sparks = [];
    switch (group) {
        case "wall":
            if (wallSpark) {
                sparks.push(wallSpark);
            }
            break;
        case "kiosks":
            sparks = kioskSparks;
            break;
        case "admins":
            sparks = adminSparks;
            break;
        case "boards":
            sparks = boardSparks;
            break;
        case "chairs":
            sparks = chairSparks;
            break;
        case "all":
            sparks.push.apply(sparks, kioskSparks);
            sparks.push.apply(sparks, adminSparks);
            sparks.push.apply(sparks, boardSparks);
            sparks.push.apply(sparks, chairSparks);
            if (wallSpark) {
                sparks.push(wallSpark);
            }
            break;
        case "watchers":
            sparks.push.apply(sparks, adminSparks);
            sparks.push.apply(sparks, boardSparks);
            sparks.push.apply(sparks, chairSparks);
            break;
    }
    sparks.forEach(function (spark) {
        spark.write(data);
    });
}

/**
 *
 * @param {Spark} spark - newly connected admin spark.
 */
function initializeAdmin(spark) {
    logger.debug("Initializing admin.");

    spark.write({
        "messageType": "initialize",
        "message": {
            "meeting": meeting,
            "connectedKiosks": kioskSparks.length,
            "connectedAdmins": adminSparks.length,
            "connectedBoards": boardSparks.length,
            "connectedChairs": chairSparks.length,
            "wallConnected": (wallSpark !== null)
        }
    });
}

/**
 *
 * @param {Spark} spark - newly connected kiosk spark.
 */
function initializeKiosk(spark) {
    logger.debug("Initializing kiosk.");

    spark.write({
        "messageType": "initialize",
        "message": {
            "meetingData": meeting
        }
    });
}

/**
 * initialize wall state.
 */
function initializeWall() {
    logger.debug("Initializing wall.");

    notify("wall", {
        "messageType": "initialize",
        "message": {
            "meeting": meeting,
            "requests": displayRequests
        }
    });
}

/**
 * @param {Spark} spark
 * initialize board state.
 */
function initializeBoard(spark) {
    logger.debug("Initializing board.");

    spark.write({
        "messageType": "initialize",
        "message": {
            "meeting": meeting
        }
    });
}


/**
 * @param {Spark} spark
 * initialize chair state.
 */
function initializeChair(spark) {
    logger.debug("initializing Chair.");

    spark.write({
        "messageType": "initialize",
        "message": {
            "meeting": meeting
        }
    });
}
// Public functions

/**
 * Adds a request to the live meeting.
 * @param {Request} request
 * @return {Promise}
 */
function addRequest(request) {
    logger.debug("Adding request.");

    return new Promise(function (fulfill, reject) {
        meeting.requests.push(request);
        notify("watchers", {
            "messageType": "request",
            "message": {
                "event": "add",
                "request": request
            }
        });
        fulfill();
    });
}

/**
 * Updates a request in the live meeting.
 * @param {Request} request
 * @return {Promise}
 */
function updateRequest(request) {
    logger.debug("Updating request.");

    return new Promise(function (fulfill, reject) {
        let old = meeting.requests.find(function (r) {
            return r.requestId == request.requestId;
        });
        if (old) {
            meeting.requests.splice(meeting.requests.indexOf(old), 1, request);
            notify("watchers", {
                "messageType": "request",
                "message": {
                    "event": "update",
                    "request": request
                }
            });
        }
        let oldDisplay = displayRequests.find(function (r) {
            return r.requestId === request.requestId;
        });
        if (oldDisplay) {
            displayRequests.splice(displayRequests.indexOf(oldDisplay), 1, request);
            notify("wall", {
                "messageType": "refresh",
                "message": {
                    "meeting": meeting,
                    "requests": displayRequests
                }
            });
        }
        fulfill();
    });
}

/**
 * Deletes a request from the live meeting.
 * @param {String} requestId
 * @return {Promise}
 */
function deleteRequest(requestId) {
    logger.debug("Delete request.");

    return new Promise(function (fulfill, reject) {
        var rId = requestId;
        let old = meeting.requests.find(function (r) {
            return (r.requestId == rId);
        });
        if (old) {
            meeting.requests.splice(meeting.requests.indexOf(old), 1);
            notify("watchers", {
                "messageType": "request",
                "message": {
                    "event": "remove",
                    "requestId": rId
                }
            });
        }

        let oldDisplay = displayRequests.find(function (r) {
            return (r.requestId == rId);
        });
        if (oldDisplay) {
            displayRequests.splice(displayRequests.indexOf(oldDisplay), 1);
            notify("wall", {
                "messageType": "request",
                "message": {
                    "event": "remove",
                    "requestId": rId
                }
            });
        }
        fulfill();
    });
}

/**
 * Activates a request in the live meeting.
 * @param {Request} request
 * @return {Promise}
 */
function activateRequest(request) {
    logger.debug("Activating request.");

    return new Promise(function (fulfill, reject) {

        let old = meeting.requests.find(function (r) {
            return r.requestId == request.requestId;
        });

        if (old) {
            meeting.requests.splice(meeting.requests.indexOf(old), 1, request);
            logger.debug("watchers");
            notify("watchers", {
                "messageType": "request",
                "message": {
                    "event": "update",
                    "request": request
                }
            });
        }

        // If displayRequests includes then splice. otherwise push
        let oldDisplay = displayRequests.find(function (r) {
            return r.requestId == request.requestId;
        });

        if (oldDisplay) {
            displayRequests.splice(displayRequests.indexOf(oldDisplay), 1, request);

            notify("wall", {
                "messageType": "refresh",
                "message": {
                    "meeting": meeting,
                    "requests": displayRequests
                }
            });
        }
        fulfill();
    });
}

/**
 * Starts a meeting by sending event to everyone.
 * @param {Meeting} newMeeting
 * @return {Promise}
 */
function startMeeting(newMeeting) {
    logger.debug("Starting meeting.");

    return new Promise(function (fulfill, reject) {
        meeting = Object.assign({}, newMeeting);

        // This API keeps track of active meeting and active requests.
        // We need to remove previous requests that were deleted or removed.
        meeting.requests = meeting.requests.filter(function (r) {
            return (r.status !== "removed" && r.status != "deleted");
        });

        logger.debug("meeting object", meeting);

        notify("all", {
            "messageType": "meeting",
            "message": {
                "event": "started",
                "meeting": meeting
            }
        });
        fulfill();
    });
}

/**
 * Ends an active meeting by sending event to everyone.
 * @return {Promise}
 */
function endActiveMeeting() {
    logger.debug("Ending active meeting.");

    return new Promise(function (fulfill, reject) {
        meeting = {};

        notify("all", {
            "messageType": "meeting",
            "message": {
                "event": "ended"
            }
        });
        fulfill();
    });
}

/**
 * Send updated list of requests to the wall
 * @return {Promise}
 */
function refreshWall() {
    logger.debug("Refreshing wall.");
    return new Promise(function (fulfill, reject) {
        displayRequests = meeting.requests.filter(function (r) {
            return (r.status === "display" || r.status === "active");
        });

        logger.trace("Refreshing wall with", displayRequests);

        notify("wall", {
            "messageType": "refresh",
            "message": {
                "meeting": meeting,
                "requests": displayRequests
            }
        });
        fulfill();
    });
}

module.exports = function (primus, log) {
    logger = log;

    setupPrimus(primus);

    return {
        version: "1.0",
        addRequest,
        updateRequest,
        deleteRequest,
        activateRequest,
        startMeeting,
        endActiveMeeting,
        refreshWall
    };
};
