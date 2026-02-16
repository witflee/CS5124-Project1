/**
 * Load data from CSV file asynchronously and render bar chart
 */
let barchartLife;
d3.csv('data/life-expectancy/life-expectancy.csv')
  .then(dataLife => {
    dataLife.forEach(d => {
      d.value = +d.value;
    });

    // Keep only data points from 2019
    dataLife = dataLife.filter(d => d.year === '2019');

    // keep only top 10 countries by life expectancy
    dataLife = dataLife.sort((a,b) => b.value - a.value).slice(0,10);

    // Sort data by life expectancy
    dataLife.sort((a,b) => b.value - a.value);
    
    // Initialize chart and then show it
    barchartLife = new Barchart({ parentElement: '#chart-life'}, dataLife);
    barchartLife.updateVis();

    // print total number of data points to console
    console.log(`Total number of data points: ${dataLife.length}`);
  })
  .catch(error => console.error(error));

  let barchartAir;
  d3.csv('data/pm25-air-pollution/pm25-air-pollution.csv')
  .then(dataAir => {
    dataAir.forEach(d => {
      d.value = +d.value;
    });

    // Keep only data points from 2019
    dataAir = dataAir.filter(d => d.year === '2019');

    // keep only top 10 countries by value
    dataAir = dataAir.sort((a,b) => b.value - a.value).slice(0,10);

    // Sort data by air quality
    dataAir.sort((a,b) => b.value - a.value);
    
    // Initialize chart and then show it
    barchartAir = new Barchart({ parentElement: '#chart-air'}, dataAir);
    barchartAir.updateVis();
    // print total number of data points to console
    console.log(`Total number of data points: ${dataAir.length}`);
  })
  .catch(error => console.error(error));

/**
 * Event listener: change ordering
 */
/*
var changeSortingOrder = d3.select("#change-sorting").on("click", function() {
    reverse = !reverse;
    updateVisualization();
});
*/

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