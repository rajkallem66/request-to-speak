/* global module */
let stack = require("callsite");
let winston = require("winston");
let path = require("path");
let config = require("config");
let logTransports = config.get("log.transports");

let formatter = function(options) {
    return options.level.toUpperCase() + " " +
        (options.message ? options.message : "") +
        (options.meta && Object.keys(options.meta).length ? "\n\t" + JSON.stringify(options.meta) : "");
};

let logOptions = {
    transports: [],
    levels: config.get("log.levels"),
    level: config.get("log.level")
};

logTransports.forEach(function(t) {
    switch(t.name) {
    case "console":
        logOptions.transports.push(new winston.transports.Console(t.options));
        break;
    case "syslog":
        t.options.timestamp = function() {
            return Date.now();
        };
        t.options.formatter = formatter;
        require("winston-syslog").Syslog;
        logOptions.transports.push(new winston.transports.Syslog(t.options));
        break;
    }
});

let logger = new winston.Logger(logOptions);
winston.addColors(config.get("log.colors"));
var oldInfo = logger.info;
logger.info = function(...args) {
    // var args = Array.prototype.slice.call(arguments, 0);
    var site = stack()[1];
    args[0] = "[" + (site.getFunctionName() || "anonymous") + ":" + path.basename(site.getFileName()) +
        ":" + site.getLineNumber() + "] " + args[0];
    return oldInfo.apply(this, args);
};
var oldDebug = logger.debug;
logger.debug = function(...args) {
    // var args = Array.prototype.slice.call(arguments, 0);
    var site = stack()[1];
    args[0] = "[" + (site.getFunctionName() || "anonymous") + ":" + path.basename(site.getFileName()) +
    ":" + site.getLineNumber() + "] " + args[0];
    return oldDebug.apply(this, args);
};

module.exports = logger;
