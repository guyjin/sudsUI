define(["qunit", "jquery", "nrm-map/views/mapIdentifyView"], function(QUnit, $, MapIdentifyView) {
    var fixture = "#qunit-fixture";
    function domroot() {
        return $(fixture);
    }
   return { 
       run:  function() {
            // module defined in main
            //QUnit.module("nrm-map/views/mapIdentifyView");
            QUnit.test("Identify detects when attribute value is a URL (artf57220)", function(assert) {
                var view  = new MapIdentifyView(),
                    url = "http://www.fs.fed.us";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept URL with only domain (" + url + ")");
                url = "http://www.fs.fed.us/";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept URL with domain and trailing slash (" + url + ")");
                url = "http://www.fs.fed.us/a/b/c";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept URL with path (" + url + ")");
                url = "http://www.fs.fed.us/a/b/c/";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept URL with path and trailing slash (" + url + ")");
                url = "http://www.fs.fed.us/a/b/c/index.html";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept URL with file (" + url + ")");
                url = "http://www.fs.fed.us/a/b/c/index.html?j=1&k=2";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept URL with query string (" + url + ")");
                url = "http://www.fs.fed.us:80/a/b/c/index.html?j=1&k=2";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept URL with port and query string (" + url + ")");
                url = "https://www.fs.fed.us";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept SSL URL with only domain (" + url + ")");
                url = "https://www.fs.fed.us/";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept SSL URL with domain and trailing slash (" + url + ")");
                url = "https://www.fs.fed.us/a/b/c";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept SSL URL with path (" + url + ")");
                url = "https://www.fs.fed.us/a/b/c/";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept SSL URL with path and trailing slash (" + url + ")");
                url = "https://www.fs.fed.us/a/b/c/index.html";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept SSL URL with file (" + url + ")");
                url = "https://www.fs.fed.us/a/b/c/index.html?j=1&k=2";
                assert.equal(view.urlRegex.exec(url)[0], url, "Accept SSL URL with query string (" + url + ")");
                url = " https://www.fs.fed.us/a/b/c/index.html?j=1&k=2";
                assert.notOk(view.urlRegex.test(url), "Reject text with preceding space (" + url + ")");
                url = "http://www.fs.fed.us/a/b/c/index.html?j=1&k=2 ";
                assert.notOk(view.urlRegex.test(url), "Reject text with traling space (" + url + ")");
                url = "preceding characters http://www.fs.fed.us/a/b/c/index.html?j=1&k=2";
                assert.notOk(view.urlRegex.test(url), "Reject text with preceding characters (" + url + ")");
                url = "http://www.fs.fed.us/a/b/c/index.html?j=1&k=2 trailing characters";
                assert.notOk(view.urlRegex.test(url), "Reject text with tralining characters (" + url + ")");
                url = "preceding characters http://www.fs.fed.us/a/b/c/index.html?j=1&k=2";
                assert.notOk(view.urlRegex.test(url), "Reject text with preceding and tralining characters (" + url + ")");
                url = "httx://www.fs.fed.us/a/b/c/index.html?j=1&k=2";
                assert.notOk(view.urlRegex.test(url), "Reject text with invalid protocol (" + url + ")");
            });
        }
    };
});