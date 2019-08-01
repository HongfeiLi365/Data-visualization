
var margin = {top: 30, right: 20, bottom: 100, left: 50},
    margin2 = {top: 140, right: 20, bottom: 20, left: 50},
    width = 800,
    height = 400,
    height_brushArea=200;


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
    
    
    var xRange = d3.extent(data, d => d.date);

    // x scale
    x = d3.scaleUtc()
    //.domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right]);

    x_brushArea = d3.scaleUtc()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right]);

    // price scale
    y_price = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.price)]).nice()
    .range([height - margin.bottom, margin.top])
    .interpolate(d3.interpolate);

    // rate scale
    y_rate = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.rate)]).nice()
    .range([height - margin.bottom, margin.top])
    .interpolate(d3.interpolate);

    // brush area scale
    y_brush =  d3.scaleLinear()
    .domain([0, d3.max(data, d => d.price)]).nice()
    .range([height - margin.bottom, height_brushArea])
    .interpolate(d3.interpolate);

    x.domain(xRange);


    // function to draw x axis
    xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    xAxis_brushArea = g => g
    .attr("transform", `translate(0,${height_brushArea+100})`)
    .call(d3.axisBottom(x_brushArea).ticks(width / 80).tickSizeOuter(0));

    // function to draw y axis
    yAxisLeft = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y_price));
    // .call(g => g.select(".domain").remove())
    // .call(g => g.select(".tick:last-of-type text").clone()
    //     .attr("x", 3)
    //     .attr("text-anchor", "start")
    //     .attr("font-weight", "bold")
    //     .text(data.y));

    yAxisRight = g => g
    .attr("transform", "translate(" + (width - margin.right) + ",0)")
    .call(d3.axisRight(y_rate));


    // define price line
    var priceLine = d3.line()
    .x(d => x(d.date))
    .y(d => y_price(d.price));

    var rateLine = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y_rate(d.rate); });


    var brushArea = d3.area()
    .x(function(d) { return x_brushArea(d.date); })
    .y0(height_brushArea+100)
    .y1(function(d) { return y_brush(d.price); });



    var svg = d3.select('#viz').append('svg')
    .attr('class', 'chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom + 60);

    var focus = svg.append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var context = svg.append('g')
    .attr('class', 'context')
    .attr('transform', 'translate(' + margin2.left + ',' + margin2.top + ')');

    var legend = svg.append('g')
    .attr('class', 'chart__legend')
    .attr('width', width)
    .attr('height', 30)
    .attr('transform', 'translate(' + margin2.left + ', 30)');

    
    var range = legend.append('text')
      .text(legendFormat(new Date(xRange[0])) + ' - ' + legendFormat(new Date(xRange[1])))
      .style('text-anchor', 'end')
      .attr('transform', 'translate(' + width + ', 0)');

      
     // draw x axis
    focus.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    // draw y axis (price)
    focus.append("g")
    .attr("class", "y axisLeft")
    .call(yAxisLeft); 

    // draw y axis (rate)
    focus.append("g")
    .attr("class", "y axisRight")
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
      .attr('transform', 'translate(' + width + ', 20)');

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
    .attr('width', width - margin.right)
    .attr('height', height - margin.bottom)
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

    context.append('path')
    .datum(data)
    .attr('class', 'chart__area area')
    .attr('d', brushArea);


    context.append('g')
    .attr('class', 'x axis chart__axis--context')
    .attr('y', 0)
    .attr('transform', 'translate(0,' + (height_brushArea - 22) + ')')
    .call(xAxis_brushArea);


    legend.append('text')
    .attr('class', 'chart__symbol')
    .text('S&P 500');

    var rangeSelection =  legend
    .append('g')
    .attr('class', 'chart__range-selection')
    .attr('transform', 'translate(110, 0)');


    var brush = d3.brushX(x_brushArea)
    .on('brush', brushed);

    
    var min = d3.min(data, d => d.price);
    var max = d3.max(data, d => d.price);


    function brushed() {
      var ext = brush.extent();
      if (d3.event.selection !== null) {
        console.log("inside if");
        x.domain(d3.event.selection === null ? x_brushArea.domain() : brush.extent());
        y_price.domain([
          d3.min(data, function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d.price : max; }),
          d3.max(data, function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d.price : min; })
        ]);

        y_rate.domain([
          d3.min(data, function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d.rate : max; }),
          d3.max(data, function(d) { return (d.date >= ext[0] && d.date <= ext[1]) ? d.rate : min; })
        ]);
        range.text(legendFormat(new Date(ext[0])) + ' - ' + legendFormat(new Date(ext[1])))
        //focusGraph.attr('x', function(d, i) { return x(d.date); });

        var days = Math.ceil((ext[1] - ext[0]) / (24 * 3600 * 1000))
        //focusGraph.attr('width', (40 > days) ? (40 - days) * 5 / 6 : 5)
      }

      priceChart.attr('d', priceLine);
      rateChart.attr('d', rateLine);
      focus.select('.x.axis').call(xAxis);
      focus.select('.y.axisLeft').call(yAxisLeft);
      focus.select('.y.axisRight').call(yAxisRight);
    }

    var dateRange = ['1w', '1m', '3m', '6m', '1y', '5y']
    for (var i = 0, l = dateRange.length; i < l; i ++) {
      var v = dateRange[i];
      rangeSelection
        .append('text')
        .attr('class', 'chart__range-selection')
        .text(v)
        .attr('transform', 'translate(' + (18 * i) + ', 0)')
        .on('click', function(d) { focusOnRange(this.textContent); });
    }

    function focusOnRange(range) {
      var today = new Date(data[data.length - 1].date);
      var ext = new Date(data[data.length - 1].date);

      var startDate = new Date('2008-01-02');
      var endDate = new Date('2009-01-07');
      if (range === '1m')
        ext.setMonth(ext.getMonth() - 1);

      if (range === '1w')
        ext.setDate(ext.getDate() - 7);

      if (range === '3m')
        ext.setMonth(ext.getMonth() - 3);

      if (range === '6m')
        ext.setMonth(ext.getMonth() - 6);

      if (range === '1y')
        ext.setFullYear(ext.getFullYear() - 1);

      if (range === '5y')
        //ext.setFullYear(ext.getFullYear() - 5);
        brush.extent([startDate, endDate]);

      //brush.extent([ext, today]);
      brushed();
      console.log("brush called");
    }
  
}


init();
