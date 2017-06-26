/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "eventHandler"], function(http, app, event) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        requests: [],
        displayRequests: [],
        messages: [],
        primus: null,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "wall");
            }
        },
        initializeMessage: function(message) {
            if(message.meeting.meetingId !== undefined) {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.requests = message.meeting.requests;
            this.setDisplay();
        },
        meetingMessage: function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
        },
        refreshMessage: function(message) {
            this.requests = message.requests;
            this.setDisplay();
        }
    };

    ret.setDisplay = function() {
        this.displayRequests = this.requests.slice(0, 10);
    };
    return ret;
});
