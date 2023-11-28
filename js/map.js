var abila;
var carOwners;
var abilaPath;
var kronos;
var svg_map;
var abilaProjection;
var mapmargin = { top: 20, right: 20, bottom: 40, left: 40 },
    mapwidth = 900 - mapmargin.left - mapmargin.right,
    mapheight = 610 - mapmargin.top - mapmargin.bottom;

var gpsData;
var mapdata = [];
var mapcolor;
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
var date;
var carIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 101, 104, 105, 106, 107];
var gdc;
var plotData = {};
var timeMinMax = { 'min': new Date('January 06, 2014 00:00:00'), 'max': new Date('January 06, 2014 23:59:59') };
var xScale;
var drag;

document.addEventListener('DOMContentLoaded', function () {
    Promise.all([d3.json('data/abila.geojson'), d3.csv('data/gps.csv'), d3.csv('data/car-assignments.csv'), d3.json('data/day_car_gps_mapping.json'),
                    d3.json('preprocessing_scripts/house_coordinates.json')]).then(function (values) {
        abila = values[0];
        gpsData = values[1];
        carOwners = values[2];
        gdc = values[3];
        homes = values[4];
        console.log(Object.entries(homes));
        //console.log(gdc);
        // console.log(gpsData[1].Timestamp);
        // console.log(carIds);
        document.getElementById('play').addEventListener('click', timelapse);
        mapcolor = d3.scaleOrdinal().domain(carIds).range(colorArray);
        svg_map = d3.select('#map_svg');
        date = new Date(document.getElementById('date').value);
        date = new Date(+date + date.getTimezoneOffset() * 60000);
        drag = d3.drag();
        // console.log(date);
        // console.log(gdc[date.getDate()])

        //console.log(temp.getDate() == date.getDate());

        svg_map.append('image')
            .attr('x', 0)
            .attr('y', 0)
            .attr('xlink:href', 'data/MC2-tourist.jpg')
            .attr('height', mapheight)
            .attr('width', mapwidth)
            .attr('class', 'image')
            .attr('opacity', 0.75);
        abilaProjection = d3.geoEquirectangular()
            .fitSize([mapwidth, mapheight], abila);
        //console.log(usaProjection);

        abilaPath = d3.geoPath().projection(abilaProjection);
        addCars(carIds);
        plotAbila();
        plotGPS();

    })
})

function plotAbila() {
    svg_map.selectAll('.abila')
        .data(abila.features)
        .join('path')
        .attr('class', 'abila')
        .attr('d', abilaPath)
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', '1px')
        .style('opacity', 0.5)

    xScale = d3.scaleLinear()
        .domain([0, 24])
        .range([mapmargin.left, mapwidth]);

    var xAxis = d3.axisBottom()
        .scale(xScale);

    svg_map.append('g')
        .attr('transform', 'translate(' + -10 + ',' + (mapheight+20) + ')')
        .attr('stroke-width', 3)
        .style('font-size', '15px')
        .call(xAxis);

    svg_map.selectAll('.houses')
            .data(Object.entries(homes))
            .join('rect')
            .attr('class', 'houses')
            .attr('x', d => abilaProjection([+d[1]['range'][0][0], +d[1]['range'][0][1]])[0])
            .attr('y', d => abilaProjection([+d[1]['range'][0][0], +d[1]['range'][0][1]])[1])
            .attr('height', 20)
            .attr('width', 20)
            .style('opacity',0.5)
            .attr('fill', 'black')
            .append('title')
            .text(d => d[1]['name'])
}

function plotGPS() {
    svg_map.selectAll('.gps')
        .data(mapdata)
        .join(
            function (enter) {
                return enter
                    .append('circle');
            }
        )
        .attr('class', 'gps')
        .attr('cx', d => abilaProjection([+d.long, +d.lat])[0])
        .attr('cy', d => abilaProjection([+d.long, +d.lat])[1])
        .attr('r', 3)
        .style('fill', (d => mapcolor(d.id)))
        .style('opacity', 0.5)
        .call(drag)

    svg_map.selectAll('.timeline').remove();
    svg_map.selectAll('.timeline')
        .data(Object.entries(timeMinMax))
        .enter()
        .append('line')
        .attr('class', 'timeline')
        .attr('id', d => 'timeline' + d[0])
        .attr('x1', d => xScale(+d[1].getHours() + d[1].getMinutes() / 60)  -10)
        .attr('y1', mapheight + 10)
        .attr('x2', d => xScale(+d[1].getHours() + d[1].getMinutes() / 60) -10)
        .attr('y2', mapheight + 30)
        .attr('stroke', 'red')
        .attr('stroke-width', '5px')
}

function addCars(carIds) {
    svg_cars = d3.select('#map_cars');


    svg_cars.selectAll('.outerRect')
    .data(carIds)
    .join('rect')
    .attr('id', d => "car_"+d)
    .attr('class', 'outerRect')
    .attr('x', 40)
    .attr('y', (d, i) => (i + 1) * 25)
    .attr('height', 20)
    .attr('width', 200)
    .style('opacity',0)
    .attr('fill', 'red');


    svg_cars.selectAll('.cars')
        .data(carIds)
        .join('rect')
        .attr('id', d => d)
        .attr('class', 'cars')
        .attr('x', 20)
        .attr('y', (d, i) => (i + 1) * 25)
        .attr('height', 20)
        .attr('width', 20)
        .attr('fill', (d, i) => mapcolor(d))
        .on('click', (d, i) => {
            if (!selected_cars.includes(d.target.id)) {
                selected_cars.push(d.target.id);
            } else {
                var index = selected_cars.indexOf(d.target.id);
                if (index != -1) {
                    selected_cars.splice(index, 1);
                }
            }
            updateData(d.target.id);
            plotGPS();

        })
    var carOwnersFiltered = carOwners.filter(d => (carIds.includes(parseInt(d.CarID))));
    svg_cars.selectAll('.carIds')
        .data(carIds)
        .join('text')
        .attr('class', 'carIds')
        .attr('x', 45)
        // .attr('id', d => "car_"+d)
        .attr('y', (d, i) => (i + 1) * 25 + 15)
        .text(d => d)
        .on('click', (d, i) => {
            if (!selected_cars.includes(d.target.innerHTML)) {
                selected_cars.push(d.target.innerHTML);
                d3.selectAll("#car_"+d.target.innerHTML).style('opacity', 0.5);
            } else {
                var index = selected_cars.indexOf(d.target.innerHTML);
                if (index != -1) {
                    selected_cars.splice(index, 1);
                }
                d3.selectAll("#car_"+d.target.innerHTML).style('opacity', 0);
            }
            updateData(d.target.innerHTML);
            plotGPS();

        })

    svg_cars.selectAll('.carOwners')
        .data(carOwnersFiltered)
        .join('text')
        .attr('class', 'carOwners')
        .attr('x', 70)
        // .attr('id', d => "car_"+d.CarID)
        .attr('y', (d, i) => (i + 1) * 25 + 15)
        .text(d => d.FirstName + ' ' + d.LastName)
        .on('click', (d, i) => {
            if (!selected_cars.includes(d.target.__data__.CarID)) {
                selected_cars.push(d.target.__data__.CarID);
                d3.selectAll("#car_"+d.target.__data__.CarID).style('opacity', 0.5);
            } else {
                var index = selected_cars.indexOf(d.target.__data__.CarID);
                if (index != -1) {
                    selected_cars.splice(index, 1);
                    d3.selectAll("#car_"+d.target.__data__.CarID).style('opacity', 0);
                    //console.log(selected_cars);
                }
            }
            updateData(d.target.__data__.CarID);
            plotGPS();

        })

        
        
}

function updateData(car) {
    highlightInNetworkChartBasedOnSelection(car);
    // console.log(gdc[date.getDate()][1]);
    //console.log(gdc[date.getDate()][car]);
    if (selected_cars.includes(car)) {
        plotData[car] = gdc[date.getDate()][car];
        d3.selectAll("#car_"+car).style('opacity', 0.5);
    } else {
        delete plotData[car];
        d3.selectAll("#car_"+car).style('opacity', 0);
    }

    //console.log(plotData);
    mapdata = [];
    Object.entries(plotData).map(pd => {
        pd[1].map(item => {
            mapdata.push(item);
        });
    });
    //console.log(data);
    //console.log(Object.entries(data));
    // gpsData.map(gps => {
    //     if(selected_cars.includes(gps.id))
    //     data.push(gps);
    // })
    mapdata.sort(sortByTime);
    // console.log(data[0].Timestamp);
    // console.log(data[data.length-1].Timestamp);
    if (selected_cars.length != 0) {
        timeMinMax.min = new Date(mapdata[0].Timestamp)
        timeMinMax.max = new Date(mapdata[mapdata.length - 1].Timestamp);
    }

    // console.log(Object.values(timeMinMax));
}

function timelapse() {
    //data.sort(sortByTime);
    svg_map.selectAll('#timelinemin')
        .transition()
        .duration(mapdata.length * 5 + 500)
        .ease(d3.easeLinear)
        .attr('x1', xScale(+timeMinMax.max.getHours() + timeMinMax.max.getMinutes() / 60) -10)
        .attr('y1', mapheight + 10)
        .attr('x2', xScale(+timeMinMax.max.getHours() + timeMinMax.max.getMinutes() / 60)  -10)
        .attr('y2', mapheight + 30)
        .attr('stroke', 'red')
        .attr('stroke-width', '5px')
        .on('end', (d, i) => {
            svg_map.selectAll('#timelinemin')
                .attr('x1', xScale(+timeMinMax.min.getHours() + timeMinMax.min.getMinutes() / 60) -10)
                .attr('y1', mapheight +10)
                .attr('x2', xScale(+timeMinMax.min.getHours() + timeMinMax.min.getMinutes() / 60) -10)
                .attr('y2', mapheight + 30)
                .attr('stroke', 'red')
                .attr('stroke-width', '5px')
        })

    svg_map.selectAll('.gps').remove();

    svg_map.selectAll('.gps')
        .data(mapdata)
        .join(
            function (enter) {
                return enter
                    .append('circle')
                    .style('opacity', 0)
                    .style('fill', 'black');
            }
        )
        .attr('class', 'gps')
        .attr('cx', d => abilaProjection([+d.long, +d.lat])[0])
        .attr('cy', d => abilaProjection([+d.long, +d.lat])[1])
        .attr('r', 3)
        .transition()
        .duration(1000)
        .delay(function (d, i) {
            return i * 5;
        })
        .style('opacity', 0.5)
        .style('fill', (d => mapcolor(d.id)))


}

function dateOnChange(input) {
    date = new Date(input.value);
    date = new Date(+date + date.getTimezoneOffset() * 60000);
    plotData = {};
    selected_cars.map(sc => {
        plotData[sc] = gdc[date.getDate()][sc];
    })
    mapdata = [];
    Object.entries(plotData).map(pd => {
        pd[1].map(item => {
            mapdata.push(item);
        });
    });
    mapdata.sort(sortByTime);
    timeMinMax.min = new Date(mapdata[0].Timestamp)
    timeMinMax.max = new Date(mapdata[mapdata.length - 1].Timestamp);
    console.log(Object.values(timeMinMax));
    plotGPS();
}

function dragstarted() {

}

function dragged() {

}

function dragended() {

}
//module.exports = {selected_cars};
