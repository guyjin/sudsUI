/**
 * @file Unit test suites for the text module
 * @see {@link module:nrm-ui/text}
 */

define(['require', 'underscore'], function(require, _) {
    return {
        run: function(QUnit) {

            QUnit.test('The text loader plugin loads a text resource', function(assert) {

                assert.expect(1);
                var textLoaded = assert.async();

                require(['text!Rules.txt'], function(rulesTxt) {
                    assert.ok(_.isString(rulesTxt) && rulesTxt.length > 0, 
                        "Plugin module loaded result as a string with length > 0");
                    textLoaded();
                });
                
            });
            
            QUnit.test('The text loader plugin caches resources and supports relative URLs', function(assert) {

                assert.expect(5);
                var textLoaded = assert.async(), 
                    textLoadedAgain = assert.async(),
                    textLoadedWithRelativePath = assert.async(),
                    prefix = 'text!',
                    xhr = this.sandbox.useFakeXMLHttpRequest(),
                    response = "Hello world",
                    relativeResourceName = _.uniqueId("./thisIsDefinitelyUnique") + ".txt",
                    resourceName = require.toAbsMid(relativeResourceName),
                    relativeMid = prefix + relativeResourceName,
                    mid = prefix + resourceName,
                    expectedUrl = require.toUrl(resourceName);

                require([mid], function(result) {
                    assert.equal(result, response, "Plugin module loaded text result for " + mid);
                    textLoaded();
                });
                require([mid], function(result) {
                    assert.equal(result, response, "Plugin module loaded text result a second time for " + mid);
                    textLoadedAgain();
                });
                require([relativeMid], function(result) {
                    assert.equal(result, response, "Plugin module loaded text result with relative path for " + 
                            relativeMid);
                    textLoadedWithRelativePath();
                });       
                // one request has been added to the request queue
                assert.equal(xhr.requests.length, 1, "One request was sent to fake XHR");
                
                // did we send it to the correct URL?
                assert.equal(xhr.requests[0].url, expectedUrl, "Requested URL was " + expectedUrl +
                        " for resource name " + resourceName);
                
                // send the response
                xhr.requests[0].respond(200, { "Content-Type": "plain/text" }, response);
            });
            

        }
    };
});

