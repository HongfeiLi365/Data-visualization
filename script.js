
var margin = {top: 30, right: 20, bottom: 100, left: 50},
    margin2 = {top: 230, right: 20, bottom: 20, left: 50},
    width = 800,
    height = 400;



var parseDate = d3.timeParse('%m/%d/%Y'),
    legendFormat = d3.timeFormat('%b %d, %Y');

function type(d) {
    return {
      date    : parseDate(d.Date),
      price   : +d.Close,
      rate : +d.FEDFUNDS,
    }
  }



async function init() {
    data = await d3.csv("https://raw.githubusercontent.com/HongfeiLi365/Data-visualization/master/data/history.csv", type);
    console.log(data);



    x = d3.scaleUtc()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right]);

    y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.price)]).nice()
    .range([height - margin.bottom, margin.top]);


    xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(data.y));

    priceLine = d3.line()
    .defined(d => !isNaN(d.price))
    .x(d => x(d.date))
    .y(d => y(d.price));

    var svg = d3.select('#viz').append('svg')
    .attr('class', 'chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom + 60);

    var focus = svg.append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


     // draw x axis
    focus.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    // draw y axis
    focus.append("g")
    .attr("class", "y axis")
    .call(yAxis); 


    focus.append("path")
    .datum(data) // 10. Binds data to the line 
    .attr("class", "chart__line chart__price--focus line") // Assign a class for styling 
    .attr("d", priceLine); // 11. Calls the line generator 


    var legend = svg.append('g')
    .attr('class', 'chart__legend')
    .attr('width', width)
    .attr('height', 30)
    .attr('transform', 'translate(' + margin2.left + ', 10)');

    legend.append('text')
    .attr('class', 'chart__symbol')
    .text('SPY')
}


init();
