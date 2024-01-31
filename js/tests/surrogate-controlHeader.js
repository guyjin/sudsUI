//define(['qunit', 'jquery'], function(QUnit, $) {
define(['jquery'], function($) {
    return { 
        run: function(QUnit) {

            // module defined in main
            //QUnit.module("nrm.surrogate-controlHeader");

            QUnit.test( "artf44597 add Surrogate-Control header", function( assert ) {
                var cacheHeader = "Cache-Control", 
                    surrogateHeader = "Surrogate-Control",
                    noStore = "no-store", noCache = "no-cache",
                    done = assert.async(4); 

                function assertHeaders(resource, cacheControl, surrogate) {
                     var cacheControlMessage = "When " + resource + " is requested, the response should have " + 
                            cacheHeader + ": " + cacheControl + " header.",
                         surrogateControlMessage = "When " + resource + " is requested, the response should " + 
                            (surrogate ? "" : "NOT ") + "have " + surrogateHeader + ": " +  noStore + " header.",
                         options = {
                            url: resource, 
                            cache: false, // IE responses from browser cache have null headers, thanks IE!
                            success: function(result,status,xhr){
                                assert.equal(xhr.getResponseHeader(cacheHeader), cacheControl, cacheControlMessage);
                                if (surrogate) {
                                    assert.equal(xhr.getResponseHeader(surrogateHeader), noStore, surrogateControlMessage);
                                } else {
                                    assert.notOk(xhr.getResponseHeader(surrogateHeader), surrogateControlMessage)
                                }
                                done();
                            }, error: function(result, status){
                                assert.ok(false, "Failed to load " + resource + ": " + result.status.toString() + ' ' + 
                                        result.statusText);
                                done();
                            }
                        };

                    // prevent script execution for Javascript resource
                    // without this, we see "multipleDefine" and 404 errors in console output
                    if (/\.js$/.test(resource)) {
                        options.dataType = "text";
                    }    

                    $.ajax(options);
                }

                assert.expect(8);

                assertHeaders("index.html", noStore, true);
                assertHeaders("api.html", noStore, true);
                assertHeaders("css/index.css", noCache, false);
                assertHeaders("js/app/main.js", noCache, false);

          });

        }
    };
});
