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
      containerWidth: _config.containerWidth || 370,
      containerHeight: _config.containerHeight || 320,
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
        .domain(['2010','2011','2012','2013','2014','2015','2016','2017','2018','2019']); // years in dataset

    // Important: we flip array elements in the y output range to position the rectangles correctly
    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]) 

    vis.xScale = d3.scaleBand()
      .range([0, vis.width])
      .paddingInner(0);

    // Sub-scale for grouping multiple years within each x band
    vis.xSub = d3.scaleBand()
      .padding(0);

    vis.xAxis = d3.axisBottom(vis.xScale)
        .tickSizeOuter(0)
        .tickFormat(d => ""); // Hide country names

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
    const entities = Array.from(new Set(vis.data.map(vis.xValue)));
    vis.xScale.domain(entities);

    // Determine selected years present in the data
    vis.selectedYears = Array.from(new Set(vis.data.map(d => String(vis.colorValue(d)))));
    vis.xSub.domain(vis.selectedYears).range([0, vis.xScale.bandwidth()]);

    vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]);

    vis.renderVis();
  }

  /**
   * Bind data to visual elements
   */
  renderVis() {
    let vis = this;

    // Create groups for each entity and bind values per entity
    const grouped = Array.from(d3.group(vis.data, vis.xValue), ([key, values]) => ({ key, values }));

    const groups = vis.chart.selectAll('.bar-group')
      .data(grouped, d => d.key)
      .join(
        enter => enter.append('g').attr('class', 'bar-group'),
        update => update,
        exit => exit.remove()
      );

    groups.attr('transform', d => `translate(${vis.xScale(d.key)},0)`);

    // Within each group, create/update rects for each year
    groups.each(function(d) {
      const g = d3.select(this);
      const rects = g.selectAll('rect').data(d.values, v => v.year + '-' + v.entity);

      rects.join(
        enter => enter.append('rect')
          .attr('class', 'bar')
          .attr('x', v => vis.xSub(String(vis.colorValue(v))))
          .attr('width', vis.xSub.bandwidth())
          .attr('y', vis.height)
          .attr('height', 0)
          .attr('fill', v => vis.colorScale(String(vis.colorValue(v))))
          .style('opacity', 0.8)
          .call(enter => enter.transition().duration(800)
            .attr('y', v => vis.yScale(vis.yValue(v)))
            .attr('height', v => vis.height - vis.yScale(vis.yValue(v)))
          ),
        update => update.call(update => update.transition().duration(800)
            .attr('x', v => vis.xSub(String(vis.colorValue(v))))
            .attr('width', vis.xSub.bandwidth())
            .attr('y', v => vis.yScale(vis.yValue(v)))
            .attr('height', v => vis.height - vis.yScale(vis.yValue(v)))
            .attr('fill', v => vis.colorScale(String(vis.colorValue(v))))
          ),
        exit => exit.call(exit => exit.transition().duration(400).attr('height',0).attr('y',vis.height).remove())
      );
    });
    
    // Tooltip event listeners on individual rects
    vis.chart.selectAll('.bar')
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