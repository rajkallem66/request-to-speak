/* global module,require*/
/* eslint prefer-spread: "off" */
var logger = null;
var meeting = {
    meetingId: "",
    defaultTimeToSpeak: ""
};
var wallSpark = null;
var adminSparks = [];
var kioskSparks = [];
var boardSparks = [];

/**
 * Function to attach to Primus events
 * @param {Primus} primus - The primus instance used for this app.
 */
function setupPrimus(primus) {
    primus.on("connection", function(spark) {
        if(spark.query.clientType) {
            switch(spark.query.clientType) {
            case "kiosk":
                kioskSparks.push(spark);
                notify("admins", {"messageType": "device", "message": {"deviceType": "kiosk", "event": "connected", "count": kioskSparks.length}});
                initializeKiosk(spark);
                break;
            case "wall":
                wallSpark = spark;
                notify("admins", {"messageType": "device", "message": {"deviceType": "wall", "event": "connected"}});
                break;
            case "board":
                boardSparks.push(spark);
                notify("admins", {"messageType": "device", "message": {"deviceType": "board", "event": "connected", "count": boardSparks.length}});
                break;
            case "admin":
                adminSparks.push(spark);
                notify("admins", {"messageType": "device", "message": {"deviceType": "admin", "event": "connected", "count": adminSparks.length}});
                initializeAdmin(spark);
                break;
            default:
                // bad client.
            }
            logger.info("New connection.", {
                type: spark.query.clientType,
                identity: spark.id
            });
            spark.on("data", function(message) {
                logger.info("Message received %s.", message);

                if(message == "ping") {
                    primus.write({reply: "pong"});
                }
            });
        }
    });

    primus.on("disconnection", function(spark) {
        switch(spark.query.clientType) {
        case "wall":
            if(spark === wallSpark) {
                wallSpark = null;
                notify("admins", {"messageType": "device", "message": {"deviceType": "wall", "event": "disconnected"}});
            } else {
                // wall out of sync!!!
            }
            break;
        case "admin":
            adminSparks = adminSparks.filter(function(adminSpark) {
                return adminSpark.id !== spark.id;
            });
            notify("admins", {"messageType": "device", "message": {"deviceType": "admin", "event": "disconnected", "count": adminSparks.length}});
            break;
        case "kiosk":
            kioskSparks = kioskSparks.filter(function(kioskSpark) {
                return kioskSpark.id !== spark.id;
            });
            notify("admins", {"messageType": "device", "message": {"deviceType": "kiosk", "event": "disconnected", "count": kioskSparks.length}});
            break;
        case "board":
            boardSparks = boardSparks.filter(function(boardSpark) {
                return boardSpark.id !== spark.id;
            });
            notify("admins", {"messageType": "device", "message": {"deviceType": "board", "event": "disconnected", "count": boardSparks.length}});
            break;
        }
    });
}

/**
 * Send data message to all connected admins
 * @param {String} group - group to notify.
 * @param {Message} data - object to send to admin sparks.
 */
function notify(group, data) {
    var sparks = [];
    switch(group) {
    case "kiosks" :
        sparks = kioskSparks;
        break;
    case "admins":
        sparks = adminSparks;
        break;
    case "all":
        sparks.push.apply(sparks, kioskSparks);
        sparks.push.apply(sparks, adminSparks);
        sparks.push.apply(sparks, boardSparks);
        if(wallSpark) {
            sparks.push(wallSpark);
        }
        break;
    case "watchers":
        sparks.push.apply(sparks, adminSparks);
        sparks.push.apply(sparks, boardSparks);
        break;
    }
    sparks.forEach(function(spark) {
        spark.write(data);
    });
}

/**
 *
 * @param {Spark} spark - newly connected admin spark.
 */
function initializeAdmin(spark) {
    spark.write({
        "messageType": "initialize",
        "message": {
            "connectedKiosks": kioskSparks.length,
            "connectedAdmins": adminSparks.length,
            "connectedBoards": boardSparks.length,
            "wallConnected": (wallSpark !== null)
        }
    });
}

/**
 *
 * @param {Spark} spark - newly connected kiosk spark.
 */
function initializeKiosk(spark) {
    spark.write({
        "messageType": "initialize",
        "message": {
            "meetingData": meeting
        }
    });
}

// Public functions
/**
 * Adds a request to the live meeting.
 * @param {Request} request
 */
function addRequest(request) {
    notify("watchers", {
        "messageType": "request",
        "message": {
            "event": "add",
            "request": request
        }
    });
}

/**
 * Starts a meeting by sending event to everyone.
 * @param {Meeting} newMeeting
 */
function startMeeting(newMeeting) {
    meeting = newMeeting;

    notify("all", {
        "messageType": "meeting",
        "message": {
            "event": "started",
            "meetingData": meeting
        }
    });
}

module.exports = function(primus, logger) {
    this.logger = logger;

    setupPrimus(primus);

    return {
        version: "1.0",
        addRequest: addRequest,
        startMeeting: startMeeting
    };
};
