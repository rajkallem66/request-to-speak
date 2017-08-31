/* global __dirname, require, process */
"use strict";
let winston = require("winston");
let config = require("config");
winston.setLevels(config.get("RTS.log.levels"));
winston.addColors(config.get("RTS.log.colors"));
winston.level = config.get("RTS.log.level");
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {colorize: true});

// Sometimes things to awry.
process.on("uncaughtException", function(err) {
    winston.emergency("uncaughtException:", err.message);
    winston.emergency(err.stack);
    process.exit(1);
});

let express = require("express");
let favicon = require("serve-favicon");
let morgan = require("morgan");
let bodyParser = require("body-parser");
let errorHandler = require("errorhandler");
let http = require("http");
let path = require("path");

let app = express();
let Primus = require("primus");

app.set("port", process.env.PORT || 3000);
app.use(favicon(__dirname + "/client/favicon.ico"));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "client")));

if("development" === app.get("env")) {
    app.use(errorHandler());
}

let server = http.createServer(app);
let transformer = config.get("RTS.wsTransformer");
let primus = new Primus(server, {transformer: transformer});

server.listen(app.get("port"), function() {
    winston.info("Express server listening on port " + app.get("port"));
});

let rtsWsApi = require("./app/rts-ws-api")(primus, winston);
winston.info("RTS WS API Version: " + rtsWsApi.version);

let dbApi = config.get("RTS.dbApi");
let dbConfig = config.get("RTS.dbConfig");

// You can create your own API for Cassandra, Mongo, Oracle, etc. Just adhere to the interface.
let rtsDbApi = require(dbApi)(dbConfig, winston);
winston.info("RTS DB API Type: " + rtsDbApi.dbType);
winston.info("RTS DB API Version: " + rtsDbApi.version);

rtsDbApi.init().then(function() {
    // In case the app died with an active meeting.
    rtsDbApi.getActiveMeeting().then(function(mtg) {
        if(mtg !== undefined) {
            winston.info("Active meeting: " + mtg.meetingId);
            rtsWsApi.startMeeting(mtg);
            rtsWsApi.refreshWall();
        } else {
            winston.info("No active meeting.");
        }
    }, function(err) {
        winston.error("Unable to check for active meeting.");
    });
});

app.use("/api", require("./app/rts-rest-api")(winston, rtsDbApi, rtsWsApi));

// Sacramento County agenda management system access.
let agendaApi = config.get("SIRE.dbApi");
let sireConfig = config.get("SIRE.dbConfig");
let sireApi = require(agendaApi)(sireConfig, winston);
app.get("/sire/meeting", function(req, res) {
    winston.info("Retrieving meetings from agenda management system.");
    sireApi.getMeetings().then(function(data) {
        res.send(data);
    }, function(err) {
        res.status(500).send(err);
    });
});

app.get("/sire/item/:meetingId", function(req, res) {
    let meetingId = req.params.meetingId;
    winston.info("Retrieving items from agenda management system for meetingId: " + meetingId);
    sireApi.getItems(meetingId).then(function(data) {
        res.send(data);
    }, function(err) {
        res.status(500).send(err);
    });
});

// Sacramento County custom authorization via F5
app.get("/authorize", function(req, res) {
    let userId = req.query.user;
    let groupName = req.query.group;
    if(!(userId && groupName)){
        res.status(400).send("Bad Request");
    } if((userId === "short") && groupName == "stout") {
        res.status(418).send("I'm a teapot");
    } else {
        let groups = config.get("AUTH.groups");
        let group = groups.find(function(g) {
            return g.group === groupName;
        });
        if(group) {
            if(group.users.includes(userId)) {
                res.status(204).end();
                winston.info("Authorized access: " + userId);                
            } else {
                res.status(403).send("Forbidden");
                winston.error("Attemtped unauthorized access: " + userId);
            }
        } else {
            res.status(410).send("Gone");
        }
    }
});
