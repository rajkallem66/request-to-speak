/* global jasmine, describe, beforeEach, it, expect, require */
define(["kiosk"], function(kiosk) {
    describe("Kiosk ViewModel definitions.", function() {
        "use strict";

        // var a = require("kiosk");
        var a = kiosk;

        describe("Kiosk definitions.", function() {
            it("should define activate as a Function", function() {
                expect(a.activate).toBeDefined();
                expect(a.activate).toEqual(jasmine.any(Function));
            });

            it("should define request", function() {
                expect(a.request).toBeDefined();
            });

            it("should define meeting", function() {
                expect(a.meeting).toBeDefined();
            });

            it("should define selectedItem", function() {
                expect(a.selectedItem).toBeDefined();
                expect(a.selectedItem).toEqual(jasmine.any(Object));
            });

            it("should define isSubmitting", function() {
                expect(a.isSubmitting).toBeDefined();
            });

            it("should define isMeetingActive", function() {
                expect(a.isMeetingActive).toBeDefined();
            });

            it("should define isKioskConnected", function() {
                expect(a.isKioskConnected).toBeDefined();
            });

            it("should define primus", function() {
                expect(a.primus).toBeDefined();
            });

            it("should define applyMeetingData as a Function.", function() {
                expect(a.applyMeetingData).toBeDefined();
                expect(a.applyMeetingData).toEqual(jasmine.any(Function));
            });

            it("should define createPrimus as a Function.", function() {
                expect(a.createPrimus).toBeDefined();
                expect(a.createPrimus).toEqual(jasmine.any(Function));
            });

            it("should define endMeeting as a Function.", function() {
                expect(a.endMeeting).toBeDefined();
                expect(a.endMeeting).toEqual(jasmine.any(Function));
            });

            it("should define submitRequest as a Function.", function() {
                expect(a.submitRequest).toBeDefined();
                expect(a.submitRequest).toEqual(jasmine.any(Function));
            });

            it("should define confirmSubmission as a Function.", function() {
                expect(a.confirmSubmission).toBeDefined();
                expect(a.confirmSubmission).toEqual(jasmine.any(Function));
            });

            it("should define newRequest as a Function.", function() {
                expect(a.newRequest).toBeDefined();
                expect(a.newRequest).toEqual(jasmine.any(Function));
            });

            it("should define additionalRequest as a Function.", function() {
                expect(a.additionalRequest).toBeDefined();
                expect(a.additionalRequest).toEqual(jasmine.any(Function));
            });
        });

        describe("Request definitions.", function() {
            var r = a.newRequest();

            it("should define firstName", function() {
                expect(r.firstName).toBeDefined();
            });

            it("should define lastName", function() {
                expect(r.lastName).toBeDefined();
            });

            it("should define official", function() {
                expect(r.official).toBeDefined();
            });

            it("should define agency", function() {
                expect(r.agency).toBeDefined();
            });

            it("should define item", function() {
                expect(r.item).toBeDefined();
            });

            it("should define offAgenda", function() {
                expect(r.offAgenda).toBeDefined();
            });

            it("should define subTopic", function() {
                expect(r.subTopic).toBeDefined();
            });

            it("should define stance", function() {
                expect(r.stance).toBeDefined();
            });

            it("should define notes", function() {
                expect(r.notes).toBeDefined();
            });

            it("should define phone", function() {
                expect(r.phone).toBeDefined();
            });

            it("should define email", function() {
                expect(r.email).toBeDefined();
            });

            it("should define address.", function() {
                expect(r.address).toBeDefined();
            });

            it("should define timeToSpeak.", function() {
                expect(r.timeToSpeak).toBeDefined();
            });
        });
    });
});
