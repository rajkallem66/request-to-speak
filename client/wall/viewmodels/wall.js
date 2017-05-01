/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "eventHandler"], function(http, app, Primus) {
    return {
        isConnected: false,
        requests: [],
        messages: [],
        primus: null,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "wall");
            }
        }
    };
});
