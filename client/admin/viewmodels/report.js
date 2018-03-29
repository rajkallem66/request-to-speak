/* eslint no-console: "off" */
define(["plugins/http", "plugins/router", "durandal/app", "dialog/importMeeting", "dialog/editMeeting", "moment"],
function(http, router, app, Import, Edit, moment) {
    var ret = {
        displayName: "Meeting",
        meetings: [],
        activate: function() {
            var self = this;
            http.get(app.apiLocation + "meeting", {"status": "ended"}).then(function(response) {
                self.meetings = response;
            }, function(err) {
                app.showMessage("Unable to connect to database.");
            });
        },
        downloadReport: function(meeting) {
            document.getElementById("report_frame").src = app.apiLocation + "report/" + meeting.meetingId;
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
