define(["nrm-ui", "require", "underscore", "./config/main","./models/customBOValidationRules"],
                                function(Nrm, require, _, appState,BusinessObject) {

    var Suds = window.Suds = {
        Models: {},
        Collections: {},
        Views: {}
    };


    Suds.startup = function(options) {

        options = _.defaults(options || { }, { isPrototype: false }); // switch between local db and database


        Nrm.startup(function() {

            appState = _.extend(appState, options);

            var deps = ['./views/sudsLayoutView'];


            $.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
                options.crossDomain ={
                    crossDomain: true
                };
                options.xhrFields = {
                    // withCredentials: true,
                    contentType:'application/json'
                };
            });


            // Store the original version of Backbone.sync
            if(window.location.hostname === 'localhost' && window.location.port === '3000') {

                var port = '7001';
                var pathPrefix = '';
                if(window.location.port === '3000') {
                    pathPrefix = 'nrm/suds';
                }

                var backboneSync = Backbone.sync;

                Backbone.sync = function (method, model, options) {

                    /*
                     * Change the `url` property of options to begin
                     * with the URL from settings
                     * This works because the options object gets sent as
                     * the jQuery ajax options, which includes the `url` property
                     */

                    var url = (options && options.url) || _.result(model, 'url')



                    var pattern = /^((http|https|ftp):\/\/)/;


                    if(!pattern.test(url)) {
                        // url = "http://" + url;
                        options = _.extend({},options, {
                            url: 'http://localhost:' + port + '/' + pathPrefix + '/' + url
                        });

                    }

                    /*
                     *  Call the stored original Backbone.sync
                     * method with the new url property
                     */

                    backboneSync(method, model, options);
                };
            }

            function renderLayoutView(LayoutView, appState) {
                // hook up context:collectionLoaded events
                function refreshMyTasks() {
                    if (Suds.MyTasks) {
                        Suds.MyTasks.fetch({ reset: true });
                    }
                }
                function refreshMyRecords() {
                    if (Suds.Records) {
                        Suds.Records.fetch({ reset: true });
                    }
                }
                Nrm.event.on({
                    'suds:refreshTasks': refreshMyTasks,
                    'suds:refreshRecords': refreshMyRecords,
                    'context:collectionLoaded': function(collection, options) {


                        if (options.context) {

                            switch (options.context.apiKey) {
                                case 'lov/processingStatus':
                                    // used in prototype mode to derive attributes from the statusFk.
                                    Suds.ProcessingStatuses = collection;
                                    break;
                                case 'myTasks':
                                    // keep a reference to the collection so that we can refresh it
                                    Suds.MyTasks = collection;
                                    collection.on({
                                        'change:statusFk': function(model) {
                                            console.log('My Tasks: status changed: ', model.processingStatusCode());
                                            if (!model.isTaskForCurrentUser()) {
                                                console.log('My Tasks: status is no longer my task');
                                                /* usage of setTimeout is a hack to address the problem where tree load
                                                 * does not occur if the tree is current loading due to changing group
                                                 * (i.e. if the stage changes due to the status change).
                                                 */
                                                setTimeout(function() {
                                                    refreshMyTasks();
                                                }, 500);
                                            }
                                        }
                                    })
                                    break;
                                case 'proposals':

                                    // keep a reference to the collection so that we can refresh it
                                    Suds.Records = collection;
                                    BusinessObject.EditableUnits = collection;
                                    collection.on({
                                        'change:statusFk': function(model) {
                                            console.log('Proposals: status changed: ', model.processingStatusCode());
                                            setTimeout(function() {
                                                refreshMyRecords();
                                            }, 500);
                                        }
                                    })
                                    break;

                                case 'process':
                                    // synchronizes the myTasks collection if models are added, changed or removed
                                    collection.on({
                                        'add': refreshMyTasks,
                                        'remove': function(model) {
                                            if (Suds.MyTasks) {
                                                Suds.MyTasks.remove(model.id);
                                            }
                                        },
                                        'change': function(model) {
                                            if (_.has(model.changedAttributes(),'statusFk')) {
                                                refreshMyTasks();
                                            } else if (Suds.MyTasks) {
                                                var taskModel = Suds.MyTasks.get(model.id);
                                                if (taskModel) {
                                                    taskModel.set(model.toJSON());
                                                }
                                            }
                                        }
                                    });
                                    break;
                            }
                        }
                    }
                });

                var mainView = Suds.MainView = new LayoutView(appState);

                mainView.render();

            }

            require(deps, function(LayoutView) {

                renderLayoutView(LayoutView, appState);
            });
        }, this);
    };

    /**
     * Gets the current date, which may be simulated for prototyping, or actual.
     * @returns {string}
     * Date string representing current date
     */

    Suds.currentDate = function() {
        if (Suds.now) {
            // allows simulating a different current date for the prototype.
            return Suds.now;
        }
        else {
            // for now, returns a date string without time so that calculations are rounded to nearest day.
            return Nrm.app.formatValue(new Date(Date.now()).toISOString().substr(0,10), 'date', 'set');
        }
    };
    Suds.dateDiff = function(dateString) {
        var today = new Date(Suds.currentDate());
        var date = new Date(dateString);
        var diff = today.getTime() - date.getTime();
        return diff / 86400000;
    };
    return Suds;
});
