/* eslint no-console: "off" */
define(["plugins/http", "plugins/router", "durandal/app", "dialog/importMeeting", "dialog/editMeeting", "moment"],
function(http, router, app, Import, Edit, moment) {
    var ret = {
        displayName: "Meeting",
        activeMeeting: null,
        canImport: false,
        meetings: [],
        activate: function() {
            var self = this;
            http.get(app.apiLocation + "meeting", {"status": ""}).then(function(response) {
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
            http.get(app.agendaLocation).then(function(response) {
                self.canImport = true;
            }, function(e) {
            });
        },
        downloadReport: function(meeting) {
            http.post(app.apiLocation + "startMeeting/" + meeting.meetingId).then(function(result) {
                app.showMessage("Meeting started successfully.").then(function() {
                    router.navigate("/request");
                });
            }, function(err) {
                app.showMessage("Unable to start meeting.\n" + JSON.stringify(err.responseText));
            });
        }
    };

    ret.format = function(date) {
        var ret = moment(date).format(app.dateFormat);

        // in case db api saves in our odd format:
        if(ret === "Invalid date") {
            ret = moment(date, app.dateFormat).format(app.dateFormat);
        }
        return ret;
    };

    return ret;
});
