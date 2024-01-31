var profile = (function() {
    var ignore = function(filename, mid) {
        var list = {
            "dojo/dojo.profile": 1,
            "dojo/package.json": 1
        };
        return mid in list; 
    };
    return {
        resourceTags: {
            ignore: ignore,
            //copyOnly: copyOnly,
            amd: function(filename, mid) {
                //return !copyOnly(filename, mid) && !ignore(filename, mid) && /\.js$/.test(filename);
                return !ignore(filename, mid) && /\.js$/.test(filename);
            }
        }
    };
})();
