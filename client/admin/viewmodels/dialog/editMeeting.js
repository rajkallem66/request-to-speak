/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/dialog", "plugins/observable", "moment"],
    function (http, app, dialog, observable, moment) {
        var ctor = function () {
            this.activate = function (m) {
                this.meeting = m;
            };
            this.meeting = {
                items: []
            };
            this.addItem = function () {
                var newItem = {
                    meetingId: this.meeting.meetingId,
                    itemName: "",
                    itemOrder: this.meeting.items.length,
                    timeToSpeak: 3,
                    subItems: []
                };
                var self = this;
                http.post(app.apiLocation + "item", newItem).then(function (result) {
                    newItem.itemId = result.itemId;
                    self.meeting.items.push(newItem);
                }, function (err) {
                    app.showMessage("Unable to add item.\n" + JSON.stringify(err));
                });
            }.bind(this);
            this.addSubItem = function (item) {
                var order;
                if (this.meeting.items[item.itemOrder].subItems) { order = this.meeting.items[item.itemOrder].subItems.length; }
                else {
                    order = 0;
                }
                var newSubItem = {
                    meetingId: this.meeting.meetingId,
                    subItemName: "",
                    itemId: item.itemId,
                    subItemOrder: order,
                    timeToSpeak: 3
                };
                var self = this;
                http.post(app.apiLocation + "subitem", newSubItem).then(function (result) {
                    newSubItem.subItemId = result.subItemId;
                    if (!self.meeting.items[item.itemOrder].subItems)
                        self.meeting.items[item.itemOrder].subItems = [];
                    self.meeting.items[item.itemOrder].subItems.push(newSubItem);
                }, function (err) {
                    app.showMessage("Unable to add item.\n" + JSON.stringify(err));
                });
            }.bind(this);
            this.deleteItem = function (item) {
                this.meeting.items.splice(this.meeting.items.indexOf(item), 1);
            }.bind(this);
            this.deleteSubItem = function (subItem) {
                var parent = this.meeting.items.find(x => x.itemId == subItem.itemId);
                parent.subItems.splice(parent.subItems.indexOf(subItem), 1);
            }.bind(this);
            this.save = function () {
                var dt = moment(this.meeting.meetingDate).format("MMM Do YYYY");
                if (dt === "Invalid date") {
                    dt = moment(this.meeting.meetingDate, "MMM Do YYYY").format("MMM Do YYYY");
                }
                if (dt === "Invalid date") {
                    app.showMessage("Meeting date is invalid.");
                } else {
                    this.meeting.meetingDate = dt;
                    dialog.close(this, this.meeting);
                }
            };
            observable.defineProperty(this, "orderedItems", function () {
                var items = this.meeting.items;
                return items.sort(function (a, b) {
                    a.itemOrder - b.itemOrder;
                });
            });
        };
        ctor.prototype.closeDialog = function () {
            dialog.close(this);
        };

        return ctor;
    });
