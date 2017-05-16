/* global module,require*/
/* eslint no-console: "off" */

// SQL Connection
var sql = require("mssql");
var logger = null;
var pool = null;

/**
 * initialize SQL connection.
 * @param {config} config
 */
function setupSql(config) {
/*    sql.connect(config).then(function(p) {
        pool = p;
    }).then(function(result) {
        if(result) {
            console.dir(result);
        }
    }).catch(function(err) {
        // ... error checks
        logger.error(err);
    });

    sql.on("error", function(err) {
        // ... error handler
        console.log("On Error?: " + err);
    });
*/}

/**
 * get meetings from agenda management system
 * @return {Promise}
 */
function getMeetings() {
    // pool.connect();
    return new Promise(function(fulfill, reject) {
        var data = [
            {
                meetingName: "Tuesday Board Meeting 01/01/2018",
                meetingDate: "01/01/2018",
                items: [
                    {
                        itemNumber: "1",
                        itemName: "Sacramento County Budget Hearing"
                    },
                    {
                        itemNumber: "2",
                        itemName: "Homeless Shelter Funding"
                    }
                ]
            },
            {
                meetingName: "Sacramento County Regional Sanitation District 01/03/2018",
                meetingDate: "01/03/2018",
                items: [
                    {
                        itemNumber: "1",
                        itemName: "EchoWater Project Update"
                    },
                    {
                        itemNumber: "2",
                        itemName: "Operations Budget Hearing"
                    },
                    {
                        itemNumber: "3",
                        itemName: "A Meeting Item With A Really Long Title Addressing A Very Serious Topic Regarding A Few Former Resolutions And A Few Pending Policies With Several Interested Parties."
                    }
                ]
            }
        ];
        fulfill(data);
    });
}
// Query
/*    var query = "SELECT TOP 10 meet.meet_id, meet.meet_type, meet.meet_date, item.item_id, item.caption, page.page_id, " +
    "page.subdir, page.page_description, page.orig_extens, vault.vault_path FROM [sire].[alpha].[ans_meetings] " +
    "meet INNER JOIN [alpha].[ans_meet_items] item ON item.meet_id = meet.meet_id INNER JOIN [alpha].[published_meetings_Page] " +
    "page ON item.item_id = page.item_id INNER JOIN [sire].[alpha].[published_meetings_Doc] doc ON doc.meet_id = meet.meet_id " +
    "INNER JOIN [alpha].[ans_vaults] vault ON vault.vault_id = doc.vault_id ORDER BY vault.vault_path, page.subdir";
*/
/*    new sql.Request().query(query).then(function(recordset) {
        console.dir(recordset);
    }).catch(function(err) {
        console.log(err);
    });
*/
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

module.exports = function(cfg, logger) {
    // config is delivered frozen and this causes problems in mssql. So, just copy over.
    var config = {
        server: cfg.server,
        database: cfg.database,
        user: cfg.user,
        password: cfg.password,
        port: cfg.port
    };

    this.logger = logger;

    setupSql(config);

    return {
        version: "1.0",
        dbType: "Microsoft SQL Server",
        getMeetings: getMeetings
    };
};
