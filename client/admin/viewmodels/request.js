/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "eventHandler", "dialog/editRequest", "moment"],
function(http, app, event, Edit, moment) {
    var ctor = function() {
        this.displayName = "Request";
        this.isConnected = false;
        this.isMeetingActive = false;
        this.messages = [];
        this.meeting = null;
        this.wallConnected = false;
        this.connectedKiosks = 0;
        this.connectedAdmins = 0;
        this.connectedBoards = 0;
        this.primus = null;

        this.activate = function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            this.meeting = this.blankMeeting();
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "admin");
            }
        };
        this.editRequest = function(request) {
            var self = this;
            app.showDialog(new Edit(), {request: request, items: this.meeting.items}).then(function(response) {
                if(response !== undefined) {
                    // update with changes.
                    http.put(location.href.replace(/[^/]*$/, "") + "request", response).then(function() {
                    }, function(err) {
                        app.showMessage("Unable to update changes. Please refresh.");
                    });
                } else {
                    // replace with a fresh copy from server
                    http.get(location.href.replace(/[^/]*$/, "") + "request/" + request.requestId).then(function(request) {
                        self.requests.splice(self.requests.findIndex(function(r) { return r.requestId === response.requestId; }), 1, request);
                    }, function() {
                        app.showMessage("Unable to cancel changes. Please refresh.");
                    });
                }
            }, function(err) {
                // Do error stuff
            });
        }.bind(this);
        this.approveRequest = function(request) {
            var status = "";
            if(request.status === "approved" || request.status === "display" || request.status === "active") {
                request.status = "new";
                request.approvedForDisplay = false;
            } else {
                request.status = "display";
                request.approvedForDisplay = true;
            }
            // update with changes.
            http.put(location.href.replace(/[^/]*$/, "") + "request", request).then(function() {
            }, function(err) {
                app.showMessage("Unable to update changes. Please refresh.");
            });
            return true;
        }
        this.activateRequest = function(request) {
            var status = "";
            if(request.status === "active") {
                request.status = "display";
                request.approvedForDisplay = true;
            } else {
                request.status = "active";
            }
            // update with changes.
            http.post(location.href.replace(/[^/]*$/, "") + "activateRequest", request).then(function() {
            }, function(err) {
                app.showMessage("Unable to update changes. Please refresh.");
            });
            return true;
        }
        this.refreshWall = function() {
            http.post(location.href.replace(/[^/]*$/, "") + "refreshWall").then(function() {
            }, function(err) {
                // do error stuff
                console.log(err);
            });
        }.bind(this);
        this.endMeeting = function() {
            var self = this;
            app.showMessage("Are you sure?", "End meeting", ["Yes", "No"]).then(function(response) {
                if(response === "Yes") {
                    http.post(location.href.replace(/[^/]*$/, "") + "endMeeting/" + self.meeting.meetingId).then(function() {
                    }, function(err) {
                        // do error stuff
                        console.log(err);
                    });
                }
            });
        };
        this.canDeactivate = function() {
            // the router's activator calls this function to see if it can leave the screen
            if(this.isMeetingActive) {
                return app.showMessage("There is an active meeting. Are you sure you want to leave this page?",
                    "Active Meeting!", ["Yes", "No"]);
            } else {
                return true;
            }
        };
        this.deactivate = function() {
            if(this.primus) {
                this.primus.end();
            }
        };
        this.deviceMessage = function(message) {
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
        };
        this.initializeMessage = function(message) {
            if(message.meeting.status === "started") {
                this.isMeetingActive = true;
            } else {
                this.isMeetingActive = false;
            }
            this.meeting = message.meeting;
            this.wallConnected = message.wallConnected;
            this.connectedAdmins = message.connectedAdmins;
            this.connectedKiosks = message.connectedKiosks;
            this.connectedBoards = message.connectedBoards;
        };
        this.meetingMessage = function(message) {
            if(message.event === "started") {
                this.isMeetingActive = true;
                this.meeting = message.meeting;
            } else {
                this.isMeetingActive = false;
                this.meeting = this.blankMeeting();
            }
        };
        this.requestMessage = function(message) {
            switch(message.event) {
            case "add":
                this.meeting.requests.push(message.request);
                break;
            case "remove":
            }
        };
        this.blankMeeting = function() {
            return {
                meetingName: "No active meeting.",
                meetingDate: "",
                requests: [],
                items: []
            };
        };
    };

    ctor.prototype.deleteRequest = function(request) {
        app.showMessage("Delete request?", "Delete Request", ["Yes", "No"]).then(function(response) {
            if(response === "Yes") {
                http.remove(location.href.replace(/[^/]*$/, "") + "request/" + request.requestId).then(function() {
                }, function(err) {
                    // do error stuff
                    console.log(err);
                });
            }
        });
    };

    ctor.prototype.format = function(date, format) {
        return moment(date).format(format);
    };

    return ctor;
});
