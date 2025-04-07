/**
 * UI - Module for handling user interface interactions
 */
const UI = (() => {
    // DOM elements
    let dateForm;
    let startDateInput;
    let endDateInput;
    let loadingEl;
    let resultsEl;
    let topPredictionEl;
    let runnerUpCountEl;
    let runnerUpsEl;
    let dataTableBody;
    let tabs;
    let tabContents;
    let statusContainer;
    let dataSourceInfo;
    
    // Charts
    let frequencyChart;
    
    // Store predictions for later use
    let currentPredictions = [];
    let currentAnalysis = null;
    let dataSource = "";
    
    /**
     * Initialize the UI
     */
    const init = () => {
        // Get DOM elements
        dateForm = document.getElementById('date-form');
        startDateInput = document.getElementById('start-date');
        endDateInput = document.getElementById('end-date');
        loadingEl = document.getElementById('loading');
        resultsEl = document.getElementById('results');
        topPredictionEl = document.getElementById('top-prediction');
        runnerUpCountEl = document.getElementById('runner-up-count');
        runnerUpsEl = document.getElementById('runner-ups');
        dataTableBody = document.querySelector('#data-table tbody');
        tabs = document.querySelectorAll('.tab');
        tabContents = document.querySelectorAll('.tab-content');
        statusContainer = document.getElementById('status-container');
        dataSourceInfo = document.getElementById('data-source-info');
        
        // Set default date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        endDateInput.value = formatDate(today);
        startDateInput.value = formatDate(thirtyDaysAgo);
        
        // Add event listeners
        dateForm.addEventListener('submit', handleFormSubmit);
        runnerUpCountEl.addEventListener('change', handleRunnerUpChange);
        
        // Tab navigation
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId) {
                        content.classList.add('active');
                    }
                });
            });
        });
        
        // Set up initial status message
        showStatusMessage("Ready to analyze Powerball data. Select a date range to begin.", "status");
    };
    
    /**
     * Format date as YYYY-MM-DD
     * @param {Date} date - Date object
     * @returns {string} - Formatted date string
     */
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    /**
     * Show status message
     * @param {string} message - Message to display
     * @param {string} type - Type of message ('status' or 'error')
     */
    const showStatusMessage = (message, type = "status") => {
        statusContainer.innerHTML = '';
        
        const messageEl = document.createElement('div');
        messageEl.className = type === "error" ? "error-message" : "status-message";
        messageEl.textContent = message;
        
        statusContainer.appendChild(messageEl);
    };
    
    /**
     * Handle form submission
     * @param {Event} e - Form submission event
     */
    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        if (!startDate || !endDate) {
            showStatusMessage('Please select both start and end dates', 'error');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            showStatusMessage('Start date must be before end date', 'error');
            return;
        }
        
        // Show loading state
        loadingEl.style.display = 'block';
        resultsEl.style.display = 'none';
        showStatusMessage("Fetching and analyzing Powerball data...", "status");
        
        // Get the content for parsing
        const providedContent = document.querySelector('#powerball-content')?.value;
        
        // Fetch and analyze data
        PowerballData.fetchData(startDate, endDate, providedContent)
            .then(result => {
                const { data, source } = result;
                
                if (!data || data.length === 0) {
                    showStatusMessage('No drawing data found for the selected date range', 'error');
                    loadingEl.style.display = 'none';
                    return;
                }
                
                // Save data source for display
                dataSource = source;
                
                showStatusMessage(`Analyzing ${data.length} Powerball drawings...`, "status");
                
                // Analyze the data
                const analysis = Analyzer.analyzeData(data);
                currentAnalysis = analysis;
                
                // Generate predictions
                const predictions = Predictor.generatePredictions(analysis, 11);
                currentPredictions = predictions;
                
                // Display results
                displayPredictions(predictions);
                displayAnalysis(analysis);
                displayRawData(data);
                
                // Update data source info
                updateDataSourceInfo(data.length, source);
                
                // Hide loading, show results
                loadingEl.style.display = 'none';
                resultsEl.style.display = 'block';
                showStatusMessage(`Analysis complete! Found patterns in ${data.length} Powerball drawings.`, "status");
            })
            .catch(error => {
                console.error('Error:', error);
                showStatusMessage(`An error occurred: ${error.message}`, 'error');
                loadingEl.style.display = 'none';
            });
    };
    
    /**
     * Update data source information
     * @param {number} count - Number of drawings
     * @param {string} source - Source of the data
     */
    const updateDataSourceInfo = (count, source) => {
        if (dataSourceInfo) {
            dataSourceInfo.innerHTML = `
                <p class="data-source">Analyzing ${count} drawings from ${source}</p>
            `;
        }
    };
    
    /**
     * Handle runner-up count change
     */
    const handleRunnerUpChange = () => {
        const count = parseInt(runnerUpCountEl.value);
        displayRunnerUps(currentPredictions, count);
    };
    
    /**
     * Display predictions
     * @param {Array} predictions - Array of prediction objects
     */
    const displayPredictions = (predictions) => {
        // Display top prediction
        displayTopPrediction(predictions[0]);
        
        // Display runner-ups
        const count = parseInt(runnerUpCountEl.value);
        displayRunnerUps(predictions, count);
    };
    
    /**
     * Display top prediction
     * @param {Object} prediction - Top prediction object
     */
    const displayTopPrediction = (prediction) => {
        topPredictionEl.innerHTML = '';
        
        // Add white balls
        prediction.whiteBalls.forEach(number => {
            const ball = document.createElement('div');
            ball.className = 'ball white-ball';
            ball.textContent = number;
            topPredictionEl.appendChild(ball);
        });
        
        // Add powerball
        const powerball = document.createElement('div');
        powerball.className = 'ball powerball';
        powerball.textContent = prediction.powerball;
        topPredictionEl.appendChild(powerball);
    };
    
    /**
     * Display runner-up predictions
     * @param {Array} predictions - Array of prediction objects
     * @param {number} count - Number of runner-ups to display
     */
    const displayRunnerUps = (predictions, count) => {
        runnerUpsEl.innerHTML = '';
        
        if (count === 0) return;
        
        // Display the requested number of runner-ups
        for (let i = 1; i <= count && i < predictions.length; i++) {
            const prediction = predictions[i];
            
            const predictionSet = document.createElement('div');
            predictionSet.className = 'prediction-set';
            
            const heading = document.createElement('h3');
            heading.textContent = `Runner-up #${i}`;
            predictionSet.appendChild(heading);
            
            const ballContainer = document.createElement('div');
            ballContainer.className = 'ball-container';
            
            // Add white balls
            prediction.whiteBalls.forEach(number => {
                const ball = document.createElement('div');
                ball.className = 'ball white-ball';
                ball.textContent = number;
                ballContainer.appendChild(ball);
            });
            
            // Add powerball
            const powerball = document.createElement('div');
            powerball.className = 'ball powerball';
            powerball.textContent = prediction.powerball;
            ballContainer.appendChild(powerball);
            
            predictionSet.appendChild(ballContainer);
            runnerUpsEl.appendChild(predictionSet);
        }
    };
    
    /**
     * Display analysis results
     * @param {Object} analysis - Analysis results
     */
    const displayAnalysis = (analysis) => {
        // Display hot white ball numbers
        displayStatItems('hot-numbers', analysis.hotWhiteBalls, 'white-ball');
        
        // Display cold white ball numbers
        displayStatItems('cold-numbers', analysis.coldWhiteBalls, 'white-ball');
        
        // Display hot powerball numbers
        displayStatItems('hot-powerball', analysis.hotPowerball, 'powerball');
        
        // Display cold powerball numbers
        displayStatItems('cold-powerball', analysis.coldPowerball, 'powerball');
        
        // Display common pairs
        displayPairs('common-pairs', analysis.commonPairs);
        
        // Display rare pairs
        displayPairs('rare-combinations', analysis.rarePairs);
        
        // Display sum analysis
        displaySumAnalysis('sum-analysis', analysis.sumAnalysis);
        
        // Display even/odd patterns
        displayEvenOddPatterns('even-odd-patterns', analysis.evenOddPatterns);
        
        // Create frequency chart
        createFrequencyChart(analysis.whiteBallFrequency, analysis.powerballFrequency);
    };
    
    /**
     * Display statistical items
     * @param {string} containerId - ID of container element
     * @param {Array} items - Array of statistical items
     * @param {string} ballType - Type of ball ('white-ball' or 'powerball')
     */
    const displayStatItems = (containerId, items, ballType) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        items.forEach(item => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            const ball = document.createElement('div');
            ball.className = `ball small-ball ${ballType}`;
            ball.textContent = item.number;
            
            const frequency = document.createElement('span');
            frequency.className = 'frequency';
            frequency.textContent = `${item.frequency} times`;
            
            statItem.appendChild(ball);
            statItem.appendChild(frequency);
            container.appendChild(statItem);
        });
    };
    
    /**
     * Display number pairs
     * @param {string} containerId - ID of container element
     * @param {Array} pairs - Array of pair objects
     */
    const displayPairs = (containerId, pairs) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        pairs.forEach(item => {
            const pairItem = document.createElement('div');
            pairItem.className = 'stat-item';
            
            const pairText = document.createElement('strong');
            pairText.textContent = `${item.pair[0]} & ${item.pair[1]}`;
            
            const frequency = document.createElement('span');
            frequency.className = 'frequency';
            frequency.textContent = `${item.frequency} times`;
            
            pairItem.appendChild(pairText);
            pairItem.appendChild(frequency);
            container.appendChild(pairItem);
        });
    };
    
    /**
     * Display sum analysis
     * @param {string} containerId - ID of container element
     * @param {Object} sumAnalysis - Sum analysis results
     */
    const displaySumAnalysis = (containerId, sumAnalysis) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        const avgItem = document.createElement('div');
        avgItem.innerHTML = `<strong>Average Sum:</strong> ${sumAnalysis.average}`;
        container.appendChild(avgItem);
        
        const rangeItem = document.createElement('div');
        rangeItem.innerHTML = `<strong>Range:</strong> ${sumAnalysis.min} to ${sumAnalysis.max}`;
        container.appendChild(rangeItem);
        
        const rangesTitle = document.createElement('div');
        rangesTitle.innerHTML = '<strong>Sum Distribution:</strong>';
        container.appendChild(rangesTitle);
        
        Object.entries(sumAnalysis.ranges).forEach(([range, count]) => {
            const rangeItem = document.createElement('div');
            rangeItem.className = 'stat-item';
            rangeItem.innerHTML = `${range}: <span class="frequency">${count} drawings</span>`;
            container.appendChild(rangeItem);
        });
    };
    
    /**
     * Display even/odd patterns
     * @param {string} containerId - ID of container element
     * @param {Object} patterns - Even/odd pattern results
     */
    const displayEvenOddPatterns = (containerId, patterns) => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        Object.entries(patterns).forEach(([pattern, count]) => {
            const patternItem = document.createElement('div');
            patternItem.className = 'stat-item';
            patternItem.innerHTML = `<strong>${pattern}:</strong> <span class="frequency">${count} drawings</span>`;
            container.appendChild(patternItem);
        });
    };
    
    /**
     * Create frequency chart
     * @param {Object} whiteBallFreq - White ball frequency data
     * @param {Object} powerballFreq - Powerball frequency data
     */
    const createFrequencyChart = (whiteBallFreq, powerballFreq) => {
        const ctx = document.getElementById('frequency-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (frequencyChart) {
            frequencyChart.destroy();
        }
        
        // Prepare data for white balls
        const whiteBallLabels = [];
        const whiteBallData = [];
        
        for (let i = 1; i <= 69; i++) {
            whiteBallLabels.push(i);
            whiteBallData.push(whiteBallFreq[i] || 0);
        }
        
        // Prepare data for powerball
        const powerballLabels = [];
        const powerballData = [];
        
        for (let i = 1; i <= 26; i++) {
            powerballLabels.push(i);
            powerballData.push(powerballFreq[i] || 0);
        }
        
        // Create chart
        frequencyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: whiteBallLabels,
                datasets: [
                    {
                        label: 'White Balls',
                        data: whiteBallData,
                        backgroundColor: 'rgba(0, 102, 204, 0.5)',
                        borderColor: 'rgba(0, 102, 204, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Powerball',
                        data: [...powerballData, ...Array(69 - 26).fill(0)],
                        backgroundColor: 'rgba(255, 0, 0, 0.5)',
                        borderColor: 'rgba(255, 0, 0, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Frequency'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Number'
                        }
                    }
                }
            }
        });
    };
    
    /**
     * Display raw drawing data
     * @param {Array} data - Array of drawing data objects
     */
    const displayRawData = (data) => {
        dataTableBody.innerHTML = '';
        
        data.forEach(drawing => {
            const row = document.createElement('tr');
            
            // Date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = drawing.date;
            row.appendChild(dateCell);
            
            // Number cells
            drawing.numbers.forEach(number => {
                const cell = document.createElement('td');
                cell.textContent = number;
                row.appendChild(cell);
            });
            
            // Powerball cell
            const powerballCell = document.createElement('td');
            powerballCell.textContent = drawing.powerball;
            powerballCell.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            row.appendChild(powerballCell);
            
            // Power Play cell
            const powerPlayCell = document.createElement('td');
            powerPlayCell.textContent = drawing.powerPlay;
            row.appendChild(powerPlayCell);
            
            dataTableBody.appendChild(row);
        });
    };
    
    // Public methods
    return {
        init,
        showStatusMessage,
        displayPredictions,
        displayAnalysis,
        displayRawData,
        updateDataSourceInfo
    };
})();