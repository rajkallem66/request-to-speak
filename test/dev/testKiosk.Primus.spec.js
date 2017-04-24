/* global describe */
define(["kiosk"], function(kiosk) {
    describe("Kiosk Primus features.", function() {
        "use strict";
        var a = kiosk;
        var p = {
            handlers: []
        };
        p.on = function(name, cb) {
            this.handlers.push({name: name, cb: cb});
        }.bind(p);

        describe("kiosk attach calls.", function() {
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
                a.isKioskConnected = false;
                open.cb();
                expect(a.isKioskConnected).toBe(true);
            });

            it("registers proper functionality on reconnect", function() {
                var reconnect = p.handlers[2];
                expect(reconnect.name).toBe("reconnect");
                a.isKioskConnected = true;
                reconnect.cb("");
                expect(a.isKioskConnected).toBe(false);
            });

            it("registers proper functionality on reconnected", function() {
                var reconnected = p.handlers[3];
                expect(reconnected.name).toBe("reconnected");
                a.isKioskConnected = false;
                reconnected.cb("");
                expect(a.isKioskConnected).toBe(true);
            });

            it("registers proper functionality on end", function() {
                var end = p.handlers[4];
                expect(end.name).toBe("end");
                a.isKioskConnected = true;
                end.cb();
                expect(a.isKioskConnected).toBe(false);
            });
        });
        describe("kiosk attach data function.", function() {
            beforeEach(function() {
                spyOn(a, "createPrimus").and.callFake(function(url) {
                    return p;
                });

                spyOn(p, "on").and.callThrough();
                spyOn(a, "applyMeetingData");

                a.activate();
            });
            afterAll(function() {
                a.primus = null;
                p.handlers = [];
            });

            it("registers functionality for meeting start messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "meeting",
                    message: {
                        event: "started"
                    }
                });
                expect(a.applyMeetingData).toHaveBeenCalled();
            });

            it("registers functionality for initialize messages", function() {
                var data = p.handlers[5];
                expect(data.name).toBe("data");
                data.cb({
                    messageType: "initialize",
                    message: {
                        meetingData: {}
                    }
                });
                expect(a.applyMeetingData).toHaveBeenCalled();
            });
        });
    });
});
