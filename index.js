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
let passport = require("passport");
let favicon = require("serve-favicon");
let bodyParser = require("body-parser");
let http = require("http");
let path = require("path");

require('./app/rts-passport')(passport, config.get("security.passport"));

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

app.post('/login/callback',
passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
    function(req, res) {
    res.redirect('/');
    }
);

app.use(passport.initialize());
app.use(passport.session(config.get("security.session")));
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

 // External system integration.
 let agenda;
 try {
    agenda = config.get("AGENDA");
 } catch(e) {
    winston.info("No agenda system integration.");
 }
 
if(agenda) {
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
