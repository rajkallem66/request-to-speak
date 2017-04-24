/* global jasmine, describe, beforeEach, it, expect, require */
define(["requestAdmin"], function(requestAdmin) {
    describe("Request Admin Primus features.", function() {
        "use strict";
        var a = requestAdmin;
        var p = {
            handlers: []
        };
        p.on = function(name, cb) {
            this.handlers.push({name: name, cb: cb});
        }.bind(p);

        describe("Request Admin attach primus calls.", function() {
            beforeAll(function() {
                spyOn(a, "createPrimus").and.callFake(function(url) {
                    return p;
                });

                spyOn(p, "on").and.callThrough();

                a.activate();
            });
            afterAll(function() {
                a.primus = null;
                p.handlers = [];
            });

            it("creates a useful Primus", function() {
                expect(a.primus).toEqual(jasmine.any(Object));
                expect(a.primus.on).toEqual(jasmine.any(Function));
            });

            it("calls the on function 6 times.", function() {
                expect(a.primus.on.calls.count()).toBe(6);
                expect(p.handlers.length).toBe(6);
            });

            it("registers proper functionality on open", function() {
                var open = p.handlers[0];
                expect(open.name).toBe("open");
                a.isAdminConnected = false;
                open.cb();
                expect(a.isAdminConnected).toBe(true);
            });

            it("registers proper functionality on reconnect", function() {
                var reconnect = p.handlers[2];
                expect(reconnect.name).toBe("reconnect");
                a.isAdminConnected = true;
                reconnect.cb("");
                expect(a.isAdminConnected).toBe(false);
            });

            it("registers proper functionality on reconnected", function() {
                var reconnected = p.handlers[3];
                expect(reconnected.name).toBe("reconnected");
                a.isAdminConnected = false;
                reconnected.cb("");
                expect(a.isAdminConnected).toBe(true);
            });

            it("registers proper functionality on end", function() {
                var end = p.handlers[4];
                expect(end.name).toBe("end");
                a.isAdminConnected = true;
                end.cb();
                expect(a.isAdminConnected).toBe(false);
            });
        });
        describe("request admin attach data function.", function() {
            beforeEach(function() {
                spyOn(a, "createPrimus").and.callFake(function(url) {
                    return p;
                });

                spyOn(p, "on").and.callThrough();
                spyOn(a, "deviceMessage");
                spyOn(a, "meetingMessage");
                spyOn(a, "applyData");
                spyOn(a, "requestMessage");

                a.activate();
            });
            afterEach(function() {
                a.primus = null;
                p.handlers = [];
            });

            it("registers functionality for device messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "device",
                    message: {}
                });
                expect(a.deviceMessage).toHaveBeenCalled();
            });

            it("registers functionality for initialize messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "initialize",
                    message: {}
                });
                expect(a.applyData).toHaveBeenCalled();
            });

            it("registers functionality for meeting messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "meeting",
                    message: {}
                });
                expect(a.meetingMessage).toHaveBeenCalled();
            });

            it("registers functionality for request messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "request",
                    message: {}
                });
                expect(a.requestMessage).toHaveBeenCalled();
            });
        });
    });
});
