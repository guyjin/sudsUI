/**
 * @file  NRM Shuttle Control. 
 * @see module:nrm-ui/plugins/nrm-shuttle
 */
/** 
 * The NRM Shuttle Control allows user to choose multiple items by moving them from one select element to another.
 * This module does not provide any public methods, but enables event listeners delegated on the document when the 
 * module is loaded as a dependency.
 * @module nrm-ui/plugins/nrm-shuttle
 * @example <caption>Usage:</caption>
 *  <link href="nrmcore/nrm-shuttle/nrm-shuttle.css" rel="stylesheet"/>
    <script src="nrmcore/nrm-shuttle/nrm-shuttle.js"></script>

 *  <select multiple="multiple" id="available">
 *   <option>One</option>
 *   <option>Two</option>
 *   <option>Three</option>
 *  </select>
 *  <button data-toggle="nrm-shuttle" data-source="#available" data-target="#selected">Add</button>
 *  <select multiple="multiple" id="selected"></select>
 *  <button data-toggle="nrm-shuttle" data-source="#selected" data-target="#available">Remove</button>
 */
;
(function() {
    function init($) {
    
        function sortByValue(target) {
            $(target).html($("option", $(target)).sort(function(a, b) {
                var aval = $(a).val();
                var bval = $(b).val();
                return aval === bval ? 0 : aval < bval ? -1 : 1;
            }));
        };

        $(document).on('click.nrm.shuttle', '[data-toggle=nrm-shuttle]', function(e) {
            var $this = $(this);
            var source = $this.attr('data-source');
            var target = $this.attr('data-target');
            $(source).children('option:selected').remove().appendTo(target);
            sortByValue(target);
            return false;
        });
        $(document).on('click.nrm.shuttle', '[data-toggle=nrm-shuttle-all]', function(e) {
            var $this = $(this);
            var source = $this.attr('data-source');
            var target = $this.attr('data-target');
            $(source).children('option').remove().appendTo(target);
            sortByValue(target);
            return false;
        });
        return $;
    }
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], init);
    } else {
        init(jQuery);
    }
}( ));

