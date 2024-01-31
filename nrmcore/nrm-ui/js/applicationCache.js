/**
 * @file The ApplicationCache module provides feedback for the HTML5 ApplicationCache API and online/offline indicator.
 * Typically this is only used by applications that have "mobileApp" option set to true.
 * @see module:nrm-ui/applicationCache
 */
/** 
 * @module nrm-ui/applicationCache
 */

define(['jquery', '.', './plugins/messageBox'], function($, Nrm, MessageBox) {
    var removeCls = {
            'label-info': 'label-success label-warning',
            'label-success': 'label-warning label-info',
            'label-warning': 'label-success label-info'
        },
        ONLINE = 'Online',
        OFFLINE = 'Offline';
        
    function updateStatus(status) {
        var indicator = $('.onlineindicator');
        if (!indicator.length) {
            return;
        }
        //console.warn('updating status', status);
        if (status.title) {
            indicator.attr('title', status.title);
        }
        if (status.text) {
            indicator.text(status.text);
        }
        if (status.className) {
            indicator.removeClass(removeCls[status.className]).addClass(status.className);
        }
    }
    
    /**
     * Create a new instance of the ApplicationCache module.  
     * @constructor
     * @alias module:nrm-ui/applicationCache
     * @classdesc
     *   Encapsulation of interaction with HTML5 ApplicationCache API and online/offline indicator for disconnected 
     *   editing.
     * @param {Object} [options] Currently unused.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Using_the_application_cache|MDN documentation for 
     * ApplicationCache API}
     */
    Nrm.ApplicationCache = function (options) {
        var appCache = window.applicationCache, 
                // The three status assignments here are intentional:
                // local status variable to avoid needing to bind to this,
                // this.status is the current status (may be online or offline, defaults to online)
                // this.onlineStatus preserves the current online status so that it can be restored after switching
                // from offline to back to online.
                status = this.status = this.onlineStatus = { 
                    text: ONLINE,
                    className: 'label-success'
                };
        if (appCache) {
            function onUpdateReady(e) {  
                console.log('applicationCache updateready', e);
                status.text = 'Update Ready';
                status.title = 'Please refresh page to update cache';
                status.className = 'label-warning';
                updateStatus(status);
                MessageBox('Application cache updated, please refresh the page to use the new version.', {type: 'notice'});
            }
            function showError(err) {
                status.text = ONLINE;
                status.title = ONLINE + ', Cache Error';
                status.className = 'label-warning';
                updateStatus(status);
                MessageBox('Application Cache Error\nRefresh the page to attempt to load the application cache again.');
            }
            function inProgress(e) {
//                if (e && e.total) {
//                    status.text = 'Caching: ' + e.loaded + ' of ' + e.total;
//                } else {
//                    status.text = 'Caching...';
//                }
                
                status.text = 'Caching...';
                status.title = 'Caching';
                status.className = 'label-info';
                updateStatus(status);
            }
            function cached() {
                status.text = ONLINE;
                status.title = ONLINE + ', cached';
                status.className = 'label-success';
                updateStatus(status);
                //MessageBox('Application cache is current', {type: 'success', hide: true, delay: 4000});
            }
            function cacheEvent(e) {
                console.info('appcache event ' + (e && e.type), e);
                switch (e.type) {
                    case 'cached':
                        cached();
                        MessageBox('Application cached successfully', {type: 'success', hide: true, delay: 4000});
                        break;
                    case 'noupdate':
                        cached();
                        break;
                    //case 'checking':
                    case 'downloading':
                    //case 'obsolete':
                    case 'progress':
                        inProgress(e);
                        break;
                }
            }
            appCache.addEventListener('updateready', onUpdateReady, false);
            appCache.addEventListener('error', showError, false);
            // Fired after the first cache of the manifest.
            appCache.addEventListener('cached', cacheEvent, false);
            // Checking for an update. Always the first event fired in the sequence.
            appCache.addEventListener('checking', cacheEvent, false);
            // An update was found. The browser is fetching resources.
            appCache.addEventListener('downloading', cacheEvent, false);
            // Fired after the first download of the manifest.
            appCache.addEventListener('noupdate', cacheEvent, false);
            // Fired if the manifest file returns a 404 or 410.
            // This results in the application cache being deleted.
            appCache.addEventListener('obsolete', cacheEvent, false);
            // Fired for each resource listed in the manifest as it is being fetched.
            appCache.addEventListener('progress', cacheEvent, false);
            
            if (Nrm.appCacheError) {
                //console.warn('ApplicationCache failed to initialize before we added the event listener');
                showError(Nrm.appCacheError);
            } else {
                switch (appCache.status) {
                    case appCache.UPDATEREADY:
                        onUpdateReady();
                        break;
                    case appCache.IDLE:
                        console.info('ApplicationCache status is IDLE');
                        cached();
                        break;
                    case appCache.UNCACHED:
                        // unexpected
                        console.warn('ApplicationCache status is UNCACHED');
                        break;
                    case appCache.CHECKING:
                    case appCache.DOWNLOADING:
                    case appCache.OBSOLETE:
                        console.info('ApplicationCache status is ' + appCache.status);
                        inProgress();
                        break;
                }
            }
        }
    };
    
    Nrm.ApplicationCache.prototype = /** @lends module:nrm-ui/applicationCache.prototype */{
        /**
         * Initialize the online/offline status.
         * @returns {external:module:jquery:Promise}
         * Usually returns synchronously, but may be asynchronous in the future.
         * The returned promise is resolved with the current online status (boolean).
         */
        init: function() {
            var dfd = new $.Deferred();
            var self = this, timeout;
            function resolve(online) {               
                if (window.addEventListener) {
                    window.addEventListener("online", function (e) {
                        if (timeout) {
                            clearTimeout(timeout);
                        }
                        self.setOnlineMode(true);
                    }, true);
                    window.addEventListener("offline", function (e) {
                        if (timeout) {
                            clearTimeout(timeout);
                        }
                        self.setOnlineMode(false);
                    }, true);
                }
                dfd.resolve(online);
                timeout = setTimeout(function() {
                    self.setOnlineMode(online);
                });
            }
            /* The "onlineTestUrl" option was originally conceived to test for the VPN-offline scenario 
             * where the navigator.onLine is true.  This may be incorporated into the getUserInfo method instead.
             */
            var testUrl = Nrm.app && Nrm.app.get("onlineTestUrl");                                
            if (testUrl && navigator.onLine) {
                $.when($.get(testUrl)).done(function() {
                    resolve(navigator.onLine);
                }).fail(function() {
                    resolve(false);
                }); 
            } else {
                resolve(navigator.onLine);
            }
            return dfd.promise();
        },
        /**
         * Set online or offline status
         * @param {boolean} online
         * @returns {undefined}
         */
        setOnlineMode: function(online) {
            console.info('Setting online mode: ', online);
            if (!online) {
                this.offlineStatus = $.extend({ }, this.onlineStatus, {
                    text: OFFLINE,
                    title: this.onlineStatus.title && this.onlineStatus.title.replace(ONLINE, OFFLINE),
                    className: 'label-warning'
                });
                this.status = this.offlineStatus;
            } else {
                this.status = this.onlineStatus;
            }
            updateStatus(this.status);
            if (Nrm.app)
                Nrm.app.set("online", online);
            
            /**
             * Online status has changed.
             * @event module:nrm-ui/event#onlineStatusChanged
             */            
            Nrm.event.trigger("onlineStatusChanged");
        }
    };
    return Nrm.ApplicationCache;
});

