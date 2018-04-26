$(function() {
    var orgTrigger = $('.localeSelectorTrigger'),
        sw = $('.localeSelectionWindow'),
        sb = $('.searchButton');

    sb.on('click', function() {
        $(this).toggleClass('searchOpen');
        $('.searchForm').toggleClass('searchOpen');
    });

    $('.closer').on('click', function() {
        sb.toggleClass('searchOpen');
        $('.searchForm').toggleClass('searchOpen');
    });

    orgTrigger.on('click', function() {
        sw.toggleClass('opened');
        $(this).toggleClass('active');
    });
    $('.list').on('click', 'a', function(e) {
        e.preventDefault()
        $(this).toggleClass('selected');
    });

    $('.regionList').on('click', 'a', function() {
        var that = $(this),
            thatRegion = that.data("region");
        if (that.hasClass('selected')) {
            entities.selectEntity(thatRegion);
            lists.showList(thatRegion);
        } else {
            entities.removeEntity(thatRegion);
            lists.hideList(thatRegion);
        }
    });

    $('.list.forestList, .list.districtList').on('click', 'a', function() {
        var that = $(this),
            thatEntity = that.data("entity"),
            parentEntity = that.closest('ul').data("parent"),
            newEntity = parentEntity + thatEntity;

        if (that.hasClass('selected')) {
            entities.selectEntity(newEntity, parentEntity);
            lists.showList(newEntity);
        } else {
            entities.removeEntity(newEntity, parentEntity);
            lists.hideList(newEntity);
        }
    });

    $('.clearForestList').on('click', function() {
        var selectedForests = $(this).siblings('.selected').children('li').children('.selected');
        console.log(selectedForests);
        $.each(selectedForests, function(index) {
            selectedForests[index] = $(this);
            var entityCode = selectedForests[index].children('.listItemIdentifier').text(),
                parentEntity = selectedForests[index].parent().parent().data('parent');
            selectedForests[index].removeClass('selected');
            entities.removeEntity(entityCode, parentEntity);
        })
    });

    $('.clearDistrictList').on('click', function() {
        var selectedDistricts = $(this).siblings('.selected').children('li').children('.selected');
        console.log(selectedDistricts);
        $.each(selectedDistricts, function(index) {
            selectedDistricts[index] = $(this);
            var entityCode = selectedDistricts[index].children('.listItemIdentifier').text(),
                parentEntity = selectedDistricts[index].parent().parent().data('parent');
            selectedDistricts[index].removeClass('selected');
            entities.removeEntity(entityCode, parentEntity);
        });
    });

    $('.dataDisplay').on('click', 'a', function() {
        $(this).toggleClass('highlighted');
        if ($('.highlighted').length) {
            $('.dataDisplay').addClass('hasHighlighted');
            $('.dashboardDataBlocks .notForHighlights').fadeOut();
        } else {
            $('.dataDisplay').removeClass('hasHighlighted');
            $('.dashboardDataBlocks .notForHighlights').fadeIn();
        }
    });



    setTimeout(function() {
        $('.dataDisplay .noDataMessage').animate({
            marginLeft: 5 + 'px'
        }, 1000, 'easeOutBounce');
    }, 700);
});


var selectedEntities = [],
    highLightedEntities = [],
    entities = {
        selectEntity: function(entityCode, parentEntity) {
            if (this.checkForEntity(entityCode) === -1) {
                selectedEntities.push(entityCode);
                if (this.checkForEntity(parentEntity) >= 0) {
                    selectedEntities.splice(this.checkForEntity(parentEntity), 1);
                }
            }
            this.renderEntities();
        },
        removeEntity: function(entityCode, parentEntity) {
            if (parentEntity !== '' && this.checkForEntity(parentEntity) === -1) {
                selectedEntities.push(parentEntity);
            }
            if (this.checkForEntity(entityCode) >= 0) {
                if (selectedEntities.length === 1) {
                    selectedEntities = [];
                } else {
                    selectedEntities.splice(this.checkForEntity(entityCode), 1);
                }
                if (this.checkForEntity(parentEntity) === -1) {
                    selectedEntities.push(parentEntity);
                }
            }

            this.renderEntities();

        },
        checkForEntity: function(entityCode) {
            return $.inArray(entityCode, selectedEntities);
        },
        renderEntities: function() {
            var se = selectedEntities.filter(Boolean);
            if (se.length > 0) {
                $('.dataDisplay .noDataMessage').hide();
                $('.dataDisplay .entityBlock').remove();
                $('.dashboardDataBlocks .noDataMessage').hide();
                $('.dashboardDataBlocks').addClass('localeSelected');
                for (var i = 0; i <= se.length - 1; i++) {
                    var a = document.createElement("a");
                    a.setAttribute('class', 'entityBlock');
                    a.setAttribute('data-localeCode', selectedEntities[i]);
                    a.innerHTML = selectedEntities[i];
                    $('.dataDisplay').append(a);
                }
            } else {
                $('.dataDisplay .entityBlock').remove();
                $('.dashboardDataBlocks .noDataMessage').show();
                $('.dashboardDataBlocks').removeClass('localeSelected');
            }

        },
        clearDistrictList: function() {
            $('.districtList .selected').each(function(district) {
                console.log(district.data("entity"));
            });
        }
    },
    lists = {
        showList: function(parent) {
            var list = $("ul[data-parent='" + parent + "']");
            list.addClass('selected');
            list.siblings('.noSelectionMessage').hide();

        },
        hideList: function(parent) {
            var list = $("ul[data-parent='" + parent + "']");
            list.removeClass('selected');
            if (list.parent().children('.selected').length === 0) {
                list.siblings('.noSelectionMessage').show();
            }
        }
    }