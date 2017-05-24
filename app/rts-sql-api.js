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

/**
 * Adds a meeting to the RTS DB.
 * @param {meeting} meeting
 * @return {Promise}
 */
function addMeeting(meeting) {
    return new Promise(function(fulfill, reject) {
        let request = pool.request();

        if(meeting.sireId !== undefined) {
            request.input("sireId", meeting.sireId);
        }
        request.input("meetingName", meeting.meetingName);
        request.input("meetingDate", meeting.meetingDate);
        request.input("active", 0);
        request.output("id");
        request.execute("InsertMeeting").then(function(result) {
            logger.debug("Commit result.", result);
            let transaction = new sql.Transaction(pool);
            transaction.begin().then(function() {
                let promises = [];
                meeting.items.forEach(function(item) {
                    promises.push(itemRequest(result.id, item, transaction));
                });
                Promise.all(promises).then(function(ir) {
                    fulfill(result);
                }, function(ierr) {
                    reject(ierr);
                });
            });
        }).catch(function(err) {
            logger.error("Error in stored procedure." + err);
            reject(err);
        });
    });
}

function itemRequest(meetingId, item, transaction) {
    let request = new sql.Request(transaction);
    request.input("meetingId", meetingId);
    request.input("itemOrder", item.itemOrder);
    request.input("itemName", item.itemName);
    request.input("timeToSpeak", item.timeToSpeak);
    let query = "INSERT INTO Item(meetingId,itemOrder, itemName, timeToSpeak) values(@meetingId, @itemOrder, @itemName, @timeToSpeak)";
    return request.query(query);
}

function getMeetings() {
    return new Promise(function(fulfill, reject) {
        let query = "SELECT meetingId, sireId, meetingName, active FROM Meeting";
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
 * @return {Promise}
 */
function addRequest(newRequest) {
    return new Promise(function(fulfill, reject) {
        // Query
        let request = pool.request();

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
        request.output("id");
        request.execute("InsertRequest").then(function(result) {
            logger.debug("New request inserted.", result);
            fulfill(result);
        }).catch(function(err) {
            logger.error("Error in calling insert stored procedure." + err);
            reject(err);
        });
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
