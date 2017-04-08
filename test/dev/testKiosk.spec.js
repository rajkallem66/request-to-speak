/* global jasmine, describe, beforeEach, it, expect, require */
define(["kiosk"], function(kiosk) {
    describe("Kiosk ViewModel", function() {
        "use strict";

        var testKiosk = {
            firstName: "John",
            lastName: "Doe",
            official: false,
            agency: null,
            item: "1",
            subTopic: "Homelessness",
            stance: "In Support",
            notes: "",
            phone: "916-555-1234",
            email: "johndoe@gmail.com",
            address: "123 A st Sacramento CA, 95811"
        };

        var a = require("kiosk");

        describe("Kiosk definitions.", function() {
            it("should define activate as a Function", function() {
                expect(a.activate).toBeDefined();
                expect(a.activate).toEqual(jasmine.any(Function));
            });

            it("should define firstName", function() {
                expect(a.firstName).toBeDefined();
            });

            it("should define lastName", function() {
                expect(a.lastName).toBeDefined();
            });

            it("should define official", function() {
                expect(a.official).toBeDefined();
            });

            it("should define agency", function() {
                expect(a.agency).toBeDefined();
            });

            it("should define item", function() {
                expect(a.item).toBeDefined();
            });

            it("should define subTopic", function() {
                expect(a.subTopic).toBeDefined();
            });

            it("should define stance", function() {
                expect(a.stance).toBeDefined();
            });

            it("should define notes", function() {
                expect(a.notes).toBeDefined();
            });

            it("should define phone", function() {
                expect(a.phone).toBeDefined();
            });

            it("should define email", function() {
                expect(a.email).toBeDefined();
            });

            it("should define address.", function() {
                expect(a.address).toBeDefined();
            });

            it("should define submitRequest as a Function.", function() {
                expect(a.submitRequest).toBeDefined();
                expect(a.submitRequest).toEqual(jasmine.any(Function));
            });
        });
    });
});