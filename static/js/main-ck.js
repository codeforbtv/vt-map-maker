// Set window height + width
var width=500,height=650,projection=d3.geo.transverseMercator().rotate([72.57,-44.2]).translate([175,185]).scale([12e3]),path=d3.geo.path().projection(projection),svg=d3.select("body").append("svg").attr("width",width).attr("height",height),color=d3.scale.threshold().domain([10,200,1e3,2e3,5e3,1e4,2e4,4e4,5e4]).range(["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"]),y=d3.scale.sqrt().domain([0,5e4]).range([0,325]),yAxis=d3.svg.axis().scale(y).tickValues(color.domain()).orient("right");d3.csv("vt_pop.csv",function(e){d3.json("vermont.json",function(t,n){for(var r=0;r<e.length;r++){var i=e[r].town,s=parseFloat(e[r].population);for(var o=0;o<n.objects.vt_towns.geometries.length;o++){var u=n.objects.vt_towns.geometries[o].properties.town;if(i.toUpperCase()==u){n.objects.vt_towns.geometries[o].properties.population=s;break}}}var a=topojson.feature(n,n.objects.vt_towns);svg.append("path").datum(a).attr("d",path).style("stroke","#777").style("stroke-width","1");var f=svg.append("g").attr("class","key").attr("transform","translate(320, 165)").call(yAxis);f.selectAll("rect").data(color.range().map(function(e,t){return{y0:t?y(color.domain()[t-1]):y.range()[0],y1:t<color.domain().length?y(color.domain()[t]):y.range()[1],z:e}})).enter().append("rect").attr("width",8).attr("y",function(e){return e.y0}).attr("height",function(e){return e.y1-e.y0}).style("fill",function(e){return e.z});svg.selectAll(".subunit").data(topojson.feature(n,n.objects.vt_towns).features).enter().append("path").attr("d",path).style("fill",function(e){var t=e.properties.population;return t?color(t):"#ddd"}).on("mouseover",function(e){var t=d3.mouse(this)[0],n=d3.mouse(this)[1]-30;svg.append("text").attr("id","tooltip").attr("x",t).attr("y",n).attr("text-anchor","middle").attr("font-family","sans-serif").attr("font-size","11px").attr("font-weight","bold").attr("fill","black").text(e.properties.town);d3.select(this).style("fill","#509e2f")}).on("mouseout",function(e){d3.select("#tooltip").remove();d3.select(this).transition().duration(250).style("fill",function(e){var t=e.properties.population;return t?color(t):"#ddd"})});svg.append("path").datum(topojson.feature(n,n.objects.lake)).attr("d",path).style("stroke","#89b6ef").style("stroke-width","1px").style("fill","#b6d2f5")})});