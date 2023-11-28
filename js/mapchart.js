var abila;
var kronos;
var svg;
var abilaProjection;
var margin_map = {top:20, right:20, bottom:40, left:40},
    width_map = 1180 - margin_map.left - margin_map.right,
    height_map = 754 - margin_map.top - margin_map.bottom;

var gpsData;
var data = [];
var color;
var car_ids = new Set();
var carIds;
var sortCars = function(a,b){return a - b};
var sortByTime = function (a, b) { return new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime() };
var svg_cars;
var colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
'#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
'#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
'#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
'#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
'#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
'#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
'#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
'#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
'#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
var selected_cars = [];

document.addEventListener('DOMContentLoaded',function(){
    Promise.all([d3.json('data/abila.geojson'),d3.csv('data/gps.csv')]).then(function(values){
        abila = values[0];
        gpsData = values[1];
        for(let i=0; i<gpsData.length; i++){
            // if(gpsData[i].id == 35){
            //     data.push(gpsData[i]);
            // }
            car_ids.add(gpsData[i].id);
        }
        carIds = Array.from(car_ids);
        console.log(data);
        carIds.sort(sortCars);
        console.log(carIds);
        color = d3.scaleOrdinal().domain(carIds).range(colorArray);
        svg = d3.select('#map_svg');
        
        svg.append('image')
            .attr('x',0)
            .attr('y',0)
            .attr('xlink:href','data/MC2-tourist.jpg')
            .attr('height',height_map)
            .attr('width',width_map)
            .attr('class','image')
            .attr('opacity',0.75);
        abilaProjection = d3.geoEquirectangular()
                            .fitSize([width_map,height_map],abila);
        //console.log(usaProjection);
        
        abilaPath = d3.geoPath().projection(abilaProjection);
        addCars(carIds);
        plotUSA();
        plotGPS();
        
    })
})

function plotUSA(){
    svg.selectAll('.abila')
        .data(abila.features)
        .join('path')
        .attr('class','abila')
        .attr('d',abilaPath)
        .attr('fill','white')
        .attr('stroke','black')
        .attr('stroke-width','1px')
}

function plotKronos(){
    svg.selectAll('.kronos')
        .data(kronos.features)
        .join('path')
        .attr('class','kronos')
        .attr('d',kronosPath)
}

function plotGPS(){
    svg.selectAll('.gps')
        .data(data)
        .join(
            function(enter){
                return enter
                .append('circle');
            }
        )
        .attr('class','gps')
        .attr('cx',d => abilaProjection([+d.long,+d.lat])[0])
        .attr('cy',d => abilaProjection([+d.long,+d.lat])[1])
        .attr('r',3)
        .style('fill', (d => color(d.id)))
        .style('opacity',0.5)
}

function addCars(carIds){
    svg_cars = d3.select('#map_cars');
    
    svg_cars.selectAll('.cars')
            .data(carIds)
            .join('rect')
            .attr('id',d => d)
            .attr('x',20)
            .attr('y',(d,i) => (i+1)*25)
            .attr('height',20)
            .attr('width',20)
            .attr('fill', (d,i) => color(d))
            .on('click',(d,i) => {
                if(!selected_cars.includes(d.target.id)){
                    selected_cars.push(d.target.id);
                }else{
                    var index = selected_cars.indexOf(d.target.id);
                    if(index != -1){
                        selected_cars.splice(index,1);
                    }
                }
                updateData();
                plotGPS();
                
            })
        svg_cars.selectAll('.carIds')
            .data(carIds)
            .join('text')
            .attr('x', 45)
            .attr('y', (d,i) => (i+1)*25 + 12)
            .text(d => d)
}

function updateData(){
    data = [];
    gpsData.map(gps => {
        if(selected_cars.includes(gps.id))
        data.push(gps);
    })
    data.sort(sortByTime);
    console.log(data);
}

function timelapse() {
    svg.selectAll('.gps').remove();

    svg.selectAll('.gps')
        .data(data)
        .join(
            function(enter){
                return enter
                .append('circle')
                .style('opacity',0)
                .style('fill','black');
            }
        )
        .attr('class','gps')
        .attr('cx',d => abilaProjection([+d.long,+d.lat])[0])
        .attr('cy',d => abilaProjection([+d.long,+d.lat])[1])
        .attr('r',3)
        
        .transition()
        .duration(1000)
        .delay(function(d,i){
            return i*5;
        })
        .style('opacity',0.5)
        .style('fill', (d => color(d.id)))
}