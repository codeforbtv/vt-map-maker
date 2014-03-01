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
    'colorRange': colorbrewer.YlGn[9],
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
    var domain = [];
    for (var i = 0; i < VTMM.vtMap.data.objects.vt_towns.geometries.length; i++) {
        var value = VTMM.vtMap.data.objects.vt_towns.geometries[i].properties[field];
        domain.push(value);
    }
    return domain;
};

VTMM.vtMap.getScale = function(field) {
    return d3.scale.quantile()
        .domain(VTMM.vtMap.getDomain(field))
        .range(VTMM.vtMap.options.colorRange);
};

var color = d3.scale.threshold()
    .domain([10, 200, 1000, 2000, 5000, 10000, 20000, 40000, 50000])
    .range(["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"]);

VTMM.vtLegend = {};

VTMM.vtLegend.y = d3.scale.sqrt()
    .domain([0, 50000])
    .range([0,325]);

VTMM.vtLegend.yAxis = d3.svg.axis()
    .scale(VTMM.vtLegend.y)
    .tickValues(color.domain())
    .orient("right");

VTMM.vtMap.loadData = function(error, vt, data) {
    for (var i = 0; i < data.length; i++) {
        var dataTown = data[i].town.toUpperCase();
        for (var j = 0; j < vt.objects.vt_towns.geometries.length; j++) {
            var jsonTown = vt.objects.vt_towns.geometries[j].properties.town;
            if (dataTown == jsonTown) {
                var field = VTMM.vtMap.options.selectedField;
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
            .style("fill", function(d) {
                var stat = d.properties[field];

                if (stat) {
                    return VTMM.vtMap.currentScale(stat);
                } else {
                    return "#ddd";
                }
            })
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

            d3.select(this)
                .style("fill", function() {
                var stat = d.properties[VTMM.vtMap.options.selectedField];
                if (stat) {
                    return VTMM.vtMap.currentScale(stat);
                } else {
                    return "#ddd";
                }
                });
            })
        .on("click", function(d) {
            var town = slugify(d.properties.town);
            VTMM.select_town(town);
        });

    VTMM.vtMap.getStat = function(properties) {
        return properties[VTMM.vtMap.options.selectedField];
    };

    VTMM.vtMap.svg.append("path")
        .datum(topojson.feature(vt, vt.objects.lake))
        .attr("d", VTMM.vtMap.path)
        .style("stroke", "#89b6ef")
        .style("stroke-width", "1px")
        .style("fill", "#b6d2f5");
};

$(document).ready(function() {
    VTMM.init();
});
