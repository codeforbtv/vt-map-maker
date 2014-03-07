var VTMM = VTMM || {};
VTMM.map = {};
VTMM.loader = {};

VTMM.init = function() {
    queue()
        .defer(d3.json, "static/data/vt.json")
        .defer(d3.csv, "https://docs.google.com/spreadsheet/pub?key=0AtWnpcGxoF0xdGtiMWVrM3RUWl9SdkU2d1VyRWJtaGc&output=csv")
        .await(VTMM.map.loadAllData);
};

VTMM.map.options = {
    'width': $("#map").width(),
    'height': $("#map").height(),
    'colorRange': colorbrewer.YlGn[9]
};

VTMM.map.svg = d3.select("#map").append("svg")
    .attr("width", VTMM.map.options.width)
    .attr("height", VTMM.map.options.height);

VTMM.map.projection = d3.geo.transverseMercator()
    .rotate([72.57, -44.20])
    .translate([VTMM.map.options.width / 2.5, VTMM.map.options.height / 2.75])
    .scale([VTMM.map.options.height * 23]);

VTMM.map.path = d3.geo.path()
    .projection(VTMM.map.projection);

VTMM.map.getDomain = function(field) {
    var objects = VTMM.map.data.objects.vt_towns.geometries;

    return $.map(objects, function( object ) { return parseFloat(object.properties[field]) });
};

VTMM.map.getScale = function() {
    return d3.scale.quantile()
        .domain(VTMM.map.domain.sort())
        .range(VTMM.map.options.colorRange);
};

VTMM.legend = {};

VTMM.legend.y = function() {
    return d3.scale.linear()
        .domain([VTMM.map.minValue, VTMM.map.maxValue])
        .range([0, VTMM.map.options.height - 80]);
};

VTMM.legend.yAxis = function() {
    var ticks = VTMM.legend.colorScale().domain;
    ticks.push(VTMM.map.maxValue);
    ticks.unshift(VTMM.map.minValue);
    return d3.svg.axis()
        .scale(VTMM.legend.y())
        .tickValues(ticks)
        .orient("right");
};

VTMM.legend.options = {
    'width': 6
};

VTMM.legend.colorScale = function() {
    var quantiles = VTMM.map.getScale().quantiles();
    return {
        'domain': quantiles,
        'range': VTMM.map.options.colorRange
    };
};

VTMM.map.loadAllData = function(error, vt, data) {
    VTMM.data = data;
    VTMM.map.data = vt;

    VTMM.map.loadMapData(vt);
    VTMM.map.loadData(data);
};

VTMM.map.loadData = function(data, field) {
    if (typeof field === 'undefined') {
        field = Object.keys(data[0]).pop();
    }

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
    VTMM.map.maxValue = Math.max.apply(Math, VTMM.map.domain);
    VTMM.map.minValue = Math.min.apply(Math, VTMM.map.domain);
    VTMM.map.render(VTMM.map.field);
};

VTMM.map.loadMapData = function(vt) {
    VTMM.map.svg.selectAll(".town")
        .data(topojson.feature(vt, vt.objects.vt_towns).features)
        .enter().append("path")
            .attr("d", VTMM.map.path)
            .attr("class", "town")
            .style("fill", '#ddd');
};

VTMM.map.render = function(field) {
    var vt = VTMM.map.data;
    VTMM.map.currentScale = VTMM.map.getScale();

    VTMM.map.svg.selectAll(".town")
        .data(topojson.feature(vt, vt.objects.vt_towns).features)

        .style("fill", VTMM.map.fillFunc)

        .on("mouseover", function(d) {
            var xPosition = d3.mouse(this)[0];
            var yPosition = d3.mouse(this)[1] - 30;

            VTMM.map.svg.append("text")
                .attr("id", "tooltip")
                .attr("x", xPosition)
                .attr("y", yPosition)
                .attr("text-anchor", "middle")
                .attr("font-family", "sans-serif")
                .attr("font-size", "11px")
                .attr("font-weight", "bold")
                .attr("fill", "black")
                .text(d.properties.town + " " + field + ":" + d.properties[field]);

            d3.select(this)
                .style("fill", "#ef6548");
        })

        .on("mouseout", function(d) {
            d3.select("#tooltip").remove();

            d3.select(this).style("fill", VTMM.map.fillFunc);
        })

        .on("click", function(d) {
            var town = slugify(d.properties.town);
            VTMM.select_town(town);
        });

    // Scale
    VTMM.map.svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(" + (VTMM.map.options.width - 80) + ",35)")
        .call(VTMM.legend.yAxis(field))
        .selectAll("rect")
            .data(VTMM.legend.colorScale(field).range.map(function(d, i) {
                var domain = VTMM.legend.colorScale(field).domain;
                var y = VTMM.legend.y();
                return {
                    y0: i ? y(domain[i - 1]) : y.range()[0],
                    y1: i < domain.length ? y(domain[i]) : y.range()[1],
                    z: d
                };
            }))
            .enter().append("rect")
            .attr("width", VTMM.legend.options.width)
            .attr("y", function(d) { return d.y0; })
            .attr("height", function(d) { return d.y1 - d.y0; })
            .style("fill", function(d) { return d.z; });

    // Lake Champlain
    VTMM.map.svg.append("path")
        .datum(topojson.feature(vt, vt.objects.lake))
        .attr("d", VTMM.map.path)
        .style("stroke", "#89b6ef")
        .style("stroke-width", "1px")
        .style("fill", "#b6d2f5");
};

VTMM.map.fillFunc = function(d) {
    value = d.properties[VTMM.map.field];

    if (value) {
        return VTMM.map.currentScale(value);
    }

    return "#ddd";
};

VTMM.loader.init = function () {
    var form = $('#loader form');

    form.submit(function (e) {
        e.preventDefault();

        var url = form.find('#url').val();
        
        d3.csv(url, function (data) {
            VTMM.map.loadData(data, 'unemp_rate2012');
        });
    });
}

$(document).ready(function() {
    VTMM.init();
    VTMM.loader.init();
});
