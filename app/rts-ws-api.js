/* global module,require*/
/* eslint no-console: "off" */
var wallSpark = null;
var adminSparks = [];
var kioskSparks = [];
var chairSparks = [];

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
                notifyAdmins({"messageType": "device", "message": {"deviceType": "kiosk", "event": "connected", "count": kioskSparks.length}});
                break;
            case "wall":
                wallSpark = spark;
                notifyAdmins({"messageType": "device", "message": {"deviceType": "wall", "event": "connected"}});
                break;
            case "chair":
                chairSparks.push(spark);
                notifyAdmins({"messageType": "device", "message": {"deviceType": "chair", "event": "connected", "count": chairSparks.length}});
                break;
            case "admin":
                adminSparks.push(spark);
                notifyAdmins({"messageType": "device", "message": {"deviceType": "admin", "event": "connected", "count": adminSparks.length}});
                initializeAdmin(spark);
                break;
            }
        }
        console.log("New connection.");
        spark.on("data", function(message) {
            console.log("Message received %s.", message);

            if(message == "ping") {
                primus.write({reply: "pong"});
            }
        });
    });

    primus.on("disconnection", function(spark) {
        switch(spark.query.clientType) {
        case "wall":
            if(spark === wallSpark) {
                wallSpark = null;
                notifyAdmins({"messageType": "device", "message": {"deviceType": "wall", "event": "disconnected"}});
            } else {
                // wall out of sync!!!
            }
            break;
        case "admin":
            adminSparks = adminSparks.filter(function(adminSpark) {
                return adminSpark.id !== spark.id;
            });
            notifyAdmins({"messageType": "device", "message": {"deviceType": "admin", "event": "disconnected", "count": adminSparks.length}});
            break;
        case "kiosk":
            kioskSparks = kioskSparks.filter(function(kioskSpark) {
                return kioskSpark.id !== spark.id;
            });
            notifyAdmins({"messageType": "device", "message": {"deviceType": "kiosk", "event": "disconnected", "count": kioskSparks.length}});
            break;
        case "chair":
            chairSparks = chairSparks.filter(function(chairSpark) {
                return chairSpark.id !== spark.id;
            });
            notifyAdmins({"messageType": "device", "message": {"deviceType": "chair", "event": "disconnected", "count": chairSparks.length}});
            break;
        }
    });
}

/**
 * Send data message to all connected admins
 * @param {Message} data - object to send to admin sparks.
 */
function notifyAdmins(data) {
    adminSparks.forEach(function(spark) {
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
            "connectedChairs": chairSparks.length,
            "wallConnected": (wallSpark !== null)
        }
    });
}

// Public functions
/**
 * Adds a request to the live meeting.
 * @param {Request} request
 */
function addRequest(request) {
    console.log(request);
}

module.exports = function(primus) {
    this.primus = primus;
    setupPrimus(primus);

    return {
        version: "1.0",
        addRequest: addRequest
    };
};
