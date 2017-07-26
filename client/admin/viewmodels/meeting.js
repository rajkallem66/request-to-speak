/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/router", "plugins/observable", "plugins/dialog", "dialog/importMeeting", "dialog/editMeeting", "moment"],
function(http, app, router, observable, dialog, Import, Edit, moment) {
    var ret = {
        displayName: "Meeting",
        activeMeeting: null,
        meetings: [],
        activate: function() {
            var self = this;
            http.get(location.href.replace(/[^/]*$/, "") + "meeting").then(function(response) {
                self.selectedMeeting = null;
                self.meetings = response;
                var startedMeetings = self.meetings.filter(function(meeting) {
                    meeting.status === "started";
                });
                if(startedMeetings.length > 0) {
                    app.showMessage("A meeting is active. You will not be able to edit the active meeting.");
                    self.activeMeeting = startedMeetings[0];
                }
            }, function(err) {
                app.showMessage("Unable to connect to database.");
            });
        },
        startMeeting: function(meeting) {
            http.post(location.href.replace(/[^/]*$/, "") + "startMeeting/" + meeting.meetingId).then(function(result) {
                app.showMessage("Meeting started successfully.").then(function() {
                    router.navigate("/request");
                });
            }, function(err) {
                app.showMessage("Unable to start meeting.\n" + JSON.stringify(err));
            });
        },
        newMeeting: function() {
            return {
                meetingId: "12",
                meetingName: "The twelfth one",
                items: [
                    {
                        itemId: "100",
                        itemName: "1",
                        defaultTimeToSpeak: 2
                    },
                    {
                        itemId: "101",
                        itemName: "2",
                        defaultTimeToSpeak: 3,
                        subTopics: [
                            {
                                subTopicId: "1",
                                subTopicName: "First sub-topic"
                            },
                            {
                                subTopicId: "2",
                                subTopicName: "The second sub-topic"
                            }
                        ]
                    }
                ]
            };
        },
        importMeeting: function() {
            var self = this;
            app.showDialog(new Import()).then(function(response) {
                if(response !== undefined) {
                    // Make sure not already in list
                    if(self.meetings.filter(function(m) {
                        return m.sireId === response.sireId;
                    }).length > 0) {
                        // Ask to overwrite
                        app.showMessage("The meeting you selected is already in RTS. Do you want to overwrite?",
                            "Meeting exists", ["Yes", "No"]).then(function(resp) {
                                if(resp === "Yes") {
                                    self.addMeeting(response);
                                }
                            });
                    } else {
                        // Not in list. Add to list
                        self.addMeeting(response);
                    }
                }
            }, function(err) {
                // Do error stuff
            });
        },
        addMeeting: function(meeting) {
            var self = this;
            http.post(location.href.replace(/[^/]*$/, "") + "meeting", meeting).then(function(response) {
                meeting.meetingId = response.meetingId;
                self.meetings.push(meeting);
                console.log("Meeting added.");
            }, function(err) {
                app.showMessage("Unable to add meeting.\n" + JSON.stringify(err));
            });
        }
    };

    ret.deleteMeeting = function(meeting) {
        var self = this;
        app.showMessage("Are you sure you want to delete this meeting?", "Delete Meeting", ["Yes", "No"]).then(function(result) {
            if(result === "Yes") {
                http.remove(location.href.replace(/[^/]*$/, "") + "meeting/" + meeting.meetingId).then(function() {
                    self.meetings.splice(self.meetings.findIndex(function(f) { return f.meetingId === meeting.meetingId; }), 1);
                    console.log("Meeting deleted.");
                }, function(err) {
                    app.showMessage("Unable to delete meeting.\n" + JSON.stringify(err));
                });
            }
        });
    }.bind(ret);


    ret.format = function(date) {
        return moment(date).format("MMM Do YYYY");
    };

    ret.editMeeting = function(meeting) {
        var self = this;
        app.showDialog(new Edit(), meeting).then(function(response) {
            if(response !== undefined) {
                self.meetings.push(response);
            }
        }, function(err) {
            // Do error stuff
        });
    }.bind(ret);

    return ret;
});
