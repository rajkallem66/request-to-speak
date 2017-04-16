/* global jasmine, describe, beforeEach, it, expect, require */
define(["kiosk"], function(kiosk) {
    describe("Kiosk ViewModel functions.", function() {
        "use strict";

        function testKioskRequestData(){
            return {
                firstName: "John",
                lastName: "Doe",
                official: true,
                agency: "USA",
                item: "1",
                offAgenda: true,
                subTopic: "Homelessness",
                stance: "In Support",
                notes: "I'm in support of this.",
                phone: "916-555-1234",
                email: "johndoe@gmail.com",
                address: "123 A st Sacramento CA, 95811",
                timeToSpeak: 3
            }
        };
        function testKioskActiveMeetingData(){
            return {
                meetingId: 12,
                meetingName: "The first one",
                confirmationDuration: 5,
                defaultTimeToSpeak: 2
            }
        };

        function testKioskInactiveMeetingData(){
            return {
                meetingId: "",
                meetingName: "",
                confirmationDuration: 0,
                defaultTimeToSpeak: 0
            }
        };

        var a = require("kiosk");

        describe("Kiosk functions.", function() {
            it("applyMeetingData should set proper values for inactive meeting.", function() {
                a.applyMeetingData(testKioskInactiveMeetingData());
                expect(a.meeting.meetingId).toBe("");
                expect(a.meeting.meetingName).toBe("");
                expect(a.meeting.confirmationDuration).toBe(0);
                expect(a.meeting.defaultTimeToSpeak).toBe(0);
                expect(a.isMeetingActive).toBe(false);
            });

            it("applyMeetingData should set proper values for active meeting.", function() {
                a.applyMeetingData(testKioskActiveMeetingData());
                expect(a.meeting.meetingId).toBe(12);
                expect(a.meeting.meetingName).toBe("The first one");
                expect(a.meeting.confirmationDuration).toBe(5);
                expect(a.meeting.defaultTimeToSpeak).toBe(2);
                expect(a.isMeetingActive).toBe(true);
            });

            it("endMeeting should set proper values to end meeting.", function() {
                a.applyMeetingData(testKioskActiveMeetingData());
                a.request = testKioskRequestData();
                a.endMeeting();
                expect(a.meeting.meetingId).toBe("");
                expect(a.request.firstName).toBe("");
                expect(a.isMeetingActive).toBe(false);
            });

            it("additionalRequest should clear specific values for additional request.", function() {
                a.request = testKioskRequestData();
                a.additionalRequest();
                expect(a.request.firstName).toBe("John");
                expect(a.request.lastName).toBe("Doe");
                expect(a.request.official).toBe(true);
                expect(a.request.agency).toBe("USA");
                expect(a.request.item).toBe("");
                expect(a.request.offAgenda).toBe(false);
                expect(a.request.subTopic).toBe("");
                expect(a.request.stance).toBe("");
                expect(a.request.notes).toBe("");
                expect(a.request.phone).toBe("916-555-1234");
                expect(a.request.email).toBe("johndoe@gmail.com");
                expect(a.request.address).toBe("123 A st Sacramento CA, 95811");
                expect(a.request.timeToSpeak).toBe(3);
            });
        });
    });
});