


var margin = {top: 20, right: 120, bottom: 20, left: 150},
    width = 1160 - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Allows us to make circled images
var defs = svg.insert("svg:defs")
  .attr("id", "defs");

var yearScale = d3.scale.linear()
    .range([0, width]);



var nameColumn = "Person";
var parentIdColumn = "Förälderns id";
var childIdColumn = "Barnets id";
var personIdColum = "Id";
var persons = {};

var nodeSize = 20;
var textIndent = 15; // distance between portrait and text
var partnerNodeSize = 10;


function initChart(nodeData, edgeData) {
  var years = nodeData
    .map(function(d) { return d["Födelseår"] })
    .filter(function(d) { return d > 0; });

  yearScale.domain([d3.min(years), d3.max(years)])

  // Draw timeline in background
  var yearInterval = 10;
  var minYear = Math.floor(d3.min(years) / yearInterval) * yearInterval;
  var maxYear = Math.floor(d3.max(years) / yearInterval) * yearInterval;
  /*var nIntervals = (maxYear - minYear) / yearInterval;
  var yearIntervals = Array.apply(null, Array(nIntervals)).map(function (_, i) {return minYear + i * yearInterval;});
  
  var timeline = svg.selectAll(".tick")
    .data(yearIntervals)
    .enter()
    .append("g")
    .attr("transform", function(d) {
      return "translate("+[yearScale(d),0]+")"; 
    });

  timeline.append("text")
    .text(function(d) { return d })*/

  var xAxis = d3.svg.axis()
    .scale(yearScale)
    .orient("top")
    .ticks(20)
    .tickFormat(function(d) { return d; });
    //.tickValues(d3.range(minYear, maxYear, yearInterval))

  svg.append("g")
    .attr("class", "axis")
    .call(xAxis);

  svg.select(".domain")
    .attr("transform", "translate(0,-3)");


  root = nodeData[0];
  root.children = treeify(edgeData, parentIdColumn, childIdColumn);
  root.x0 = height / 2;
  root.y0 = 0;

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  root.children.forEach(collapse);
  update(root);
}


d3.select(self.frameElement).style("height", "800px");

function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { 
    	d.y = yearScale(d["Födelseår"])
    	//d.y = d.depth * 180;
    });

    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .classed("alive", function(d) { return d["Nu levande"]; })
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });
        //.on("click", click);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    // Partner node
    var partnerGroup = nodeEnter.append("g")
      .attr("class", "partner")
      .classed("no-partner", function(d) { return !d["hasPartner"]; })
      .attr("transform", "translate("+ [0, nodeSize] +")")

    /*partnerGroup.append("circle")
       .attr("x", - nodeSize / 2)
       .attr("y", (nodeSize / 2 + partnerNodeSize / 2) * 0.8)
       .attr("r", partnerNodeSize / 2)
       .attr("fill", "red");*/

    partnerGroup.append("path")
      .attr("class", "heart")
      .attr("d","M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z")
      .attr("transform", "translate("+[- partnerNodeSize / 2,- partnerNodeSize / 2]+"), scale(0.3)");

    partnerGroup.append("text")
      .attr("x", function(d,i) { return d.depth == 0 ? -textIndent : textIndent; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d,i) { return d.depth == 0 ? "end" : "start"; })
      .attr("class", "name partner")
      .text(function(d) { return d["Partner"]; })

    nodeEnter.append("text")
        //.attr("x", function(d) { return d.children || d._children ? -textIndent : textIndent; })
        .attr("x", function(d,i) { return d.depth == 0 ? -textIndent : textIndent; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d,i) { return d.depth == 0 ? "end" : "start"; })
        //.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .attr("class", "name person")
        .text(function(d) { 
        	return d["Person"] + " ("  + d["Födelseår"] + ")"; 
        })
        .style("fill-opacity", 1e-6);

    var def = defs.selectAll("pattern")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });
    
    var defEnter = def.enter()
      .append("pattern")
      .attr("id", function(d) { return "portrait-" + d.id })
      .attr("patternUnits", "userSpaceOnUse")
      .attr("x", nodeSize / 2)
      .attr("y", nodeSize / 2)
      .attr("height", nodeSize)
      .attr("width", nodeSize);

    defEnter.append("image")
      .attr("height", nodeSize)
      .attr("width", nodeSize)
      .attr("x", 0)
      .attr("y", 0)
      .attr("xlink:href", function(d) {
        if (d["ImageUrl"] == "") {
          return "images/placeholder.png";
        }
        else {
          //return "images/placeholder.png";
          return d["ImageUrl"];
        }
      })

    defExit = def.exit()
      .remove();

    nodeEnter.append("circle")
      .attr("x", - nodeSize / 2)
      .attr("y", - nodeSize / 2)
      .attr("r", nodeSize / 2)
      .attr("class", "portrait")
      .style("fill", function(d) { 
        return "url(#portrait-" + d.id + ")"
      });


    /*nodeEnter.append("image")
      .attr("xlink:href", function(d) {
        if (d["ImageUrl"] == "") {
          return "images/placeholder.png";
        }
        else {
          //return "images/placeholder.png";
          return d["ImageUrl"];
        }
      })
      .attr("x", - nodeSize / 2)
      .attr("y", - nodeSize / 2)
      .attr("width", nodeSize)
      .attr("height", nodeSize)
      .attr("class", "portrait");*/

    // Inivisible area used for interactions
    var clickableWidth = 140;
    var clickableArea = nodeEnter.append("rect")
      .attr("class", "clickable-area")
      .attr("width", clickableWidth)
      .attr("y", -nodeSize / 2)
      .attr("x", function(d,i) { 
          return d.depth == 0 ? -clickableWidth + nodeSize / 2 : - nodeSize / 2; 
      })
      .attr("height", nodeSize)
      .attr("fill", "#fff")
      .attr("opacity", 1e-6)
      .attr("stroke", "none")

    clickableArea
      .on("click", click)
      .on("mouseover", function(d) {
        // Enlarge nodes with portraits
        if (d.hasPortrait) {
          scaleNode(this.parentNode, d, 3);
        }
      })
      .on("mouseout", function(d) {
        scaleNode(this.parentNode, d, 1);
      });

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    /*nodeUpdate.select("circle")
        .attr("r", 10)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
    */

    nodeUpdate.selectAll(".name")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }


// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

function scaleNode(node, d, factor) {
  var newNodeSize = nodeSize * factor;

  // Resize circle
  d3.select(node)
    .select(".portrait")
    .transition()
    .duration(200)
    .attr("r", newNodeSize / 2)
    .attr("x", -newNodeSize / 2)
    .attr("y", -newNodeSize / 2);

  d3.select("#portrait-" + d.id)
    .transition()
    .duration(200)
    .attr("x", newNodeSize / 2)
    .attr("y", newNodeSize / 2)
    .attr("width", newNodeSize)
    .attr("height", newNodeSize);

  d3.select("#portrait-" + d.id).select("image")
    .transition()
    .duration(200)
    .attr("width", newNodeSize)
    .attr("height", newNodeSize);
}