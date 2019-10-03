/* eslint no-console: "off" */
define(["durandal/app", "plugins/observable", "eventHandler", "moment"],
    function (app, observable, event, moment) {
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
                    event.setupPrimus(this, "board");
                }
            },
            initializeMessage: function (message) {
                if (message.meeting.meetingId !== undefined) {
                    this.isMeetingActive = true;
                    message.meeting.items.forEach(function (i) {
                        i.requests = [];
                        i.timeRemaining = 0;
                        if (i.subItems)
                            i.subItems.forEach(function (si) {
                                si.requests = [];
                                si.timeRemaining = 0;
                            });
                    });
                    this.items = message.meeting.items;
                    this.requests = message.meeting.requests;
                    this.addToList(message.meeting.requests);
                }
            },
            meetingMessage: function (message) {
                if (message.event === "started") {
                    this.isMeetingActive = true;
                    message.meeting.items.forEach(function (i) {
                        i.requests = [];
                        i.timeRemaining = 0;
                        if (i.subItems)
                            i.subItems.forEach(function (si) {
                                si.requests = [];
                                si.timeRemaining = 0;
                            });
                    });
                    this.items = message.meeting.items;
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
                let old;
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
        }.bind(ret);

        ret.updateList = function (updatedRequest) {
            var old = this.requests.find(function (r) {
                return r.requestId === updatedRequest.requestId;
            });

            if (old) {
                this.requests.splice(this.requests.indexOf(old), 1, updatedRequest);
                // remove removeRequests.



                // find old item
                var item = this.items.find(function (i) {
                    return i.itemId === old.item.itemId;
                });

                if (item && item.subItems && item.subItems.length > 0) {
                    //remove from sub item 
                    var subItem = item.subItems.find(function (si) {
                        return si.subItemId === old.subItem;
                    });

                    subItem.requests.splice(subItem.requests.findIndex(function (k) {
                        return k.requestId === updatedRequest.requestId;
                    }), 1);
                }
                else {
                    // remove old from old item
                    item.requests.splice(item.requests.findIndex(function (f) {
                        return f.requestId === updatedRequest.requestId;
                    }), 1);
                }

                this.addToList(updatedRequest);

                this.timeTotal();
            }
        }.bind(ret);

        ret.timeTotal = function () {
            // sum time to speak
            this.totalTimeRemaining = 0;
            var totalTime = 0;
            this.items.forEach(function (i) {
                i.timeRemaining = 0;
                if (i.requests) {
                    i.requests.forEach(function (r) {
                        if (r.status != 'new')// Change to show only approved requests time 
                        {
                            i.timeRemaining += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                            totalTime += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                        }
                    });
                }

                if (i.subItems && i.subItems.length > 0) {
                    i.subItems.forEach(function (si) {
                        si.timeRemaining = 0;
                        if (si.requests) {
                            si.requests.forEach(function (r) {
                                if (r.status != 'new')// Change to show only approved requests time 
                                {
                                    si.timeRemaining += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                                    totalTime += isNaN(parseInt(r.timeToSpeak)) ? 0 : parseInt(r.timeToSpeak);
                                }
                            });
                        }
                    });
                }
            });

            this.totalTimeRemaining = totalTime;

        }.bind(ret);



        ret.requestSort = function (a, b) {
            var aVal = ((a.item.itemName === "Off Agenda") ? 1000 : parseInt(a.item.itemOrder)).toString();
            var bVal = ((b.item.itemName === "Off Agenda") ? 1000 : parseInt(b.item.itemOrder)).toString();
            aVal += ((a.official) ? "0" : "1");
            bVal += ((b.official) ? "0" : "1");
            aVal += moment(a.dateAdded).valueOf().toString();
            bVal += moment(b.dateAdded).valueOf().toString();

            return parseInt(aVal) - parseInt(bVal);
        };

        return ret;
    });
