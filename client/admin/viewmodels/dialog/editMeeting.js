/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/dialog"], function(http, app, dialog) {
    var ctor = function() {
        this.activate = function(m) {
            this.meeting = m;
        };
        this.addItem = function() {
            this.meeting.items.add({

            });
        };
        this.moveItemUp = function(item) {
        };
        this.moveItemDown = function(item) {

        };
        this.deleteItem = function(item) {
            this.meeting.items.splice(self.meeting.items.indexOf(item), 1);
        }.bind(this);
        this.save = function() {
            dialog.close(this, this.meeting);
        };
    };
    ctor.prototype.closeDialog = function() {
        dialog.close(this);
    };
    return ctor;
});
