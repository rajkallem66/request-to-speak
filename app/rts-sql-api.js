/* global module,require*/

// SQL Connection
let sql = require("mssql");
let logger = null;
let pool = null;

/**
 * initialize SQL connection.
 * @param {config} config
 */
function setupSql(config) {
    pool = new sql.ConnectionPool(config, function(err) {
        if(err) {
            logger.info(err);
        } else {
            logger.info("RTS DB connected.");
        }
    });
    pool.on("error", function(err) {
        logger.error(err);
    });
}

function addMeeting(meeting) {
    return new Promise(function(fulfill, reject) {
        let transaction = new sql.Transaction(pool);
        transaction.begin().then(function() {
            let request = new sql.Request(transaction);

            request.input("meetingName", meeting.meetingName);
            let query = "Insert into Meeting (meetingName) values (@meetingName)";
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
        let query = "SELECT meetingId, meetingName, active FROM Meeting";
        logger.debug("Statement: " + query);
        pool.request().query(query).then(function(result) {
            logger.debug("Query result.", result.recordset);
            fulfill(result.recordset);
        }, function(err) {
            logger.error("Query error: " + err);
            reject(err);
        });
    });
}

function startMeeting(meeting) {
    return new Promise(function(fulfill, reject) {
        let transaction = new sql.Transaction(pool);
        transaction.begin().then(function() {
            let request = new sql.Request(transaction);

            request.input("meetingId", meeting.meetingId);
            let query = "UPDATE Meeting set active = 1 where @meetingId = " + meeting.meetingId;
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
    let transaction = new sql.Transaction(pool);
    transaction.begin().then(function() {
        let request = new sql.Request(transaction);

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
        let query = "Insert into Request (meetingId,firstName,lastName,official,agency,item,offAgenda,subTopic,stance,notes,phone,email,address,timeToSpeak) ";
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
    let config = {
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
