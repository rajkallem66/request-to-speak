/* global jasmine, describe, beforeEach, it, expect, require */
define(["board"], function(board) {
    describe("Board ViewModel definitions.", function() {
        "use strict";

        var a = board;

        describe("Board definitions.", function() {
            it("should define isMeetingActive", function() {
                expect(a.isMeetingActive).toBeDefined();
            });

            it("should define isConnected", function() {
                expect(a.isConnected).toBeDefined();
            });

            it("should define requests", function() {
                expect(a.requests).toBeDefined();
                expect(a.requests).toEqual(jasmine.any(Array));
            });

            it("should define primus", function() {
                expect(a.primus).toBeDefined();
            });

            it("should define activate as a Function", function() {
                expect(a.activate).toBeDefined();
                expect(a.activate).toEqual(jasmine.any(Function));
            });

            it("should define applyMeetingData as a Function.", function() {
                expect(a.applyMeetingData).toBeDefined();
                expect(a.applyMeetingData).toEqual(jasmine.any(Function));
            });

            it("should define endMeeting as a Function.", function() {
                expect(a.endMeeting).toBeDefined();
                expect(a.endMeeting).toEqual(jasmine.any(Function));
            });
        });
    });
});
