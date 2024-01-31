/**
 * @file The WebSQL module provides a Backbone.sync implementation wrapping the WebSQL API.
 * @deprecated WebSQL API was rejected as an HTML5 standard.
 */
define(['.', './guid', 'underscore'], function(Nrm, guid, _) {
    Nrm.WebSQL = function(db,tableName,callback){
        this.tableName = tableName;
        this.db = db;
        var success = function(tx,res) {
            if (callback) {
                callback();
            }
        };
        var str = "CREATE TABLE IF NOT EXISTS " + tableName + " (id unique,value)";
        this.executeSql(str,null,success);
    };

    _.extend(Nrm.WebSQL.prototype,{
	create: function (model,success,error) {
            //when you want use your id as identifier, use apiid attribute
            if(!model.attributes[model.idAttribute]) {
                // Reference model.attributes.apiid for backward compatibility.
                var obj = {};
                obj[model.idAttribute] = (model.attributes.apiid)?(model.attributes.apiid):(guid.guid());
                model.set(obj);
            }
            console.log('WebSql insert OR REPLACE into ' + this.tableName + ' ' + model.attributes[model.idAttribute]);
            this.executeSql("INSERT OR REPLACE INTO " + this.tableName + " (id,value) VALUES(?,?)",[model.attributes[model.idAttribute], JSON.stringify(model.toJSON())], success, error);
        },

	destroy: function (model, success, error) {
            var id = (model.attributes[model.idAttribute] || model.attributes.id);
            this.executeSql("DELETE FROM " + this.tableName + " WHERE id =?", [id], success, error);
        },

        findAll: function (success, error) {
            this.executeSql("SELECT id,value FROM " + this.tableName, null, success, error);
        },

        find: function (model, success, error) {
            var id = (model.attributes[model.idAttribute] || model.attributes.id);
            this.executeSql("SELECT id,value FROM "+ this.tableName + " WHERE id =?",[id], success, error);
        },

        update: function (model, success, error) {
            var id = (model.attributes[model.idAttribute] || model.attributes.id);
            this.executeSql("UPDATE " + this.tableName + " SET value=? WHERE id =?",[JSON.stringify(model.toJSON()), id], success, error);
        },

        executeSql: function (SQL, params, successCallback, errorCallback) {
            var success = function(tx,result) {
                if (successCallback) {
                    successCallback(tx,result);
                }
            };
            var error = function(tx,error) {
                if (errorCallback) {
                    errorCallback(tx,error);
                }
            };
            this.db.transaction(function(tx) {
                tx.executeSql(SQL, params, success, error);
            });
        } 
    });

    Nrm.WebSQL.initDatabase = function (dbName, callback) {
        var db;
        try {
            db = openDatabase(dbName, '1.0', 'NRM database', 2 * 1024 * 1024);
        } catch (err) {
            if (err === 2) {
                alert("Invalid database version");
            } else {
                alert('WebSQL is not supported in this browser.');
            }
        }
        callback(db);
    };

    Nrm.WebSQL.sync = function(method, model, options) {
        var store = model.localStorage;
        if (store === undefined && model.collection) {
            store = model.collection.localStorage;
        }
        if (store === undefined) {
            alert("Offline storage has not been defined");
            return;
        }
        var success = function(tx,res) {
            var len = res.rows.length, result, i;
            if (len > 0) {
                result = [];
                for (i = 0; i < len; i++) {
                    result.push(JSON.parse(res.rows.item(i).value));
                }
            }
            if (options.success) {
                // modified for latest version of backbone
    //            options.success(model, result, options);
                options.success(result);
            }
        };
        var error = function(tx,error) {
            if (options.error) {
                options.error(error);
            }
        };

        switch(method) {
            case "read": 
                var id = model.attributes;
                if (id !== undefined) {
                    id = (model.attributes[model.idAttribute] || model.attributes.id);
                }
                if (id === undefined) {
                    store.findAll(success,error);
                } else {
                    store.find(model,success,error);
                }
                break;
            case "create":	
                var state = model.get("state");
                if (state === undefined || state === "A") {
                    if (state === undefined) {
                        model.set("state","U");
                    store.create(model,success,error);
                    }
                } else {
                    model.set("state","U");
                    store.update(model,success,error);
                }
                break;
            case "update":
                if (model.get("state") === "D") {
                    model.set("state", "U");
                } else {
                    model.set("state", "M");
                }
                store.update(model, success, error);
                break;
            case "delete":
                if (model.get("state") !== "A") {
                    model.set("state","D");
                    store.update(model,success,error);
                } else {
                    store.destroy(model,success,error);
                }
                break;
            case "destroy":
                store.destroy(model,success,error);
                break;
            default:
                window.console.error(method);
        }
    };
    return Nrm.WebSQL;
});