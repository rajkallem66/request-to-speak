/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/observable", "eventHandler", "moment"], function(http, app, observable, event, moment) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        messages: [],
        requests: [],
        newRequests: [],
        removeRequests: [],
        items: [],
        requestSort: "",
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
                message.meeting.items.forEach(function(i) {i.requests = []; i.timeRemaining = 0;});
                this.items = message.meeting.items;
                this.newRequests = message.meeting.requests;
                this.requests = message.meeting.requests;
            } else {
                this.isMeetingActive = false;
                this.requests = [];
            }
            this.updateList();
        },
        meetingMessage: function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
                message.meeting.items.forEach(function(i) {i.requests = []; i.timeRemaining = 0;});
                this.items = message.meeting.items;
                this.newRequests = message.meeting.requests;
                this.requests = message.meeting.requests;
            } else {
                this.isMeetingActive = false;
                this.items = [];
                this.requests = [];
            }
            this.updateList();
        },
        requestMessage: function(message) {
            var requests = this.requests;
            if(message.event === "add") {
                requests.push(message.request);
                this.newRequests.push(message.request);
            } else {
                var requestId = parseInt(message.requestId);
                var toRemove = requests.find(function(r) {
                    return r.requestId === requestId;
                });
                if(toRemove) {
                    this.removeRequests.push(toRemove);
                    requests.splice(requests.indexOf(toRemove), 1);
                }
                this.updateList();
            }
        }
    };

    ret.format = function(date) {
        return moment(date).format("HH:mm:ss A");
    };

    ret.updateList = function() {
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

        //remove removeRequests.
        this.removeRequests.forEach(function(r) {
            var item = items.find(function(i) {
                return i.itemId === r.item.itemId;
            });
            if(item) {
                item.requests.splice(item.requests.findIndex(function(f) {
                    return f.requestId === r.requestId;
                }), 1)
            } else {
                // problem!
            }
        });

        // trunc remove requests.
        this.removeRequests = [];

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

    return ret;
});
