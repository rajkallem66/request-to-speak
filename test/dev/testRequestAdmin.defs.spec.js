/* global jasmine, describe, beforeEach, it, expect, require */
define(["requestAdmin"], function(requestAdmin) {
    describe("Request Admin ViewModel definitions.", function() {
        "use strict";

        var a = requestAdmin;

        describe("Request Admin definitions.", function() {
            it("should define activate as a Function", function() {
                expect(a.activate).toBeDefined();
                expect(a.activate).toEqual(jasmine.any(Function));
            });

            it("should define requests as an Array", function() {
                expect(a.requests).toBeDefined();
                expect(a.requests).toEqual(jasmine.any(Array));
            });

            it("should define isConnected", function() {
                expect(a.isConnected).toBeDefined();
            });

            it("should define isMeetingActive", function() {
                expect(a.isMeetingActive).toBeDefined();
            });

            it("should define wallConnected", function() {
                expect(a.wallConnected).toBeDefined();
            });

            it("should define connectedKiosks", function() {
                expect(a.connectedKiosks).toBeDefined();
            });

            it("should define connectedAdmins", function() {
                expect(a.connectedAdmins).toBeDefined();
            });

            it("should define connectedBoards", function() {
                expect(a.connectedBoards).toBeDefined();
            });

            it("should define primus", function() {
                expect(a.primus).toBeDefined();
            });

            it("should define canDeactivate as a Function.", function() {
                expect(a.canDeactivate).toBeDefined();
                expect(a.canDeactivate).toEqual(jasmine.any(Function));
            });

            it("should define deviceMessage as a Function.", function() {
                expect(a.deviceMessage).toBeDefined();
                expect(a.deviceMessage).toEqual(jasmine.any(Function));
            });

            it("should define meetingMessage as a Function.", function() {
                expect(a.meetingMessage).toBeDefined();
                expect(a.meetingMessage).toEqual(jasmine.any(Function));
            });

            it("should define requestMessage as a Function.", function() {
                expect(a.requestMessage).toBeDefined();
                expect(a.requestMessage).toEqual(jasmine.any(Function));
            });

            it("should define applyData as a Function.", function() {
                expect(a.applyData).toBeDefined();
                expect(a.applyData).toEqual(jasmine.any(Function));
            });
        });
    });
});
