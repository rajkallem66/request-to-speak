/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "primus"], function(http, app, Primus) {
    return {
        requests: [],
        primus: null,
        messages: [],
        isWallConnected: false,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            this.primus = new Primus(location.href.replace(location.hash, "") + "?clientType=wall");

            this.primus.on("open", function() {
                console.log("Connection established.");
                this.isWallConnected = true;
            }.bind(this));
            this.primus.on("reconnect timeout", function(err, opts) {
                console.log("Timeout expired: %s", err.message);
            });
            this.primus.on("reconnect", function(err, opts) {
                console.log("Reconnecting", err.message);
                this.isWallConnected = false;
            }.bind(this));
            this.primus.on("reconnected", function(err, opts) {
                console.log("Reconnecting", err.message);
                this.isWallConnected = true;
            }.bind(this));
            this.primus.on("end", function() {
                console.log("Connection ended.");
                this.isWallConnected = false;
            }.bind(this));
            this.primus.on("data", function(data) {
                console.log(data);

                this.messages.push({message: "Message received: " + data.messageType});
                switch(data.messageType) {
                case "refresh":
                    this.requests = data.message.requests;
                    break;
                case "initialize":
                    this.requests = data.message.requests;
                    break;
                }
            }.bind(this));
        },
        canDeactivate: function() {
            // the router's activator calls this function to see if it can leave the screen
            return app.showMessage("Are you sure you want to leave this page?", "Navigate", ["Yes", "No"]);
        }
    };
});
