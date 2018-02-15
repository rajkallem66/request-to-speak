/* global module,require*/

// LokiJS Connection
let Loki = require("lokijs");
let db = null;
let meetings = null;
let logger = null;
let config = null;
const uuid = require("uuid/v1");

/**
 * Initialize the Loki DB
 * @return {Promise}
 */
function lokiInit() {
    return new Promise(function(fulfill, reject) {
        config.options.autoloadCallback = function() {
            try {
                meetings = db.getCollection("meetings");
                if(meetings === null) {
                    meetings = db.addCollection("meetings");
                }
            } catch (e) {
                logger.error(e);
                reject(e);
            }
            fulfill();
        };
        db = new Loki(config.file, config.options);
    });
}

/**
 * Adds a meeting to the RTS DB.
 * @param {meeting} meeting
 * @return {Promise}
 */
function addMeeting(meeting) {
    return new Promise(function(fulfill, reject) {
        try {
            let newMeeting = meetings.insert(meeting);
            newMeeting.meetingId = newMeeting.$loki;
            meetings.update(newMeeting);
            fulfill(newMeeting);
        } catch(err) {
            logger.error(err);
            reject(err);
        }
    });
}

/**
 * @param {String} meetingId
 * @return {Promise}
 */
function getMeetings(meetingId) {
    return new Promise(function(fulfill, reject) {
        try {
            if(meetingId) {
                var mtg = meetings.get(parseInt(meetingId));
                if(mtg) {
                    fulfill(mtg);
                } else {
                    reject("Meeting does not exist.");
                }
            } else {
                fulfill(meetings.data);
            }
        } catch(err) {
            logger.error(err);
            reject(err);
        }
    });
}

/**
 * set meeting status to started.
 * @param {Meeting} meetingId
 * @return {Promise}
 */
function startMeeting(meetingId) {
    return updateMeetingStatus(meetingId, "started");
}

/**
 * set meeting status to ended.
 * @param {String} meetingId
 * @return {Promise}
 */
function endMeeting(meetingId) {
    return updateMeetingStatus(meetingId, "ended");
}

/**
 * utility function to update meeting status
 * @param {String} meetingId
 * @param {Meeting} meeting
 * @return {Promise}
 */
function updateMeeting(meetingId, meeting) {
    return new Promise(function(fulfill, reject) {
        try {
            meeting.$loki = parseInt(meetingId);
            meetings.update(meeting);
            fulfill();
        } catch (err) {
            logger.error(err);
            reject(err);
        }
    });
}

/**
 * utility function to update meeting status
 * @param {string} meetingId
 * @param {string} status
 * @return {Promise}
 */
function updateMeetingStatus(meetingId, status) {
    return new Promise(function(fulfill, reject) {
        try {
            let mtg = meetings.get(meetingId);
            mtg.status = status;
            meetings.update(mtg);
            fulfill();
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Delete a meeting in the database.
 * @param {String} meetingId
 * @return {Promise}
 */
function deleteMeeting(meetingId) {
    return new Promise(function(fulfill, reject) {
        try {
            let mtg = meetings.get(parseInt(meetingId));
            meetings.remove(mtg);
            fulfill();
        } catch (err) {
            logger.error(err);
            reject(err);
        }
    });
}

/**
 * Returns a specific request.
 * @param {String} requestId
 * @return {Promise}
 */
function getRequest(requestId) {
    return new Promise(function(fulfill, reject) {
        try {
            let mtg = meetings.where(function(m) {
                return m.requests.findIndex(function(r) {
                    return r.requestId === requestId;
                }) > -1;
            });
            if (mtg.length === 1) {
                let req = mtg[0].requests.find(function(r) {
                    return r.requestId === requestId;
                });
                if(req !== null) {
                    fulfill(req);
                } else {
                    reject("Meeting does not contain request.");
                }
            } else {
                reject("Request does not exist.");
            }
        } catch(err) {
            logger.error(err);
            reject(err);
        }
    });
}

/**
 * Insert new request into database.
 * @param {Request} newRequest
 * @return {Promise}
 */
function addRequest(newRequest) {
    return new Promise(function(fulfill, reject) {
        try {
            let mtg = meetings.get(newRequest.meetingId);
            newRequest.requestId = uuid();
            mtg.requests.push(newRequest);
            meetings.update(mtg);
            fulfill(newRequest.requestId);
        } catch(err) {
            logger.error(err);
            reject(err);
        }
    });
}

/**
 * Update a request in the database.
 * @param {Request} updateRequest
 * @return {Promise}
 */
function updateRequest(updateRequest) {
    return new Promise(function(fulfill, reject) {
        try {
            let mtg = meetings.get(parseInt(updateRequest.meetingId));
            if(mtg !== null) {
                mtg.requests.splice(mtg.requests.findIndex(function(r) {
                    return r.requestId === updateRequest.requestId;
                }), 1, updateRequest);
                meetings.update(mtg);
                fulfill();
            } else {
                reject("Meeting does not exist.");
            }
        } catch(err) {
            logger.error(err);
            reject(err);
        }
    });
}

/**
 * Delete a request in the database.
 * @param {String} requestId
 * @return {Promise}
 */
function deleteRequest(requestId) {
    return new Promise(function(fulfill, reject) {
        try {
            let mtgs = meetings.where(function(m) {
                return m.requests.findIndex(function(r) {
                    return r.requestId === requestId;
                }) > -1;
            });
            if (mtgs.length === 1) {
                let mtg = mtgs[0];
                let req = mtg.requests.find(function(r) {
                    return r.requestId === requestId;
                });
                if(req !== null) {
                    req.status = "deleted";
                    meetings.update(mtg);
                    fulfill();
                } else {
                    reject("Meeting does not contain request.");
                }
            } else {
                reject("Request does not exist.");
            }
        } catch(err) {
            logger.error(err);
            reject(err);
        }
    });
}

/**
 * Delete a request in the database.
 * @param {String} requestId
 * @return {Promise}
 */
function removeRequest(requestId) {
    return new Promise(function(fulfill, reject) {
        try {
            let mtgs = meetings.where(function(m) {
                return m.requests.findIndex(function(r) {
                    return r.requestId === requestId;
                }) > -1;
            });
            if (mtgs.length === 1) {
                let mtg = mtgs[0];
                let req = mtg.requests.find(function(r) {
                    return r.requestId === requestId;
                });
                if(req !== null) {
                    req.status = "removed";
                    meetings.update(mtg);
                    fulfill();
                } else {
                    reject("Meeting does not contain request.");
                }
            } else {
                reject("Request does not exist.");
            }
        } catch(err) {
            logger.error(err);
            reject(err);
        }
    });
}

/**
 * returns information on an active meeting
 * @return {Promise}
 */
function getActiveMeeting() {
    return new Promise(function(fulfill, reject) {
        try {
            var activeMeetings = meetings.find( {status: "started"} );
            if(activeMeetings.length === 0) {
                fulfill();
            } else if(activeMeetings.length > 1) {
                reject("More than one active meeting.");
            } else {
                fulfill(activeMeetings[0]);
            }
        } catch(err) {
            logger.error(err);
            reject(err);
        }
    });
}

/**
 *
 * @param {String} newItem
 * @return {Promise}
 */
function addItem(newItem) {
    return new Promise(function(fulfill, reject) {
        try {
            let mtg = meetings.get(newItem.meetingId);
            newItem.itemId = uuid();
            mtg.items.push(newItem);
            meetings.update(mtg);
            fulfill(newItem.itemId);
        } catch(err) {
            logger.error(err);
            reject(err);
        }
    });
}

module.exports = function(cfg, log) {
    logger = log;
    config = cfg;

    return {
        version: "1.0",
        dbType: "LokiJS",
        init: lokiInit,
        getRequest: getRequest,
        addRequest: addRequest,
        updateRequest: updateRequest,
        deleteRequest: deleteRequest,
        removeRequest: removeRequest,
        addMeeting: addMeeting,
        getMeetings: getMeetings,
        updateMeeting: updateMeeting,
        getActiveMeeting: getActiveMeeting,
        startMeeting: startMeeting,
        endMeeting: endMeeting,
        deleteMeeting: deleteMeeting,
        addItem: addItem
    };
};
