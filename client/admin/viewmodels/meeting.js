/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/router", "plugins/dialog", "dialog/import"],
function(http, app, router, dialog, Import) {
    var ret = {
        displayName: "Meeting",
        activeMeeting: null,
        meetings: [],
        selectedMeeting: null,
        activate: function() {
            var self = this;
            http.get(location.href.replace(/[^/]*$/, "") + "meeting").then(function(response) {
                self.meetings = response;
                var startedMeetings = self.meetings.filter(function(meeting) {
                    meeting.started === true;
                });
                if(startedMeetings.length > 0) {
                    app.showMessage("A meeting is active. You will not be able to edit the active meeting.");
                    self.activeMeeting = startedMeetings[0];
                }
            }, function(err) {
                app.showMessage("Unable to connect to database.");
            });
        },
        startMeeting: function() {
            http.post(location.href.replace(/[^/]*$/, "") + "startMeeting", this.selectedMeeting).then(function(result) {
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
                    self.meetings.push(response);
                    self.selectedMeeting = response;
                }
            }, function(err) {
                // Do error stuff
            });
        },
        saveMeeting: function() {
            http.post(location.href.replace(/[^/]*$/, "") + "addMeeting", this.selectedMeeting).then(function() {
                console.log("Start meeting successfully submitted.");
            }, function(err) {
                app.showMessage("Unable to save meeting.\n" + JSON.stringify(err));
            });
        }
    };
    ret.selectMeeting = function(meeting) {
        if(this.selectedMeeting !== null && this.meetings.includes(this.selectedMeeting) === false) {
            app.showMessage("This meeting has not been saved.");
        }
        if(meeting === this.activeMeeting) {
            app.showMessage("The meeting you selected is active. You cannot edit an active meeting.");
            return;
        }
        this.selectedMeeting = meeting;
    }.bind(ret);

    return ret;
});
