var VTMM = VTMM || {};
VTMM.map = {};

VTMM.init = function() {
    queue()
        .defer(d3.json, "static/data/vt.json")
        .defer(d3.csv, "https://docs.google.com/spreadsheet/pub?key=0AtWnpcGxoF0xdFhOLUFDRGRURUpOWktwTDd4alJhVGc&output=csv")
        .await(VTMM.map.loadData);
};

VTMM.map.options = {
    'width': $("#map").width(),
    'height': $("#map").height(),
    'colorRange': colorbrewer.YlGn[7],
    'selectedField': 'wage'
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

    return $.map(objects, function( object ) { return object.properties[field] });
};

VTMM.map.getScale = function(field) {
    return d3.scale.linear()
        .domain(VTMM.map.getDomain(field))
        .range(VTMM.map.options.colorRange);
};


VTMM.map.maxValue = 0;

VTMM.legend = {};

VTMM.legend.y = function() {
    return d3.scale.linear()
        .domain([0, VTMM.map.maxValue])
        .range([0, VTMM.map.options.height - 80]);
};

VTMM.legend.yAxis = function(field) {
    return d3.svg.axis()
        .scale(VTMM.legend.y())
        .tickValues(VTMM.legend.colorScale(field).domain)
        .orient("right");
};

VTMM.legend.options = {
    'width': 6
};

VTMM.legend.colorScale = function(field) {
    var max = VTMM.map.maxValue,
        quantiles = [0, max/6, max/3, max/2, 2*max/3, 5*max/6, max];
    return {
        'domain': quantiles.sort(function(a,b){ return a-b; }),
        'range': VTMM.map.options.colorRange
    };
};

VTMM.map.loadData = function(error, vt, data) {
    for (var i = 0; i < data.length; i++) {
        var field = VTMM.map.options.selectedField,
            dataTown = data[i].town.toUpperCase();
        VTMM.map.maxValue = parseInt(data[i][field], 10) > parseInt(VTMM.map.maxValue, 10) ? data[i][field] : VTMM.map.maxValue;
        for (var j = 0; j < vt.objects.vt_towns.geometries.length; j++) {
            var jsonTown = vt.objects.vt_towns.geometries[j].properties.town;
            if (dataTown == jsonTown) {
                vt.objects.vt_towns.geometries[j].properties[field] = data[i][field];
            }
        }
    }
    VTMM.data = data;
    VTMM.map.data = vt;
    VTMM.map.render();
};

VTMM.map.render = function() {
    var vt = VTMM.map.data;
    var field = VTMM.map.options.selectedField;
    VTMM.map.currentScale = VTMM.map.getScale(field);

    VTMM.map.svg.selectAll(".town")
        .data(topojson.feature(vt, vt.objects.vt_towns).features)
        .enter().append("path")
            .attr("d", VTMM.map.path)
            .attr("class", "town")
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
                .text(d.properties.town);

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
            .attr("height", function(d) { console.log(d); return d.y1 - d.y0; })
            .style("fill", function(d) { return d.z; });

    VTMM.map.svg.append("path")
        .datum(topojson.feature(vt, vt.objects.lake))
        .attr("d", VTMM.map.path)
        .style("stroke", "#89b6ef")
        .style("stroke-width", "1px")
        .style("fill", "#b6d2f5");
};

VTMM.map.fillFunc = function(d) {
    var field = VTMM.map.options.selectedField,
        value = d.properties[field];

    if (value) {
        return VTMM.map.currentScale(value);
    }

    return "#ddd";
}

$(document).ready(function() {
    VTMM.init();
});
