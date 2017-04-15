/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "primus"], function(http, app, Primus) {
    return {
        request: null,
        meeting: {
            meetingId: "",
            timeToSpeak: 0,
        },

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
                        this.startMeeting(data.message.meetingData);
                    } else {
                        this.endMeeting();
                    }
                    break;
                case "initialize":
                    this.applyData(data.message.meetingData);
                    break;
                }
            }.bind(this));
        },
        applyData: function(meetingData){
            console.log("Intializing ")
            this.meeting.meetingId = meetingData.meetingId;
            this.meeting.meetingName = meetingData.meetingName;
            if(meetingData.meetingId){
                this.isMeetingActive = true;
                this.request = this.newRequest();
            } else {
                this.isMeetingActive = false;
            }
        },
        startMeeting: function(meetingData) {
            console.log("Meeting started.");
            this.meeting.meetingId = meetingData.meetingId;
            this.meeting.timeToSpeak = meetingData.defaultTimeToSpeak
            this.isMeetingActive = true;
            this.request = this.newRequest();
        },
        endMeeting: function() {
            console.log("Meeting ended.");
            this.isMeetingActive = false;
            this.meeting.meetingId = "";
            this.request = this.newRequest();
        },
        submitRequest: function() {
            this.isSubmitting = true;
            var self = this;
            http.post(location.href.replace(/[^/]*$/, "") + "request", this.request).then(function() {
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
                timeToSpeak: this.meeting.timeToSpeak
            };
        }
    };
});
