var profile = (function() {
    var ignore = function(filename, mid) {
        var list = {
            "tests/test.profile": 1,
            "tests/package.json": 1
        };
        return mid in list; 
    };
    var amdTest = function(filename, mid) {
                return !ignore(filename, mid) && /\.js$/.test(filename);
            };
    return {
        resourceTags: {
            ignore: ignore,
            test: amdTest,
            amd: amdTest
        }
    };
})();
