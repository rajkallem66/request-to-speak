/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "eventHandler"], function(http, app, event) {
    return {
        isConnected: false,
        isMeetingActive: false,
        messages: [],
        meeting: {},
        requests: [],
        wallConnected: false,
        connectedKiosks: 0,
        connectedAdmins: 0,
        connectedBoards: 0,
        primus: null,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "admin");
            }
        },
        canDeactivate: function() {
            // the router's activator calls this function to see if it can leave the screen
            if(this.isMeetingActive) {
                return app.showMessage("There is an active meeting. Are you sure you want to leave this page?", "Navigate", ["Yes", "No"]);
            } else {
                return true;
            }
        },
        deviceMessage: function(message) {
            switch(message.deviceType) {
            case "wall":
                if(message.event === "connected") {
                    this.wallConnected = true;
                } else {
                    this.wallConnected = false;
                }
                break;
            case "kiosk":
                this.connectedKiosks = message.count;
                break;
            case "board":
                this.connectedBoards = message.count;
                break;
            case "admin":
                this.connectedAdmins = message.count;
                break;
            }
        },
        meetingMessage: function(message) {
            this.meeting = message.meetingData;
            this.isMeetingActive = (this.meeting.meetingId !== undefined);
        },
        requestMessage: function(message) {
            switch(message.event) {
            case "add":
                this.requests.push(message.request);
                break;
            case "remove":
            }
        },
        applyData: function(data) {
            this.meeting = data.meeting;
            this.isMeetingActive = (this.meeting.meetingId !== undefined);
            this.wallConnected = data.wallConnected;
            this.connectedAdmins = data.connectedAdmins;
            this.connectedKiosks = data.connectedKiosks;
            this.connectedBoards = data.connectedBoards;
        }
    };
});
