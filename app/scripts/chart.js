


var margin = {top: 20, right: 120, bottom: 20, left: 120},
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

var yearScale = d3.scale.linear()
    .range([0, width]);

var nameColumn = "Person";
var parentIdColumn = "Förälderns id";
var childIdColumn = "Barnets id";
var personIdColum = "Id";
var persons = {};

function initChart(nodeData, edgeData) {
  var years = nodeData
    .map(function(d) { return d["Födelseår"] })
    .filter(function(d) { return d > 0; });

  yearScale.domain([d3.min(years), d3.max(years)])

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
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", click);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    var nodeSize = 20;

    /*nodeEnter.append("rect")
	     .attr("x", - nodeSize / 2)
      	.attr("y", - nodeSize / 2)
        .attr("width", nodeSize)
        .attr("height", nodeSize)
        .attr("fill", "#fff")
        .attr("stroke", "red")
        .attr("stroke-width", function(d) {
        	return d["Lingarödelägare"] ? "3px" : "0";
        });*/

    // Partner node
    var partnerNodeSize = 10;
    var partnerGroup = nodeEnter.append("g")
      .attr("class", "partner")
      .classed("no-partner", function(d) { return !d["hasPartner"]; })
      .attr("transform", "translate("+ [0, nodeSize] +")")

    partnerGroup.append("circle")
       .attr("x", - nodeSize / 2)
       .attr("y", (nodeSize / 2 + partnerNodeSize / 2) * 0.8)
       .attr("r", partnerNodeSize / 2)
       .attr("fill", "red");

    partnerGroup.append("text")
      .attr("x", function(d,i) { return d.depth == 0 ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d,i) { return d.depth == 0 ? "end" : "start"; })
      .attr("class", "name partner")
      .text(function(d) { return d["Partner"]; })

    nodeEnter.append("image")
      .attr("xlink:href", function(d) {
        if (d["ImageUrl"] == "") {
          return "images/placeholder.png";
        }
        else {
          return "images/placeholder.png";
          //return d["ImageUrl"];
        }
      })
      .attr("x", - nodeSize / 2)
      .attr("y", - nodeSize / 2)
      .attr("width", nodeSize)
      .attr("height", nodeSize)
      .attr("class", "portrait");

    nodeEnter.append("text")
        //.attr("x", function(d) { return d.children || d._children ? -10 : 10; })
        .attr("x", function(d,i) { return d.depth == 0 ? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d,i) { return d.depth == 0 ? "end" : "start"; })
        //.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .attr("class", "name person")
        .text(function(d) { 
        	return d["Person"] + " ("  + d["Födelseår"] + ")"; 
        })
        .style("fill-opacity", 1e-6);

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