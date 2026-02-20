/**
 * Load data from CSV file asynchronously and render bar chart
 */

/* =-=-=-= LEVEL ONE GOALS =-=-=-= */

// histogram for life expectancy
let barchartLife;
d3.csv('data/life-expectancy/life-truncated.csv')
  .then(dataLife => {
    dataLife.forEach(d => {
      d.value = +d.value;
    });

    // Keep only data points from 2019
    dataLife = dataLife.filter(d => d.year === '2019');

    // keep only top 10 countries by life expectancy
    // dataLife = dataLife.sort((a,b) => b.value - a.value).slice(0,10);

    // Sort data by life expectancy
    dataLife.sort((a,b) => b.value - a.value);
    
    // Initialize chart and then show it
    barchartLife = new Barchart({ parentElement: '#chart-life'}, dataLife);
    barchartLife.updateVis();

    // print total number of data points to console
    console.log(`Total number of data points: ${dataLife.length}`);
  })
  .catch(error => console.error(error));

// histogram for air pollution
let barchartAir;
d3.csv('data/pm25-air-pollution/pm25-air-pollution.csv')
  .then(dataAir => {
    dataAir.forEach(d => {
      d.value = +d.value;
    });

    // Keep only data points from 2019
    dataAir = dataAir.filter(d => d.year === '2019');

    // keep only top 10 countries by value
    // dataAir = dataAir.sort((a,b) => b.value - a.value).slice(0,10);

    // Sort data by air quality
    dataAir.sort((a,b) => b.value - a.value);
    
    // Initialize chart and then show it
    barchartAir = new Barchart({ parentElement: '#chart-air'}, dataAir);
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
d3.csv('data/combined.csv')
  .then(data => {
    // Convert strings to numbers
    data.forEach(d => {
      d.expectancy = +d.expectancy; // life expectancy
      d.concentration = +d.concentration; // PM2.5 concentration
    });

    // Keep only data points from 2019
    data = data.filter(d => d.year === '2019');
    
    // Initialize chart
    const scatterplot = new Scatterplot({ parentElement: '#scatterplot'}, data);
    
    // Show chart
    scatterplot.updateVis();
  })
  .catch(error => console.error(error));

/**
 * Event listener: use color legend as filter
 */
d3.selectAll('.legend-btn').on('click', function() {
  // Toggle 'inactive' class
  d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));
  
  // Check which categories are active
  let selectedDifficulty = [];
  d3.selectAll('.legend-btn:not(.inactive)').each(function() {
    selectedDifficulty.push(d3.select(this).attr('data-difficulty'));
  });

  // Filter data accordingly and update vis
  scatterplot.data = data.filter(d => selectedDifficulty.includes(d.difficulty));
  scatterplot.updateVis();
});

/* =-=-=-= LEVEL TWO GOALS =-=-=-= */

// Vis 4 and 5: add chloropleth maps to show the same info as the bar charts
// Lay out visualizations in an organized way


/* =-=-=-= LEVEL THREE GOALS =-=-=-= */

// Surprise 3rd dataset!
// User should be able to toggle between multiple attributes to display


/* =-=-=-= LEVEL FOUR GOALS =-=-=-= */

// Add detail-on-demand interactions to the map, showing information about the selected county
// Add detail-on-demand interactions to the distribution visualizations, showing the value and range of the selected bar
// Add detail-on-demand interactions to the correlation visualizations, showing information about the selected county


/* =-=-=-= LEVEL FIVE GOALS =-=-=-= */

// Allow user to brush within data to show set of countries (highlight selected or filter others out) in all visualizations


/* =-=-=-= LEVEL SIX GOALS =-=-=-= */

// Allow user to select a year and show the data for that year in all visualizations (instead of just 2019)

/**
 * Event listener: change ordering
 */
/*
var changeSortingOrder = d3.select("#change-sorting").on("click", function() {
    reverse = !reverse;
    updateVisualization();
});
*/

