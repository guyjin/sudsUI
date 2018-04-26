/*
 MIT License - http://www.opensource.org/licenses/mit-license.php
 For usage and examples, check out the README at:
 http://github.com/jquery-longpress/
 Copyright (c) 2008-2013, Vaidik Kapoor (kapoor [*dot*] vaidik -[at]- gmail [*dot*] com)
*/
(function(b){b.fn.longpress=function(e,c,d){"undefined"===typeof d&&(d=500);return this.each(function(){function f(a){g=(new Date).getTime();var c=b(this);h=setTimeout(function(){"function"===typeof e?e.call(c,a):b.error("Callback required for long press. You provided: "+typeof e)},d)}function k(a){(new Date).getTime()-g<d&&(clearTimeout(h),"function"===typeof c?c.call(b(this),a):"undefined"!==typeof c&&b.error("Optional callback for short press should be a function."))}var a=b(this),g,h;a.on("mousedown",
f);a.on("mouseup",k);a.on("touchstart",f);a.on("touchend",k)})}})(jQuery);