var profile = (function() {
    var ignore = function(filename, mid) {
        var list = {
            "nrm-map/nrm-map.profile": 1,
            "nrm-map/package.json": 1,
            "nrm-map/nrmMap.css": 1
        }; 
        return mid in list; 
    };
    var copyOnly = function(filename, mid) {
        var list = {
            "nrm-map/tileWorker": 1,
            "nrm-map/flmDataSources.json": 1,
            "nrm-map/shapefileWorker": 1,
            "nrm-map/proxy.config": 1,
            "nrm-map/proxy.ashx": 1,
            "nrm-map/shapefileloader/shapefile-nonAMD": 1
        };
        return (mid in list) || /\.html$/.test(filename);
    };

    return {
        trees: [ [".", ".", /(\/\.)|(^\.)|(~$)|(test_map\.html$)|(\.ashx$)|^images$/] ],
        resourceTags: {
            ignore: ignore,
            copyOnly: copyOnly,
            amd: function(filename, mid) {
                return !copyOnly(filename, mid) && !ignore(filename, mid) && /\.js$/.test(filename);
            },
            test: function(filename, mid) {
                return /^nrm-map\/tests\//.test(mid);
            }
        }
    };
})();
