/* eslint no-console: "off" */
define(["durandal/app", "plugins/observable", "eventHandler", "moment"],
function(app, observable, event, moment) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        messages: [],
        requests: [],
        newRequests: [],
        items: [],
        totalTimeRemaining: 0,
        primus: null,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "board");
            }
        },
        initializeMessage: function(message) {
            if(message.meeting.meetingId !== undefined) {
                this.isMeetingActive = true;
                message.meeting.items.forEach(function(i) {
                    i.requests = []; i.timeRemaining = 0;
                });
                this.items = message.meeting.items;
                this.newRequests = message.meeting.requests;
                this.requests = message.meeting.requests;
                this.addToList();
            }
        },
        meetingMessage: function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
                message.meeting.items.forEach(function(i) {
                    i.requests = []; i.timeRemaining = 0;
                });
                this.items = message.meeting.items;
                this.newRequests = message.meeting.requests;
                this.requests = message.meeting.requests;
                this.addToList();
            } else {
                this.isMeetingActive = false;
                this.totalTimeRemaining = 0;
                this.items = [];
                this.requests = [];
            }
        },
        requestMessage: function(message) {
            var requests = this.requests;
            if(message.event === "add") {
                requests.push(message.request);
                this.newRequests.push(message.request);
                this.addToList();
            } else if(message.event === "update") {
                this.updateList(message.request);
            } else {
                var requestId = parseInt(message.requestId);
                this.removeFromList(requestId);
            }
        }
    };

    ret.format = function(date) {
        return moment(date).format("HH:mm:ss A");
    };

    ret.addToList = function() {
        var items = this.items;
        // add new requests
        this.newRequests.forEach(function(r) {
            var item = items.find(function(i) {
                return i.itemId === r.item.itemId;
            });
            if(item) {
                item.requests.push(r);
            } else {
                // problem!
            }
        });

        // trunc newMessages array
        this.newRequests = [];

        // sum time to speak
        items.forEach(function(i) {
            if(i.requests) {
                i.timeRemaining = i.requests.reduce(function(a, b) {
                    return a + b.timeToSpeak;
                }, 0);
            } else {
                i.timeRemaining = 0;
            }
        });

        this.totalTimeRemaining = this.items.reduce(function(p, c) {
            return (p.timeRemaining === undefined ? p : p.timeRemaining) + c.timeRemaining;
        }, 0);
    }.bind(ret);

    ret.removeFromList = function(requestId) {
        var toRemove = this.requests.find(function(r) {
            return r.requestId === requestId;
        });
        if(toRemove) {
            this.requests.splice(this.requests.indexOf(toRemove), 1);

            var items = this.items;
            // remove removeRequests.
            var item = items.find(function(i) {
                return i.itemId === toRemove.item.itemId;
            });
            if(item) {
                item.requests.splice(item.requests.findIndex(function(f) {
                    return f.requestId === toRemove.requestId;
                }), 1);
            } else {
                // problem!
            }
        }

        // sum time to speak
        items.forEach(function(i) {
            if(i.requests) {
                i.timeRemaining = i.requests.reduce(function(a, b) {
                    return a + b.timeToSpeak;
                }, 0);
            } else {
                i.timeRemaining = 0;
            }
        });

        this.totalTimeRemaining = this.items.reduce(function(p, c) {
            return (p.timeRemaining === undefined ? p : p.timeRemaining) + c.timeRemaining;
        }, 0);
    }.bind(ret);

    ret.updateList = function(updatedRequest) {
        this.requests.splice(this.requests.findIndex(function(r) {
            return r.requestId === updatedRequest.requestId;
        }), 1, updatedRequest);

        // remove removeRequests.
        var item = this.items.find(function(i) {
            return i.itemId === updatedRequest.item.itemId;
        });

        // TODO: what if change Item in edit.
        if(item) {
            item.requests.splice(item.requests.findIndex(function(f) {
                return f.requestId === updatedRequest.requestId;
            }), 1, updatedRequest);
        } else {
            // problem!
        }

        // sum time to speak
        this.items.forEach(function(i) {
            if(i.requests) {
                i.timeRemaining = i.requests.reduce(function(a, b) {
                    return a + b.timeToSpeak;
                }, 0);
            } else {
                i.timeRemaining = 0;
            }
        });

        this.totalTimeRemaining = this.items.reduce(function(p, c) {
            return (p.timeRemaining === undefined ? p : p.timeRemaining) + c.timeRemaining;
        }, 0);
    }.bind(ret);

    return ret;
});
