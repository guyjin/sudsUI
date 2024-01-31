/**
 * @file The LocalStorage module provides a Backbone.sync implementation wrapping the HTML5 LocalStorage API.
 * @see module:nrm-ui/localStorage
 */
/**
 * @module nrm-ui/localStorage
 * 
 */
define(['backbone', '.', './guid', 'underscore', 'jquery'], 
        function(Backbone, Nrm, guid, _, $) {
        
    /** 
     * Create a new instance of the LocalStorage module. 
     * @constructor 
     * @alias module:nrm-ui/localStorage
     * @classdesc Storage module that can be used in place of Backbone.sync to provide client-side storage for small 
     * amounts of data, like user preferences.
     * @param {string} name - Name of the record in LocalStorage that contains the data.
     * @returns {undefined}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API|MDN Using the Web Storage API}
     * for details on the HTML5 LocalStorage API referenced in this page.
     */
    Nrm.LocalStorage = function(name) {
        this.name = name;
        var store = this.localStorage().getItem(this.name);
        this.records = (store && store.split(",")) || [];
    };

    _.extend(Nrm.LocalStorage.prototype, /** @lends module:nrm-ui/localStorage.prototype */{

        /**
         * Save the current state of the **Store** to *localStorage*.
         * @returns {undefined}
         */
        save: function() {
            this.localStorage().setItem(this.name, this.records.join(","));
        },

        /**
         * Add a model, giving it a (hopefully)-unique GUID, if it doesn't already have an id of it's own.
         * @param {external:module:backbone.Model} model The Backbone model to insert.
         * @returns {Object} The persisted model attributes.
         */
        create: function(model) {
            if (!model.id) {
                model.id = guid.guid();
                model.set(model.idAttribute, model.id);
            }
            this.localStorage().setItem(this.name+"-"+model.id, JSON.stringify(model));
            this.records.push(model.id.toString());
            this.save();
            return this.find(model);
        },

        /**
         * Update a model by replacing its copy in 'this.data'.
         * @param {external:module:backbone.Model} model The Backbone model to update.
         * @returns {Object} The persisted model attributes.
         */
        update: function(model) {
            this.localStorage().setItem(this.name+"-"+model.id, JSON.stringify(model));
            if (!_.include(this.records, model.id.toString())) {
                this.records.push(model.id.toString());
            }
            this.save();
            return this.find(model);
        },

        /**
         * Retrieve a model from 'this.data' by id.
         * @param {external:module:backbone.Model} model The Backbone model to find.
         * @returns {Object} The persisted model attributes.
         */
        find: function(model) {
            return this.jsonData(this.localStorage().getItem(this.name+"-"+model.id));
      },

        /**
         * Return the array of all models currently in storage.
         * @returns {Object[]} The array of models as plain objects.
         */
        findAll: function() {
            return _(this.records).chain()
              .map(function(id){
                  return this.jsonData(this.localStorage().getItem(this.name+"-"+id));
                  }, this)
              .compact()
              .value();
        },

        /**
         * Delete a model from 'this.data', returning it.
         * @param {external:module:backbone.Model} model The Backbone model to delete.
         * @returns {external:module:backbone.Model|boolean}
         * Returns the model that was deleted, or false for a new model.
         */
        destroy: function(model) {
            if (model.isNew())
                return false;
            this.localStorage().removeItem(this.name+"-"+model.id);
            this.records = _.reject(this.records, function(id){
                return id === model.id.toString();
            });
            this.save();
            return model;
        },

        /**
         * Wrapper for window.localStorage.
         * @returns {Storage} The localStorage instance
         */
        localStorage: function() {
            return localStorage;
        },

        /**
         * fix for "illegal access" error on Android when JSON.parse is passed null
         * @param {string} data JSON string or null
         * @returns {Object} The parsed JSON as an object.
         */
        jsonData: function (data) {
            return data && JSON.parse(data);
        }
    });

    /**
     * Backbone.sync implementation which replaces the default JQuery XHR implementation if Nrm.offlineStorage is set
     * to "Local", and the model or collection does not have localStorage property set to false.
     * @param {string} method The CRUD method or "sync method", see Backbone documentation for details. 
     * @param {external:module:backbone.Model|external:module:backbone.Model} model The model or collection.
     * @param {object} options Sync options including success and error callbacks, see Backbone documentation for details.
     * @returns {external:module:jquery.Promise}
     * The returned promise will be resolved with the result which could be the model attributes or array of models if 
     * sync request was successful, or rejected with an error object or string if the sync request failed.
     * @see {@link http://backbonejs.org/#Sync|Backbone.sync}
     */
    Nrm.LocalStorage.sync = function(method, model, options) {
        var resp, errorMessage, syncDfd = $.Deferred && $.Deferred(); //If $ is having Deferred - use it.
        var store = model.localStorage;
        if (store === undefined && model.collection) {
            store = model.collection.localStorage;
        }
        if (store === undefined) {
            alert("Offline storage has not been defined");
            return;
        }

        try {
            switch (method) {
                case "read":
                    resp = model.id !== undefined ? store.find(model) : store.findAll();
                    break;
                case "create":
                    resp = store.create(model);
                    break;
                case "update":
                    resp = store.update(model);
                    break;
                case "delete":
                    resp = store.destroy(model);
                    break;
            }
        } catch(error) {
            if (error.code === DOMException.QUOTA_EXCEEDED_ERR && window.localStorage.length === 0) {
                errorMessage = "Private browsing is unsupported";
            } else {
                errorMessage = error.message;
            }
        }

        if (resp) {
            model.trigger("sync", model, resp, options);
            if (options && options.success) {
                if (Backbone.VERSION === "0.9.10") {
                    options.success(model, resp, options);
                } else {
                    options.success(resp);
                }
            }
            if (syncDfd) {
                syncDfd.resolve(resp);
            }
        } else {
            errorMessage = errorMessage ? errorMessage : "Record Not Found";
            model.trigger("error", model, errorMessage, options);
            if (options && options.error) {
                if (Backbone.VERSION === "0.9.10") {
                    options.error(model, errorMessage, options);
                } else {
                    options.error(errorMessage);
                }
            }
            if (syncDfd) {
                syncDfd.reject(errorMessage);
            }
        }

        // add compatibility with $.ajax
        // always execute callback for success and error
        if (options && options.complete) options.complete(resp);
            return syncDfd && syncDfd.promise();
    };
    return Nrm.LocalStorage;
});

