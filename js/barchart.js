class Barchart {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 600,
      containerHeight: _config.containerHeight || 500,
      margin: _config.margin || {top: 10, right: 5, bottom: 25, left: 30},
      reverseOrder: _config.reverseOrder || false,
      tooltipPadding: _config.tooltipPadding || 15
    }
    this.data = _data;
    this.initVis();
  }
  
  /**
   * Initialize scales/axes and append static elements, such as axis titles
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Initialize scales and axes
     vis.colorScale = d3.scaleOrdinal()
        .range(['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd']) // colorbrewer colors
        .domain([2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]); // years in dataset

    // Important: we flip array elements in the y output range to position the rectangles correctly
    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]) 

    vis.xScale = d3.scaleBand()
        .range([0, vis.width])
        .paddingInner(0);

    vis.xAxis = d3.axisBottom(vis.xScale)
        .tickSizeOuter(0)
        // .tickFormat(d => d.length > 10 ? d.slice(0,10) + '...' : d); // Shorten long country names
        .tickFormat(d => ""); // Show full country names

    vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(10)
        .tickSizeOuter(0)
        .tickFormat(d3.formatPrefix('.0s', 1e1)); // Format y-axis ticks as tens

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // SVG Group containing the actual chart; D3 margin convention
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);
    
    // Append y-axis group 
    vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis');
  }

  /**
   * Prepare data and scales before we render it
   */
  updateVis() {
    let vis = this;

    // Reverse column order depending on user selection
    if (vis.config.reverseOrder) {
      vis.data.reverse();
    }

    // Specificy x- and y-accessor functions
    vis.colorValue = d => d.year;
    vis.xValue = d => d.entity;
    vis.yValue = d => d.value;

    // Set the scale input domains
    vis.xScale.domain(vis.data.map(vis.xValue));
    vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]);

    vis.renderVis();
  }

  /**
   * Bind data to visual elements
   */
  renderVis() {
    let vis = this;

    // let length = vis.data.length;
    // let total = vis.xScale.domain().length*10;
    // let adjusted = (vis.data.length)/(vis.xScale.domain().length);

    // Add rectangles
    let bars = vis.chart.selectAll('.bar')
        .data(vis.data, vis.xValue)
      .join('rect');
    
    bars.style('opacity', 0.5)
      .transition().duration(1000)
        .style('opacity', 1)
        .attr('class', 'bar')
        .attr('x', d => vis.xScale(vis.xValue(d)))
        .attr('width', vis.xScale.bandwidth())
        .attr('height', d => vis.height - vis.yScale(vis.yValue(d)))
        .attr('y', d => vis.yScale(vis.yValue(d)))
        .attr('fill', d => vis.colorScale(vis.colorValue(d)));

    // console.log("length: "+length);
    // console.log("total: "+total);
    // console.log("adjusted: " + (vis.data.length)/(vis.xScale.domain().length));
    
    // Tooltip event listeners
    bars
        .on('mouseover', (event,d) => {
          d3.select('#tooltip')
            .style('display', 'block')
            // Format number with million and thousand separator
            .html(`
              <div class="tooltip-title">${d.entity}</div>
              <div class="tooltip-label"><i>${d.year}</i></div>
              <div>${d3.format(',.2f')(vis.yValue(d))}</div>`);
        })
        .on('mousemove', (event) => {
          d3.select('#tooltip')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        });

    // Update axes
    vis.xAxisG
        .transition().duration(1000)
        .call(vis.xAxis);

    vis.yAxisG.call(vis.yAxis);
  }
}