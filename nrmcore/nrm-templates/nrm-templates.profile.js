var profile = (function() {
    var ignore = function(filename, mid) {
        var list = {
            "nrm-templates/nrm-templates.profile": 1,
            "nrm-templates/package.json": 1
        };
        return mid in list; 
    };

    return {
        trees: [ [".", ".", /(\/\.)|(^\.)|(~$)|(\.bat$)/] ],
        resourceTags: { 
            ignore: ignore,
            amd: function(filename, mid) {
                return /\.js$|\.handlebars$/.test(filename); // assumes the nrm "hbs" build plugin will be used
            },
            handlebars: function(filename, mid) {
                return /\.handlebars$/.test(mid);
            },
            test: function(filename, mid) {
                return /^nrm-templates\/tests\//.test(mid);
            }
        }
            
    };
})();
