var VTMM = VTMM || {};
VTMM.map = {};
VTMM.legend = {};
VTMM.loader = {};

VTMM.scales = {};

VTMM.init = function() {
    // Load the JSON data
    queue()
        .defer(d3.json, "static/data/vt.json")
        .await(VTMM.map.loadAllData);

    // Initialize the legend
    VTMM.legend.init();

    // Save map as image
    $('#save').click(VTMM.map.save);

    // Parse the colorbrewer scales
    $.each(colorbrewer, function (k, v) {
        if ( typeof v['9'] !== 'undefined' ) {
            VTMM.scales[k] = v['9'];
        }
    });

    // Add a menu item for each scale
    $.each(VTMM.scales, function (k, v) {
        var item = $('<li><a /></li>');

        item
            .clone()
            .data('scale', v)
            .find('a')
            .text(k)
            .click(function () {
                VTMM.options.colorRange = v;
                VTMM.map.render();
            })
            .end()
            .appendTo('ul#color-menu');
    });

    $('button.scale_type').click(function() {
        var type = $(this).text().toLowerCase();
        VTMM.options.scale = type;
        VTMM.map.render();
    });

    // Update dropdown labels with selected value
    $('body').on('click', '.dropdown-menu li', function () {
        $(this)
            .closest('.btn-group')
            .find('button')
            .text($(this).text())
            .append('&nbsp;<span class="caret"></span>');
    });

    VTMM.map.init_save();
};

VTMM.map.dimensions = {
    'width': $("#map").width(),
    'height': $("#map").height()
};

VTMM.options = {
    'colorRange': colorbrewer.YlGn[9],
    'scale': 'quantile',
    'data': "https://docs.google.com/spreadsheets/d/1XRN5vzjpV-l9IVTiyejpvfSWDwae_WcHBH4CuHhPuxo/pubhtml"
};

VTMM.map.svg = d3.select("#map").append("svg")
    .attr("width", VTMM.map.dimensions.width)
    .attr("height", VTMM.map.dimensions.height);

VTMM.map.projection = d3.geo.transverseMercator()
    .rotate([72.57, -44.20])
    .translate([VTMM.map.dimensions.width / 2.5, VTMM.map.dimensions.height / 2.75])
    .scale([VTMM.map.dimensions.height * 23]);

VTMM.map.path = d3.geo.path()
    .projection(VTMM.map.projection);

VTMM.map.getDomain = function(field) {
    var objects = VTMM.map.data.objects.vt_towns.geometries;

    return $.map(objects, function( object ) { return parseFloat(object.properties[field]); });
};

VTMM.map.scale = function(domain, scaleType) {
    scaleType = typeof scaleType !== 'undefined' ? scaleType : 'quantile';
    var domainForScale = {
        'quantize': [0, d3.max(domain)],
        'quantile': domain.sort()
    };

    return d3.scale[scaleType]()
        .domain(domainForScale[scaleType])
        .range(VTMM.options.colorRange);
};

VTMM.legend.domain = function() {
    var scaleType = VTMM.options.scale;

    if (scaleType === 'quantile' || typeof scaleType === 'undefined') {
        var quantileDomain = VTMM.map.scale(VTMM.map.domain).quantiles();
        quantileDomain.unshift(0);
        return quantileDomain;
    } else {
        var mapScale = VTMM.map.scale(VTMM.map.domain, scaleType);
        return d3.scale.linear().domain(mapScale.domain()).ticks(9);
    }
};

VTMM.legend.init = function() {
    var legend = VTMM.map.svg.selectAll("g.legend")
        .data(VTMM.options.colorRange)
        .enter().append('g')
        .attr("class", "legend");

    var ls_w = 20,
        ls_h = 15;

    legend.append("rect")
        .attr("x", VTMM.map.dimensions.width * 0.5)
        .attr("y", function(d,i) {
            return VTMM.map.dimensions.height * 0.97 - (i*ls_h) - 2*ls_h;})
        .attr("width", ls_w)
        .attr("height", ls_h)
        .style("fill", function(d,i) {
            return d;
        })
        .style("opacity", 0,8);

    legend.append("text")
        .attr("x", VTMM.map.dimensions.width * 0.5 + 30)
        .attr("y", function(d,i) {
            return VTMM.map.dimensions.height * 0.97 - (i*ls_h) - ls_h -5;});
};

VTMM.legend.update = function() {

    var rects = VTMM.map.svg.selectAll("g.legend rect"),
        text = VTMM.map.svg.selectAll("g.legend text");

    rects
        .data(VTMM.options.colorRange)
        .transition()
        .duration(500)
        .style("fill", function(d) { return d; });

    text
        .data(VTMM.legend.domain())
        .text(function(d) {
            return d > 10 ? Math.round(d).toString() : (Math.round(d * 10) / 10).toFixed(1);
        });
};

VTMM.map.loadData = function (key) {
    Tabletop.init({
        key: key,
        callback: function(data) {
            // Create fields lookup object from keys in first row of data
            var fields = Object.keys(data[0]);
            VTMM.fields = {};
            $.each(fields, function(k, v) {
                VTMM.fields[v] = {};
            });

            VTMM.data = data;
            VTMM.map.selectField(data, fields[1]);

            VTMM.loader.create_field_menu(data);
            VTMM.loader.hide();
        },
        simpleSheet: true
    });
};

VTMM.map.loadAllData = function(error, vt) {
    VTMM.map.data = vt;

    VTMM.map.loadData(VTMM.options.data);

    VTMM.map.loadMapData(vt);
};

VTMM.map.selectField = function(data, field) {
    field = typeof field !== 'undefined' ? field : VTMM.fields[0];

    VTMM.data = data;
    VTMM.map.field = field;

    for (var i = 0; i < data.length; i++) {
            var dataTown = data[i].town.toUpperCase();
        for (var j = 0; j < VTMM.map.data.objects.vt_towns.geometries.length; j++) {
            var jsonTown = VTMM.map.data.objects.vt_towns.geometries[j].properties.town;
            if (dataTown == jsonTown) {
                VTMM.map.data.objects.vt_towns.geometries[j].properties[VTMM.map.field] = data[i][VTMM.map.field];
            }
        }
    }

    VTMM.map.domain = VTMM.map.getDomain(VTMM.map.field).filter(Number);
    VTMM.map.render();
};

VTMM.map.loadMapData = function(vt) {
    VTMM.map.svg.selectAll(".town")
        .data(topojson.feature(vt, vt.objects.vt_towns).features)
        .enter().append("path")
            .attr("d", VTMM.map.path)
            .attr("class", "town")
            .style("stroke", "#a6a8ab")
            .style("stroke-width", "1px")
            .style("fill", '#ddd');

    // Lake Champlain
    VTMM.map.svg.append("path")
        .datum(topojson.feature(vt, vt.objects.lake))
        .attr("d", VTMM.map.path)
        .style("stroke", "#89b6ef")
        .style("stroke-width", "1px")
        .style("fill", "#b6d2f5");

    VTMM.map.svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(" + (VTMM.map.dimensions.width - 80) + ",35)");

};

VTMM.map.render = function() {
    var vt = VTMM.map.data;

    VTMM.map.svg.selectAll(".town")
        .data(topojson.feature(vt, vt.objects.vt_towns).features)

        .transition()
        .duration(500)
        .style("fill", VTMM.map.fillFunc);

    VTMM.map.svg.append("path")
        .datum(topojson.feature(vt, vt.objects.lake))
        .attr("d", VTMM.map.path)
        .style("stroke", "#89b6ef")
        .style("stroke-width", "1px")
        .style("fill", "#b6d2f5");

    VTMM.legend.update();
};

VTMM.map.fillFunc = function(d) {
    value = d.properties[VTMM.map.field];

    if (value) {
        return VTMM.map.scale(VTMM.map.domain, VTMM.options.scale)(value);
    }

    return "#ddd";
};

VTMM.loader.init = function () {
    var loader = $('#loader'),
        form = loader.find('form'),
        button = form.find('button');

    form.submit(function (e) {
        e.preventDefault();

        var url = form.find('#url').val();

        button.prop('disabled', true);

        VTMM.map.loadData(url);
    });
};

VTMM.loader.hide = function () {
    var loader = $('#loader'),
        form = loader.find('form'),
        button = form.find('button');

    button.prop('disabled', false);
    loader.modal('hide');
};

VTMM.loader.create_field_menu = function (data) {
    var keys = Object.keys(data[0]),
        container = $('#loader form').parent(),
        list = $('#field-menu'),
        item = $('<li><a /></li>'),
        activeToggle = function() {
            var $this = $(this),
                field = $(this).data('key');

            list.find('.active').removeClass('active');
            $this.addClass('active');

            VTMM.map.selectField(data, field);
        };

    list.empty();

    for (var i = 1; i < keys.length; i++ ) {
        item
            .clone()
            .appendTo(list)
            .data('key', keys[i])
            .click(activeToggle)
            .find('a')
            .text(keys[i]);
    }
};

VTMM.loader.create_field_table = function (data) {
    var keys = Object.keys(data[0]),
        container = $('#loader form').parent(),
        table = $('<table id="field-table" class="table"></table>'),
        row = $('<tr></tr>'),
        cell = $('<td></td>');

    $('.modal-body').append(table);
    table.prepend($('<tr><td><strong>Select a Field to Map</strong></td></tr>'));

    // Add an empty row
    table.append(row.clone());

    var toggleActive = function() {
        table.find('.active').removeClass('active');
        row.addClass('active');
        VTMM.map.selectField(data, $(this).data('key'));
    };
    // Loop through field keys
    for (var i = 0; i < 5; i++ ) {
        table.find('tr').last()
            .append(
                cell.clone().text(keys[i])
                .data('key', keys[i])
                .click(toggleActive())
            );
    }
};

VTMM.map.init_save = function () {
    $('.info').append('<canvas />');
};

VTMM.map.save = function() {
    var canvas = document.querySelector("canvas"),
        context = canvas.getContext("2d"),
        image = new Image(),
        html,
        svg = $('svg');

    html = d3.select("svg")
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

    $(image).width(svg.width()).height(svg.height());
    $(canvas).width(svg.width()).height(svg.height());

    image.src = 'data:image/svg+xml;base64,'+ btoa(html);
    image.onload = function() {
        context.drawImage(image, 0, 0);

        var canvasdata = canvas.toDataURL("image/png"),
            pngimg = '<img src="' + canvasdata + '">',
            a = document.createElement("a");

        a.download = "sample.png";
        a.href = canvasdata;
        a.click();
    };
};

$(document).ready(function() {
    VTMM.init();
    VTMM.loader.init();
});
