(function ( $ ) {
    var caseSections = $( ".caseSections" );
    var renderView   = $( ".nrm-edit-form" );
    
    $( ".caseNavToggle" ).on( "click", function () {
        $( ".screenNav" ).toggleClass( "opened" );
        caseSections.toggleClass( "open" );
    } );
    
    $( ".navAnchorLink" ).on( "click", function ( e ) {
        e.preventDefault();
        
        if ( $( this ).attr( "data-target" ) === "#home" ) {
            renderView.animate(
                {
                    scrollTop: 0
                },
                500
            );
        }
        else {
            renderView.animate(
                {
                    scrollTop:
                    $( $.attr( this, "data-target" ) ).offset().top -
                    $( $.attr( this, "data-target" ) )
                    .offsetParent()
                    .offset().top +
                    300
                },
                500
            );
        }
        
        if ( caseSections.hasClass( "open" ) ) {
            caseSections.removeClass( "open" );
            $( ".screenNav" ).toggleClass( "opened" );
        }
    } );
    
    $( ".sectionFilter" ).on( "click", function () {
        setActiveTab( $( this ) );
        var status = $( this ).attr( "data-filter" );
        filterSections( status );
    } );
    
    $( ".sectionActionLink, .noContent" ).on( "click", "a", function ( e ) {
        e.preventDefault();
        var target = $( this ).attr( "href" );
        leavePage();
        setTimeout( function () {
            visitPage( target );
        }, pageTransitionTime );
    } );
    
    $( "div[data-view-target]" ).on( "click", function () {
        var target = $( this ).attr( "data-view-target" );
        $( ".caseContent" ).attr( "data-view", target );
        setActiveTab( $( this ) );
    } );
    
    $( ".toggleLicenseDetails" ).on( 'click', function ( e ) {
        toggleDetailsTable( e.target );
//         $(this).toggleClass('open');
//         $(this).parent().parent().next().toggleClass('open');
    } );
    
    $( '.licenseTableCloser' ).on( 'click', function ( e ) {
        e.preventDefault();
        closeDetailsTable( e.target );
    } );
    
    $( '.releaseBondButton' ).on( 'click', function () {
        confirm( 'Are you sure you want to release this bond?' );
    } );
    
    setTimeout( function () {
        $( ".suds-container" ).animate(
            {
                opacity: 1,
                left   : 0
            },
            pageTransitionTime,
            "easeOutCirc"
        );
    }, 300 );
    
    renderView.scroll( function () {
        if ( $( this ).scrollTop() > sectionNavOffsetFromRenderViewTop + 10 ) {
            var t = $( this ).offset().top + 10;
            $( ".screenNav" )
            .addClass( "fixed" )
            .css( {
                      top: t + "px"
                  } );
        }
        else {
            $( ".screenNav" )
            .removeClass( "fixed" )
            .css( {
                      top: "auto"
                  } );
        }
    } );
    
})( jQuery );
var pageTransitionTime = 500;
var filterSections     = function ( status ) {
    switch ( status ) {
        case "done":
            filterDone();
            break;
        case "todo":
            filterToDo();
            break;
        default:
            filterAll();
    }
};

var filterDone                        = function () {
    $( ".caseSection" ).hide();
    $( '.caseSection[data-status="done"]' ).show();
    $( ".navAnchorLink.status" ).hide();
    $( ".navAnchorLink.status.Done" ).show();
};
var filterAll                         = function () {
    $( ".caseSection" ).show();
    $( ".navAnchorLink.status" ).show();
};
var filterToDo                        = function () {
    $( ".caseSection" ).hide();
    $( '.caseSection[data-status != "done"]' ).show();
    $( ".navAnchorLink.status" ).show();
    $( ".navAnchorLink.status.Done" ).hide();
};
var sectionNavOffsetFromRenderViewTop = $( ".summaryHeader" ).height();

var screenNavOffsetFromRenderViewTop = $( ".screenNav" ).offset().top;

var leavePage = function () {
    $( ".suds-container" ).animate(
        {
            opacity: 0,
            left   : -600
        },
        pageTransitionTime
    );
};

var toggleDetailsTable = function ( target ) {
    var that = $( target );
    $( target ).toggleClass( 'open' );
    that.parent().parent().parent().next().toggleClass( 'open' );
};

var closeDetailsTable = function ( target ) {
    var that = $( target );
    that.parent().parent().removeClass( 'open' );
    that.parent().parent().prev( '.basicInfo' ).children( '.infoActions' ).children( '.toggleLicenseDetails' ).removeClass( 'open' );
};

var setActiveTab = function ( targetTab ) {
    $( ".tabHeading" ).removeClass( "active" );
    $( targetTab ).addClass( "active" );
};

var checkViewState = function () {
    return $( ".caseContent" ).attr( "data-view" );
};

var visitPage = function ( target ) {
    window.location.href = target;
};

