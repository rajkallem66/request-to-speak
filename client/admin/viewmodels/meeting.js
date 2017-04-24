/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "primus"], function(http, app, Primus) {
    return {
        displayName: "Meeting",
        meetings: [],
        activate: function() {
/*            http.get("AgendaSystem meetings").then(function() {
                http.get("RTS meetings").then(function() {

                });
            });*/
        },
        mergeMeetings: function(agendaSystem, rtsMeetings) {

        },
        startMeeting: function() {
            http.post(location.href.replace(/[^/]*$/, "") + "startMeeting", this.newMeeting()).then(function() {
                console.log("Start meeting successfully submitted.");
            }, function() {
                // do error stuff
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
        }
    };
});
