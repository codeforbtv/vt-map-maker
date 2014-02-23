var VTMM = VTMM || {};
VTMM.vtMap = {};

VTMM.vtMap.options = {
    'width': $("#map").width(),
    'height': $("#map").height(),
    'colorRange': colorbrewer.YlGn[9]
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
        var value = VTH.vtMap.data.objects.vt_towns.geometries[i].properties[field];
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

d3.csv("static/data/data.csv", function(data) {
    d3.json("static/data/vt.json", function(error, vt) {

        for (var i = 0; i < data.length; i++) {
            var dataTown = data[i].town;
            var dataPop = parseFloat(data[i].population);

            for (var j = 0; j < vt.objects.vt_towns.geometries.length; j++) {
                var jsonTown = vt.objects.vt_towns.geometries[j].properties.town;

                if (dataTown.toUpperCase() == jsonTown) {
                    vt.objects.vt_towns.geometries[j].properties.population = dataPop;
                    break;
                }
            }
        }

        var vermont = topojson.feature(vt, vt.objects.vt_towns);

        VTMM.vtMap.svg.append("path")
            .datum(vermont)
            .attr("d", VTMM.vtMap.path)
            .style("stroke", "#777")
            .style("stroke-width", "1");


        var g = VTMM.vtMap.svg.append("g")
            .attr("class", "key")
            .attr("transform", "translate(" + (VTMM.vtMap.options.width - (VTMM.vtMap.options.width * 0.2)) + ", " + (VTMM.vtMap.options.height - (VTMM.vtMap.options.height * 0.9)) + ")")
            .call(VTMM.vtLegend.yAxis);

        g.selectAll("rect")
            .data(color.range().map(function(d, i) {
                return {
                    y0: i ? VTMM.vtLegend.y(color.domain()[i - 1]) : VTMM.vtLegend.y.range()[0],
                    y1: i < color.domain().length ? VTMM.vtLegend.y(color.domain()[i]) : VTMM.vtLegend.y.range()[1],
                    z: d
                };
            }))
            .enter().append("rect")
                .attr("width", 8)
                .attr("y", function(d) { return d.y0; })
                .attr("height", function(d) { return d.y1 - d.y0; })
                .style("fill", function(d) { return d.z; });


        VTMM.vtMap.svg.selectAll(".subunit")
            .data(topojson.feature(vt, vt.objects.vt_towns).features)
        .enter().append("path")
            .attr("d", VTMM.vtMap.path)
            .style("fill", function(d) {
                var population = d.properties.population;

                if (population) {
                    return color(population);
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
                .style("fill", "#509e2f");
            })
            .on("mouseout", function(d) {
                d3.select("#tooltip").remove();

                d3.select(this)
                .transition()
                .duration(250)
                .style("fill", function(d) {
                var population = d.properties.population;

                if (population) {
                    return color(population);
                } else {
                    return "#ddd";
                }
            });



        });

        VTMM.vtMap.svg.append("path")
            .datum(topojson.feature(vt, vt.objects.lake))
            .attr("d", VTMM.vtMap.path)
            .style("stroke", "#89b6ef")
            .style("stroke-width", "1px")
            .style("fill", "#b6d2f5");

    });
});
