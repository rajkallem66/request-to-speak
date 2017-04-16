/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "primus"], function(http, app, Primus) {
    return {
        displayName: "Meeting",
        meetings: [],
        activate: function() {
            http.get("AgendaSystem meetings").then(function() {
                http.get("RTS meetings").then(function() {

                });
            });
        },
        mergeMeetings: function(agendaSystem, rtsMeetings) {

        }
    };
});
