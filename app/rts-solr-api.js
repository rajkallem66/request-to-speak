/* global module,require*/

// Solr Client
let solr = require("solr-client");
let client = null;
let logger = null;

/**
 * adds a new meeting to the data store.
 * @param {Meeting} meeting
 * @return {Promise}
 */
function addMeeting(meeting) {
    return new Promise(function(fulfill, reject) {
        client.add([meeting], function(err, obj) {
            if(err) {
                logger.error(err);
                reject(err);
            } else {
                logger.info(obj);
                fulfill(obj);
            }
        });
    });
}

/**
 * sets the meeting started flag in the data store.
 * @param {Meeting} meeting
 * @return {Promise}
 */
function startMeeting(meeting) {
    return new Promise(function(fulfill, reject) {
        client.add({id: meeting.id, started: true}, function(err, obj) {
            if(err) {
                logger.error(err);
                reject(err);
            } else {
                logger.info(obj);
                fulfill(obj);
            }
        });
    });
}
/**
 * retrieve meetings from RTS database
 *@return {Promise}
 */
function getMeetings() {
    return new Promise(function(fulfill, reject) {
        let query = client.createQuery()
            .q({type: "meeting"})
            .start(0)
            .rows(100);
        client.search(query, function(err, obj) {
            if(err) {
                logger.error(err);
                reject(err);
            } else {
                logger.info(obj.response.docs);
                fulfill(obj.response.docs);
            }
        });
    });
}
/**
 * Insert new request into database.
 * @param {Request} newRequest
 */
function addRequest(newRequest) {
    client.add(newRequest, function(err, obj) {
        if(err) {
            logger.error(err);
        } else {
            logger.info(obj);
            client.softCommit(function(err, res) {
                if(err) {
                    logger.error(err);
                } else {
                    logger.info(res);
                }
            });
        }
    });
}

module.exports = function(config, log) {
    logger = log;

    client = solr.createClient(config);

    return {
        version: "1.0",
        dbType: "Apache Solr",
        addMeeting: addMeeting,
        addRequest: addRequest,
        getMeetings: getMeetings,
        startMeeting: startMeeting
    };
};
