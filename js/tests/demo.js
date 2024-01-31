define([ 
    'nrm-ui', 
    'nrm-ui/models/version', 
    'jquery',
    'text!Rules.txt'
], 
        function(Nrm, Version, $, rulesText) {
    return {
        run: function(QUnit) {

            // enable aborting a test if an assertion fails
            var success = true;
            
            QUnit.log(function(details) {
                success = details.result;
            })
            
            // module is defined in main
            //QUnit.module("tests/demo");
            
            QUnit.test('Demo of a rudimentary unit test', function(assert) {
                assert.ok(Nrm, 'Nrm module should be defined.');
                
            });
            QUnit.test('Demo of an asynchronous unit test', function(assert) {
                
                // The response variable is a callback function that we later call to signal that 
                // the asyncronous action is completed.
                // A test can have multiple assert.async() calls
                var response = assert.async();
                
                // We recommend verifying the number of assertions if practical
                assert.expect(1);
                
                var model = new Version({id: "SvnRev.txt"});
                model.fetch({
                    success: function() {
                        // Assertion checks for expected attribute that should be set on the model when it is fetched.
                        assert.ok(model.get("rev"), "Request succeeded, and the \"rev\" attribute is defined.");
                        response();
                    },
                    fail: function() {
                        // assertion always fails if this is called
                        assert.ok(false, "Request failed");
                        response(); // signal that we're done with this test even though it failed
                    }
                });
            });
            QUnit.test("Sinon fake timer simulates the browser's setTimeout", function(assert) {

                 var testme = 0, clock = this.sandbox.useFakeTimers();
                 
                 setTimeout(function() {
                     testme = 1;
                 }, 500);
                 
                 clock.tick(510);
                 
                 assert.equal(testme, 1, "Variable was set to expected value in the setTimeout callback");
            });
            
            QUnit.test("Actual setTimeout", function(assert) {
                
                 // unless we use the default configuration from nrm-ui/tests/api/launcher,
                 // the fake timer is enabled by default, we can call this.sandbox.restore() to disable it for this test
                 //this.sandbox.restore();
                 
                 var done = assert.async();
                 assert.expect(1);
                 
                 setTimeout(function() {
                     // if fake timer was enabled, we would have to call this.clock.tick() to get here (see previous test).
                     console.log
                     assert.ok(true, "The setTimeout callback was called");
                     done();
                 }, 500);
            });
            
            QUnit.test("Sinon fake XMLHttpRequest should simulate ajax request", function (assert) {
                
                success = true;
                assert.expect(4);                
                                
                // use Sinon "fake XMLHttpRequest"
                // use sandbox to avoid extra clean-up
                var xhr = this.sandbox.useFakeXMLHttpRequest();

                // Sinon spy: http://sinonjs.org/docs/
                var callback = this.spy();
                $.ajax('Rules.txt', {
                    'dataType': 'json',
                    'success': callback
                })
                
                // one request has been added to the request queue
                assert.equal(xhr.requests.length, 1, "One request was sent to fake XHR");
                
                if (!success) {
                    // see QUnit.log call above
                    return;
                }
                
                // The spy hasn't been called yet...
                assert.equal(callback.callCount, 0, "Spy callback not called until after fake XMLHttpRequest responds.");
                
                // send the response
                xhr.requests[0].respond(200, { "Content-Type": "application/json" }, rulesText);
                
                // Now the spy has been called exactly once...
                assert.ok(callback.calledOnce, "Spy callback was called exactly once");
                
                // Now we get the first call from the spy, and check that the first argument is the expected JSON response
                assert.ok($.isArray(callback.firstCall.args[0].Entities), 
                        "Spy callback was called with Entities property set to an array");
            });
            
            QUnit.test("Actual ajax reqest", function (assert) {
                
                var done = assert.async();
                success = true;
                assert.expect(1);
                
                $.ajax('Rules.txt', {
                    'dataType': 'json',
                    'success': function(response) { 
                        assert.ok($.isArray(response.Entities), "Success callback called with Entities property set to an array");
                        done();
                    },
                    'fail': function() {
                        // assertion always fails if this is called
                        assert.ok(false, "Request failed");
                        done(); // signal that we're done with this test even though it failed
                    }
                });
            });

        }
    };
});

