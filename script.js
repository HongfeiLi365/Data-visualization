
var margin = {top: 30, right: 20, bottom: 100, left: 30},
    margin2 = {top: 140, right: 20, bottom: 20, left: 30},
    width = 700,
    height = 400,
    height_brushArea=200;


var parseDate = d3.timeParse('%m/%d/%Y'),
    bisectDate = d3.bisector(function(d) { return d.date; }).left,
    legendFormat = d3.timeFormat('%b %d, %Y'),
    priceFormat = d3.format(".1f");

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
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right]);

    // x_brushArea = d3.scaleUtc()
    // .domain(d3.extent(data, d => d.date))
    // .range([margin.left, width - margin.right]);

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

    // // brush area scale
    // y_brush =  d3.scaleLinear()
    // .domain([0, d3.max(data, d => d.price)]).nice()
    // .range([height - margin.bottom, height_brushArea])
    // .interpolate(d3.interpolate);


    // function to draw x axis
    xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

    // xAxis_brushArea = g => g
    // .attr("transform", `translate(0,${height_brushArea+100})`)
    // .call(d3.axisBottom(x_brushArea).ticks(width / 80).tickSizeOuter(0));

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
    //.defined(d => !isNaN(d.value))
    .x(d => x(d.date))
    .y(d => y_price(d.price));

    var rateLine = d3.line()
    //.defined(d => !isNaN(d.value))
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y_rate(d.rate); });


    // var brushArea = d3.area()
    // .x(function(d) { return x_brushArea(d.date); })
    // .y0(height_brushArea+100)
    // .y1(function(d) { return y_brush(d.price); });



    var svg = d3.select('#viz').append('svg')
    .attr('class', 'chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom + 60);

    svg.append('defs').append('clipPath')
    .attr('id', 'clip')
  .append('rect')
    .attr('x', margin.left)
    .attr('width', width - margin.right - margin.left)
    .attr('height', height);

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
    .text('Mouse over plot to see details!');

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
    .attr('x', margin.left)
    .attr('class', 'chart__overlay')
    .attr('width', width - margin.right - margin.left)
    .attr('height', height - margin.bottom)
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .on('mouseover', function() {
      helper.style('display', null);
      priceTooltip.style('display', null);
      rateTooltip.style('display', null);
    })
    .on('mouseout', function() {
      //helper.style('display', 'none');
      helperText.text('Mouse over plot to see details!');
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
      helperText.text(legendFormat(new Date(d.date)) + ' - S&P 500: ' + priceFormat(d.price) + ' Interest Rate: ' + d.rate);
      priceTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y_price(d.price) + ')');
      rateTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y_rate(d.rate) + ')');
    }

    // context.append('path')
    // .datum(data)
    // .attr('class', 'chart__area area')
    // .attr('d', brushArea);


    // context.append('g')
    // .attr('class', 'x axis chart__axis--context')
    // .attr('y', 0)
    // .attr('transform', 'translate(0,' + (height_brushArea - 22) + ')')
    // .call(xAxis_brushArea);


    legend.append('text')
    .attr('class', 'chart__symbol')
    .text('Select Recession Periods:');

    var rangeSelection =  legend
    .append('g')
    .attr('class', 'chart__range-selection')
    .attr('transform', 'translate(110, 0)');

  


    function changeRange(startDate, endDate, annotations){

      x.domain([startDate, endDate]).nice();
      y_price.domain([
        d3.min(data, function(d) { return (d.date >= startDate && d.date <= endDate) ? d.price : 3015; }),
        d3.max(data, function(d) { return (d.date >= startDate && d.date <= endDate) ? d.price : 0; })
      ]).nice();

      y_rate.domain([
        d3.min(data, function(d) { return (d.date >=startDate && d.date <= endDate) ? d.rate : 6.0; }),
        d3.max(data, function(d) { return (d.date >= startDate && d.date <= endDate) ? d.rate : 0; })
      ]).nice();
      range.text(legendFormat(new Date(startDate)) + ' - ' + legendFormat(new Date(endDate)));
      

      priceChart.attr('d', priceLine);
      rateChart.attr('d', rateLine);
      focus.select('.x.axis').call(xAxis);

      focus.select('.y.axisLeft').call(yAxisLeft);
      focus.select('.y.axisRight').call(yAxisRight);

      d3.select('#annotation').remove();

      // x: x(data[d3.scan(data, function(a,b){return a.price - b.price;})].date),
      // y: y_price(d3.min(data, d=>d.price))

      var makeAnnotations = d3.annotation()
      .annotations(annotations)

      theAnnotation = focus.append("g")
        .attr("id", "annotation")
        .call(makeAnnotations)

     
    }

    var dateRange = ['1990', '2002', '2008']
    for (var i = 0, l = dateRange.length; i < l; i ++) {
      var v = dateRange[i];
      rangeSelection
        .append('text')
        .attr('class', 'chart__range-selection')
        .text(v)
        .attr('transform', 'translate(' + (60 + (40 * i)) + ', 0)')
        .on('click', function(d) { focusOnRange(this.textContent); });
    }

    function focusOnRange(range) {
      if (range === '1990'){
        const annotations = [
          {
            note: {
              label: "Stock Market Lowest Point",
              title: "Oct 11, 1990",
              align: "middle"
            },
            connector: {
              end: "arrow",        // none, or arrow or dot
              type: "line",       // Line or curve
              endScale: 1,           // Number of break in the curve
              lineType : "horizontal"
            },
            color: ["Black"],
            x: 285,
            y: 270,
            dy: -100,
            dx: 0
          },

          {
            note: {
              label: "Fed started cutting rate significantly",
              title: "Nov, 1990"
              
            },
            connector: {
              end: "arrow",        // none, or arrow or dot
              type: "line",       // Line or curve
              endScale: 1,           // Number of break in the curve
              lineType : "horizontal"
            },
            color: ["Black"],
            x: 305,
            y: 55,
            dy: 0,
            dx: 40
          }
        ]

        changeRange(new Date('1990-01-02'), new Date('1991-12-31'), annotations);
      }


      if (range === '2002'){
        const annotations = [
          {
            note: {
              label: "Stock Market Lowest Point",
              title: "Oct 07, 2002",
              align: "middle"
          
            },
            connector: {
              end: "arrow",        // none, or arrow or dot
              type: "line",       // Line or curve
              endScale: 1,           // Number of break in the curve
              lineType : "horizontal"
            },
            color: ["Black"],
            x: 278,
            y: 250,
            dy: -100,
            dx: 0
          },
          {
            note: {
              label: "Fed started cutting rate significantly",
              title: "Nov, 2002"
              
            },
            connector: {
              end: "arrow",        // none, or arrow or dot
              type: "line",       // Line or curve
              endScale: 1,           // Number of break in the curve
              lineType : "horizontal"
            },
            color: ["Black"],
            x: 308,
            y: 45,
            dy: 0,
            dx: 40
          }
        ]


        changeRange(new Date('2002-01-02'), new Date('2003-12-31'), annotations);
      }

      if (range === '2008'){
        const annotations = [
          {
            note: {
              label: "Stock Market Lowest Point",
              title: "May 06, 2009",
              align: "middle"
            },
            connector: {
              end: "arrow",        // none, or arrow or dot
              type: "line",       // Line or curve
              endScale: 1,           // Number of break in the curve
              lineType : "horizontal"
            },
            color: ["Black"],
            x: 412,
            y: 250,
            dy: -100,
            dx: 0
          },
          {
            note: {
              label: "Fed started cutting rate significantly",
              title: "Oct, 2008"
              
            },
            connector: {
              end: "arrow",        // none, or arrow or dot
              type: "line",       // Line or curve
              endScale: 1,           // Number of break in the curve
              lineType : "horizontal"
            },
            color: ["Black"],
            x: 270,
            y: 182,
            dy: 0,
            dx: -30
          }
        ]

        changeRange(new Date('2008-01-02'), new Date('2009-12-31'), annotations);
      }


    }

    focusOnRange('1990');
}

init();

