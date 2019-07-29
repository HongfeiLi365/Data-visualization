
var margin = {top: 30, right: 20, bottom: 100, left: 50},
    margin2 = {top: 230, right: 20, bottom: 20, left: 50},
    width = 800,
    height = 400;



var parseDate = d3.timeParse('%Y-%m-%d'),
    bisectDate = d3.bisector(function(d) { return d.date; }).left,
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


    // x scale
    x = d3.scaleUtc()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right]);

    // price scale
    y_price = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.price)]).nice()
    .range([height - margin.bottom, margin.top]);

    // rate scale
    y_rate = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.rate)]).nice()
    .range([height - margin.bottom, margin.top]);

    // function to draw x axis
    xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    // function to draw y axis
    yAxisLeft = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y_price))
    // .call(g => g.select(".domain").remove())
    // .call(g => g.select(".tick:last-of-type text").clone()
    //     .attr("x", 3)
    //     .attr("text-anchor", "start")
    //     .attr("font-weight", "bold")
    //     .text(data.y));

    yAxisRight = g => g
    .attr("transform", "translate(" + (width - margin.right) + ",0)")
    .call(d3.axisRight(y_rate))


    // define price line
    var priceLine = d3.line()
    .defined(d => !isNaN(d.price))
    .x(d => x(d.date))
    .y(d => y_price(d.price));

    var rateLine = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y_rate(d.rate); });

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

    // draw y axis (price)
    focus.append("g")
    .attr("class", "y axis")
    .call(yAxisLeft); 

    // draw y axis (rate)
    focus.append("g")
    .attr("class", "y axis")
    .call(yAxisRight); 


    var priceChart = focus.append("path")
    .datum(data) 
    .attr("class", "chart__line chart__price--focus line") 
    .attr("d", priceLine); 

    var rateChart = focus.append("path")
    .datum(data) 
    .attr("class", "chart__line chart__rate--focus line") 
    .attr("d", rateLine); 

    var helper = focus.append('g')
      .attr('class', 'chart__helper')
      .style('text-anchor', 'end')
      .attr('transform', 'translate(' + width + ', 0)');

    var helperText = helper.append('text')

    var priceTooltip = focus.append('g')
    .attr('class', 'chart__tooltip--price')
    .append('circle')
    .style('display', 'none')
    .attr('r', 2.5);

  var rateTooltip = focus.append('g')
    .attr('class', 'chart__tooltip--rate')
    .append('circle')
    .style('display', 'none')
    .attr('r', 2.5);

  var mouseArea = svg.append('g')
    .attr('class', 'chart__mouse')
    .append('rect')
    .attr('class', 'chart__overlay')
    .attr('width', width)
    .attr('height', height)
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .on('mouseover', function() {
      helper.style('display', null);
      priceTooltip.style('display', null);
      rateTooltip.style('display', null);
    })
    .on('mouseout', function() {
      helper.style('display', 'none');
      priceTooltip.style('display', 'none');
      rateTooltip.style('display', 'none');
    })
    .on('mousemove', mousemove);


    function mousemove() {
      var x0 = x.invert(d3.mouse(this)[0]);
      var i = bisectDate(data, x0, 1);
      var d0 = data[i - 1];
      var d1 = data[i];
      var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      helperText.text(legendFormat(new Date(d.date)) + ' - S&P 500: ' + d.price + ' Interest Rate: ' + d.rate);
      priceTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y_price(d.price) + ')');
      rateTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y_rate(d.rate) + ')');
    }

    var legend = svg.append('g')
    .attr('class', 'chart__legend')
    .attr('width', width)
    .attr('height', 30)
    .attr('transform', 'translate(' + margin2.left + ', 30)');

    legend.append('text')
    .attr('class', 'chart__symbol')
    .text('S&P 500')
}


init();
