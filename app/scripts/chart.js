


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
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });
        //.on("click", click);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    var nodeSize = 20;
    var enlargedNodeSize = nodeSize * 4; // used on hover
    var textIndent = 15; // distance between portrait and text

    // Partner node
    var partnerNodeSize = 10;
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
      .attr("id", function(d,i) { return "portrait-" + i })
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
      .style("fill", function(d,i) { 
        return "url(#portrait-" + i + ")"
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
      .on("mouseover", function(d,i) {
        // Enlarge nodes with portraits
        if (d.hasPortrait) {
          // Resize circle
          d3.select(this.parentNode)
            .select(".portrait")
            .transition()
            .duration(200)
            .attr("r", enlargedNodeSize / 2)
            .attr("x", -enlargedNodeSize / 2)
            .attr("y", -enlargedNodeSize / 2);

          d3.select("#portrait-" + i)
            .transition()
            .duration(200)
            .attr("x", enlargedNodeSize / 2)
            .attr("y", enlargedNodeSize / 2)
            .attr("width", enlargedNodeSize)
            .attr("height", enlargedNodeSize);

          d3.select("#portrait-" + i).select("image")
            .transition()
            .duration(200)
            .attr("width", enlargedNodeSize)
            .attr("height", enlargedNodeSize);
        }
      })
      .on("mouseout", function(d,i) {
        d3.select(this.parentNode)
          .select(".portrait")
          .transition()
          .duration(200)
          .attr("r", nodeSize / 2)
          .attr("x", -nodeSize / 2)
          .attr("y", -nodeSize / 2);

        // Pattern
        d3.select("#portrait-" + i)
          .transition()
          .duration(200)
          .attr("x", nodeSize / 2)
          .attr("y", nodeSize / 2)
          .attr("width", nodeSize)
          .attr("height", nodeSize)

        // Pattern > image
        d3.select("#portrait-" + i).select("image")
          .transition()
          .duration(200)
          .attr("width", nodeSize)
          .attr("height", nodeSize)
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