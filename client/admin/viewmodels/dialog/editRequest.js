/* eslint no-console: "off" */
define(["plugins/http", "plugins/dialog"], function(http, dialog) {
    var ctor = function() {
        this.activate = function(data) {
            this.request = data.request;
            this.items = data.items;
        };
        this.request = {};
        this.save = function() {
            dialog.close(this, this.request);
        };
    };
    ctor.prototype.closeDialog = function() {
        dialog.close(this);
    };
    return ctor;
});
