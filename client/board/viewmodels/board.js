/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/observable", "eventHandler"], function(http, app, observable, event) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        meeting: [],
        requestSort: "",
        totalRemainingTime: 0,
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
            } else {
                this.isMeetingActive = false;
            }
            this.meeting = message.meeting;
        },
        meetingMessage: function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.meeting = message.meeting;
        },
        requestMessage: function(message) {
            var requests = this.meeting.requests;
            if(message.event === "add") {
                requests.push(message.request);
            } else {
                requests.splice(requests.findIndex(function(r) {
                    return r.requestId === message.request.requestId;
                }), 1);
            }
        }
    };

    observable.defineProperty(ret, "itemsList", function() {
        var requests = this.meeting.requests;

        // start with a distinct list of items.
        var items = requests.map(function(request) {
            return request.item;
        }).filter(function(value, index, self) {
            return self.findIndex(function(i) {
                return i.itemId === i.itemId;
            }) === index;
        });

        // add requests and sum time to speak
        items.forEach(function(i) {
            i.requests = requests.filter(function(r) {
                return r.itemId === i.itemId;
            });
            i.timeRemaining = i.requests.reduce(function(p, c) {
                return p + c.timeToSpeak;
            });
        });

        this.totalRemainingTime = items.reduce(function(p, c) {
            return p + c.timeRemaining;
        });

        return items;
    });

    return ret;
});
