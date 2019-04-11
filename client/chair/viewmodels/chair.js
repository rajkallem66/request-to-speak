/* eslint no-console: "off" */
define(["durandal/app", "plugins/observable", "eventHandler", "moment", "plugins/http"],
    function (app, observable, event, moment, http) {
        var ret = {
            isConnected: false,
            isMeetingActive: false,
            messages: [],
            requests: [],
            items: [],
            totalTimeRemaining: 0,
            primus: null,
            disconnected: function () {
                location.reload();
            },
            activate: function () {
                // the router's activator calls this function and waits for it to complete before proceeding
                if (this.primus === null || this.primus.online !== true) {
                    event.setupPrimus(this, "chair");
                }
            },
            initializeMessage: function (message) {
                if (message.meeting.meetingId !== undefined) {
                    this.isMeetingActive = true;
                    message.meeting.items.forEach(function (i) {
                        i.requests = []; i.timeRemaining = 0;
                    });
                    this.items = message.meeting.items.sort(this.itemSort);
                    this.requests = message.meeting.requests;
                    this.addToList(message.meeting.requests);
                }
            },
            meetingMessage: function (message) {
                if (message.event === "started") {
                    this.isMeetingActive = true;
                    message.meeting.items.forEach(function (i) {
                        i.requests = []; i.timeRemaining = 0;
                    });
                    this.items = message.meeting.items.sort(this.itemSort);
                    this.requests = message.meeting.requests;
                    this.addToList(message.meeting.requests);
                } else {
                    this.isMeetingActive = false;
                    this.totalTimeRemaining = 0;
                    this.items = [];
                    this.requests = [];
                }
            },
            requestMessage: function (message) {
                var requests = this.requests;
                if (message.event === "add") {
                    requests.push(message.request);
                    this.addToList(message.request);
                } else if (message.event === "update") {
                    this.updateList(message.request);
                } else {
                    this.removeFromList(message.requestId);
                }
            }
        };

        ret.format = function (date) {
            return moment(date).format("HH:mm:ss A");
        };

        ret.activateRequest = function (request) {
            var current = ret.requests.find(function (r) {
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


        ret.addToList = function (req) {
            var items = this.items;
            // add new requests
            var self = this;
            let newRequests = [];

            if (Array.isArray(req)) {
                newRequests = req;
            } else {
                newRequests.push(req);
            }

            newRequests.forEach(function (r) {
                var item = items.find(function (i) {
                    if (r.item)
                        return i.itemId === r.item.itemId;
                    else
                        return i.itemId === r.itemId
                });
                if (item) {
                    item.requests.push(r);
                    item.requests = item.requests.sort(self.requestSort);
                }
            });

            this.timeTotal();
        }.bind(ret);

        ret.removeFromList = function (requestId) {
            var toRemove = this.requests.find(function (r) {
                return r.requestId == requestId;
            });
            if (toRemove) {
                this.requests.splice(this.requests.indexOf(toRemove), 1);
                var items = this.items;
                // remove removeRequests.
                var item = items.find(function (i) {
                    return i.itemId === toRemove.item.itemId;
                });
                if (item) {
                    var itemRequest = item.requests.find(function (r) {
                        return r.requestId == requestId;
                    });
                }
                if (itemRequest) {
                    item.requests.splice(item.requests.findIndex(function (f) {
                        return f.requestId == toRemove.requestId;
                    }), 1);
                }
            }
            this.timeTotal();
        }.bind(ret);

        ret.updateList = function (updatedRequest) {
            var old = this.requests.find(function (r) {
                return r.requestId === updatedRequest.requestId;
            });

            if (old) {
                this.requests.splice(this.requests.indexOf(old), 1, updatedRequest);
                // remove removeRequests.
                var item = this.items.find(function (i) {
                    return ((i.itemId === updatedRequest.item.itemId) && (i.requests.indexOf(old) >= 0));
                });

                // TODO: what if change Item in edit.
                if (item) {
                    item.requests.splice(item.requests.findIndex(function (f) {
                        return f.requestId === updatedRequest.requestId;
                    }), 1, updatedRequest);
                    item.requests = item.requests.sort(this.requestSort);
                }
                this.timeTotal();
            }
        }.bind(ret);

        ret.timeTotal = function () {
            // sum time to speak
            this.items.forEach(function (i) {
                i.timeRemaining = 0;
                if (i.requests) {
                    i.requests.forEach(function (r) {
                        if (r.status != 'new')// Change to show only approved requests time 
                            i.timeRemaining += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                    });
                }
            });

            this.totalTimeRemaining = this.items.reduce(function (p, c) {
                return (p.timeRemaining === undefined ? p : p.timeRemaining) + c.timeRemaining;
            }, 0);
        }.bind(ret);

        ret.itemSort = function (a, b) {
            var aVal = (a.itemName === "Off Agenda") ? 1000 : parseInt(a.itemOrder);
            var bVal = (b.itemName === "Off Agenda") ? 1000 : parseInt(b.itemOrder);
            return aVal - bVal;
        };

        ret.requestSort = function (a, b) {
            var aVal = ((a.item.itemName === "Off Agenda") ? 1000 : parseInt(a.item.itemOrder)).toString();
            var bVal = ((b.item.itemName === "Off Agenda") ? 1000 : parseInt(b.item.itemOrder)).toString();
            aVal += ((a.official) ? "0" : "1");
            bVal += ((b.official) ? "0" : "1");
            aVal += moment(a.dateAdded).valueOf().toString();
            bVal += moment(b.dateAdded).valueOf().toString();

            return parseInt(aVal) - parseInt(bVal);
        };

        ret.sortItems = function (obj) {
            for (var i = 0; i <= ret.items.length; i++) {
                if (ret.items[i].itemId == obj.item.itemId) {
                    for (var j = 0; j <= ret.items[i].requests.length; i++) {
                        if (ret.items[i].requests[j].requestId == obj.requestId) {
                            if (j != 0) {
                                var a = ret.items[i].requests[j]
                                this.removeFromList(ret.items[i].requests[j].requestId)
                                this.addToList(a);
                                break;
                                // var b = ret.items[i].requests.splice(j, 1);
                                // ret.items[i].requests.unshift(ret.items[i].requests[0]);
                                // break;
                            }
                        }
                    }
                }
            }

            return ret.items;
        }
        return ret;
    });
