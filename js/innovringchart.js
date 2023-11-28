var ringdata, ringsvg, filtereddata, ringheight, ringwidth, inwidth, inringheight, maxRadius, minRadius, parseTime, parsedate;
var dateToRadius, timeScale, uniquedates;
var loc, cc;
var selected_cc;
var selected_location;
var days;
var daylabel ;
var timelabelangles;
var timelabel;
var time;

var border_color = '#e9eff1';

// var colorMap = {
//     "Travel and Accommodation": "#FFC107",
//     "Miscellaneous": "#9E9E9E",
//     "Retail": "#3F51B5",
//     "Food and Beverage": "#FF5722",
//     "Industrial": "#607D8B"
//   };
var colorMap = {
  "Travel and Accommodation": "#66c2a5",
  "Miscellaneous": "#fc8d62",
  "Retail": "#8da0cb",
  "Food and Beverage": "#e78ac3",
  "Industrial": "#a6d854",
};
var loctype = {
  "Abila Airport": "Travel and Accommodation",
  "Abila Scrapyard": "Miscellaneous",
  "Abila Zacharo": "Miscellaneous",
  "Ahaggo Museum": "Travel and Accommodation",
  "Albert's Fine Clothing": "Retail",
  "Bean There Done That": "Food and Beverage",
  "Brew've Been Served": "Food and Beverage",
  "Brewed Awakenings": "Food and Beverage",
  "Carlyle Chemical Inc.": "Industrial",
  "Chostus Hotel": "Travel and Accommodation",
  "Coffee Cameleon": "Food and Beverage",
  "Coffee Shack": "Food and Beverage",
  "Daily Dealz": "Retail",
  "Desafio Golf Course": "Travel and Accommodation",
  "Frank's Fuel": "Miscellaneous",
  "Frydos Autosupply n' More": "Retail",
  "Gelatogalore": "Food and Beverage",
  "General Grocer": "Retail",
  "Guy's Gyros": "Food and Beverage",
  "Hallowed Grounds": "Food and Beverage",
  "Hippokampos": "Food and Beverage",
  "Jack's Magical Beans": "Food and Beverage",
  "Kalami Kafenion": "Food and Beverage",
  "Katerina's Cafe": "Food and Beverage",
  "Kronos Mart": "Retail",
  "Kronos Pipe and Irrigation": "Industrial",
  "Maximum Iron and Steel": "Industrial",
  "Nationwide Refinery": "Industrial",
  "Octavio's Office Supplies": "Retail",
  "Ouzeri Elian": "Food and Beverage",
  "Roberts and Sons": "Miscellaneous",
  "Shoppers' Delight": "Retail",
  "Stewart and Sons Fabrication": "Miscellaneous",
  "U-Pump": "Miscellaneous"
};
document.addEventListener('DOMContentLoaded', function () {
  Promise.all([d3.csv('data/cctime_data.csv', function (d) {
    return {
      date: d.date,  //d3.timeParse("%Y-%m-%d")(d.date), // Parse the date string into a Date object
      price: +d.price,
      last4ccnum: +d.last4ccnum,
      location: d.location,
      time: d.time
    };
  })]).then(function (values) {
    ringdata = values[0];

    ringwidth = 750;
    ringheight = 750;
    ringsvg = d3.select("#ring_svg")
    // .append("svg")
    // .attr("width", ringwidth)
    // .attr("height", ringheight)
    var margin = { top: 30, right: 30, bottom: 30, left: 100 };
    inwidth = ringwidth - margin.left - margin.right;
    inringheight = ringheight - margin.top - margin.bottom;
    // ringsvg.attr('transform', `translate(${margin.left},${margin.top})`);
    uniquedates = new Set(ringdata.map(function (d) { return d.date; }));
    calend();
    document.getElementById('dropdownloc').addEventListener('change', UpdateChart);
    document.getElementById('dropdowncc').addEventListener('change', UpdateChart);
    selected_location = document.getElementById("dropdownloc").value;
    selected_cc = document.getElementById("dropdowncc").value;
    UpdateData(selected_location, selected_cc);
    legends();
    DrawChart();
  })
})
function UpdateData(selected_location, selected_cc) {
  var currentloc
  d3.selectAll(".box_circles").style("opacity", 0.1);
  if (selected_location == 1) {
    d3.selectAll(".box_circles").style("opacity", 1);
    d3.selectAll('.cc_bars').style('stroke-width',1);
  }

  else {
    d3.selectAll('#box_' + location_index[selected_location]).style("opacity", 1);
    d3.selectAll('.cc_bars').style('stroke-width',1);
    d3.select("#bar_"+location_index[selected_location] ).style("stroke-width",4);
  }
  var allcc = (selected_cc == '1');
  var alloc = (selected_location == '1');

  selectLinkByCcNum(selected_cc);
  filtereddata = ringdata.filter(d => (((d.last4ccnum == selected_cc) || allcc) && ((d.location == selected_location) || alloc)));
}
function UpdateChart() {
  selected_location = document.getElementById("dropdownloc").value;
  selected_cc = document.getElementById("dropdowncc").value;
  UpdateData(selected_location, selected_cc);
  days.remove();
  timelabel.remove();
  time.remove();
  DrawChart();
  highlightInNetworkChartBasedOnSelection(selected_location);
}

function Updatering(d, i) {
  // console.log("update",i)
  ringsvg.selectAll(".transactions")
    .style("visibility", "hidden");
  // .attr("fill","red");

  if (i == 'dALL') {
    ringsvg.selectAll(".transactions")
      .style('stroke', "black")
      .style('stroke-width', 0.5)
      .style("visibility", "visible");
  }
  else {
    d3.selectAll('[id*="' + i + '"]')
      .style('stroke', "black")
      .style('stroke-width', 0.5)
      .style("visibility", "visible");
  }
}
function timetoangle(time) {
  return (timeScale(parseTime(time)) * Math.PI) / 180
}
function DrawChart() {
  parsedate = d3.timeParse("%Y-%m-%d");
  parseTime = d3.timeParse("%H:%M:%S");
  maxRadius = (Math.min(inwidth, inringheight)) / 2 - 30;
  minRadius = 50;


  var tooltipring = d3.select("#right-ring-div")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltipring")
  .style("background-color", "white")
  .style("color", "black")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")
  .style("position", "absolute");

  dateToRadius = d3.scaleTime()
    .domain(d3.extent(ringdata, d => parsedate(d.date)))
    .range([minRadius, maxRadius]);

  timeScale = d3.scaleLinear()
    .domain([parseTime("00:00:00"), parseTime("23:59:59")])
    .range([360, 0]);

  days = ringsvg.selectAll(".days")
    .data(Array.from(uniquedates))
    .join("circle")
    .attr("cx", inwidth / 2)
    .attr("cy", inringheight / 2)
    .attr("r", d => dateToRadius(parsedate(d)))
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("stroke-ringwidth", 1)
    .style("opacity", 0.3);


  daylabel = ringsvg.selectAll(".day-label")
    .data(Array.from(uniquedates))
    .join("text")
    .attr("class", "day-label")
    .attr("text-anchor", "middle")
    .attr("x", inwidth / 2)
    .attr("y", d => inringheight / 2 - dateToRadius(parsedate(d)) + 9)
    .text(d => d.slice(5).replace("-", "/"))
    .attr("opacity", 0.4)
    .style("font-size", '9px');


  ringsvg.selectAll('line')
    .data(d3.range(2))
    .join('line')
    .attr('x1', d => inwidth / 2 + Math.cos(d * Math.PI / 2) * maxRadius)
    .attr('y1', d => inringheight / 2 + Math.sin(d * Math.PI / 2) * maxRadius)
    .attr('x2', d => inwidth / 2 + Math.cos(d * Math.PI / 2 + Math.PI) * maxRadius)
    .attr('y2', d => inringheight / 2 + Math.sin(d * Math.PI / 2 + Math.PI) * maxRadius)
    .attr('stroke', 'black')
    .style('stroke-dasharray', '10,10')
    .attr('opacity', 0.2);

  timelabelangles = d3.range(360, 0, -45);
  timelabelangles.forEach((x, i) => timelabelangles[i] = timelabelangles[i] * (Math.PI / 180));

  timelabel = ringsvg.selectAll(".time-label")
    .data(timelabelangles)
    .join("text")
    .attr("class", "time-label")
    .attr("text-anchor", "middle")
    .attr("x", d => inwidth / 2 + (maxRadius + 15) * Math.cos(d))
    .attr("y", d => inringheight / 2 + (maxRadius + 15) * Math.sin(d) + 5)
    .text((d, i) => i * 3);

  time = ringsvg.selectAll(".transactions")
    .data(filtereddata)
    .join("circle")
    .attr("class", "transactions")
    .attr("cx", function (d) { return inwidth / 2 + dateToRadius(parsedate(d.date)) * Math.cos(timetoangle(d.time)); })
    .attr("cy", function (d) { return inringheight / 2 + dateToRadius(parsedate(d.date)) * Math.sin(timetoangle(d.time)); })
    .attr("r", 3.5)
    .attr("id", d => "c" + d.last4ccnum + '_t' + d.time + '_d' + d.date + '_l' + d.location + "_ty" + loctype[d.location])
    .attr("fill", d => colorMap[loctype[d.location]])
    .style("visibility", "visible")
    .style("opacity", 1)
    .on("mouseover", function (_, d) {
      tooltipring.style("opacity", 1);
      time.style("opacity", 0.3);
      d3.select(this).style("opacity", 1);
      d3.select(this).style("stroke", "white");
    })
    .on("mouseout", function (_, d) {
      time.style("opacity", 1)
      tooltipring.html("").style("opacity", 0);
      d3.select(this).style("opacity", 1);
      d3.select(this).style("stroke", "none");
    })
    .on("mousemove", function (event, d) {
      d3.select(this).style("opacity", 1);
      tooltipring.html("cc : " + d.last4ccnum+ '<br>' + 'Spending: ' + d.price + '<br>' + 'Location: ' + d.location + '<br>' + 'Time: '+ d.time + '<br>' +"Date: "+ d.date)
        .style("left", event.clientX + window.scrollX + 20 + "px")
        .style("top", event.clientY + window.scrollY - 20 + "px");
    });



}

function legends() {
  cc = new Set(ringdata.map(function (d) { return d.last4ccnum; }));
  // console.log(cc)
  loc = new Set(ringdata.map(function (d) { return d.location; }));
  // console.log(loc)
  var select = document.getElementById("dropdownloc");
  loc.forEach(d => {
    var option = document.createElement("option");
    option.text = d;
    option.value = d;
    select.add(option);
  })

  select = document.getElementById("dropdowncc");
  cc.forEach(d => {
    var option = document.createElement("option");
    option.text = d;
    option.value = d;
    select.add(option);
  })

  const legendWidth = 150;
  const legendHeight = 20 * 4; // height of each item in legend is 20
  var legendr = ringsvg
    .append("g")
    .attr("class", "legend")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("transform", 'translate(600,10)');
   
    legendr.append("text")
    .attr("x", -65)
    .attr("y", 3)
    .attr("text-anchor", "middle")
    .attr('fill', "black")
    .attr("font-weight",320)
    .attr("font-family","Serif")
    .text("Select Categories")
    .style("font-size", '12px');

    
  var clickedty = null
  var rectty = legendr.selectAll("legrect")
    .data(Object.keys(colorMap))
    .enter()
    .append("rect")
    .attr("x", -120)
    .attr("y", (d, i) => (i * 20)+8) // position each item vertically
    .attr("width", 13)
    .attr("height", 13)
    .style("fill", d => colorMap[d])
    .style("stroke", "black")
    .on('click', function(d,i) {
    // (d, i) => Updatering(i, "ty" + i));
    // console.log(i)
    if (clickedty == i) {
      rectty.style("stroke", "black");
      d3.selectAll(".transactions")
        .style("visibility", "visible")
        .style("stroke", "none")
      clickedty = null;
    }
    else {
      rectty.style("stroke", "black")
      d3.select(this).style("stroke", "red")
      clickedty = i;
      Updatering(i, "ty" + i);

    }
  });

  legendr.selectAll(".legtext")
    .data(Object.keys(colorMap))
    .enter()
    .append("text")
    .attr("x", -100)
    .attr("y", (d, i) => i * 20 + 20) // position the text vertically
    .text(d => d) // set the text to the key value
    .style('font-size', '11px');


}

function calend() {


  var cal = ringsvg
    .append("g")
    .attr("width", 120)
    .attr("height", 120);

  // Create a grid of squares for each date
  var clickedcal = null
  var gridSize = 22,
    padding = 5;
  uniquedates.add('ALL')
 

  cal.append("text")
    .attr("x", 60)
    .attr("y", 130)
    .attr("text-anchor", "middle")
    .attr('fill', "green")
    .style("font-size", "14px")
    .text("Calendar");

  var squares = cal.selectAll(".square")
    .data(Array.from(uniquedates))
    .join("rect")
    .attr("class", "square")
    .attr("x", function (d, i) { return i % 4 * (gridSize + padding)+10; })
    .attr("y", function (d, i) { return Math.floor(i / 4) * (gridSize + padding)+10; })
    .attr("width", gridSize)
    .attr("height", gridSize)
    .style("fill", "#d9f0d3")
    .style("stroke", "black")
    .on("click", function (d, i) {
      // Call  update chart function with the selected date
      if (clickedcal == i) {
        squares.style("stroke", "black");
        d3.selectAll(".transactions")
          .style("visibility", "visible")
          .style("stroke", "none")
        // .style("stroke-width",0);
        clickedcal = null;
      }
      else {
        squares.style("stroke", "black")
        d3.select(this).style("stroke", "red")
        clickedcal = i;
        i = "d" + i
        Updatering(d, i);

      }

    });

  // Add labels for each date
  var labels = cal.selectAll(".label")
    .data(Array.from(uniquedates))
    .join("text")
    .attr("class", "label")
    .style("pointer-events", "none")
    .attr("x", function (d, i) { return (i % 4 * (gridSize + padding) + gridSize / 2)+10; })
    .attr("y", function (d, i) { return (Math.floor(i / 4) * (gridSize + padding) + gridSize / 2)+10; })
    .text(function (d) { return d.slice(-3).replace('-', ''); })
    .style("text-anchor", "middle")
    .style("dominant-baseline", "central")
    .style("fill", "#333")
    .style("font-size", "12px");
}


