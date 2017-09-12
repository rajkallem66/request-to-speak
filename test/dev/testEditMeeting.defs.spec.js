/* global jasmine, describe, beforeEach, it, expect, require */
define(["dialog/editMeeting"], function(Edit) {
    describe("Edit Meeting ViewModel definitions.", function() {
        "use strict";

        var a = new Edit();

        describe("Edit Meeting definitions.", function() {
            it("should define save as a Function.", function() {
                expect(a.save).toBeDefined();
                expect(a.save).toEqual(jasmine.any(Function));
            });

            it("should define closeDialog as a Function.", function() {
                expect(a.closeDialog).toBeDefined();
                expect(a.closeDialog).toEqual(jasmine.any(Function));
            });
        });
    });
});
