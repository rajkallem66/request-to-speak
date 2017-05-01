/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/observable", "eventHandler"], function(http, app, observable, event) {
    var ret = {
        isConnected: false,
        isMeetingActive: false,
        requests: [],
        messages: [],
        primus: null,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "board");
            }
        },
        applyMeetingData: function(meetingData) {
            console.log("Intializing ");
            if(meetingData.meetingId) {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.requests = meetingData.requests;
        },
        endMeeting: function() {
            console.log("Meeting ended.");
            this.isMeetingActive = false;
            this.meeting = {};
            this.requests = [];
        }
    };

    return ret;
});
