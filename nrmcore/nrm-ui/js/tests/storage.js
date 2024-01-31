define([
   'qunit', 
   'jquery',
   'backbone', 
   '../localDB', 
   '../webSQL', 
   'module'
], function(
       QUnit, 
	   $, 
	   Backbone, 
	   LocalDB, 
	   WebSQL, 
	   module
	) {
var run = function() {
    if (!QUnit.config.currentModule || QUnit.config.currentModule.name !== module.id) {
        // backwards-compatibility for early Starter Project implementation
        // DO NOT copy this into new tests, all new tests should assume the application is using latest Starter Project
        QUnit.module("nrm.storage");
    }

QUnit.test( "Nrm.LocalDB (IndexedDB)", function( assert ) {
    runTest(assert, "LocalDB");
  });

//QUnit.test( "Nrm.WebSQL", function( assert ) {
//    runTest(assert, "WebSQL");
//  });

/* 
 * Local Storage Tests:
 *  create db
 *  create table
 *  add
 *  add second row (not in a test)
 *  update
 *  find
 *  findAll
 *  destroy
 *  TBD: sync(read)
 *  TBD: sync(create)
 *  TBD: sync(update)
 *  TBD: sync(delete)
 *  TBD: sync(destroy)
 *  
 */
function runTest(assert, storagetype) {
    var db, storageClass, dbname="qunit",
        tableDone = assert.async(),
        recordCreated = assert.async(),
        record2Created = assert.async(),
        recordUpdated = assert.async(),
        recordFindAll = assert.async(),
        recordFind = assert.async(),
        recordDestroyed = assert.async(),
        tableCreated = assert.async(),
        secondObjectCreated = assert.async();
    switch (storagetype.toLowerCase()) {
        case "websql":
          try {

              if (openDatabase !== undefined) {
                  console.log('proceeding with WebSQL test');
              }
          } catch (e) {
              //var s = "artf58791 PENDING WebSQL not supported in this browser";
              //console.log(s);
              assert.expect(1);
              assert.ok(true,"WebSQL NOT SUPPORTED IN THIS BROWSER, SKIPPING TEST");
              return;
          }
          storageClass = WebSQL;
          break;
        case "localdb":
          storageClass = LocalDB;
          break;
    }
    assert.expect(assert.test.expected + 10);
    assert.ok(storageClass,storagetype + ' object');
    var config = {context:{test1:{noObjectStore:false}}};
    $.when(storageClass.initDatabase(dbname,config)).done(
//    $.when(storageClass.initDatabase(dbname)).done(
        function(database){
          db = database;
          tableCreated();
          assert.ok(db, storagetype + ' db return');
          console.log('db',db);
          var doIt = function(tx, res){
              assert.ok(obj,storagetype + ' table create');
              tableDone();
              var Model = Backbone.Model.extend({});
              var model = new Model({"id":"1","name":"test1","status":"initial insert"});
              var model2 = new Model({"id":"2","name":"test2","status":"initial insert"});
              //var collection = new Backbone.Collection([model, model2]);
              model.localStorage = obj;
              model2.localStorage = obj;
              console.log('model',model);
              var destroySuccess = function(){
                assert.ok(true,storagetype + ' record destroy');
                recordDestroyed();
                // test second table
                if (storagetype.toLowerCase() === "websql") {
                    // the method using dbname doesn't work for websql
                    var obj2 = new storageClass(obj.db, 'test2', function(){
                      console.log('second table created');
                      assert.ok(obj2,storagetype + 'second table create');
                      secondObjectCreated();
                    });
                } else {
                    var obj2 = db;
//                    obj2.tableName = 'test2';
                      console.log('second table created');
                      assert.ok(obj2,storagetype + 'second table create');
                      secondObjectCreated();
/*                    var obj2 = new storageClass({db: obj.db, tableName: 'test2', callback: function(){
                    //var obj2 = new storageClass(dbname, 'test2', function(){
                      console.log('second table created');
                      assert.ok(obj2,storagetype + 'second table create');
                      secondObjectCreated();
                    },
                    errorCallback: function(err){
                      console.log('ERROR second table created', err);
                      assert.ok(false, storagetype + 'second table create');
                      secondObjectCreated();
                    }
                    });*/
                }
              };
              var destroyFail = function(err){
                console.error('destroy error',err);
                assert.ok(false,storagetype + ' record destroy');
                recordDestroyed();
              };
              var findSuccess = function(tx, result){
                  console.log('find returned',result);
                  var val;
                  if (storagetype.toLowerCase() === 'websql'){
                      val = JSON.parse(result.rows.item(0).value).status;
                  } else {
                      val = result.result.status;
                  }
                  assert.ok( val === 'updated' , storagetype + ' find');
                  recordFind();
                  obj.destroy(model,destroySuccess,destroyFail);
                  //obj.destroy(model2,function(){}, function(){});
              };
              var findFail = function(err){
                console.error('find error',err); 
                assert.ok(false,storagetype + ' find');
                recordFind();
              };
              var findAllSuccess = function(tx,result){
                  var val;
                  var res;
                  if (storagetype.toLowerCase() === 'websql'){
                      val = JSON.parse(result.rows.item(0).value).status;
                      res = result.rows;
                  } else {
                      val = result.result[0].status;
                      res = result.result;
                  }
                  console.log('findAll result found ' + val,result);
                  assert.ok(res.length === 2, storagetype + ' find All result');
                  recordFindAll();
                  obj.find(model,findSuccess,findFail);
              };
              var findAllFail = function(err){
                console.error('findAllFail',err);
                recordFindAll();
                assert.ok(false,storagetype + ' find All');
              };
              var updateSuccess = function(tx, result){
                // check for status=updated in the find test
                console.log('updateSuccess',tx,result);
                assert.ok(true,storagetype + ' record update');
                recordUpdated();
                console.log('about to findall');
                obj.findAll(findAllSuccess, findAllFail);
              };
              var updateFail = function(err){
                console.error('update error ' + err.message,err);
                assert.ok(false,storagetype + ' record update');
                recordUpdated();
              };
              var createSuccess = function(){
                console.log('in createSuccess');
                assert.ok(true,storagetype + ' record create');
                recordCreated();
                // test update
                model.set("status","updated");
                console.log('creating second record');
                obj.create(model2, function(){
                    console.log('about to update model',model);
                    assert.ok(true,storagetype + ' second record create');
                    record2Created();
                    obj.update(model, updateSuccess, updateFail);
                },
                    function(err){
                        console.log('error adding second record',err);
                        assert.ok(false,storagetype + ' second record create');
                        record2Created();
                        obj.update(model, updateSuccess, updateFail);
                });
                //obj.destroy(model,destroySuccess,destroyFail);
              };
              var createFail = function(err){
                console.error('create error ' + err.message,err);
                assert.ok(false,storagetype + ' record create');
                recordCreated();
                //obj.destroy(model,destroySuccess,destroyFail);
                obj.update(model, updateSuccess, updateFail);
              };

              console.log('about to create',obj);
              obj.create(model,createSuccess,createFail);

          };

          var obj = db;
          obj.tableName = 'test1';
          doIt();
//          var obj = new storageClass({db: db, tableName: 'test1', callback: doIt, 
//                errorCallback: function(err){
//                    console.log('ERROR table created', err);
//                    assert.ok(false,storagetype + ' table create');
//                    //tableDone();
//                   }
//          });
       });
}
};
return {run: run};
});