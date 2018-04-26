var profile = (function() {
    var ignore = function(filename, mid) {
        var list = {
            "nrm-ui/nrm-ui.profile": 1,
            "nrm-ui/package.json": 1
        };
        return mid in list;
    };

    return {
        resourceTags: {
            ignore: ignore,
            amd: function(filename, mid) {
                //return !copyOnly(filename, mid) && !ignore(filename, mid) && /\.js$/.test(filename);
                return !ignore(filename, mid) && /\.js$/.test(filename);
            },
            test: function(filename, mid) {
                return /^nrm-ui\/tests\//.test(mid);
            }
        }
    };
})();
