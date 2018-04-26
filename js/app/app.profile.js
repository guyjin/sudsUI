var profile = (function() {
    var ignore = function(filename, mid) {
        var list = {
            "app/app.profile": 1,
            "app/package.json": 1
        };
        return mid in list; 
    };

    return {
        resourceTags: {
            ignore: ignore,
            amd: function(filename, mid) {
                return !ignore(filename, mid) && /\.js$/.test(filename);
            }
        }
    };
})();
