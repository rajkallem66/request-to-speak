/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "eventHandler", "dialog/editRequest", "moment"],
function(http, app, event, Edit, moment) {
    var ctor = function() {
        this.displayName = "Request";
        this.isConnected = false;
        this.isMeetingActive = false;
        this.messages = [];
        this.meeting = null;
        this.totalTimeRemaining = 0;
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
                    http.put(app.apiLocation + "request", response).then(function() {
                    }, function(err) {
                        app.showMessage("Unable to update changes. Please refresh.");
                    });
                } else {
                    // replace with a fresh copy from server
                    http.get(app.apiLocation + "request/" + request.requestId).then(function(response) {
                        self.updateList(response);
                    }, function() {
                        app.showMessage("Unable to cancel changes. Please refresh.");
                    });
                }
            }, function(err) {
                // Do error stuff
            });
        }.bind(this);
        this.approveRequest = function(request) {
            if(request.status === "approved" || request.status === "display" || request.status === "active") {
                request.status = "new";
                request.approvedForDisplay = false;
            } else {
                request.status = "approved";
            }
            // update with changes.
            http.put(app.apiLocation + "request", request).then(function() {
            }, function(err) {
                app.showMessage("Unable to update changes. Please refresh.");
            });
            return true;
        };
        this.displayRequest = function(request) {
            if(request.status === "display" || request.status === "active") {
                request.status = "approved";
                request.approvedForDisplay = false;
            } else {
                request.status = "display";
                request.approvedForDisplay = true;
            }
            // update with changes.
            http.put(app.apiLocation + "request", request).then(function() {
            }, function(err) {
                app.showMessage("Unable to update changes. Please refresh.");
            });
            return true;
        };
        this.activateRequest = function(request) {
            if(request.status === "active") {
                request.status = "display";
                request.approvedForDisplay = true;
            } else {
                request.status = "active";
                request.approvedForDisplay = true;
            }
            // update with changes.
            http.post(app.apiLocation + "activateRequest", request).then(function() {
            }, function(err) {
                app.showMessage("Unable to update changes. Please refresh.");
            });
            return true;
        };
        this.refreshWall = function() {
            http.post(app.apiLocation + "refreshWall").then(function() {
            }, function(err) {
                // do error stuff
                console.log(err);
            });
        };
        this.endMeeting = function() {
            var self = this;
            app.showMessage("Are you sure?", "End meeting", ["Yes", "No"]).then(function(response) {
                if(response === "Yes") {
                    http.post(app.apiLocation + "endMeeting/" + self.meeting.meetingId).then(function() {
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
                message.meeting.items.forEach(function(i) {
                    i.requests = []; i.timeRemaining = 0;
                });
                this.meeting = message.meeting;
                this.addToList(message.meeting.requests);
            } else {
                this.isMeetingActive = false;
                this.meeting = this.blankMeeting();
            }
            this.wallConnected = message.wallConnected;
            this.connectedAdmins = message.connectedAdmins;
            this.connectedKiosks = message.connectedKiosks;
            this.connectedBoards = message.connectedBoards;
        };
        this.meetingMessage = function(message) {
            if(message.event === "started") {
                this.meeting = message.meeting;
                this.isMeetingActive = true;
                this.meeting.items.forEach(function(i) {
                    i.requests = []; i.timeRemaining = 0;
                });
                this.addToList(message.meeting.requests);
            } else {
                this.isMeetingActive = false;
                this.totalTimeRemaining = 0;
                this.meeting = this.blankMeeting();
            }
        };
        this.requestMessage = function(message) {
            switch(message.event) {
            case "add":
                this.meeting.requests.push(message.request);
                this.addToList([message.request]);
                break;
            case "remove":
                this.removeFromList(message.requestId);
                break;
            case "update":
                this.updateList(message.request);
                break;
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
        this.approveAll = function() {
            this.requests.forEach(function(r) {
                if(r.status !== "approved" && r.status !== "display" && r.status !== "active") {
                    r.status = "approved";
                    http.put(app.apiLocation + "request", r).then(function() {
                    }, function(err) {
                        app.showMessage("Unable to update changes. Please refresh.");
                    });
                }
            });
        };

        // List management
        this.addToList = function(addList) {
            var items = this.meeting.items;
            // add new requests
            addList.forEach(function(r) {
                var item = items.find(function(i) {
                    return i.itemId === r.item.itemId;
                });
                if(item) {
                    item.requests.push(r);
                } else {
                    // problem!
                }
            });

            this.timeTotal();
        }.bind(this);

        this.removeFromList = function(requestId) {
            var toRemove = this.meeting.requests.find(function(r) {
                return r.requestId === requestId;
            });
            if(toRemove) {
                this.meeting.requests.splice(this.meeting.requests.indexOf(toRemove), 1);

                var items = this.meeting.items;
                // remove removeRequests.
                var item = items.find(function(i) {
                    return i.itemId === toRemove.item.itemId;
                });
                if(item) {
                    item.requests.splice(item.requests.indexOf(toRemove), 1);
                } else {
                    // problem!
                }
            }

            this.timeTotal();
        }.bind(this);

        this.updateList = function(updatedRequest) {
            this.meeting.requests.splice(this.meeting.requests.findIndex(function(r) {
                return r.requestId === updatedRequest.requestId;
            }), 1, updatedRequest);

            // remove removeRequests.
            var item = this.meeting.items.find(function(i) {
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
            this.timeTotal();
        }.bind(this);

        this.timeTotal = function() {
            // sum time to speak
            this.meeting.items.forEach(function(i) {
                i.timeRemaining = 0;
                if(i.requests) {
                    i.requests.forEach(function(r) {
                        i.timeRemaining += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                    });
                }
            });

            this.totalTimeRemaining = this.meeting.items.reduce(function(p, c) {
                return (p.timeRemaining === undefined ? p : p.timeRemaining) + c.timeRemaining;
            }, 0);
        }.bind(this);
    };

    ctor.prototype.deleteRequest = function(request) {
        app.showMessage("Delete request?", "Delete Request", ["Yes", "No"]).then(function(response) {
            if(response === "Yes") {
                http.remove(app.apiLocation + "request/" + request.requestId).then(function() {
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
