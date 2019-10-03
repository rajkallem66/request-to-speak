/* eslint no-console: "off" */
define(["plugins/http", "plugins/observable", "durandal/app", "eventHandler", "dialog/editRequest", "moment", "toastr"],
    function (http, observable, app, event, Edit, moment, toastr) {
        var ctor = function () {
            this.displayName = "Request";
            this.isConnected = false;
            this.isMeetingActive = false;
            this.messages = [];
            this.meeting = null;
            this.sorts = ["Time Entered", "Stance"];
            this.selectedSort = "Time Entered";
            this.totalTimeRemaining = 0;
            this.wallConnected = false;
            this.connectedKiosks = 0;
            this.connectedAdmins = 0;
            this.connectedBoards = 0;
            this.connectedChairs = 0;
            this.primus = null;

            this.activate = function () {
                // the router's activator calls this function and waits for it to complete before proceeding
                this.meeting = this.blankMeeting();
                if (this.primus === null || this.primus.online !== true) {
                    event.setupPrimus(this, "admin");
                }
            };
            this.editRequest = function (request) {
                var self = this;
                app.showDialog(new Edit(), { request: request, items: this.meeting.items }).then(function (response) {
                    if (response !== undefined) {
                        // update with changes.
                        http.put(app.apiLocation + "request", response).then(function () {
                        }, function (err) {
                            app.showMessage("Unable to update changes. Please refresh.");
                        });
                    } else {
                        // replace with a fresh copy from server
                        http.get(app.apiLocation + "request/" + request.requestId).then(function (response) {
                            self.updateList(response);
                        }, function () {
                            app.showMessage("Unable to cancel changes. Please refresh.");
                        });
                    }
                }, function (err) {
                    // Do error stuff
                });
            }.bind(this);
            this.approveRequest = function (request) {
                if (request.status === "approved" || request.status === "display" || request.status === "active") {
                    request.status = "new";
                    request.approvedForDisplay = false;
                } else {
                    request.status = "approved";
                }
                if (request.offAgenda == null && request.item)
                    request.offAgenda = request.item.itemName === "Off Agenda";
                // update with changes.
                http.put(app.apiLocation + "request", request).then(function () {
                }, function (err) {
                    app.showMessage("Unable to update changes. Please refresh.");
                });
                return true;
            };
            this.displayRequest = function (request) {
                if (request.status === "display" || request.status === "active") {
                    request.status = "approved";
                    request.approvedForDisplay = false;
                } else {
                    request.status = "display";
                    request.approvedForDisplay = true;
                }
                if (request.offAgenda == null && request.item)
                    request.offAgenda = request.item.itemName === "Off Agenda";
                // update with changes.
                http.put(app.apiLocation + "request", request).then(function () {
                }, function (err) {
                    app.showMessage("Unable to update changes. Please refresh.");
                });
                return true;
            };
            this.activateRequest = function (request) {
                var current = this.meeting.requests.find(function (r) {
                    return r.status === "active";
                });

                if (request.status === "active") {
                    request.status = "display";
                    request.approvedForDisplay = true;
                } else {
                    request.status = "active";
                    request.approvedForDisplay = true;
                }

                if (current && current !== request) {
                    current.status = "display";
                    // update current then new.
                    http.post(app.apiLocation + "activateRequest", current).then(function () {
                        // update with changes.
                        http.post(app.apiLocation + "activateRequest", request).then(function () {
                        }, function (err) {
                            app.showMessage("Unable to update changes. Please refresh.");
                        });
                    }, function (err) {
                        app.showMessage("Unable to update changes. Please refresh.");
                    });
                } else {
                    // update with changes.
                    http.post(app.apiLocation + "activateRequest", request).then(function () {
                    }, function (err) {
                        app.showMessage("Unable to update changes. Please refresh.");
                    });
                }
                return true;
            }.bind(this);
            this.removeRequest = function (request) {
                var self = this;
                var next = null;

                if (request.status === "active") {

                    var orderedDisplayed = this.meeting.requests.filter(function (r) {
                        return r.status === "display";
                    }).sort(this.requestSort);

                    if (orderedDisplayed.length > 0) {

                        var requestItem = this.meeting.items.find(function (item) {
                            return item.itemId === request.item.itemId
                        });

                        if (request.subItem && request.subItem > 0) {

                            var requestItemSubItem = requestItem.subItems.find(function (subItem) {
                                return subItem.subItemId === request.subItem;
                            });

                            var orderedSubItemRequests = requestItemSubItem.requests.filter(function (sr) {
                                return sr.status === "display";
                            }).sort(this.requestSort);

                            if (orderedSubItemRequests.length > 0) {
                                next = orderedSubItemRequests[0];
                            }

                        }
                        else if (!next) {

                            var orderedItemRequests = requestItem.requests.filter(function (ir) {
                                return ir.status === "display";
                            }).sort(this.requestSort);

                            if (orderedItemRequests.length > 0) {
                                next = orderedItemRequests[0];
                            }
                        }
                        if (!next) {
                            next = orderedDisplayed[0];
                        }


                    }
                }
                request.status = "removed";
                // update with changes.
                http.post(app.apiLocation + "removeRequest", request).then(function () {
                    if (next) {
                        self.activateRequest(next);
                    }
                }, function (err) {
                    app.showMessage("Unable to update changes. Please refresh.");
                });
                return true;
            };
            this.refreshWall = function () {
                http.post(app.apiLocation + "refreshWall/" + this.selectedSort).then(function () {
                }, function (err) {
                    // do error stuff
                    console.log(err);
                });
            };
            this.endMeeting = function () {
                var self = this;
                app.showMessage("Are you sure?", "End meeting", ["Yes", "No"]).then(function (response) {
                    if (response === "Yes") {
                        http.post(app.apiLocation + "endMeeting/" + self.meeting.meetingId).then(function () {
                        }, function (err) {
                            // do error stuff
                            console.log(err);
                        });
                    }
                });
            };
            this.canDeactivate = function () {
                // the router's activator calls this function to see if it can leave the screen
                if (this.isMeetingActive) {
                    return app.showMessage("There is an active meeting. Are you sure you want to leave this page?",
                        "Active Meeting!", ["Yes", "No"]);
                } else {
                    return true;
                }
            };
            this.deactivate = function () {
                if (this.primus) {
                    this.primus.end();
                }
            };
            this.deviceMessage = function (message) {
                switch (message.deviceType) {
                    case "wall":
                        if (message.event === "connected") {
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
                    case "chair":
                        this.connectedChairs = message.count;
                        break;
                    case "admin":
                        this.connectedAdmins = message.count;
                        break;
                }
            };
            this.initializeMessage = function (message) {
                if (message.meeting.status === "started") {
                    this.isMeetingActive = true;
                    message.meeting.items.forEach(function (i) {
                        i.requests = [];
                        i.timeRemaining = 0;
                        if (i.subItems) {
                            i.subItems.forEach(function (si) {
                                si.requests = [];
                                si.timeRemaining = 0;
                            });
                        }
                        else {
                            i.subItems = [];
                        }
                    });
                    message.meeting.items = message.meeting.items;

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
                this.connectedChairs = message.connectedChairs;
            };
            this.meetingMessage = function (message) {
                if (message.event === "started") {
                    this.meeting = message.meeting;
                    this.isMeetingActive = true;
                    this.meeting.items.forEach(function (i) {
                        i.requests = []; i.timeRemaining = 0;
                    });
                    message.meeting.items = message.meeting.items;
                    this.addToList(message.meeting.requests);
                } else {
                    this.isMeetingActive = false;
                    this.totalTimeRemaining = 0;
                    this.meeting = this.blankMeeting();
                }
            };
            this.requestMessage = function (message) {
                switch (message.event) {
                    case "add":
                        this.meeting.requests.push(message.request);
                        this.addToList([message.request]);
                        toastr.options.closeButton = true;
                        toastr.options.positionClass = 'toast-bottom-right';
                        toastr.success('New Request added(' + message.request.firstName + ')');
                        break;
                    case "remove":
                        this.removeFromList(message.requestId);
                        break;
                    case "update":
                        this.updateList(message.request);
                        break;
                }
            };
            this.blankMeeting = function () {
                return {
                    meetingName: "No active meeting.",
                    meetingDate: "",
                    requests: [],
                    items: []
                };
            };
            this.approveAll = function () {
                this.requests.forEach(function (r) {
                    if (r.status !== "approved" && r.status !== "display" && r.status !== "active") {
                        r.status = "approved";
                        if (r.offAgenda == null && r.item)
                            r.offAgenda = r.item.itemName === "Off Agenda";
                        http.put(app.apiLocation + "request", r).then(function () {
                        }, function (err) {
                            app.showMessage("Unable to update changes. Please refresh.");
                        });
                    }
                });
            };

            this.displayApproved = function () {
                this.requests.forEach(function (request) {
                    if (request.status === "approved") {
                        request.status = "display";
                    }
                    if (request.offAgenda == null && request.item)
                        request.offAgenda = request.item.itemName === "Off Agenda";
                    // update with changes.
                    http.put(app.apiLocation + "request", request).then(function () {
                    }, function (err) {
                        app.showMessage("Unable to update changes. Please refresh.");
                    });
                })
            };

            this.displayAll = function () {
                this.requests.forEach(function (request) {
                    if (request.status !== "active") {
                        if (request.status === "display") {

                            //updated just for the animation purpose.

                            request.status = "approved";
                            request.status = "display";
                            request.approvedForDisplay = false;
                        } else {
                            request.status = "display";
                            request.approvedForDisplay = true;
                        }
                    }
                    if (request.offAgenda == null && request.item)
                        request.offAgenda = request.item.itemName === "Off Agenda";
                    // update with changes.
                    http.put(app.apiLocation + "request", request).then(function () {
                    }, function (err) {
                        app.showMessage("Unable to update changes. Please refresh.");
                    });
                })
            };

            // List management
            this.addToList = function (addList) {
                var items = this.meeting.items;
                var self = this;
                // add new requests
                addList.forEach(function (r) {
                    var item;
                    //new
                    if (r.subItem) {
                        items.forEach(function (i) {

                            if (i.subItems && i.subItems.length > 0) {
                                var subItem = i.subItems.find(function (si) {
                                    return si.subItemId === r.subItem
                                })
                            }
                            if (subItem) {
                                subItem.requests.push(r);
                                subItem.requests = subItem.requests.sort(self.requestSort);
                            }

                        });
                    }
                    else if (r.item) {
                        var item = items.find(function (i) {
                            return i.itemId === r.item.itemId;
                        });

                        if (item) {
                            item.requests.push(r);
                            item.requests = item.requests.sort(self.requestSort);
                        }
                    }
                    else {
                        //Something wrong with request
                    }

                });
                //  var test = items;
                this.timeTotal();
            }.bind(this);

            this.removeFromList = function (requestId) {
                var toRemove = this.meeting.requests.find(function (r) {
                    return r.requestId == requestId;
                });
                if (toRemove) {
                    this.meeting.requests.splice(this.meeting.requests.indexOf(toRemove), 1);

                    var items = this.meeting.items;
                    // remove removeRequests.

                    var old;

                    items.forEach(function (i) {
                        if (i.subItems && i.subItems.length > 0) {
                            i.subItems.forEach(function (si) {
                                if (si.requests && si.requests.length > 0) {
                                    old = si.requests.find(function (r) {
                                        return (r.requestId == requestId);
                                    });

                                    if (old) {
                                        si.requests.splice(si.requests.indexOf(old), 1);
                                    }
                                }
                            }
                            );
                        }

                        if (!old && i.requests && i.requests.length > 0) {
                            old = i.requests.find(function (r) {
                                return (r.requestId == requestId);
                            });

                            if (old) {
                                i.requests.splice(i.requests.indexOf(old), 1);
                            }
                        }

                    }
                    );


                }

                this.timeTotal();
            }.bind(this);

            this.updateList = function (updatedRequest) {
                // find old one
                var old = this.meeting.requests.find(function (r) {
                    return r.requestId === updatedRequest.requestId;
                });
                if (old) {
                    // splice updated one in
                    this.meeting.requests.splice(this.meeting.requests.findIndex(function (r) {
                        return r.requestId === updatedRequest.requestId;
                    }), 1);

                    this.meeting.requests.push(updatedRequest);

                }
                // find old item
                var item = this.meeting.items.find(function (i) {
                    return i.itemId === old.item.itemId;
                });

                if (item && item.subItems && item.subItems.length > 0) {
                    //remove from sub item 
                    var subItem = item.subItems.find(function (si) {
                        return si.subItemId === old.subItem;
                    });
                    if (subItem) {
                        subItem.requests.splice(subItem.requests.findIndex(function (k) {
                            return k.requestId === updatedRequest.requestId;
                        }), 1);

                        subItem.requests.push(updatedRequest);
                    }
                }
                else {
                    // remove old from old item
                    item.requests.splice(item.requests.findIndex(function (f) {
                        return f.requestId === updatedRequest.requestId;
                    }), 1);

                    item.requests.push(updatedRequest);
                }

                this.sortAll();
                this.timeTotal();
                // add the new one in.
                //this.addToList([updatedRequest]);



            }.bind(this);

            this.timeTotal = function () {
                this.totalTimeRemaining = 0;
                var totalTime = 0;
                this.meeting.items.forEach(function (i) {
                    i.timeRemaining = 0;

                    if (i.subItems && i.subItems.length > 0) {
                        i.subItems.forEach(function (si) {
                            si.timeRemaining = 0;
                            if (si.requests) {
                                si.requests.forEach(function (r) {
                                    {
                                        if (r.status != 'new')// Change to show only approved requests time 
                                        {
                                            si.timeRemaining += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                                            totalTime += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                                        }
                                    }
                                });
                            }
                        });
                    }
                    else if (i.requests) {
                        i.requests.forEach(function (r) {
                            if (r.status != 'new')// Change to show only approved requests time 
                            {
                                i.timeRemaining += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                                totalTime += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                            }
                        });
                    }
                    else {
                        //something wrong
                    }
                });

                this.totalTimeRemaining = totalTime;
            }.bind(this);

            this.itemSort = function (a, b) {
                var c = (a.itemName === "Off Agenda") ? 1000 : parseInt(a.itemOrder);
                var d = (b.itemName === "Off Agenda") ? 1000 : parseInt(b.itemOrder);
                return c - d;
            };

            this.requestSort = function (a, b) {
                var aVal = ((a.item.itemName === "Off Agenda") ? 1000 : parseInt(a.item.itemOrder)).toString();
                var bVal = ((b.item.itemName === "Off Agenda") ? 1000 : parseInt(b.item.itemOrder)).toString();
                aVal += ((a.official) ? "0" : "1");
                bVal += ((b.official) ? "0" : "1");
                if (this.selectedSort === "Stance") {
                    aVal += a.stance.charCodeAt(0).toString();
                    bVal += b.stance.charCodeAt(0).toString();
                }
                aVal += moment(a.dateAdded).valueOf().toString();
                bVal += moment(b.dateAdded).valueOf().toString();

                return parseInt(aVal) - parseInt(bVal);
            }.bind(this);

            this.sortAll = function (value) {
                var self = this;
                this.meeting.items.forEach(function (i) {
                    i.requests = i.requests.sort(self.requestSort);
                    if (i.subItems && i.subItems.length > 0) {
                        i.subItems.forEach(function (si) {
                            si.requests = si.requests.sort(self.requestSort);
                        });
                    }
                });
            }.bind(this);

            observable(this, "selectedSort").subscribe(this.sortAll);
        };

        ctor.prototype.deleteRequest = function (request) {
            app.showMessage("Delete request?", "Delete Request", ["Yes", "No"]).then(function (response) {
                if (response === "Yes") {
                    http.remove(app.apiLocation + "request/" + request.requestId).then(function () {
                    }, function (err) {
                        // do error stuff
                        console.log(err);
                    });
                }
            });
        };

        ctor.prototype.formatTime = function (date) {
            return moment(date).format("hh:mm:ss A");
        };

        ctor.prototype.format = function (date) {
            var ret = moment(date).format(app.dateFormat);

            // in case db api saves in our odd format:
            if (ret === "Invalid date") {
                ret = moment(date, app.dateFormat).format(app.dateFormat);
            }
            return ret;
        };

        return ctor;
    });



