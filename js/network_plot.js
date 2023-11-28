var node;
var link;
var netData;
var node_text;
var NodeNameToNodeIdMapping = {};
// var CarNameToNodeIdMapping = {};

document.addEventListener('DOMContentLoaded', function () {
  d3.json('MC2/network-plot.json')
    .then(function (values) {
      // console.log(data);
      netData = values;
      MapNodeNameToNodeId(values);
      // MapCarNameToNodeId(values);
      drawNetworkPlot(values);
    });
});

function drawNetworkPlot(netData) {
  var margin = { top: 50, right: 30, bottom: 100, left: 260 },
    width = 900 - margin.left - margin.right,
    height = 900 - margin.top - margin.bottom;
  var svg = d3.select('#network_svg');
  svg = svg.append('g').attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var image_ref = {
    0: "data/circle-15.svg",
    1: "data/square-15.svg",
    2: "data/triangle.svg",
    3: "data/Star.svg",
    4: "data/hexagon.svg",
    5: "data/penta.svg"
  }

  // Initialize the links
  link = svg
    .selectAll("line")
    .data(netData.links)
    .enter()
    .append("line")
    .style("stroke", "#aaa")
    .attr('class', 'network_chart_links')
    .attr("id", d => "l" + d.source + "_" + d.target)

  // Initialize the nodes
  node = svg
    .selectAll(".network_nodes")
    .data(netData.nodes)
    .enter()
    .append('image')
    .attr("xlink:href", d => image_ref[d.group])
    .attr("width", 25)
    .attr("height", 25)
    .attr("class", "network_nodes")
    .attr("id", d => "a" + d.id)
    .attr("stroke", "black")
    .on("mouseover", function (d, i) {
      var id = d.target.id;
      highlightBasedOnNodeId(id);
    })
    .on("mouseout", function (d, i) {
      var id = d.target.id;
      highlightBasedOnNodeId(id, true);
    })

    node_text = svg
    .selectAll(".nodeTexts")
    .data(netData.nodes)
    .enter()
    .append('text')
    .attr("class",'nodeTexts')
    .attr("id", d => "a" + d.id)
    .style("opacity", 0.2)
    .style('font-size',"10px")
    .text(d => {
      if(d.group==0)
      return d.name
      else{
        return d.firstname + " "+ d.lastname
      }
    })
    


  // legend
  svg
    .selectAll("legends")
    .data(Object.keys(image_ref))
    .enter()
    .append('image')
    .attr("xlink:href", d => image_ref[d])
    .attr("id", d => "g"+d)
    .attr("x", width - 10)
    .attr("y", (_, i) => height - 70 + i * 35)
    .attr("width", 25)
    .attr("height", 25)
    .attr("border", "5px solid #555")
    .on("mouseover", function (d, i) {
      var id = this.id;
      highlightBasedOnGroupId(id);
    })
    .on("mouseout", function (d, i) {
      var id = this.id;
      highlightBasedOnGroupId(id, true);
    });

  const legendText = ['Location', 'Executive', 'Security', 'Facilities', 'IT', 'Engineering']

  svg
    .selectAll("legends")
    .data(legendText)
    .enter()
    .append('text')
    .text(d => d)
    .attr("id", (_, i) => "g"+i)
    .attr("x", width + 20)
    .attr("y", (_, i) => height - 52 + i * 35)
    .attr("width", 25)
    .attr("height", 25)
    .on("mouseover", function (d, i) {
      var id = this.id;
      highlightBasedOnGroupId(id);
    })
    .on("mouseout", function (d, i) {
      var id = this.id;
      highlightBasedOnGroupId(id, true);
    });


  var simulation = d3.forceSimulation(netData.nodes)                 // Force algorithm is applied to netData.nodes
    .force("link", d3.forceLink()                               // This force provides links between nodes
      .id(function (d) { return d.id; })                     // This provide  the id of a node
      .links(netData.links)                                    // and this the list of links
    )
    .force("charge", d3.forceManyBody().strength(-500))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
    .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
    .on("end", ticked);


  // This function is run at each iteration of the force algorithm, updating the nodes position.
  function ticked() {
    link
      .attr("x1", function (d) { return d.source.x; })
      .attr("y1", function (d) { return d.source.y; })
      .attr("x2", function (d) { return d.target.x; })
      .attr("y2", function (d) { return d.target.y; });

    node
      .attr("x", function (d) { return d.x - 12; })
      .attr("y", function (d) { return d.y - 12; });

    node_text
    .attr("x", function (d) { return d.x - 12; })
    .attr("y", function (d) { return d.y - 12; })

  }
}

function MapNodeNameToNodeId(data) {
  for (var node of data["nodes"]) {
      NodeNameToNodeIdMapping[node['name']] = node['id'];
  }
}

// function MapCarNameToNodeId(data) {
//   for (var node of data["nodes"]) {
//     if (node['group'] > 0) {
//       CarNameToNodeIdMapping[node['name']] = node['id'];
//     }
//   }
// }

function highlightBasedOnNodeId(id, reset = false) {
  // console.log(id);
  var r = 25;
  var stroke = "#555";
  var strokeWidth = "4px";
  var remainingLinksOpacity = 0.2;
  var remainingNodeFilter = "grayscale(1)";
  var remainingNodeOpacity = 0.2;

  if (reset) {
    r = 20;
    stroke = "#aaa";
    strokeWidth = "1px";
    remainingLinksOpacity = 1;
    remainingNodeFilter = "grayscale(0)";
    remainingNodeOpacity = 1;

    netData.links.map(x => {
        d3.select("#l" + x.source.id + "_" + x.target.id)
        .style("stroke", stroke)
        .style("stroke-width", strokeWidth)
        .style("opacity", 1);

        d3.select("#l" + x.target.id + "_" + x.source.id)
        .style("stroke", stroke)
        .style("stroke-width", strokeWidth)
        .style("opacity", 1);
    })

    node
      .style('filter', remainingNodeFilter)
      .style('opacity', remainingNodeOpacity);

    node_text.style('opacity', 0.2);
  }
  else{
  node
  .style('filter', remainingNodeFilter)
  .style('opacity', remainingNodeOpacity);

  d3.selectAll('#'+id)
  .style('filter', "grayscale(0)")
  .style('opacity', 1);

  netData.links.map(x => {
    if ("a" + x.source.id === id) {
      d3.selectAll("#a" + x.target.id)
      .style('filter', "grayscale(0)")
      .style('opacity', 1);

      d3.select("#l" + x.source.id + "_" + x.target.id)
      .style("stroke", stroke)
      .style("stroke-width", strokeWidth)
      .style("opacity", 1);
    }
    else{
      d3.select("#l" + x.source.id + "_" + x.target.id)
      .style("opacity", remainingLinksOpacity);
    }
    if ("a" + x.target.id === id) {
      d3.selectAll("#a" + x.source.id)
      .style('filter', "grayscale(0)")
      .style('opacity', 1);

      d3.select("#l" + x.source.id + "_" + x.target.id)
      .style("stroke", stroke)
      .style("stroke-width", strokeWidth)
      .style("opacity", 1);
    }
    // else{
    //   d3.select("#l" + x.source.id + "_" + x.target.id)
    //   .style("opacity", remainingLinksOpacity);
    // }
  })
}
}

function highlightInNetworkChartBasedOnSelection(selectedName) {
  var r = 20;
  var stroke = "#aaa";
  var strokeWidth = "1px";
  var remainingLinksOpacity = 1;

  d3.selectAll('.network_chart_links')
  .attr("r", r)
  .style("stroke", stroke)
  .style("stroke-width", strokeWidth)
  .style("opacity", remainingLinksOpacity);

  highlightBasedOnNodeId("a"+NodeNameToNodeIdMapping[selectedName]);
}

function highlightBasedOnGroupId(groupId, reset=false) {
  if(groupId == "g0") reset = true;
  var stroke = "#555";
  var strokeWidth = "4px";
  var remainingLinksOpacity = 0.2;
  var remainingNodeFilter = "grayscale(1)";
  var remainingNodeOpacity = 0.2;

  if (reset) {
    r = 20; 
    stroke = "#aaa";
    strokeWidth = "1px";
    remainingLinksOpacity = 1;
    remainingNodeFilter = "grayscale(0)";
    remainingNodeOpacity = 1;

    netData.links.map(x => {
        d3.select("#l" + x.source.id + "_" + x.target.id)
        .style("stroke", stroke)
        .style("stroke-width", strokeWidth)
        .style("opacity", 1);

        d3.select("#l" + x.target.id + "_" + x.source.id)
        .style("stroke", stroke)
        .style("stroke-width", strokeWidth)
        .style("opacity", 1);
    })

    node
      .style('filter', remainingNodeFilter)
      .style('opacity', remainingNodeOpacity);
      node_text.style('opacity', 0.2);
  }
  else{

  node
  .style('filter', remainingNodeFilter)
  .style('opacity', remainingNodeOpacity);

  netData.links.map(x => {
    if ("g" + x.source.group === groupId) {
      d3.selectAll("#a" + x.target.id)
      .style('filter', "grayscale(0)")
      .style('opacity', 1);

      d3.selectAll("#a" + x.source.id)
      .style('filter', "grayscale(0)")
      .style('opacity', 1);

      d3.select("#l" + x.source.id + "_" + x.target.id)
      .style("stroke", stroke)
      .style("stroke-width", strokeWidth)
      .style("opacity", 1);
    }
    else{
      d3.select("#l" + x.source.id + "_" + x.target.id)
      .style("opacity", remainingLinksOpacity);
    }
  })
}
}

