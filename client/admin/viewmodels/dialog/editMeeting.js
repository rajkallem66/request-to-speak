/* eslint no-console: "off" */
define(["plugins/http", "plugins/dialog"], function(http, dialog) {
    var ctor = function() {
        this.activate = function(m) {
            this.meeting = m;
        };
        this.save = function() {
            dialog.close(this, this.meeting);
        };
    };
    ctor.prototype.closeDialog = function() {
        dialog.close(this);
    };
    return ctor;
});
