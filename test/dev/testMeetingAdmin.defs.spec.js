/* global jasmine, describe, beforeEach, it, expect, require */
define(["meetingAdmin"], function(meetingAdmin) {
    describe("Meeting Admin ViewModel definitions.", function() {
        "use strict";

        var a = meetingAdmin;

        describe("Meeting Admin definitions.", function() {
            it("should define activeMeeting", function() {
                expect(a.activeMeeting).toBeDefined();
            });
        });
    });
});
