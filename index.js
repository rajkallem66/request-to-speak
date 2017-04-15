/* global __dirname, require, process */
"use strict";
var winston = require("winston");
var config = require("config");
winston.level = config.get("RTS.log.level");

var express = require("express");
var favicon = require("serve-favicon");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var errorHandler = require("errorhandler");
var http = require("http");
var path = require("path");

var app = express();
var Primus = require("primus");

app.set("port", process.env.PORT || 3000);
app.use(favicon(__dirname + "/client/favicon.ico"));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, "client")));

if("development" === app.get("env")) {
    app.use(errorHandler());
}
 
var server = http.createServer(app);
var transformer = config.get("RTS.wsTransformer");
var primus = new Primus(server, {transformer: transformer});

server.listen(app.get("port"), function() {
    winston.info("Express server listening on port " + app.get("port"));
});

var rtsWsApi = require("./app/rts-ws-api")(primus, winston);
winston.info("RTS WS API Version: " + rtsWsApi.version);

var dbApi = config.get("RTS.dbApi");
var dbConfig = config.get("RTS.dbConfig");

// You can create your own API for Cassandra, Mongo, Oracle, etc. Just adhere to the interface.
var rtsDbApi = require(dbApi)(dbConfig, winston);
winston.info("RTS DB API Type: " + rtsDbApi.dbType);
winston.info("RTS DB API Version: " + rtsDbApi.version);

app.post("/request", function(req, res) {
    var request = req.body;
    winston.info("Adding request from: " + req._remoteAddress);
    winston.debug("Request data.", request);
    rtsDbApi.addRequest(request);
    rtsWsApi.addRequest(request);
    res.end("yes");
});

app.post("/addMeeting", function(req, res) {
    var meeting = req.body;
    winston.info("Adding meeting id: " + meeting.meetingId);
    rtsDbApi.addMeeting(meeting);
    res.end("yes");
});

app.post("/startMeeting", function(req, res) {
    var meeting = req.body;
    winston.info("Starting meeeting id: " + meeting.meetingId);
    rtsWsApi.startMeeting(meeting);
    res.end("yes");
});
