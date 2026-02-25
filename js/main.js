/**
 * Load data from CSV file asynchronously and render bar chart
 */

/* =-=-=-= LEVEL ONE GOALS =-=-=-= */

// histogram for life expectancy
let dataLife, barchartLife;
d3.csv('data/life-expectancy/life-truncated.csv')
  .then(_data => {
    dataLife = _data;
    dataLife.forEach(d => {
      d.value = +d.value;
    });

    // Sort data by life expectancy
    dataLife.sort((a,b) => b.value - a.value);
    
    // Initialize chart and then show it
    barchartLife = new Barchart({ parentElement: '#chart-life'}, dataLife);

    // Make only 2019 active at the start
    d3.selectAll('.legend-btn').classed('inactive', true);
    d3.select('.legend-btn[data-year="2019"]').classed('inactive', false); 
    toggleYear.push("2019");
    barchartLife.data = dataLife.filter(d => toggleYear.includes(d.year));

    barchartLife.updateVis();

    // print total number of data points to console
    console.log(`Total number of data points: ${dataLife.length}`);
  })
  .catch(error => console.error(error));

// histogram for air pollution
let dataAir, barchartAir;
d3.csv('data/pm25-air-pollution/pm25-air-pollution.csv')
  .then(_data => {
    dataAir = _data;
    dataAir.forEach(d => {
      d.value = +d.value;
    });

    // Sort data by air quality
    dataAir.sort((a,b) => b.value - a.value);
    
    // Initialize chart and then show it
    barchartAir = new Barchart({ parentElement: '#chart-air'}, dataAir);

    // Make only 2019 active at the start
    d3.selectAll('.legend-btn').classed('inactive', true);
    d3.select('.legend-btn[data-year="2019"]').classed('inactive', false); 
    barchartAir.data = dataAir.filter(d => toggleYear.includes(d.year));

    barchartAir.updateVis();
    // print total number of data points to console
    console.log(`Total number of data points: ${dataAir.length}`);
  })
  .catch(error => console.error(error));

// Attach sorting toggles for each chart's button
d3.select('#sorting-life').on('click', () => {
  if (barchartLife) {
    barchartLife.config.reverseOrder = true;
    barchartLife.updateVis();
  }
});

d3.select('#sorting-air').on('click', () => {
  if (barchartAir) {
    barchartAir.config.reverseOrder = true;
    barchartAir.updateVis();
  }
});

// scatterplot for life expectancy vs air pollution
let dataBoth, scatterplot, toggleYear = [];
d3.csv('data/combined.csv')
  .then(_data => {
    dataBoth = _data;
    // Convert strings to numbers
    dataBoth.forEach(d => {
      d.expectancy = +d.expectancy; // life expectancy
      d.concentration = +d.concentration; // PM2.5 concentration
    });
    
    // Initialize chart
    scatterplot = new Scatterplot({ parentElement: '#scatterplot'}, dataBoth);

    // Make only 2019 active at the start
    d3.selectAll('.legend-btn').classed('inactive', true);
    d3.select('.legend-btn[data-year="2019"]').classed('inactive', false); 
    scatterplot.data = dataBoth.filter(d => toggleYear.includes(d.year));
    
    // Show chart
    scatterplot.updateVis();
  })
  .catch(error => console.error(error));

/* =-=-=-= LEVEL TWO GOALS =-=-=-= */

// Vis 4 and 5: add chloropleth maps to show the same info as the bar charts
// Lay out visualizations in an organized way

// Add first map for life expectancy
let choroplethMapLife;
Promise.all([
  d3.json('data/world.json'),
  d3.csv('data/life-expectancy/life-truncated.csv')
]).then(dataChoro => {
  const geoData = dataChoro[0];
  const countryData = dataChoro[1];

  // Combine both datasets by adding the life expectancy to the TopoJSON file
  geoData.objects.countries.geometries.forEach(d => {
    d.properties.yearData = {};
    for (let i = 0; i < countryData.length; i++) {
      if (d.id == countryData[i].code) {
        d.properties.yearData[countryData[i].year] = +countryData[i].value;
      }
    }
  });

  choroplethMapLife = new ChoroplethMap({ 
    parentElement: '#map-life'
  }, geoData);
  
  // Apply initial year filter
  choroplethMapLife.filterByYears(toggleYear.length > 0 ? toggleYear : ["2019"]);
})
.catch(error => console.error(error));

// Add second map for air pollution
let choroplethMapAir;
Promise.all([
  d3.json('data/world.json'),
  d3.csv('data/pm25-air-pollution/pm25-air-pollution.csv')
]).then(dataChoro => {
  const geoData = dataChoro[0];
  const countryData = dataChoro[1];

  // Combine both datasets by adding the pollution to the TopoJSON file
  geoData.objects.countries.geometries.forEach(d => {
    d.properties.yearData = {};
    for (let i = 0; i < countryData.length; i++) {
      if (d.id == countryData[i].code) {
        d.properties.yearData[countryData[i].year] = +countryData[i].value;
      }
    }
  });

  choroplethMapAir = new ChoroplethMap({ 
    parentElement: '#map-air'
  }, geoData);
  
  // Apply initial year filter
  choroplethMapAir.filterByYears(toggleYear.length > 0 ? toggleYear : ["2019"]);
})
.catch(error => console.error(error));


/* =-=-=-= LEVEL THREE GOALS =-=-=-= */

// User should be able to toggle between multiple attributes to display


/* =-=-=-= LEVEL FOUR GOALS =-=-=-= */

// Add detail-on-demand interactions to the map, showing information about the selected county
// Add detail-on-demand interactions to the distribution visualizations, showing the value and range of the selected bar
// Add detail-on-demand interactions to the correlation visualizations, showing information about the selected county

// Goal accomplished by tooltips on hover


/* =-=-=-= LEVEL FIVE GOALS =-=-=-= */

// Allow user to brush within data to show set of countries (highlight selected or filter others out) in all visualizations


/* =-=-=-= LEVEL SIX GOALS =-=-=-= */

// Allow user to select a year and show the data for that year in all visualizations (instead of just 2019)

/**
 * Event listener: use color legend as filter
 */
d3.selectAll('.legend-btn').on('click', function() {
  // Toggle 'inactive' class
  d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));
  
  // Check which categories are active
  toggleYear = [];
  d3.selectAll('.legend-btn:not(.inactive)').each(function() {
    toggleYear.push(d3.select(this).attr('data-year'));
  });
  console.log(toggleYear);

  // Filter data accordingly and update vis
  scatterplot.data = dataBoth.filter(d => toggleYear.includes(d.year));
  barchartLife.data = dataLife.filter(d => toggleYear.includes(d.year));
  barchartAir.data = dataAir.filter(d => toggleYear.includes(d.year));
  barchartLife.updateVis();
  barchartAir.updateVis();
  scatterplot.updateVis();
  
  // Update choropleth maps with selected years
  if (choroplethMapLife) {
    choroplethMapLife.filterByYears(toggleYear);
  }
  if (choroplethMapAir) {
    choroplethMapAir.filterByYears(toggleYear);
  }
});

/**
 * Event listener: change ordering
 */
/*
var changeSortingOrder = d3.select("#change-sorting").on("click", function() {
    reverse = !reverse;
    updateVisualization();
});
*/

