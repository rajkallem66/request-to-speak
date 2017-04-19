/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "primus"], function(http, app, Primus) {
    return {
        displayName: "Request",
        messages: [],
        requests: [],
        isAdminConnected: false,
        isMeetingActive: false,
        wallConnected: false,
        connectedKiosks: 0,
        connectedAdmins: 0,
        connectedBoards: 0,

        primus: null,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                this.primus = new Primus(location.href.replace(location.hash, "") + "?clientType=admin");

                this.primus.on("open", function() {
                    console.log("Connection established.");
                    this.isAdminConnected = true;
                });
                this.primus.on('reconnect timeout', function (err, opts) {
                    console.log('Timeout expired: %s', err.message);
                }.bind(this));
                this.primus.on('reconnect', function (err, opts) {
                    console.log('Reconnecting.', err.message);
                    this.isAdminConnected = false;
                }.bind(this));
                this.primus.on('reconnected', function (err, opts) {
                    console.log('Reconnected.', err.message);
                    this.isAdminConnected = true;
                }.bind(this));
                this.primus.on("end", function() {
                    console.log("Connection ended.");
                    this.isKioskConnected = false;
                }.bind(this));
                this.primus.on("data", function(data) {
                    console.log(data);
                    this.messages.push({message: "Message received: " + data.messageType});
                    if(data.messageType) {
                        switch (data.messageType) {
                        case "device":
                            this.deviceMessage(data.message);
                            break;
                        case "initialize":
                            this.applyData(data.message);
                            break;
                        case "meeting":
                            this.meetingMessage(data.message);                        
                            break;
                        case "request":
                            this.requestMessage(data.message);                        
                            break;
                        }
                    } else {
                        console.log(JSON.stringify(data));
                    }
                }.bind(this));
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
        },
    };
});