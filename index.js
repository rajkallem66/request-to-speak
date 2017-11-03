/* global __dirname, require, process */
"use strict";
let winston = require("winston");
let config = require("config");
let logTransports = config.get("RTS.log.transports");
let logOptions = {
    transports: [],
    levels: config.get("RTS.log.levels"),
    level: config.get("RTS.log.level")
};
logTransports.forEach(function(t) {
    switch(t.name) {
    case "console": 
        logOptions.transports.push(new winston.transports.Console(t.options));
        break;
    case "syslog":
        require('winston-syslog').Syslog;
        let sysTransport = new winston.transports.Syslog(t.options)
        logOptions.transports.push(sysTransport);
        break;
    }
});

let logger = new winston.Logger(logOptions);
winston.addColors(config.get("RTS.log.colors"));

// Sometimes things to awry.
process.on("uncaughtException", function(err) {
    logger.emerg("uncaughtException:", err.message);
    logger.emerg(err.stack);
    process.exit(1);
});

let express = require("express");
let favicon = require("serve-favicon");
let bodyParser = require("body-parser");
let http = require("http");
let path = require("path");

let app = express();
let Primus = require("primus");

let port;
try {
    port = config.get("RTS.port");
} catch(e) {
    logger.info("No port specified.");
}

app.set("port", port || 3000);
app.use(favicon(__dirname + "/client/favicon.ico"));
app.use(bodyParser.json());-
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "client")));

let server = http.createServer(app);
let primusConfig = config.get("RTS.primus");
let primus = new Primus(server, primusConfig);

primus.save(__dirname +'/client/lib/primus.js');

server.listen(app.get("port"), function() {
    logger.info("Express server listening on port " + app.get("port"));
});

let rtsWsApi = require("./app/rts-ws-api")(primus, logger);
logger.info("RTS WS API Version: " + rtsWsApi.version);

let dbApi = config.get("RTS.dbApi");
let dbConfig = config.get("RTS.dbConfig");

// You can create your own API for Cassandra, Mongo, Oracle, etc. Just adhere to the interface.
let rtsDbApi = require(dbApi)(dbConfig, logger);
logger.info("RTS DB API Type: " + rtsDbApi.dbType);
logger.info("RTS DB API Version: " + rtsDbApi.version);

rtsDbApi.init().then(function() {
    // In case the app died with an active meeting.
    rtsDbApi.getActiveMeeting().then(function(mtg) {
        if(mtg !== undefined) {
            logger.info("Active meeting: " + mtg.meetingId);
            rtsWsApi.startMeeting(mtg);
            rtsWsApi.refreshWall();
        } else {
            logger.info("No active meeting.");
        }
    }, function(err) {
        logger.error("Unable to check for active meeting.");
    });
});

app.use("/api", require("./app/rts-rest-api")(logger, rtsDbApi, rtsWsApi));

// Sacramento County agenda management system access.
let agendaApi = config.get("SIRE.dbApi");
let sireConfig = config.get("SIRE.dbConfig");
let sireApi = require(agendaApi)(sireConfig, logger);
app.get("/sire/meeting", function(req, res) {
    logger.info("Retrieving meetings from agenda management system.");
    sireApi.getMeetings().then(function(data) {
        res.send(data);
    }, function(err) {
        res.status(500).send(err);
    });
});

app.get("/sire/item/:meetingId", function(req, res) {
    let meetingId = req.params.meetingId;
    logger.info("Retrieving items from agenda management system for meetingId: " + meetingId);
    sireApi.getItems(meetingId).then(function(data) {
        res.send(data);
    }, function(err) {
        res.status(500).send(err);
    });
});

// Sacramento County custom authorization via F5
app.get("/auth/authorize", function(req, res) {
    let userId = req.query.user;
    if(!userId) {
        res.status(400).send("Bad Request");
    } else {
        let users = config.get("AUTH.users");
        let user = users.find(function(u) {
            return u.user === userId;
        });
        if(user) {
            res.status(200).send(JSON.stringify(user.groups));
            logger.info("Authorized access: " + userId);
        } else {
            res.status(403).send("Forbidden");
            logger.error("Attemtped unauthorized access: " + userId);
        }
    }
});
