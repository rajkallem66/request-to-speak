/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "knockout", "primus"], function(http, app, ko, Primus) {
    return {
        requests: ko.observableArray([]),
        primus: null,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            this.primus = new Primus(location.href.replace(location.hash, "") + "?clientType=wall");

            this.primus.on("open", function() {
                console.log("Connection established.");
            });

            this.primus.on("data", function(data) {
                console.log(data);
                this.messages.push({message: "Message received: " + data.reply});
            }.bind(this));
        },
        canDeactivate: function() {
            // the router's activator calls this function to see if it can leave the screen
            return app.showMessage("Are you sure you want to leave this page?", "Navigate", ["Yes", "No"]);
        }
    };
});
