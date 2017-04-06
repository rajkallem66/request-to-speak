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
app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, "public")));

if("development" === app.get("env")) {
    app.use(errorHandler());
}

var server = http.createServer(app);
var primus = new Primus(server, {transformer: "faye"});
var kiosks = [];

server.listen(app.get("port"), function() {
    console.log("Express server listening on port " + app.get("port"));
});

primus.on("connection", function(spark) {
    if(spark.query === "kiosk") {
        kiosks.push(spark);
    }
    console.log("New connection.");
    spark.on("data", function(message) {
        console.log("Message received %s.", message);

        if(message == "ping") {
            primus.write({reply: "pong"});
        }
    });
});

// SQL Connection
var sql = require("mssql");

sql.connect("mssql://sql-solr:78yhS0NpfxLbrU!T@heron.saccounty.net/sire").then(function() {
    console.log("connected!!!");
    // Query
    var query = "SELECT TOP 10 meet.meet_id, meet.meet_type, meet.meet_date, item.item_id, item.caption, page.page_id, " +
    "page.subdir, page.page_description, page.orig_extens, vault.vault_path FROM [sire].[alpha].[ans_meetings] " +
    "meet INNER JOIN [alpha].[ans_meet_items] item ON item.meet_id = meet.meet_id INNER JOIN [alpha].[published_meetings_Page] " +
    "page ON item.item_id = page.item_id INNER JOIN [sire].[alpha].[published_meetings_Doc] doc ON doc.meet_id = meet.meet_id " +
    "INNER JOIN [alpha].[ans_vaults] vault ON vault.vault_id = doc.vault_id ORDER BY vault.vault_path, page.subdir";

    new sql.Request().query(query).then(function(recordset) {
        console.dir(recordset);
    }).catch(function(err) {
        console.log(err);
    });

    // Stored Procedure

/*    new sql.Request()
    .input('input_parameter', sql.Int, value)
    .output('output_parameter', sql.VarChar(50))
    .execute('procedure_name').then(function(recordsets) {
        console.dir(recordsets);
    }).catch(function(err) {
        // ... execute error checks
    });
*/
    // ES6 Tagged template literals (experimental)

    // sql.query`select * from mytable where id = ${value}`.then(function(recordset) {
    //     console.dir(recordset);
    // }).catch(function(err) {
    //     // ... query error checks
    // });
}).catch(function(err) {
    // ... connect error checks
    console.log(err);
});
