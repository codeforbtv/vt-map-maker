var VTMM = VTMM || {};
VTMM.vtMap = {};

VTMM.init = function() {
    queue()
        .defer(d3.json, "static/data/vt.json")
        .defer(d3.csv, "static/data/data.csv")
        .await(VTMM.vtMap.loadData);
};

VTMM.vtMap.options = {
    'width': $("#map").width(),
    'height': $("#map").height(),
    'colorRange': colorbrewer.YlGn[7],
    'selectedField': 'population'
};

VTMM.vtMap.svg = d3.select("#map").append("svg")
    .attr("width", VTMM.vtMap.options.width)
    .attr("height", VTMM.vtMap.options.height);

VTMM.vtMap.projection = d3.geo.transverseMercator()
    .rotate([72.57, -44.20])
    .translate([VTMM.vtMap.options.width / 2.5, VTMM.vtMap.options.height / 2.75])
    .scale([VTMM.vtMap.options.height * 23]);

VTMM.vtMap.path = d3.geo.path()
    .projection(VTMM.vtMap.projection);

VTMM.vtMap.getDomain = function(field) {
    var objects = VTMM.vtMap.data.objects.vt_towns.geometries;

    return $.map(objects, function( object ) { return object.properties[field] });
};

VTMM.vtMap.getScale = function(field) {
    return d3.scale.quantile()
        .domain(VTMM.vtMap.getDomain(field))
        .range(VTMM.vtMap.options.colorRange);
};


VTMM.vtMap.maxValue = 0;

VTMM.vtLegend = {};

VTMM.vtLegend.y = function() {
    return d3.scale.sqrt()
        .domain([0, VTMM.vtMap.maxValue])
        .range([0, 325]);
};

VTMM.vtLegend.yAxis = function(field) {
    return d3.svg.axis()
        .scale(VTMM.vtLegend.y())
        .tickValues(VTMM.vtLegend.colorScale(field).domain)
        .orient("right");
};

VTMM.vtLegend.options = {
    'width': 6
};

VTMM.vtLegend.colorScale = function(field) {
    var quantiles = VTMM.vtMap.getScale(field).quantiles();
    quantiles.push(VTMM.vtMap.maxValue);
    return {
        'domain': quantiles.sort(function(a,b){ return a-b; }),
        'range': VTMM.vtMap.options.colorRange
    };
};

VTMM.vtMap.loadData = function(error, vt, data) {
    for (var i = 0; i < data.length; i++) {
        var field = VTMM.vtMap.options.selectedField,
            dataTown = data[i].town.toUpperCase();
        VTMM.vtMap.maxValue = parseInt(data[i][field], 10) > parseInt(VTMM.vtMap.maxValue, 10) ? data[i][field] : VTMM.vtMap.maxValue;
        for (var j = 0; j < vt.objects.vt_towns.geometries.length; j++) {
            var jsonTown = vt.objects.vt_towns.geometries[j].properties.town;
            if (dataTown == jsonTown) {
                vt.objects.vt_towns.geometries[j].properties[field] = data[i][field];
            }
        }
    }
    VTMM.data = data;
    VTMM.vtMap.data = vt;
    VTMM.vtMap.render();
};

VTMM.vtMap.render = function() {
    var vt = VTMM.vtMap.data;
    var field = VTMM.vtMap.options.selectedField;
    VTMM.vtMap.currentScale = VTMM.vtMap.getScale(field);

    VTMM.vtMap.svg.selectAll(".town")
        .data(topojson.feature(vt, vt.objects.vt_towns).features)
        .enter().append("path")
            .attr("d", VTMM.vtMap.path)
            .attr("class", "town")
            .style("fill", VTMM.vtMap.fillFunc)
        .on("mouseover", function(d) {
            var xPosition = d3.mouse(this)[0];
            var yPosition = d3.mouse(this)[1] - 30;

            VTMM.vtMap.svg.append("text")
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

            d3.select(this).style("fill", VTMM.vtMap.fillFunc);
        })

        .on("click", function(d) {
            var town = slugify(d.properties.town);
            VTMM.select_town(town);
        });


    VTMM.vtMap.svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(" + (VTMM.vtMap.options.width - 80) + ",35)")
        .call(VTMM.vtLegend.yAxis(field))
        .selectAll("rect")
            .data(VTMM.vtLegend.colorScale(field).range.map(function(d, i) {
                var domain = VTMM.vtLegend.colorScale(field).domain;
                var y = VTMM.vtLegend.y();
                return {
                    y0: i ? y(domain[i - 1]) : y.range()[0],
                    y1: i < domain.length ? y(domain[i]) : y.range()[1],
                    z: d
                };
            }))
            .enter().append("rect")
            .attr("width", VTMM.vtLegend.options.width)
            .attr("y", function(d) { return d.y0; })
            .attr("height", function(d) { console.log(d); return d.y1 - d.y0; })
            .style("fill", function(d) { return d.z; });

    VTMM.vtMap.svg.append("path")
        .datum(topojson.feature(vt, vt.objects.lake))
        .attr("d", VTMM.vtMap.path)
        .style("stroke", "#89b6ef")
        .style("stroke-width", "1px")
        .style("fill", "#b6d2f5");
};

VTMM.vtMap.fillFunc = function(d) {
    var field = VTMM.vtMap.options.selectedField,
        value = d.properties[field];

    if (value) {
        return VTMM.vtMap.currentScale(value);
    }

    return "#ddd";
}

$(document).ready(function() {
    VTMM.init();
});
