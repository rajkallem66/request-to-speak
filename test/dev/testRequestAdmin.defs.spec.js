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

            it("should define applyData as a Function.", function() {
                expect(a.applyData).toBeDefined();
                expect(a.applyData).toEqual(jasmine.any(Function));
            });

            it("should define startMeeting as a Function.", function() {
                expect(a.startMeeting).toBeDefined();
                expect(a.startMeeting).toEqual(jasmine.any(Function));
            });
        });
    });
});