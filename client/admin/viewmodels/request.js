/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "eventHandler", "dialog/edit"], function(http, app, event, Edit) {
    return {
        displayName: "Request",
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
        editRequest: function(request) {
            var self = this;
            app.showDialog(new Edit(), request).then(function(response) {
                if(response !== undefined) {
                    self.meetings.push(response);
                    self.selectedMeeting = response;
                }
            }, function(err) {
                // Do error stuff
            });
        },
        canDeactivate: function() {
            // the router's activator calls this function to see if it can leave the screen
            if(this.isMeetingActive) {
                return app.showMessage("There is an active meeting. Are you sure you want to leave this page?",
                    "Active Meeting!", ["Yes", "No"]);
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
        initializeMessage: function(message) {
            if(message.meeting.status === "started") {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.meeting = message.meeting;
            this.requests = message.meeting.requests;
            this.wallConnected = message.wallConnected;
            this.connectedAdmins = message.connectedAdmins;
            this.connectedKiosks = message.connectedKiosks;
            this.connectedBoards = message.connectedBoards;
        },
        meetingMessage: function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.meeting = message.meetingData;
        },
        requestMessage: function(message) {
            switch(message.event) {
            case "add":
                this.requests.push(message.request);
                break;
            case "remove":
            }
        }
    };
});
