/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/observable", "primus"], function(http, app, observable, Primus) {
    var ret = {
        request: {},
        meeting: {},
        selectedItem: {},

        isSubmitting: false,
        isMeetingActive: false,
        isKioskConnected: false,

        messages: [],
        primus: null,
        activate: function() {
            // the router's activator calls this function and waits for it to complete before proceeding
            this.primus = new Primus(location.href.replace(location.hash, "") + "?clientType=kiosk");

            this.primus.on("open", function() {
                console.log("Connection established.");
                this.isKioskConnected = true;
            });
            this.primus.on("open", function() {
                console.log("Connection lost.");
                this.isKioskConnected = false;
            });

            this.primus.on("data", function(data) {
                console.log(data);

                this.messages.push({message: "Message received: " + data.messageType});
                switch(data.messageType) {
                case "meeting":
                    if(data.message.event === "started") {
                        this.applyMeetingData(data.message.meetingData);
                    } else {
                        this.endMeeting();
                    }
                    break;
                case "initialize":
                    this.applyMeetingData(data.message.meetingData);
                    break;
                }
            }.bind(this));
        },
        applyMeetingData: function(meetingData) {
            console.log("Intializing ");
            if(meetingData.meetingId) {
                this.isMeetingActive = true;
                this.request = this.newRequest();
            } else {
                this.isMeetingActive = false;
            }
            this.meeting = meetingData;
        },
        endMeeting: function() {
            console.log("Meeting ended.");
            this.isMeetingActive = false;
            this.meeting = {};
            this.request = {};
        },
        submitRequest: function() {
            this.isSubmitting = true;
            var self = this;
            http.post(location.href.replace(/[^/]*$/, "") + "request", this.request).then(function() {
                self.isSubmitting = false;
                self.confirmSubmission();
            }, function() {
                // do error stuff
            });
        },
        confirmSubmission: function() {
            // show message for 3 seconds
            this.request = this.newRequest();
        },
        newRequest: function() {
            return {
                meetingId: this.meeting.meetingId,
                firstName: "",
                lastName: "",
                official: false,
                agency: "",
                item: "",
                offAgenda: false,
                subTopic: "",
                stance: "",
                notes: "",
                phone: "",
                email: "",
                address: "",
                timeToSpeak: 0
            };
        },
        additionalRequest: function() {
            this.request.item = "";
            this.request.offAgenda = false;
            this.request.subTopic = "";
            this.request.stance = "";
            this.request.notes = "";
        },
    };
    observable(ret, 'selectedItem').subscribe(function(value){
        if(this.request.item !== undefined) {
            this.request.item = value.itemName;
            this.request.timeToSpeak = value.defaultTimeToSpeak;
        }
    }.bind(ret));

    return ret;
});
