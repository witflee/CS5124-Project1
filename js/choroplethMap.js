class ChoroplethMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 600,
      containerHeight: _config.containerHeight || 600,
      margin: _config.margin || {top: 0, right: 0, bottom: 50, left: -31},
      tooltipPadding: 10,
      legendBottom: 200,
      legendLeft: 420,
      legendRectHeight: 12, 
      legendRectWidth: 150
    }
    this.data = _data;
    this.fullData = _data; // Store full data for filtering
    this.initVis();
  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Initialize projection and path generator
    vis.projection = d3.geoMercator();
    vis.geoPath = d3.geoPath().projection(vis.projection);

    vis.colorScale = d3.scaleLinear()
        .range(['#cfe2f2', '#0d306b'])
        .interpolate(d3.interpolateHcl);


    // Initialize gradient that we will later use for the legend
    vis.linearGradient = vis.svg.append('defs').append('linearGradient')
        .attr("id", "legend-gradient");

    // Append legend
    vis.legend = vis.chart.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${vis.config.legendLeft},${vis.height - vis.config.legendBottom})`);
    
    vis.legendRect = vis.legend.append('rect')
        .attr('width', vis.config.legendRectWidth)
        .attr('height', vis.config.legendRectHeight);

    vis.legendTitle = vis.legend.append('text')
        .attr('class', 'legend-title')
        .attr('dy', '.35em')
        .attr('y', -10)
        // .text('Data Value')

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    const valueExtent = d3.extent(vis.data.objects.countries.geometries, d => d.properties.value);
    
    // Update color scale
    vis.colorScale.domain(valueExtent);

    // Define begin and end of the color gradient (legend)
    vis.legendStops = [
      { color: '#cfe2f2', value: valueExtent[0], offset: 0},
      { color: '#0d306b', value: valueExtent[1], offset: 100},
    ];

    vis.renderVis();
  }


  renderVis() {
    let vis = this;

    // Convert compressed TopoJSON to GeoJSON format
    const countries = topojson.feature(vis.data, vis.data.objects.countries)

    // Defines the scale of the projection so that the geometry fits within the SVG area
    vis.projection.fitSize([vis.width, vis.height], countries);

    // Append world map
    const countryPath = vis.chart.selectAll('.country')
        .data(countries.features)
      .join('path')
        .attr('class', 'country')
        .attr('d', vis.geoPath)
        .attr('fill', d => {
          if (d.properties.value) {
            return vis.colorScale(d.properties.value);
          } else {
            return 'url(#lightstripe)';
          }
        });

    countryPath
        .on('mousemove', (event,d) => {
          const dataValue = d.properties.value ? `${d.properties.value}` : 'No data available';
          const dataYear = d.properties.yearShown ? `${d.properties.yearShown}` : 'No data available';
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class="tooltip-title">${d.properties.name}</div>
              <div class="tooltip-label"><i>${dataYear}</i></div>
              <div>${dataValue}</div>
            `);
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        });
    
    // Dispatch a custom event when a country is clicked so other components can react
    countryPath.on('click', (event, d) => {
      const container = document.querySelector(vis.config.parentElement);
      if (container) {
        const selEvent = new CustomEvent('countrySelected', { detail: { code: d.id, name: d.properties.name } });
        container.dispatchEvent(selEvent);
      }
    });

    // Add legend labels
    vis.legend.selectAll('.legend-label')
        .data(vis.legendStops)
      .join('text')
        .attr('class', 'legend-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('y', 20)
        .attr('x', (d,index) => {
          return index == 0 ? 0 : vis.config.legendRectWidth;
        })
        .text(d => Math.round(d.value * 10 ) / 10);

    // Update gradient for legend
    vis.linearGradient.selectAll('stop')
        .data(vis.legendStops)
      .join('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

    vis.legendRect.attr('fill', 'url(#legend-gradient)');
  }

  /**
   * Filter data by selected years and update visualization
   * @param {Array} years - Array of year strings to display
   */
  filterByYears(years) {
    let vis = this;
    
    // Set the value property based on selected year(s)
    // If multiple years selected, calculate year-to-year difference between them
    vis.data.objects.countries.geometries.forEach(geometry => {
      if (geometry.properties.yearData) {
        const values = years
          .map(year => geometry.properties.yearData[year])
          .filter(v => v !== undefined && v !== null);

        if (values.length > 0) {
          // Get difference between values if multiple years are selected
          geometry.properties.value = values.reduce((a, b) => b - a, 0);
          geometry.properties.yearShown = years.length === 1 ? years[0] : years.join(', ');
        } else {
          geometry.properties.value = null;
          geometry.properties.yearShown = null;
        }
      }
    });
    
    vis.updateVis();
  }
}