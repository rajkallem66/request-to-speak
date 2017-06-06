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
    pool = new sql.ConnectionPool(config).connect().then(function(p) {
        return new Promise(function(fulfill, reject) {
            logger.debug("RTS DB Connected.");
            pool = p;
            pool.on("error", function(err) {
                logger.error(err);
            });
            fulfill();
        });
    }, function(err) {
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
        request.input("status", "new");
        request.output("id");
        request.execute("InsertMeeting").then(function(result) {
            logger.debug("Commit result.", result);
            let meetingId = result.returnValue;
            let transaction = new sql.Transaction(pool);
            transaction.begin().then(function() {
                let p = Promise.resolve();

                meeting.items.forEach(function(item) {
                    p = p.then(function(ir) {
                        return itemRequest(meetingId, item, transaction);
                    }, function(err) {
                        transaction.rollback().then(function() {
                            reject(err);
                        }, function() {
                            reject(err);
                        });
                    });
                });
                p.then(function(ir) {
                    transaction.commit().then(function() {
                        fulfill(meetingId);
                    }, function(err) {
                        reject(err);
                    });
                });
            });
        }).catch(function(err) {
            logger.error("Error in stored procedure." + err);
            reject(err);
        });
    });
}

/**
 * Creates a mssql.request for an item
 * @param {String} meetingId
 * @param {Object} item
 * @param {Object} transaction
 * @return {Request}
 */
function itemRequest(meetingId, item, transaction) {
    let request = new sql.Request(transaction);

    request.input("meetingId", meetingId);
    request.input("itemOrder", item.itemOrder);
    request.input("itemName", item.itemName);
    request.input("timeToSpeak", 3);
    request.output("id");
    return request.execute("InsertItem");
}

/**
 * @return {Promise}
 */
function getMeetings() {
    return new Promise(function(fulfill, reject) {
        let meetingQuery = "SELECT meetingId, sireId, meetingName, meetingDate, status FROM Meeting";
        logger.debug("Meeting statement: " + meetingQuery);
        pool.request().query(meetingQuery).then(function(meetingResult) {
            logger.debug("Meeting query result.", meetingResult.recordset);
            let itemQuery = "SELECT i.meetingId, i.itemId, i.itemOrder, i.itemName, i.timeToSpeak FROM Meeting m " +
                "INNER JOIN Item i ON m.meetingId = i.meetingId";
            logger.debug("Item statement: " + itemQuery);
            pool.request().query(itemQuery).then(function(itemResult) {
                logger.debug("Item query result.", itemResult.recordset);
                let meetings = [];
                meetingResult.recordset.forEach(function(meeting) {
                    meeting.items = itemResult.recordset.filter(function(item) {
                        return item.meetingId === meeting.meetingId;
                    });
                    meetings.push(meeting);
                });
                fulfill(meetings);
            }, function(err) {
                logger.error("Item query error.", err);
                reject(err);
            });
        }, function(err) {
            logger.error("Meeting query error.", err);
            reject(err);
        });
    });
}

/**
 * set meeting status to started.
 * @param {Meeting} meeting
 * @return {Promise}
 */
function startMeeting(meeting) {
    return updateMeetingStatus(meeting.meetingId, "started");
}

/**
 * set meeting status to ended.
 * @param {Meeting} meeting
 * @return {Promise}
 */
function endMeeting(meeting) {
    return updateMeetingStatus(meeting.meetingId, "ended");
}

/**
 * utility function to update meeting status
 * @param {string} meetingId
 * @param {string} status
 * @return {Promise}
 */
function updateMeetingStatus(meetingId, status) {
    return new Promise(function(fulfill, reject) {
        let transaction = new sql.Transaction(pool);
        transaction.begin().then(function() {
            let request = new sql.Request(transaction);

            request.input("meetingId", meetingId);
            let query = "UPDATE Meeting set status = '" + status + "' where @meetingId = " + meetingId;
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
            logger.error("Error in calling insert stored procedure.", err);
            reject(err);
        });
    });
}

/**
 * returns information on an active meeting
 * @return {Promise}
 */
function getActiveMeeting() {
    var doQuery = function(fulfill, reject) {
        let query = "SELECT meetingId, sireId, meetingName, status FROM Meeting WHERE status = 'started'";
        logger.debug("Statement: " + query);
        pool.request().query(query).then(function(result) {
            logger.debug("Query result.", result.recordset);
            if(result.recordset.length === 0) {
                fulfill();
            } else if(result.recordset.length === 1) {
                fulfill(result.recordset[0]);
            } else {
                logger.error("More than one active meeting.");
                reject(result.recordset);
            }
        }, function(err) {
            logger.error("Query error: " + err);
            reject(err);
        });
    };

    // The pool may not be there. If it isn't, just chain to the promise.
    if(pool.then !== undefined) {
        return pool.then(function() {
            return new Promise(doQuery);
        });
    } else {
        return new Promise(doQuery);
    }
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
        getActiveMeeting: getActiveMeeting,
        startMeeting: startMeeting,
        endMeeting: endMeeting,
        setupSql: setupSql
    };
};
