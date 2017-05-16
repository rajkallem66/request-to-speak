/* global module,require*/

// SQL Connection
var sql = require("mssql");
var logger = null;
var pool = null;

/**
 * initialize SQL connection.
 * @param {config} config
 */
function setupSql(config) {
    sql.connect(config).then(function(p) {
        pool = p;
    }).then(function(result) {
        if(result) {
            logger.info("SQL Connected.", result);
        }
    }).catch(function(err) {
        // ... error checks
        logger.error(err);
    });

    sql.on("error", function(err) {
        // ... error handler
        logger.error(err);
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
function addMeeting(meeting) {
    return new Promise(function(fulfill, reject) {
        var transaction = new sql.Transaction(pool);
        transaction.begin().then(function() {
            var request = new sql.Request(transaction);

            request.input("meetingName", meeting.meetingName);
            var query = "Insert into Meeting (meetingName) values (@meetingName)";
            logger.debug("Statement: " + query);
            request.query(query).then(function() {
                transaction.commit().then(function(recordSet) {
                    logger.debug("Commit result.", recordSet);
                    fulfill();
                }).catch(function(err) {
                    logger.error("Error in Transaction Commit." + err);
                    reject(err);
                });
            }).catch(function(err) {
                logger.error("Error in Transaction Begin." + err);
                reject(err);
            });
        }).catch(function(err) {
            logger.error(err);
            reject(err);
        });
    });
}

function getMeetings() {
    return new Promise(function(fulfill, reject) {
        var query = "SELECT meetingId, meetingName, active FROM Meeting";
        logger.debug("Statement: " + query);
        pool.request().query(query).then(function(result) {
            logger.debug("Query result.", result.recordset);
            fulfill(result.recordset);
        },function(err) {
            logger.error("Query error: " + err);
            reject(err);
        });
    });
}

function startMeeting(meeting) {
    return new Promise(function(fulfill, reject) {
        var transaction = new sql.Transaction(pool);
        transaction.begin().then(function() {
            var request = new sql.Request(transaction);

            request.input("meetingId", meeting.meetingId);
            var query = "UPDATE Meeting set active = 1 where @meetingId = " + meeting.meetingId;
            logger.debug("Statement: " + query);
            request.query(query).then(function() {
                transaction.commit().then(function(recordSet) {
                    logger.debug("Commit result.", recordSet);
                    fulfill();
                }).catch(function(err) {
                    logger.error("Error in Transaction Commit." + err);
                    reject(err);
                });
            }).catch(function(err) {
                logger.error("Error in Transaction Begin." + err);
                reject(err);
            });
        }).catch(function(err) {
            logger.error(err);
            reject(err);
        });
    });
}


/**
 * Insert new request into database.
 * @param {Request} newRequest
 */
function addRequest(newRequest) {
    // Query
    var transaction = new sql.Transaction(pool);
    transaction.begin().then(function() {
        var request = new sql.Request(transaction);

        request.input("meetingId", newRequest.meetingId);
        request.input("firstName", newRequest.firstName);
        request.input("lastName", newRequest.lastName);
        request.input("official", newRequest.official);
        request.input("agency", newRequest.agency);
        request.input("item", newRequest.item);
        request.input("offAgenda", newRequest.offAgenda);
        request.input("subTopic", newRequest.subTopic);
        request.input("stance", newRequest.stance);
        request.input("notes", newRequest.notes);
        request.input("phone", newRequest.phone);
        request.input("email", newRequest.email);
        request.input("address", newRequest.address);
        request.input("timeToSpeak", newRequest.timeToSpeak);
        var query = "Insert into Request (meetingId,firstName,lastName,official,agency,item,offAgenda,subTopic,stance,notes,phone,email,address,timeToSpeak) ";
        query += "values (@meetingId,@firstName,@lastName,@official,@agency,@item,@offAgenda,@subTopic,@stance,@notes,@phone,@email,@address,@timeToSpeak)";
        logger.debug("Statement: " + query);
        request.query(query).then(function() {
            transaction.commit().then(function(recordSet) {
                logger.debug("Commit result.", recordSet);
            }).catch(function(err) {
                logger.error("Error in Transaction Commit." + err);
            });
        }).catch(function(err) {
            logger.error("Error in Transaction Begin." + err);
        });
    }).catch(function(err) {
        logger.error(err);
    });
}

module.exports = function(cfg, log) {
    // config is delivered frozen and this causes problems in mssql. So, just copy over.
    var config = {
        server: cfg.server,
        database: cfg.database,
        user: cfg.user,
        password: cfg.password,
        port: cfg.port
    };

    logger = log;

    setupSql(config);

    return {
        version: "1.0",
        dbType: "Microsoft SQL Server",
        addRequest: addRequest,
        addMeeting: addMeeting,
        getMeetings: getMeetings,
        startMeeting: startMeeting,
        setupSql: setupSql
    };
};
