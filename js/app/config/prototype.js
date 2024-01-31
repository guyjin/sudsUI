/**
 * @file Applies prototype-specific configuration as a separate module so that it can be omitted from the optimized layer 
 * for actual SUDS app.
 * @see module:app/config/prototype
 */
/** 
 * @module app/config/prototype
 */
define([
    'underscore', 
    'nrm-ui', 
    '..', 
    'jquery', 
    'nrm-ui/localDB', 
    'backbone',
    'nrm-ui/views/modalView',
    'require',
    'hbs!error',
    '../models/common/specialUse'
], function(_, Nrm, Suds, $, LocalDB, Backbone, ModalView, require, errorTemplate, SpecialUse) {
    return {
        initialize: function(config, callback, caller) {
            /* Increment the dataVersion value AND the metdata.version in prototypeDataPackage.json to trigger a refresh
             * of the data package. Note that this will selectively clear the IndexedDB data stores only for the keys 
             * found in the data package.
             */
            var dataVersion = 13;

            _.extend(config.context, {
                // special context item for package metadata, works kind of like the 'lov' context
                metadata: {
                    modules: {
                        collection: 'nrm-ui/collections/graphCollection'
                    }
                },
                userProfile: {
                    // creates the "userProfile" data store in IndexedDB to allow storage of homeOrg for multiple users
                }
            });
            
            function onError(model, resp, options) {
                var error = Nrm.app.normalizeErrorInfo('Failed to download package', model, resp || model, options);
                Nrm.event.trigger('showErrors', errorTemplate({ error: error }));
            }
            
            function downloadPackage(callback) {
                var dataPackage = new Backbone.Model();
                dataPackage.localStorage = false;
                dataPackage.url = require.toUrl('../data/prototypeDataPackage.json');
                dataPackage.fetch({
                    success: function(model) {
                        LocalDB.loadPackage(model, {
                            success: function() {
                                Nrm.event.trigger('app:packageLoaded', true);
                                if(_.isFunction(callback)){
                                    callback.apply(this, arguments);
                                }
//                                Nrm.event.trigger('app:modal', {
//                                    caption: 'Download Complete',
//                                    text: 'Data package was downloaded successfully.'
//                                });
                            },
                            error: onError
                        });
                    },
                    error: onError
                });
            }            
            
            Nrm.event.on({
                'prototype:getRoles': function(userInfo, callback) {
                    
                    var search = window.location.search, match;
                    if (search) {
                        match = search.match(/\?user=([a-zA-Z]+)/);
                        if (match && match[1]) {
                            userInfo.set('userName', match[1].toUpperCase());
                        }
                    }
                    var model = new Backbone.Model({ id: userInfo.get('userName') });
                    model.urlRoot = "api/userProfile";
                    model.fetch({
                        success: function() {
                            userInfo.set("roles", [model.toJSON()]);
                            callback(userInfo);
                        },
                        error: function(model, resp, options) {
                            userInfo.set("roles", []);
                            callback(userInfo);
                        }
                    });
                },
                'app:init': function() {
                    console.log('SUDS app:init');
                    // check for loaded package
                    // TODO: this should probably occur earlier so that application initialization occurs AFTER loading
                    // the package instead of the other way around.
                    var metadata = new Backbone.Model();
                    metadata.url = 'api/metadata/package';
                    metadata.fetch({
                        success: function(model, resp) {
                            var loaded = model.get("version") === dataVersion;
                            Nrm.event.trigger('app:packageLoaded', loaded);
                        }
                    });

                },
                'app:disconnected': function(action) {
                    var notImplemented;
                    switch (action) {
                        case 'download':

                            Nrm.event.trigger('app:home', {
                                callback: function(data) {
                                    if (data.cancel) {
                                        return;
                                    }
                                    if (Suds.packageLoaded) {
                                        Nrm.event.trigger('app:modal', {
                                            caption: 'Overwrite Package?',
                                            text: 'Downloading a package will clear the current content and all local edits will ' +
                                                    'be lost if they are not uploaded first.  Are you sure you want to continue?',
                                            buttons: ModalView.YES_NO,
                                            callback: function() {
                                                if (this.clicked === 0) {
                                                    downloadPackage();
                                                }
                                            }
                                        });
                                    } else {
                                        downloadPackage();
                                    }
                                }
                            });
                            break;
                        case 'upload':
                            notImplemented = 'Upload Data Package';
                            break;
                        case 'about':
                            notImplemented = 'Package Metadata';
                            break;
                        case 'clear':
                            Nrm.event.trigger('app:home', {
                                callback: function(data) {
                                    if (data.cancel) {
                                        return;
                                    }
                                    Nrm.event.trigger('app:modal', {
                                        caption: 'Clear Local Data?',
                                        text: 'All local edits will be lost.  Are you sure you want to continue?',
                                        buttons: ModalView.YES_NO,
                                        callback: function() {
                                            if (this.clicked === 0) {
                                                var empty = { };
                                                _.each(Nrm.app.get('context'), function(context, key) {
                                                    if (!context.noObjectStore) {
                                                        empty[key] = [];
                                                    }
                                                });
                                                LocalDB.loadPackage(new Backbone.Model(empty), {
                                                    success: function() {
                                                        Nrm.event.trigger('app:packageLoaded', false);
                                                        Nrm.event.trigger('app:modal', {
                                                            caption: 'Local Data Cleared',
                                                            text: 'All data has been cleared was cleared, you will need to ' + 
                                                                    'download a data package to continue.'
                                                        });
                                                    },
                                                    error: function(model, resp) {
                                                        var error = Nrm.app.normalizeErrorInfo('Failed to clear local data', 
                                                            model, resp || model);
                                                        Nrm.event.trigger('showErrors', errorTemplate({ error: error }));
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                            break;
                        default:
                            notImplemented = action;
                    }
                    if (notImplemented) {
                        Suds.MainView.showNotImplemented(notImplemented);
                    }
                },
                'app:packageLoaded': function(loaded) {
                    if (!loaded) {
                        downloadPackage(function() {
                            _.each(Nrm.app.get('context'), function(context, key) {
                                 if (key.indexOf('/') !== -1 && context.collection) {
                                     context.collection = null; // force reload?
                                 }
                            });                            
                        });
                    }
                    console.log('package loaded', loaded);
                    if (Suds.packageLoaded === loaded) {
                        return;
                    }
                    Suds.packageLoaded = loaded;

                }
            });
            
            Nrm.offlineStorage = 'LocalDB';
            
            function proceed() {
                if (_.isFunction(callback)) {
                    callback.call(caller, config);
                }
            }
            
            $.when(LocalDB.initDatabase('Suds_Prototype', _.pick(config, 'context'))).done(function(instance) {
                Suds.db = instance;
                var modelToJSON = Backbone.Model.prototype.toJSON;
                _.extend(Backbone.Model.prototype, {
                    localStorage: instance,
                    // default list of attributes to omit when storing in LocalDB, may be overriden if necessary.
                    omitAttributes: ['selected'],
                    // override Backbone.Model#toJSON to support omitting attributes when storing to LocalDB.
                    toJSON: function(options) {
                        var result = modelToJSON.apply(this, arguments);
                        if (options && options.localDB && _.isArray(this.omitAttributes)) {
                            result = _.omit(result, this.omitAttributes);
                        }
                        return result;
                    }
                });
                Backbone.Collection.prototype.localStorage = instance;
                LocalDB.addDeletedFilterHandler(instance);
                LocalDB.addCountHandler(instance);
                
                var userName; // hack to allow filtering editableUnit by user name before 'userInfo' attribute is set
                
                Nrm.event.on('db:beforeSync', function(store, method, model) {
                    var currentFilter = store.filter;
                    
                    // is the row owned by the org?
                    function isOwnedByOrg(row, org) {
                        return org && row && org.id === row.fsUnitId;
                    }
                    
                    // applies original filter
                    function applyFilter(caller, args) {
                        if (_.isFunction(currentFilter)) {
                            return currentFilter.apply(caller, args);
                        }
                        return true;
                    }
                    switch (store.tableName) {
                        /* This case 'metadata' block would eliminate the need to maintain the data version in both the
                         * prototype module and the prototypeDataPackage.json file, but when I tried this solution, I 
                         * found that it risks loading the wrong version of the json file getting associated with the 
                         * incremented dataVersion if the browser loads it from the cache instead of the changed file.
                         */
//                        case 'metadata':
//                            if (method === 'update') {
//                                // set the version
//                                var data = model.get('value');
//                                if (data) {
//                                    data.version = dataVersion;
//                                }
//                            }
//                            break;
                        case 'userProfile':
                            // enable saving/fetching user info for offline use
                            store.transform = function(result, method, model, options) {
                                var dfd = $.Deferred();
                                function notFound() {
                                    dfd.resolve({id: "Not Set"});
                                }
                                // translates the homeOrg to a member of the lov/editableUnit collection
                                $.when(Nrm.app.getContext({ apiKey: 'lov/editableUnit' })).done(function(context) { 
                                    if(!result) {
                                        notFound();
                                    } else {
                                        userName = result.id;
                                        $.when(Nrm.app.getCollection(context)).done(function(collection) { 
                                            var model = collection.get(result.homeOrg);
                                            if (model) {
                                                dfd.resolve(model.toJSON());
                                            } else {
                                                notFound();
                                            }
                                        }).fail(_.bind(dfd.reject, dfd));
                                    }
                                }).fail(_.bind(dfd.reject, dfd));
                                return dfd.promise();
                            };
                            if (model.isNew()) {
                                // setting the home org...
                                var user = Nrm.app.get('userInfo');
                                if (user) {
                                    userName = user.userName;
                                }
                                // userName provides the model id so that we can store homeOrg for multiple users
                                store.id = userName;
                                model.set('id', userName);
                            }
                            break;
                        case 'myTasks':
                            // redirect the table name so that we can add records in the 'specialUse'
                            store.tableName = 'process';
                            /* The following filter simulates a query that should be implemented in the mid-tier to 
                             * filter results to only include actionable items for the current user.
                             */
                            store.filter = function(row) {
                                // do not include the record if an existing filter wants to exclude it.
                                if (!applyFilter(this, arguments)) {
                                    return false;
                                }
                                var homeOrg = Nrm.app.get('homeOrg');
                                if (!isOwnedByOrg(row, homeOrg)) {
                                    // always returns empty list if home org is not set
                                    // also exclude any models not matching the home org
                                    return false;
                                }
                                return SpecialUse.isTaskForRole(row.statusFk, homeOrg);
                            };
                            break;
                        case 'process':
                            /* The following filter limits results to only include records owned by the current home org.
                             */
                            store.filter = function(row) {
                                // do not include the record if an existing filter wants to exclude it.
                                if (!applyFilter(this, arguments)) {
                                    return false;
                                }
                                var homeOrg = Nrm.app.get('homeOrg');
                                return isOwnedByOrg(row, homeOrg);
                            };
                            break;
                        case 'lov':
                            if (store.id === 'editableUnit') {
                                /* The following filter limits results to only the editable units and role assignments
                                 * associated with the current userName.  
                                 */
                                store.filter = function(row) {
                                    // do not include the record if an existing filter wants to exclude it.
                                    if (!applyFilter(this, arguments)) {
                                        return false;
                                    }
                                    var user = Nrm.app.get('userInfo');
                                    if (user) {
                                        userName = user.userName;
                                    }
                                    return row.userName === userName;
                                };
                            }
                            break;
                    }
                });
                //LocalDB.addSearchNotSupportedHandler(instance);
                proceed();
            }).fail(function(error) {
                console.error('LocalDB initialization failed with error: ', error);
                // ASSUMPTION: all requests will fail because Nrm.offlineStorage is set to 'LocalDB', but localStorage is undefined.
                proceed();
            });
        }
    };
});