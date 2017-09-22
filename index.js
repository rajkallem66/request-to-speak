/* global __dirname, require, process */
"use strict";
let winston = require("winston");
let config = require("config");

winston.setLevels(config.get("RTS.log.levels"));
winston.addColors(config.get("RTS.log.colors"));
// winston.level = config.get("RTS.log.level");
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

 // External system integration.
if(config.get("AGENDA")) {
    winston.info("Agenda integration found.");
    let agendaApi = config.get("AGENDA.dbApi");
    let agendaConfig = config.get("AGENDA.dbConfig");
    let agendaDbApi = require(agendaApi)(agendaConfig, winston);
    winston.info("Agenda DB API Type: " + agendaDbApi.dbType);
    winston.info("Agenda DB API Version: " + agendaDbApi.version);

    let agendaRestApi = config.get("AGENDA.restApi");
    winston.info("Agenda REST API: " + agendaRestApi);    
    app.use("/agenda", require(agendaRestApi)(winston, agendaDbApi));
}

// Side-chain authorization endpoint for F5 or the like.
if(config.get("AUTH")) {
    winston.info("Authorization API found.");
    let authApi = config.get("AUTH.restApi");
    app.use("/auth", require(authApi)(winston));
}
