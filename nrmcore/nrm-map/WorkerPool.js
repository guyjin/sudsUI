/**
 * @file Worker pool for background processing.
 * @see module:nrm-map/WorkerPool
 */
/** 
 * @module nrm-map/WorkerPool
 * 
 */

/*
 * "Highly configurable" mutable plugin boilerplate
 * Author: @markdalgleish
 * Further changes, comments: @addyosmani
 * Licensed under the MIT license
 */

// http://addyosmani.com/resources/essentialjsdesignpatterns/book/
// http://markdalgleish.com/2011/05/creating-highly-configurable-jquery-plugins/
// http://markdalgleish.com/2011/09/html5data-creating-highly-configurable-jquery-plugins-part-2/

// Note that with this pattern, as per Alex Sexton's, the plugin logic
// hasn't been nested in a jQuery plugin. Instead, we just use
// jQuery for its instantiation.

// This is a worker pool
// ttp://www.smartjava.org/content/html5-easily-parallelize-jobs-using-web-workers-and-threadpool

// Notes:
// http://stackoverflow.com/questions/7145514/whats-the-purpose-of-starting-semi-colon-at-beginning-of-javascript

// History:
// NRM ported and modified in 2014.
// 10/27/2015 ebodin Finished AMD port, refactored with deferreds and properties to eliminate some globals.
// 5/18/2016 http://teamforge.fs.usda.gov/sf/go/artf54311 Cache map tiles in IndexedDB

// runner work tasks in the pool

define(['jquery'], function($) {
	// ==================================
	// WORKERTASK
	// ==================================

	function WorkerTask(script, callback, msg, context) {
		this.script = script;
		this.callback = callback;
		this.startMessage = msg;
                this.context = context;
	}

	//_nrm.namespace("utils").WorkerTask = WorkerTask;

	// ==================================
	// WORKERTHREAD (Used internally)
	// ==================================

	function WorkerThread(parentPool) {
	 
	    var that = this, 
                dummyCallback = function(event) {
                    console.log("WorkerPool.dummyCallback", event);
                    if ($.isFunction(that.workerTask.callback))
                        that.workerTask.callback(event);
                    // we should use a seperate thread to add the worker
                    var data = JSON.parse(event.data);
                    if (data.type === undefined || data.type === "response") {
                        that.parentPool.freeWorkerThread(that);
                    }
                };
	    this.parentPool = parentPool;
	    this.workerTask = {};
            this.run = function(workerTask) {
                console.log("WorkerThread.run", workerTask);
	        this.workerTask = workerTask;
	        // create a new web worker
	        if (this.workerTask.script!= null) {
	            var worker = this.worker = new Worker(workerTask.script);
	            worker.addEventListener('message', dummyCallback, false);
                    worker.addEventListener("error", function(err){console.error("WorkerTask error", err, arguments);});
	            worker.postMessage(workerTask.startMessage);
	        }
	    };
            this.terminate = function() {
                console.log("WorkerTask.terminate", this.worker);
                this.worker.terminate();
            };
	}

	// ==================================
	// WORKER POOL
	// ==================================

	var WorkerPool = function (options) {

		this.options = options;

		// All plugin globals explicitly defined here.
		this.taskQueue = [];	// Contains WorkerTasks
		this.workerQueue = [];	// Contains WorkerThreads
		this.poolSize = 0;

		this.init();
	};

	// the plugin prototype
	WorkerPool.prototype = {
		defaults: {
			poolSize: 5
		},

		init: function () {
                    // Introduce defaults that can be extended either 
                    // globally or using an object literal. 
                    this.config = $.extend({}, this.defaults, this.options);
                    this.poolSize = this.config.poolSize;
                    // create 'size' number of worker threads
                    for (var i = 0 ; i < this.poolSize ; i++) {
                        this.workerQueue.push(new WorkerThread(this));
                    }			
		},

	    addWorkerTask: function(workerTask) {
                console.log("addWorkerTask", workerTask);
	        if (this.workerQueue.length > 0) {
	            // get the worker from the front of the queue
	            var workerThread = this.workerQueue.shift();
                    console.log("addWorkerTask run", workerTask);
	            workerThread.run(workerTask);
	        } else {
	            // no free workers
	            this.taskQueue.push(workerTask);
                    console.log("addworkerTask queued workerTask", this.taskQueue);
	        }
	    },
	 
	    freeWorkerThread: function(workerThread) {
                //console.log('WorkerPool.freeWorkerThread workerThread and taskQueue(' 
                //        + this.taskQueue.length.toString() + '):', workerThread, this.taskQueue);
                if (this.taskQueue.length > 0) {
	            // don't put back in queue, but execute next task
	            var workerTask = this.taskQueue.shift();
	            workerThread.run(workerTask);
	        } else {
	            this.workerQueue.push(workerThread);
	        }
	    },

            terminate: function() {
                console.log("WokerPool.terminate", this);
                this.taskQueue = [];
                this.workerQueue.forEach(function(workerThread){
                    workerThread.worker.terminate();
                });
                this.workerQueue = [];
            }
	};

	WorkerPool.defaults = WorkerPool.prototype.defaults;
        WorkerPool.Task = WorkerTask;
        //_nrm.namespace("utils").WorkerPool = WorkerPool;
        return WorkerPool;
});