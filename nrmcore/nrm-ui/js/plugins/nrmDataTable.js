/**
 * 
 * @file Wraps the {@link https://datatables.net/|DataTables JQuery plugin} with behavior customized for NRM 
 * requirements
 * @author      Dan Camenson
 * @see {@link module:nrm-ui/plugins/nrmDataTable}
 */
/**
 * 
 * @module nrm-ui/plugins/nrmDataTable
 */
/**
 * Function that is called when the row selection state changes.
 * @callback EnableActionsCallback
 * @param {external:module:jquery} enableElement The table actions container element.
 * @param {Object} options
 * @param {Number} options.cnt The selection count
 * @param {Array} options.data The data for the selected rows.
 * @returns {undefined}
 */
/**
 * Function that filters the collection to display a subset of the models in the table.
 * @callback FilterCallback
 * @param {external:module:backbone.Model} model The model to include or exclude.
 * @param {Number} index The index of the model in the collection
 * @returns {Boolean}
 * Return true to include the model in the table.
 */
/**
 * Initialization options for the nrmDataTable plugin.  In addition to initialization options for the DataTables 
 * plugin, the nrmDataTable supports a few additional options documented below.  
 * @typedef PluginOptions
 * @property {Function|string} [fnSelected="selected"] Attribute name or function that determines the state of the row
 * selection checkbox. This is used as the 
 * {@link https://datatables.net/reference/option/columns.data|DataTables.columns.data option} for the selection 
 * checkbox column.
 * @property {module:nrm-ui/plugins/nrmDataTable~FilterCallback} [nrmFilter] Function that filters the collection 
 * before binding to the table. 
 * @property {module:nrm-ui/plugins/nrmDataTable~EnableActionsCallback} [fnEnableCallback] Function that is called when
 * the row selection state changes, use this to enable or disable table actions based on the current selection.
 * @property {external:module:backbone.Collection} [collection] A collection to bind to the table.  If this option is
 * not set, then one of the DataTables options for data binding must be used.
 * @property {Boolean} [readOnly=false] Indicates that the selection checkbox column should be omitted if the option is
 * set to true.
 * @property {Boolean} [multiSelect=true] Multiple rows can be selected at the same time.
 * @property {Boolean} [nrmScroll=true] Enable default scrolling behavior (currently horizontal scrolling only).
 * @property {Boolean} [defaultSelectedValue=false] Default selection value, if set to true, all rows will be selected
 * (selection checkbox checked) by default.
 * @property {external:module:jquery} [tableActions] The JQuery element containing the table actions, if not specified
 * the default is the previous sibling element of the table.
 * @property {string} [titleAttr="title"] Attribute name to set the accessible label on the selection checkbox.  
 * @property {Object} [titles] Hash of accessible labels for the selection checkboxes.
 * @property {string} [titles.deselectAll="Deselect all rows"] Title to display on the select all rows checkbox when it
 * is unchecked.
 * @property {string} [titles.selectAll="Select all rows"] Title to display on the select all rows checkbox when it is 
 * checked.
 * @property {string} [titles.deselectRow="Deselect row"] Title to display on the row selection checkbox when it is 
 * unchecked.
 * @property {string} [titles.selectRow="Select row"] Title to display on the row selection checkbox when it is checked.
 * @property {Number} [selectionCnt=0] Selection count, maintained internally when the selection changes.
 * @property {string|Boolean} [focusable] JQuery selector string that indicates whether a child element is focusable, or 
 * set to false to disable keyboard navigation in the grid.  If not set, it will use the default focusable selector 
 * determined by {@link module:nrm-ui/main.getFocusableSelector|Nrm.getFocusableSelector}.
 * @see {@link https://datatables.net/reference/option/|DataTables options} for a complete
 * list of initialization options.
 */
define(['jquery', 'underscore', '..', 'backbone', 'use!datatables-bootstrap'], function($, _, Nrm, Backbone) {
 
    $.fn.dataTableExt.oApi.fnReloadAjax = function ( oSettings, sNewSource, fnCallback, bStandingRedraw )
    {
        // DataTables 1.10 compatibility - if 1.10 then versionCheck exists.
        // 1.10s API has ajax reloading built in, so we use those abilities
        // directly.
        if ( $.fn.dataTable.versionCheck ) {
            var api = new $.fn.dataTable.Api( oSettings );

            if ( sNewSource ) {
                api.ajax.url( sNewSource ).load( fnCallback, !bStandingRedraw );
            }
            else {
                api.ajax.reload( fnCallback, !bStandingRedraw );
            }
            return;
        }

        if ( sNewSource !== undefined && sNewSource !== null ) {
            oSettings.sAjaxSource = sNewSource;
        }

         // Dan - 09/14
        if (!oSettings) {
            return;
        }
       // Server-side processing should just call fnDraw
        if ( oSettings.oFeatures.bServerSide ) {
            this.fnDraw();
            return;
        }

        this.oApi._fnProcessingDisplay( oSettings, true );
        var that = this;
        var iStart = oSettings._iDisplayStart;
        var aData = [];

        this.oApi._fnServerParams( oSettings, aData );

        oSettings.fnServerData.call( oSettings.oInstance, oSettings.sAjaxSource, aData, function(json) {
            /* Clear the old information from the table */
            that.oApi._fnClearTable( oSettings );

            /* Got the data - add it to the table */
            var aData =  (oSettings.sAjaxDataProp !== "") ?
                that.oApi._fnGetObjectDataFn( oSettings.sAjaxDataProp )( json ) : json;

            for ( var i=0 ; i<aData.length ; i++ )
            {
                that.oApi._fnAddData( oSettings, aData[i] );
            }

            oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

            that.fnDraw();

            if ( bStandingRedraw === true )
            {
                oSettings._iDisplayStart = iStart;
                that.oApi._fnCalculateEnd( oSettings );
                that.fnDraw( false );
            }

            that.oApi._fnProcessingDisplay( oSettings, false );

            /* Callback user function - for event handlers etc */
            if ( typeof fnCallback == 'function' && fnCallback !== null )
            {
                fnCallback( oSettings );
            }
        }, oSettings );
    };

    $.fn.dataTableExt.oApi.fnFindRows = function ( oSettings, sSearch, sColumn )
    {
    // find rows matching search criteria 'sSearch' optionally by columns 'sColumn'
        var rows = [];
        $.each(oSettings.aoData,function(index,data){
            var aData = data._aData;
            if (typeof sColumn === 'undefined') {
                // no columns specified; search all columns
                for (var j in aData ) {
                    if (typeof sSearch === 'string') {
                        // one search criteria
                        if (aData[j] === sSearch) {
                            rows.push(data.nTr);                
                        }
                    } else if ($.isArray(sSearch)) {
                        // multiple search criteria
                        $.each(sSearch,function(idx,item){
                            if (aData[j] === item) {
                                rows.push(data.nTr);                
                            }
                        });
                    }
                }
            } else if (typeof sColumn === 'string') {
                // one column specified
                if (typeof sSearch === 'string') {
                    // one search criteria
                    if (aData[sColumn] === sSearch) {
                        rows.push(data.nTr);
                    } 
                } else if ($.isArray(sSearch)) {
                    // multiple search criteria
                    $.each(sSearch,function(idx,item){
                        if (aData[sColumn] === item) {
                            rows.push(data.nTr);                
                        }
                    });
                }
            } else if ($.isArray(sColumn)) {
                // multiple columns specified
                $.each(sColumn,function(idx,col){
                    if (typeof sSearch === 'string') {
                        // one search criteria
                        if (aData[col] === sSearch) {
                            rows.push(data.nTr);
                        }
                    } else if ($.isArray(sSearch)) {
                        // multiple search criteria
                        $.each(sSearch,function(idx2,item){
                            if (aData[col] === item) {
                                rows.push(data.nTr);                
                            }
                        });
                    }   
                });
            }
        });
        return rows;
    };

    $.fn.dataTableExt.oApi.fnStandingRedraw = function (oSettings) {
        if (oSettings.oFeatures.bServerSide === false) {
            var before = oSettings._iDisplayStart;

            oSettings.oApi._fnReDraw(oSettings);

            // iDisplayStart has been reset to zero - so lets change it back
            oSettings._iDisplayStart = before;
            oSettings.oApi._fnCalculateEnd(oSettings);
        }

        // draw the 'current' page
        oSettings.oApi._fnDraw(oSettings);
    };

    $.extend( true, $.fn.dataTable.defaults, {
        oLanguage: {
            sLengthMenu: "_MENU_ records per page",
            //sInfo: "_START_ to _END_ of _TOTAL_ records",
            "fnInfoCallback": function( settings, start, end, max, total, pre ) {
                if (total === 0) {
                    return "No records";
                } else if (total === 1) {
                    return "1 record";
                } else {
                    var api = this.api(),
                        pageInfo = api.page.info();
                    if (pageInfo.pages === 1) {
                        return total + " records";
                    } else {
                        return start + " to " + end + " of " + total + " records";
                    }
                }
            },
            sSearch: "Filter"
        }
    });
    
    /**
     * Applies the NrmDataTable plugin to a JQuery object.
     * This is actually the plugin function (jQuery.fn.nrmContextMenu) and module return value, not a constructor.  
     * @class
     * @alias module:nrm-ui/plugins/nrmDataTable
     * @classdesc
     *  The NrmDataTable plugin is a wrapper for the {@link https://datatables.net/|DataTables JQuery plugin} 
     *  that adds behavior customized for NRM requirements.
     * @param {module:nrm-ui/plugins/nrmDataTable~PluginOptions} options
     * @returns {external:module:jquery}
     * Returns the original JQuery object extended with instance members of the NrmDataTable plugin.
     */
    var NrmDataTable = function(options) {
        var $oTable = $(this);
        var titleDefaults = {
           deselectAll: "Deselect all rows",
           selectAll: "Select all rows",
           deselectRow: "Deselect row",
           selectRow: "Select row"
        };
        var defaults = {
            aaSorting: [],
            titleAttr: "title", // "aria-label", // alternative if title tag is too intrusive.
            selectionCnt: 0,
            defaultSelectedValue: false,
            collection: undefined,
            bAutoWidth: false,
            readOnly: false,
            multiSelect: true,
            nrmScroll: true,
            focusable: Nrm.getFocusableSelector(),
            tableActions: $oTable.prev()
        };
	/**
         * Internal intialization function.
         * @private
         * @param {module:nrm-ui/plugins/nrmDataTable~PluginOptions} options
         * @returns {undefined}
         */	
        this.init = function(options) {
            /**
             * Initialization options.
             * @name module:nrm-ui/plugins/nrmDataTable#properties
             * @type {module:nrm-ui/plugins/nrmDataTable~PluginOptions}
             */
            var props = this.properties = $.extend({},defaults, options),
                afterLoadCallback = _.partial(afterLoad, this);
            props.titles = $.extend({}, titleDefaults, options.titles);
            props.collectionEventsDelegated = false;
            if (props.collection) {
                $.extend(props, {
                    fnServerData: _.bind(function (sSource, aoData, fnCallback) {
                        var coll = props.collection;
                        $.when(coll.loading).done(_.bind(function(){
                            var c = 0;
                            function mapJson(model) {
                                if (!props.readOnly) {
                                    var selected = model.get("selected");
                                    if (selected === undefined) {
                                        selected = props.defaultSelectedValue;
                                     /* TODO: do we really want to set the default value on the model?
                                      * Setting the value on the result of toJSON might improve performance
                                      * by suppressing misleading "change" events, and avoid unwanted 
                                      * attribute that otherwise might need to be omitted when saving.
                                      * However, it might be a breaking change if external code relies on
                                      * the model attribute being set during nrmDataTable initialization.
                                      */
                                            model.set("selected",props.defaultSelectedValue, {silent:true});
                                    }
                                    if (selected) c++;
                                }
                                return $.extend({ _cid: model.cid }, model.toJSON());
                            }
                            if (props.nrmFilter && typeof props.nrmFilter === "function")
                                fnCallback(_.map(coll.filter(props.nrmFilter), mapJson));
                            else
                                fnCallback(coll.map(mapJson));
                            props.selectionCnt = c;
                            afterLoadCallback(!props.collectionEventsDelegated);
                            if (coll && !props.collectionEventsDelegated) {
                                props.collectionEventsDelegated = true;
                                coll.on('add',addRowHandler,this);
                                coll.on('remove',deleteRowHandler,this);
                                coll.on('reset',this.loadData,this);
                                coll.on('filter', filterHandler, this);
                                coll.on('highlight', highlightHandler, this);
                            }
                        }, this));
                    }, this),
                    sAjaxSource: true,
                    sAjaxDataProp: ""
                });
            }
				
            if (!props.readOnly) {
                 if(!props.collection)
                    addSelectedAttribute(props);
                 addSelectBox(props);
            }
            // backwards-compatibility for 1.10 - 1.9
            if ($oTable.is(".table-hover.table-striped.table-bordered"))
                $oTable.addClass("display"); 
            if ($oTable.is(".table-condensed"))
                $oTable.addClass("compact");
            /**
             * JQuery object extended with DataTables instance members.
             * @type {external:module:jquery}
             */
            this.dataTable = $oTable.dataTable(props);
            if (props.nrmScroll)
                $oTable.wrap('<div class="nrm-dataTables-scroll"/>');
            if (props.readOnly === false && props.multiSelect === true && $('.checkAll',this).length === 0) {
                    var x = $('thead tr th:first-child',this.dataTable);
                    x.append('<input type="checkbox" class="checkAll" tabindex="0">');
            }
            if (!props.collectionEventsDelegated) {
                afterLoadCallback(true); 
            }
            if (props.focusable && props.tableActions) {
                var label = $oTable.attr("aria-labelledby");
                var title = label && $("#" + label, $oTable.parents().last()).text();
                title = title ? title + " " : "";
                var skipLink = $('<a href="#" class="nrm-route-action nrm-skip-table sr-only sr-only-focusable" ' 
                        + 'title="Go to the bottom of the ' + title
                        + 'table" style="margin-right:5px;">Skip table</a>');
                // cannot use :focusable here because elements are not visible at this point.
                var insertBefore = $('a[href],input,button,textarea,select,[tabindex]:not([tabindex=""])', props.tableActions);
                if (insertBefore.length)
                    insertBefore.first().parentsUntil(props.tableActions).last().before(skipLink);
                else
                    $(props.tableActions).append(skipLink);
                skipLink = $('<div class="row"><div class="col-sm-12"><a href="#" ' 
                        + 'class="nrm-route-action nrm-skip-table-end sr-only sr-only-focusable" ' 
                        + 'title="Go to the top of the ' + title 
                        + 'table">Go to top of table</a></div></div>');
                $oTable.closest(".dataTables_wrapper").append(skipLink);
            }
            this.delegateEvents();			
        };
        function highlightHandler(model, collection) {
            var idx = collection.indexOf(model);
            this.setActiveRow(idx);
        }
        function filterHandler(collection, options) {
            options = options || { };   
            this.properties.nrmFilter = options.filter;
            this.loadData();
        }
        function addRowHandler(model, collection) {
            var idx = collection.indexOf(model);
            this.loadData();
            this.setActiveRow(idx);
        }
        function deleteRowHandler() {
            var $this = $(this), row = $this.attr("data-nrm-active-row"), footer = $this.attr("data-nrm-active-footer"),
                focus = !!$(":focus", $this).length, displayRow = -1, lastRow = false,
                dt = this.dataTable.api && this.dataTable.api();
            if (row && row != -1 && !footer) {
                var display = { 
                    order: 'current', 
                    search: 'applied' 
                }, idx = { order: 'index' }, tr = dt.row(row, idx), pi = dt.page.info();
                var displayNodes = dt.rows(display).nodes();
                displayRow = tr ? displayNodes.indexOf(tr.node()) : -1;  
                lastRow = displayRow > -1 && displayRow === pi.recordsDisplay - 1;
                if (displayRow > -1 && !lastRow) {
                    tr = displayNodes[displayRow + 1];
                    displayRow = dt.row(tr, idx).index();
                    // decrement the new index if the next row is after the current row in "index" order
                    if ($.isNumeric(row) && displayRow > parseInt(row))
                        displayRow -= 1;
                }
            }
            this.loadData();
            if (lastRow)
                this.lastPage(focus);
            else if (displayRow > -1)
                this.setActiveRow(displayRow, focus);            
        }
        /**
         * Set the active row, which manages the tabindex and other focus-related attributes, adds highlighted class
         * and triggers the custom "activerow" JQuery event on the &lt;tr&gt; element.
         * @param {Number|external:module:jquery} cell Numeric row index or JQuery object representing a &lt;tr&gt;, 
         * &lt;td&gt; or &lt;th&gt; element.
         * @param {Boolean} [focus] Indicates whether focus should be set to the active row.
         * @param {Boolean} [headerClick] Indicates whether we are in the header cell click event handler.
         * @returns {undefined}
         */
        this.setActiveRow = function(cell, focus, headerClick) {
            var dt = this.dataTable.api && this.dataTable.api(), focusable = this.properties.focusable;
            if (!focusable || !dt) return;
            if ($.isNumeric(cell)) {
                var r = dt.row(cell, { order: "index" });
                if (!r) return;
                cell = r.node();
            }
            var $cell = $(cell), $this = $(this), idx = { row: -1, column: -1 }, $row, i = 0;
            if ($cell.is('tr')) {
                var $empty, row = dt.row($cell).index();
                if (row || row === 0)
                    idx.row = row;
                else if ($cell.closest('tfoot').length) {
                    idx.row = $cell.index();
                    idx.footer = "1";
                } else {
                    $empty = $('.dataTables_empty',$cell);
                    if ($empty.length) {
                        idx.row = 0;
                        $cell = $empty;
                    }
                } 
                idx.column = $this.attr("data-nrm-active-col") || -1;
                if (idx.column !== -1) {
                    if (idx.footer) {
                        i = 0;
                        $.each($cell.children(), function() {
                            var $this = $(this), span = $this.attr("colspan");
                            i += ($.isNumeric(span) ? parseInt(span) : 1);
                            if (i >= idx.column) {
                                $cell = $this;
                                return false;
                            }
                        });
                    } else if (idx.row == -1) {
                        $cell = $(dt.column(idx.column).header());
                    } else if (!$empty || !$empty.length) {
                        $cell = $(dt.cell(idx).node());
                    }
                }
            } else if ($cell.closest('tfoot').length) {
                $row = $cell.closest('tr');
                idx.row = $row.index();
                idx.footer = "1";
                idx.column = $cell.index();
                i = 0;
                $.each($row.children(), function() {
                    var $this = $(this);
                    if ($this.index() === idx.column) {
                        idx.column = i;
                        return false;
                    }
                    var span = $this.attr("colspan");
                    i += ($.isNumeric(span) ? parseInt(span) : 1);
                });
            } else if ($cell.is('th')) {
                idx.column = dt.column($cell).index();
            } else {
                idx = dt.cell($cell).index();
                if (!idx && $cell.is(".dataTables_empty")) {
                    idx = { row: 0, column: $this.attr("data-nrm-active-col") || 0 };
                } else if (!idx) {
                    return;
                }
            }
//            console.log("Set active row: Row index: " + idx.row);
//            console.log("Set active row: Col index: " + idx.column);
            var current = { 
                row: $this.attr("data-nrm-active-row") || -1, 
                column: $this.attr("data-nrm-active-col") || -1,
                footer: $this.attr("data-nrm-active-footer")
            };
            // don't use triple-equals for these comparisons... data attribute is string, DT index is number
            $row = $row || $cell.closest("tr");
            var footerChanged = !!idx.footer !== !!current.footer; 
            var rowChanged = footerChanged || idx.row != current.row || !$row.is(".row_selected"); 
            var colChanged = idx.column != current.column; 
            if (colChanged) {
                $this.attr("data-nrm-active-col", idx.column);
            }
            if (rowChanged) {
                if (!focus && headerClick && idx.row == -1 && rowOnCurrentPage(this, current.row)) {
                    // clicking a column header should not change active row if it is on the current page
                    return;
                }
                
                $this.attr("data-nrm-active-row", idx.row);
                if (footerChanged)
                    $this.attr("data-nrm-active-footer", idx.footer ? "1" : "");
                
                // previousActiveRow is used to preserve the original active row when clicking through the pages
                if (!focus && idx.row == -1 && current.row != -1 && !$(':focus', $row).length) {
                    this.properties.previousActiveRow = current.row;
                } else {
                    delete this.properties.previousActiveRow;
                }
                
                var sel = current.row == -1 ? "thead > tr" : (current.footer ? ('tfoot>tr:eq(' + current.row + ')') : '');
                var $active = sel ? $(sel, $this).first() : $(dt.row(current.row, { order: "index" }).node());
                if (!$active.length && current.row === "0" && !current.footer)
                    $active = $("tr:has(.dataTables_empty)", $this);
                if ($active.length) {
                    $active.removeClass("row_selected");
                    var t = $active.children('[tabindex="0"]');
                    t.attr("tabindex", "").removeClass('nrm-activerow-focus'); // TODO: set to -1 or empty? Behavior is slightly different either way
                    $.each($active.children().not('[tabindex]'), function() {
                        var dontfocusMe = $('[tabindex="0"]:visible,.nrm-activerow-focus[tabindex="0"]', this);
                        dontfocusMe.attr("tabindex", "-1").removeClass('nrm-activerow-focus');
                    });
                }
                
                if (!idx.footer && idx.row != -1) {
                    var tr = dt.row($row, { order: 'index' }), pi = dt.page.info();
                    var displayRow = tr ? dt.rows({ order: 'current', search: 'applied' }).nodes().indexOf(tr.node()) : -1;
                    if (displayRow > -1 && pi.recordsDisplay > 0 && (pi.start > displayRow || pi.end - 1 < displayRow)) {
                        dt.page(Math.floor(displayRow / dt.page.len())).draw(false);
                    } else if (displayRow === -1 && !$(".dataTables_empty", $row).length) {
                        // active row is excluded from current filter
                        this.setActiveRow($("thead > tr", $this).first());
                        return;
                    }
                }
                
                $row.addClass("row_selected");
                var t1 = $row.children('[tabindex]');
                t1.attr("tabindex", "0").addClass('nrm-activerow-focus');
                $.each($row.children().not('[tabindex]'), function() {
                    var focusMe = $(focusable, this).not('select.select2-offscreen,.select2-container :not(input)');
                    if (!focusMe.length)
                        focusMe = $(this).not("th:empty");
                    focusMe.attr("tabindex", "0").addClass('nrm-activerow-focus');
                });
                var $vscroll = $this.closest(':hasScroll(y)');
                if (!$vscroll.length && $(window).height() < $(document).height()) {
                    $vscroll = $('body');
                }
                if ($vscroll.length) {
                    scrollRowIntoView($vscroll, $row);
                }
                //console.log("active row changed");
                $row.trigger("activerow.nrm.dataTable");
            }
            if (focus) {
                var $focus = $cell.is(focusable) ? $cell : $(focusable, $cell).not('[tabindex="-1"]');
                if (!$focus.length)
                    $focus = $(focusable, $cell.closest('tr'));
                if ($focus.length)
                    $focus[0].focus();
            }
        };
        
        function rowOnCurrentPage(dt, row) {
            if ((!row && row !== 0) || row == -1) return false;
            var api = dt.dataTable.api && dt.dataTable.api();
            var tr = api.row(row, { order: 'index' });
            var displayRow = tr ? api.rows({ page: 'current' }).nodes().indexOf(tr.node()) : -1;
            return displayRow > -1;
        }
        function scrollRowIntoView(panel, $row) {
            if (!panel || !panel.length || !$row || !$row.length)
                return;
            var op = $row.offsetParent(), offset = 0, next;
            while (op.length && op[0] !== panel[0]) {
                offset += op.position().top;
                next = op.offsetParent();
                if (next.length && next[0] === op[0])
                    break;
                op = next;
            }
            var p = $row.position(), top = offset + p.top, nh = $row.height(), h = panel.height(),
                    bottom = top + nh, scroll = { };
            if (panel[0].scrollWidth > panel.width()) h = h - Nrm.getScrollbarWidth();
            if (top < 0) {
                scroll.scrollTop = panel.scrollTop() + top;
            } else if (bottom > h) {
                scroll.scrollTop = panel.scrollTop() + (nh > h ? top : bottom - h);
            }
            if (scroll !== false) {
                panel.animate(scroll, 1);
            }
        };
        /**
         * Set active row to the first row on the next page.
         * @param {Boolean} focus Set focus to the new active row.
         * @returns {Boolean}
         * Return value indicates whether there is a next page.
         */
        this.nextPage = function(focus) {
            var dt = this.dataTable.api && this.dataTable.api(), ret = false;
            if (!dt) return ret;
            var pi = dt.page.info();
            if (pi && pi.page < pi.pages - 1) {
                dt.page("next").draw(false);
                this.setActiveRow($('tr', this).first(), focus);
                ret = true;
            }
            return ret;
        };
        /**
         * Set active row to the first or last row on the previous page.
         * @param {Boolean} [focus] Set focus to the new active row.
         * @param {Boolean} [top] Set active row to the first row in the previous page instead of the last. 
         * @returns {Boolean}
         */
        this.prevPage = function(focus, top) {
            var dt = this.dataTable.api && this.dataTable.api(), ret = false;
            if (!dt) return ret;
            var pi = dt.page.info();
            if (pi && pi.page > 0) {
                dt.page("previous").draw(false);
                var $tr = $('tr', this);
                this.setActiveRow(top ? $tr.first() : $tr.last(), focus);
                ret = true;
            }
            return ret;
        };
        /**
         * Set active row to the first row on the first page.
         * @param {Boolean} [focus] Set focus to the new active row.
         * @returns {Boolean}
         */
        this.firstPage = function(focus) {
            var dt = this.dataTable.api && this.dataTable.api();
            if (!dt) return false;
            var pi = dt.page.info();
            if (pi && pi.page > 0) {
                dt.page("first").draw(false);
            }
            this.setActiveRow($('tr', this).first(), focus);
            return true;
        };
        /**
         * Set active row to the last row on the last page.
         * @param {Boolean} [focus] Set focus to the new active row.
         * @returns {Boolean}
         */
        this.lastPage = function(focus) {
            var dt = this.dataTable.api && this.dataTable.api();
            if (!dt) return false;
            var pi = dt.page.info();
            if (pi && pi.page < pi.pages - 1) {
                dt.page("last").draw(false);
            } 
            this.setActiveRow($('tr', this).last(), focus);
            return true;
        };
        /**
         * Delegate events on the table element, the table actions element, and on the collection bound to the table.
         * This might be useful to restore events after removing and re-rendering the table, but use with caution
         * because it does not stop listening to the events if they are already delegated.
         * @returns {undefined}
         */
        this.delegateEvents = function() {
            var $p = $('.dataTables_paginate',$(this).parent()), $this = $(this), focusable = this.properties.focusable;
            $.fn.dataTableExt.oPagination.bootstrap.fnDelegateEvents(this.dataTable.fnSettings(), $p);
            $this.on('click.nrm.dataTable', '.checkAll', this, fnSelectAll);
            $this.on('click.nrm.dataTable', '.checkRow', this, fnSelect);
            if (focusable) {
                $this.on('draw.dt', null, this, function(e) {
                    var dt = e.data, $dt = $(dt), reset = false;
                    var row = $dt.attr("data-nrm-active-row") || -1;
                    if (!$dt.attr("data-nrm-active-footer")) {
                        if (row != -1) {
                            reset = !rowOnCurrentPage(dt, row);
                        } else if (rowOnCurrentPage(dt, dt.properties.previousActiveRow)) {
                            // special case: returning to a page containing the original active row
                            row = dt.properties.previousActiveRow;
                        } else {
                            reset = true;
                        }
                        if (reset) 
                            dt.setActiveRow($('tr', dt).first()); 
                        else 
                            dt.setActiveRow(row);
                    }
                });
                $this.on('invalidate.nrm.dataTable', 'td', this, function(e) {
                    var dt = e.data.dataTable.api(), settings = dt.settings()[0],
                            cell = dt.cell($(e.currentTarget)).index(), row, col;
                    /* JS 10/19/15 This is a hack, necessary to defeat the sort value caching when an editable field changes.
                     * We cannot always use the DataTables API to invalidate because it renders the cell which 
                     * disrupts the user experience if the cell is focused when the rendering occurs.
                     */
                    if (cell && cell.row > -1) {
                        row = settings.aoData[cell.row];
                        if (row) {
                            row._aSortData = null;
                            row._aFilterData = null;
                        }
                        if (cell.column > -1) {
                            col = settings.aoColumns[cell.column];
                            col && (col.sType = null);
                        } 
                    }
                });
                $this.on('click.nrm.dataTable focusin.nrm.dataTable contextmenu.nrm.dataTable', 'td,th', this, function(e) {
                    var dt = e.data;
                    dt.setActiveRow(e.currentTarget, false, $(e.target).is('th') && e.type === "click");
                });
                $this.on('keydown.nrm.dataTable', 'td,th', this, function(e) {
                    if (e.which === 38 || e.which === 40) { // 38 = up, 40 = down
                        var $cell = $(e.currentTarget), dt = e.data;
                        var $tr = $cell.closest('tr');
                        if (e.which === 40) $tr = $tr.next();
                        else if (e.which === 38) $tr = $tr.prev();
                        if ($tr.length === 0) {
                            var $table = $cell.closest('table');
                            var isHeader = !!$cell.closest('thead', $table).length;
                            var isFooter = !isHeader && !!$cell.closest('tfoot', $table).length;
                            if (isFooter && e.which === 38)
                                $tr = $("tbody > tr", $table).last();
                            else if (isHeader && e.which === 40)
                                $tr = $("tbody > tr", $table).first();
                            else if (!isHeader && !isFooter) {
                                if (e.which === 38)
                                    $tr = $("thead > tr", $table).last();
                                else
                                    $tr = $("tfoot > tr", $table).first();
                            }
                        } 
                        if ($tr.length) {
                            dt.setActiveRow($tr, true);
                            e.preventDefault();
                        } else if (e.which === 40) {
                            if (dt.nextPage(true)) e.preventDefault();
                        } else {
                            if (dt.prevPage(true, false)) e.preventDefault();
                        }
                    } else if (e.which === 36) { // home
                        if (e.data.firstPage(true)) e.preventDefault();
                    } else if (e.which === 35) { // end
                        if (e.data.lastPage(true)) e.preventDefault();
                    } else if (e.which === 33) { // pageup
                        if (e.data.prevPage(true, true)) e.preventDefault();
                    } else if (e.which === 34) { // pagedown
                        if (e.data.nextPage(true)) e.preventDefault();
                    } else if (e.which === 27 && e.data.properties.tableActions) { // esc
                        var actions = $(focusable, e.data.properties.tableActions);
                        var noSkipActions = actions.not('.nrm-skip-table');
                        if (noSkipActions.length)
                            actions = noSkipActions;
                        actions.first().focus();
                    }
                });
                if (this.properties.tableActions && this.properties.collectionEventsDelegated !== false) {
                    var actions = $(this.properties.tableActions);
                    actions.on('click.nrm.dataTable', '.nrm-skip-table', function() {
                        $('.nrm-skip-table-end', actions.next()).focus();
                    });
                    actions.next().on('click.nrm.dataTable', '.nrm-skip-table-end', function() {
                        $('.nrm-skip-table', actions).focus();
                    });
                }
            }
        };
        /**
         * Rebuild the table rows on reset of the bound data.
         * @param {external:module:backbone.Collection|Object|Object[]} data Data bound to the table. 
         * @see {@link https://datatables.net/reference/option/data} for details on the array option.
         * @returns {undefined}
         */
	this.resetData = function(data) {
            if (data && this.properties.collection === data) {
                //already bound to same collection and listening to events that will reload data when necessary
                return;
            } else if (_.isArray(data)) {
                // the odd scenario where the table is bound to an array instead of a collection
                this.properties.aaData = data;
                if (!this.properties.readOnly) {
                    addSelectedAttribute(this.properties);
                }
                // Reload table
                this.DataTable().rows().remove().add(data).draw(); // TODO: test case
                
            } else if (data instanceof Backbone.Collection) {
                // resetting to a different collection instance
                if(this.properties.collection) {
                    this.properties.collection.off(null, null, this);
                }
                this.properties.collection = data;
                this.properties.collectionEventsDelegated = false;
                this.loadData();
            }
        };
        /**
         * Destroy the DataTables plugin instance and remove event handlers.  This must be called when removing a view
         * that contains an NrmDataTable instance to avoid memory leaks.
         * @returns {undefined}
         */
        this.fnDestroy = function() {
            $(this).off('.nrm.dataTable .dt');
            if (this.properties.tableActions) {
                var actions = $(this.properties.tableActions);
                actions.off('click.nrm.dataTable');
                actions.next().off('click.nrm.dataTable');
            }
            if (this.properties.collection) {
                    this.properties.collection.off('add',addRowHandler);
                    this.properties.collection.off('remove',deleteRowHandler);
                    this.properties.collection.off('reset',this.loadData);
                    this.properties.collection.off('filter', filterHandler);
                    this.properties.collection.off('highlight', highlightHandler, this);
            }
            this.dataTable.fnDestroy();
        };
        /**
         * Change the selection state of a row, either checking or unchecking the checkbox and updating the selection 
         * count and enabled status of table actions.
         * @param {external:module:jquery} selectedRow The JQuery object representing the &gt;tr&lt; element to select.
         * @param {Object} options
         * @param {Boolean} [options.toggle=false] Toggle the current selected value.
         * @param {Boolean} [options.selected] The new selected value for the row.
         * @returns {undefined}
         */
        this.selectRowExternal = function(selectedRow,options) {
            if (options.toggle)
                selectRow({ data: this }, selectedRow);
            else
                selectRow({ data: this }, selectedRow, {
                    value: options.selected
                });
            var data = this.dataTable.fnGetData(selectedRow);
            fnEnableCallback({ data: this },{enableElement:this.properties.tableActions,data:data});
        };
        /**
         * Set a column visible or hidden.
         * @param {Number} col Zero-based column index, not counting the selection checkbox column (so the first column
         * after the selection checkbox is column 0).
         * @param {Boolean} show Indicates whether the column should be visible or hidden.
         * @param {Boolean} [redraw=true] Redraw the table.
         * @returns {undefined}
         */
        this.setColumnVisible = function(col, show, redraw) {
            if (!this.properties.readOnly) {
                col = col + 1;
            }
            if (!redraw && redraw !== false) redraw = true;
            this.dataTable.fnSetColumnVis(col, show, redraw);
        };
        function afterLoad(dt, init) {
            var data = _.isFunction(dt.dataTable) ? dt.dataTable().fnGetData() : dt.dataTable.fnGetData();
            var rc = data.length;
            var $chk = $('.checkAll', dt);
            var checked = rc > 0 && rc === dt.properties.selectionCnt;
            $chk.prop("checked", checked);
            $chk.attr(dt.properties.titleAttr, checked ? dt.properties.titles.deselectAll : dt.properties.titles.selectAll);
            if (dt.properties.tableActions) {
                // Pass 0 for rowCount parameter in updateSelectionCountHtml if none are selected instead of actual row count.
                // This will result in empty initial selection count label unless rows are pre-selected.
                // updateSelectionCountHtml(dt.properties, dt.properties.selectionCnt, dt.properties.selectionCnt > 0 ? rc : 0);
                // actually, let's psss the actual row count, so we can display it when there's no selection
                updateSelectionCountHtml(dt.properties, dt.properties.selectionCnt, rc);
                if (dt.properties.fnEnableCallback) {
                    data = _.filter(data, function(row) {
                        return row.selected;
                    });
                    try {
                        dt.properties.fnEnableCallback(dt.properties.tableActions,{cnt:dt.properties.selectionCnt, data: data});                    
                    } catch (error) {
                        console.log("fnEnableCallback error:" + error);
                    }
                }
            }
        };

        function fnEnableCallback(event,options) {
            var dt = event.data;
            var props = $.extend({}, options);
            if (!props.enableElement) {
                return;
            }

            var rows = dt.dataTable.fnGetData();
            var selectionCnt = dt.properties.selectionCnt;
            updateSelectionCountHtml(dt.properties, selectionCnt, rows.length);
            if (dt.properties.fnEnableCallback)
                dt.properties.fnEnableCallback(props.enableElement,{cnt:selectionCnt,data:props.data});

        };

        function fnSelectAll(event) {
            var dt = event.data;
            // note: showing the progress indicator here doesn't work because it is not asynchronous.
            //$(".ajax-progress").show();
            var selectAll = $(this)[0].checked;
            var filteredRows = dt.dataTable.$('tr', { "filter": "applied" });
            var data = [];
            $.each(filteredRows, function (index, tr) {
                data.push(dt.dataTable.fnGetData(tr));
                selectRow(event,tr,{value:selectAll});
                if (index === filteredRows.length-1) {
                    fnEnableCallback(event,{enableElement:dt.properties.tableActions,data:data});
                }
            });
            //$(".ajax-progress").hide();
		};

        function fnSelect(event) {
            var dt = event.data;
            var selectedRow = $(this).parents('tr')[0];
            if (selectedRow === undefined)
                return;

            if (dt.properties.multiSelect === false) {
                // note: showing the progress indicator here doesn't work because it is not asynchronous.
                //$(".ajax-progress").show();
                // remove previous checks
                var selIdx = dt.dataTable.fnGetPosition(selectedRow)
                $.each(dt.dataTable.fnGetData(), function(idx, row) {
                      if (idx !== selIdx && row.selected) {
                          selectRow(event,idx,{value:false});
                      }
                   });
                //$(".ajax-progress").hide();
            }
            selectRow(event,selectedRow);
            var data = dt.dataTable.fnGetData(selectedRow);
            fnEnableCallback(event,{enableElement:dt.properties.tableActions,data:data});
        };

        function selectRow(event, selectedRow, options) {
            var dt = event.data;
            var selectionCnt = dt.properties.selectionCnt;
            var props = $.extend({}, options);
            var rows = dt.dataTable.fnGetData();
            
            // set value of 'selected' property
            var newVal = props.value;
            var selIdx = 0;  // index of 'selected' property in dataTable
            // if value is not passed in, retrieve from data
            var origVal = dt.dataTable.fnGetData(selectedRow, selIdx);
            if (newVal === undefined) {
                // toggle the value
                newVal = !origVal;
            }
            if (origVal === newVal)
                return; // no change
            
            var focused = event.currentTarget &&  $(event.currentTarget).is(".checkRow:focus");
            dt.dataTable.fnUpdate(newVal, selectedRow, selIdx, false);
            var api = dt.dataTable.api && dt.dataTable.api(), $dt = $(dt), active = $dt.attr("data-nrm-active-row") || -1;
            if (api && active != -1 && !$dt.attr("data-nrm-active-footer")) {
                // allow keyboard navigation
                // comparisons to active variable are double-equals instead of triple-equals on purpose.
                var idx = api.row(selectedRow).index();
                if (idx == active) {
                    var $chk = $('.checkRow', selectedRow);
                    $chk.attr("tabindex", "0");
                    if (focused)
                        $chk[0].focus();
                }
            }
            // calculate number of selected rows
            if (newVal) {
                    if (selectionCnt < rows.length) {
                            selectionCnt++;
                    }
            } else if (selectionCnt > 0) {
                    selectionCnt--;
            }
            dt.properties.selectionCnt = selectionCnt;
            if (selectionCnt === 0) {
                var $chk = $('.checkAll', dt);
                if ($chk.prop("checked"))
                    $chk.prop("checked", false);
                $chk.attr(dt.properties.titleAttr, dt.properties.titles.selectAll);
            } else if (selectionCnt === rows.length) {
                var $chk = $('.checkAll', dt);
                if (!$chk.prop("checked"))
                    $chk.prop("checked", true);
                $chk.attr(dt.properties.titleAttr, dt.properties.titles.deselectAll);
            }
        };
        function updateSelectionCountHtml(properties, selectionCnt, rowCount) {
            var x = $(properties.tableActions);
            var xx = $('.selection-count',x);
            var txt = properties.multiSelect ? 
                     selectionCnt + " of " + rowCount + " selected" :
                     (rowCount || "0") + " record" + (rowCount === 1 ? "" : "s");
            if (xx.length === 0) {
                x.append("<span class='selection-count'>" + txt + "</span>");
            } else {
                xx.html(txt);
            }
        };
        /**
         * Reload the data from the collection.
         * @returns {undefined}
         */
        this.loadData = function(event) {
            $(this).attr("data-nrm-active-row", "-1");
            this.dataTable.fnReloadAjax();
            //afterLoad(this, false); // moved to fnServerData
        };

        function addSelectedAttribute(properties) {
            var selectionCnt = 0;
                if (properties.aaData) {
                    $.each(properties.aaData, function(i,item) {
                        if (item.selected === undefined) {
                            item.selected = properties.defaultSelectedValue;
                        }
                        if (item.selected===true) {
                            selectionCnt++;;
                        }
                    });
                }
                properties.selectionCnt = selectionCnt;
        };
		
	// add checkbox column
	function addSelectBox(properties){
            properties.aoColumns.unshift({
		mData: properties.fnSelected || "selected",
                    mRender: function (data, type, full) {
                        if (type === "type") return data;
                        if (type === "filter") return "";
                        var name = properties.nameAttr && full ? full[properties.nameAttr] : null;
                        function formatTitle(base) {
                            return properties.titleAttr + '="' + (name ? (base + ': ' + name) : base) + '"';
                        }
			if (data === false) {
                            return '<input type="checkbox" class="checkRow" tabindex="-1" value="false" ' 
                                    +  formatTitle(properties.titles.selectRow) + '></input>';
			} else {
                            return '<input type="checkbox" class="checkRow" tabindex="-1" value="true" checked ' 
                                    +  formatTitle(properties.titles.deselectRow) + '></input>';
			}
                    },
		bSortable: false,
                sClass: "nrm-cell-rowselect",
		sWidth: "22px" //"40px" // DataTables 1.10 uses content-box so width doesn't include padding
            });
	};


        this.init(options);

        return this;
    };
    return $.fn.nrmDataTable = NrmDataTable;

});
