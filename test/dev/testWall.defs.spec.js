/* global jasmine, describe, beforeEach, it, expect, require */
define(["wall"], function(wall) {
    describe("Wall ViewModel definitions.", function() {
        "use strict";

        var a = wall;

        describe("Wall definitions.", function() {
            it("should define requests", function() {
                expect(a.requests).toBeDefined();
                expect(a.requests).toEqual(jasmine.any(Array));
            });

            it("should define primus", function() {
                expect(a.primus).toBeDefined();
            });

            it("should define isConnected", function() {
                expect(a.isConnected).toBeDefined();
            });

            it("should define activate as a Function", function() {
                expect(a.activate).toBeDefined();
                expect(a.activate).toEqual(jasmine.any(Function));
            });
        });
    });
});
