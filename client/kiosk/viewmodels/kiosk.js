/* eslint no-console: "off" */
define(["plugins/http", "durandal/app", "plugins/observable", "eventHandler", "jquery"],
function(http, app, observable, event, $) {
    let ret = {
        isConnected: false,
        isMeetingActive: false,
        step: 0,
        request: {
        },
        meeting: {},
        selectedItem: {},
        isMovingNext: false,
        isSubmitting: false,
        confirmSubmission: false,
        messages: [],
        primus: null,
        attached: function() {
        },
        activate: function() {
            this.request = this.newRequest();
            // the router's activator calls this function and waits for it to complete before proceeding
            if(this.primus === null || this.primus.online !== true) {
                event.setupPrimus(this, "kiosk");
            }
        },
        meetingMessage: function(message) {
            console.log("Meeting message");
            if(message.event === "started") {
                this.isMeetingActive = true;
                this.meeting = message.meetingData;
                this.request = this.newRequest();
            } else {
                this.isMeetingActive = false;
                this.meeting = {};
                this.request = {};
            }
        },
        initializeMessage: function(message) {
            console.log("Initializing kiosk");
            this.meeting = message.meetingData;
            if(message.meetingData.active !== undefined) {
                this.isMeetingActive = message.meetingData.active;
            } else {
                this.isMeetingActive = false;
            }
        },
        nextStep: function() {
            this.step += 1;
        },
		prevStep: function() {
            this.step -= 1;
        },
        removeStuff: function(d, e) {
            this.isMovingNext = false;
            // $(d).removeClass("fs-display-next");
            // $(d).removeClass("fs-display-prev");
        },
        submitRequest: function() {
            this.isSubmitting = true;
            let self = this;
            http.post(location.href.replace(/[^/]*$/, "") + "request", this.request).then(function() {
                self.isSubmitting = false;
                self.confirmSubmission = true;
                setTimeout(function() {
                    self.confirmSubmission = false;
                    self.request = self.newRequest();
                    self.step = 0;
                }, 3000);
            }, function() {
                // do error stuff
            });
        },
        newRequest: function() {
            let req = {
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
            observable.defineProperty(req, "name", {
                read: function() {
                    if(this.firstName !== "") {
                        return this.firstName + " " + this.lastName;
                    } else {
                        return "";
                    }
                },
                write: function(value) {
                    let lastSpacePos = value.lastIndexOf(" ");
                    if (lastSpacePos > 0) { // Ignore values with no space character
                        this.firstName = value.substring(0, lastSpacePos); // Update "firstName"
                        this.lastName = value.substring(lastSpacePos + 1); // Update "lastName"
                    }
                }
            });
            return req;
        },
        additionalRequest: function() {
            this.request.item = "";
            this.request.offAgenda = false;
            this.request.subTopic = "";
            this.request.stance = "";
            this.request.notes = "";
        }
    };
    observable(ret, "selectedItem").subscribe(function(value) {
        if(value !== undefined) {
            this.request.item = value.itemName;
            this.request.timeToSpeak = value.defaultTimeToSpeak;
        }
    }.bind(ret));

    observable.defineProperty(ret, "notesCharsRemaining", function() {
        return 250 - this.request.notes.length;
    });

    return ret;
});