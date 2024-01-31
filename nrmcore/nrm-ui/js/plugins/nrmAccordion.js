/**
 * @file  Plugin that renders a 
 * {@link http://getbootstrap.com/javascript/#collapse-example-accordion|Twitter Bootstrap Accordion} panel. 
 * @see module:nrm-ui/plugins/nrmAccordion
 */
/** 
 * @module nrm-ui/plugins/nrmAccordion
 * 
 */

define(['jquery', 'hbs!NRMaccordion'], function($, NRMaccordionTemplate) {

    /**
     * Applies the NrmAccordion plugin to a JQuery object      
     * This is actually the plugin function (jQuery.fn.nrmAccordion) and module return value, not a constructor.  
     * @constructor
     * @alias module:nrm-ui/plugins/nrmAccordion
     * @classdesc
     * The nrmAccordion JQuery plugin renders a 
     * {@link http://getbootstrap.com/javascript/#collapse-example-accordion|Twitter Bootstrap Accordion} panel. 
     * @param {Object} options
     * @param {Boolean} [options.collapsible=true] Panel is collapsible.
     * @param {string} options.collapseId Element id for the panel.
     * @param {string} options.body Selector of the element that will be wrapped in the accordion panel.
     * @param {string} options.title Panel header text.
     * @returns {external:module:jquery}
     * Original JQuery object extended with nrmAccordion instance members.
     */
    var NrmAccordion = function(options) {
        var defaults = {
            collapsible: true,
            collapseId: 'collapseOne',
			body: '',
            title: ''
        }, expandIcon = "glyphicon-chevron-down", collapseIcon = "glyphicon-chevron-right";
        /**
         * Initialize the plugin, for internal use only.
         * @private
         * @param {Object} options
         * @returns {undefined}
         */
        this.init = function(options) {
			this.properties = $.extend({},defaults, options);
			var template = NRMaccordionTemplate;
			var myAccordion = template({
				collapsible: this.properties.collapsible,
				collapseId: this.properties.collapseId,
				title: this.properties.title
			});
			$(this.properties.body).replaceWith(myAccordion);
			$('.panel-body', this).last().append(this.properties.body);
                        var expanded = $("#" + this.properties.collapseId, this).is('.in');
                        if (expanded) 
                            $(".glyphicon", this).removeClass("glyphicon-chevron-up").addClass(expandIcon);
                        else 
                            $(".glyphicon", this).removeClass("glyphicon-chevron-down").addClass(collapseIcon);
			this.delegateEvents();
		}
                /**
                 * Delegate events on the accordion panel, can be used to restore functionality if the view is removed 
                 * and re-rendered.
                 * @returns {undefined}
                 */
		this.delegateEvents = function() {
			var x = "#" + this.properties.collapseId;
			$(this).on('show.bs.collapse hide.bs.collapse', x, function(event){
                                var hide = event.type === "hide", add = (hide ? collapseIcon : expandIcon), 
                                    remove = (hide ? expandIcon : collapseIcon);
				var z = $(event.target).siblings();
				$(".glyphicon",z).removeClass(remove).addClass(add);
			});
		};
        /**
         * Destroy the plugin instance by remove event listeners.
         * @returns {undefined}
         */
        this.fnDestroy = function() {
            $(this).off('show.bs.collapse hide.bs.collapse');
        };

		this.init(options);

		return this;
    };
    return $.fn.nrmAccordion = NrmAccordion;

});