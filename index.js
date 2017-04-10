/* global __dirname, require, process */
/* eslint no-console: "off" */
"use strict";

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
var primus = new Primus(server, {transformer: "faye"});

server.listen(app.get("port"), function() {
    console.log("Express server listening on port " + app.get("port"));
});

var rtsWsApi = require("./app/rts-ws-api")(primus);
console.log("RTS WS API Version: " + rtsWsApi.version);

var rtsSqlApi = require("./app/rts-sql-api")("mssql://sql-solr:78yhS0NpfxLbrU!T@heron.saccounty.net/sire");
console.log("RTS SQL API Version: " + rtsSqlApi.version);

app.post("/request", function(req, res) {
    var firstName = req.body.firstName;
    var request = req.body;
    console.log("First name = " + firstName);
    res.end("yes");
    rtsSqlApi.addRequest(request);
    rtsWsApi.addRequest(request);
});
app.post("/addMeeting", function(req, res) {
    var meeting = req.body;
    console.log("Meeting ID = " + meeting.meetingId);
    res.end("yes");
    rtsSqlApi.addMeeting(request);
});
