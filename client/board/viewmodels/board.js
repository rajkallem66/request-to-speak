/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/observable", "eventHandler"], function(http, app, observable, event) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        messages: [],
        requests: [],
        newRequests: [],
        requestList: [],
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
            } else {
                this.isMeetingActive = false;
            }
            this.requests = message.meeting.requests;
            this.updateList();
        },
        meetingMessage: function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.requests = message.meeting.requests;
            this.updateList();
        },
        requestMessage: function(message) {
            var requests = this.requests;
            if(message.event === "add") {
                requests.push(message.request);
                new.push(message.request);
            } else {
                requests.splice(requests.findIndex(function(r) {
                    return r.requestId === message.request.requestId;
                }), 1);
            }
        },
    };

    ret.updateList = function() { 
        // trunc newMessages array
        this.newRequests.length = 0;
        // start with a distinct list of items.
        var requests = this.requests;
        var allItems = requests.map(function(request) {
            return request.item;
        });
        var items = allItems.filter(function(value, index, self) {
            return self.findIndex(function(i) {
                return value.itemId === i.itemId;
            }) === index;
        });

        // add requests and sum time to speak
        items.forEach(function(i) {
            i.requests = requests.filter(function(r) {
                return r.item.itemId === i.itemId;
            });
            i.timeRemaining = i.requests.reduce(function(a, b) {
                return a + b.timeToSpeak;
            }, 0);
        });

        this.requestList = items;
        
        this.totalTimeRemaining = this.requestList.reduce(function(p, c) {
            return (p.timeRemaining === undefined ? p : p.timeRemaining) + c.timeRemaining;
        });
    }.bind(ret);

    return ret;
});
