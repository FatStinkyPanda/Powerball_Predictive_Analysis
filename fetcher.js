/**
 * PowerballData - Module for fetching and parsing Powerball drawing data
 */
const PowerballData = (() => {
    /**
     * Parse HTML content from Powerball website
     * @param {string} html - HTML content from Powerball website
     * @returns {Array} - Array of drawing data objects
     */
    const parseHTML = (html) => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Get all drawing rows
            const drawingRows = Array.from(doc.querySelectorAll('.draw-card, .drawing-item, tr'));
            const results = [];

            // Process each drawing row
            drawingRows.forEach(row => {
                try {
                    // Skip header rows
                    if (row.querySelector('th') || row.classList.contains('header')) {
                        return;
                    }
                    
                    // Extract date
                    const dateEl = row.querySelector('.date, td:first-child');
                    if (!dateEl) return;
                    
                    const dateText = dateEl.textContent.trim();
                    // Verify this is a date row (contains day of week)
                    if (!dateText.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),/)) {
                        return;
                    }
                    
                    // Extract white balls and powerball
                    const allNumberCells = Array.from(row.querySelectorAll('.white-ball, .red-ball, .powerball, td:not(:first-child):not(:last-child)'));
                    
                    // Need at least 6 numbers (5 white balls + 1 powerball)
                    if (allNumberCells.length < 6) return;
                    
                    // Extract white balls (first 5 numbers)
                    const whiteBalls = allNumberCells.slice(0, 5).map(cell => {
                        const text = cell.textContent.trim();
                        return parseInt(text, 10);
                    });
                    
                    // Extract powerball (6th number)
                    const powerballNum = parseInt(allNumberCells[5].textContent.trim(), 10);
                    
                    // Extract Power Play
                    const powerPlayEl = row.querySelector('.power-play, td:last-child');
                    let powerPlay = "N/A";
                    if (powerPlayEl) {
                        powerPlay = powerPlayEl.textContent.trim();
                        // If it's not in format "2x", "3x", etc. try to find it
                        if (!powerPlay.match(/\d+x/)) {
                            // Check for power play specifically
                            const powerPlayText = row.textContent.includes('Power Play') ? 
                                row.textContent.match(/Power Play[:\s]+(\d+x)/i) : null;
                            
                            if (powerPlayText && powerPlayText[1]) {
                                powerPlay = powerPlayText[1];
                            }
                        }
                    }
                    
                    // Validate data
                    if (whiteBalls.length === 5 && 
                        whiteBalls.every(n => !isNaN(n) && n >= 1 && n <= 69) && 
                        !isNaN(powerballNum) && powerballNum >= 1 && powerballNum <= 26) {
                        
                        results.push({
                            date: dateText,
                            numbers: whiteBalls,
                            powerball: powerballNum,
                            powerPlay: powerPlay
                        });
                    }
                } catch (rowError) {
                    console.warn('Error parsing a row:', rowError);
                }
            });
            
            return results;
        } catch (error) {
            console.error('Error parsing HTML content:', error);
            return [];
        }
    };
    
    /**
     * Parse Powerball data from text format often found in website content
     * @param {string} content - Raw content from Powerball website
     * @returns {Array} - Array of drawing data objects
     */
    const parseFromTextContent = (content) => {
        try {
            const lines = content.split('\n');
            const results = [];
            
            // Parse through lines for drawing data
            let dateFound = false;
            let date = '';
            let numbers = [];
            let powerball = null;
            let powerPlay = null;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Look for date line (e.g., "Sat, Apr 5, 2025")
                if (line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), [A-Z][a-z]+ \d+, \d{4}$/) || 
                    line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), [A-Z][a-z]+ \d+$/)) {
                    
                    // If we already have a date, save the previous entry
                    if (dateFound && numbers.length === 5 && powerball !== null) {
                        results.push({
                            date,
                            numbers: [...numbers],
                            powerball,
                            powerPlay: powerPlay || "N/A"
                        });
                    }
                    
                    // Start a new entry
                    dateFound = true;
                    date = line;
                    numbers = [];
                    powerball = null;
                    powerPlay = null;
                    continue;
                }
                
                // If we found a date, look for numbers
                if (dateFound) {
                    // If it's just a number
                    if (/^\d+$/.test(line)) {
                        const num = parseInt(line, 10);
                        
                        if (numbers.length < 5) {
                            numbers.push(num);
                        } else if (powerball === null) {
                            powerball = num;
                        }
                    }
                    // If it's "Power Play"
                    else if (line === "Power Play") {
                        // The next line should be the power play value
                        if (i + 1 < lines.length) {
                            powerPlay = lines[i + 1].trim();
                            i++; // Skip the next line
                        }
                    } else if (line.match(/\d+x/)) {
                        // If it looks like a power play multiplier
                        powerPlay = line;
                    }
                }
            }
            
            // Don't forget the last entry
            if (dateFound && numbers.length === 5 && powerball !== null) {
                results.push({
                    date,
                    numbers: [...numbers],
                    powerball,
                    powerPlay: powerPlay || "N/A"
                });
            }
            
            // Validate results
            for (let i = results.length - 1; i >= 0; i--) {
                const result = results[i];
                
                // Make sure each result has 5 white balls and 1 powerball
                if (result.numbers.length !== 5 || isNaN(result.powerball)) {
                    results.splice(i, 1);
                } else {
                    // Validate number ranges
                    if (!result.numbers.every(num => num >= 1 && num <= 69)) {
                        results.splice(i, 1);
                    } else if (result.powerball < 1 || result.powerball > 26) {
                        results.splice(i, 1);
                    }
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error parsing from text:', error);
            return [];
        }
    };
    
    /**
     * Function to fetch data from Powerball website
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise} - Promise resolving to drawing data
     */
    const fetchFromWebsite = async (startDate, endDate) => {
        const results = [];
        let hasMorePages = true;
        let page = 1;
        
        try {
            while (hasMorePages) {
                // Format the URL with the date parameters and page number
                const url = `https://www.powerball.com/previous-results?gc=powerball&sd=${startDate}&ed=${endDate}&page=${page}`;
                
                // Use a CORS proxy to avoid CORS errors
                // In a production environment, you would use a server-side proxy
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                
                console.log(`Fetching page ${page} of drawings...`);
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const html = await response.text();
                
                // Parse HTML to extract drawing data
                const pageResults = parseHTML(html);
                
                if (pageResults.length > 0) {
                    // Add this page's results to our collection
                    results.push(...pageResults);
                    
                    // Check if there might be more pages
                    if (html.includes('"Load More"') || html.includes('"load-more"') || 
                        html.includes('Load More') || html.includes('pagination') ||
                        pageResults.length >= 20) { // Many sites show 20 items per page
                        
                        page++;
                        
                        // Safety check - don't fetch too many pages
                        if (page > 10) {
                            console.warn('Reached maximum page limit (10 pages)');
                            hasMorePages = false;
                        }
                    } else {
                        hasMorePages = false;
                    }
                } else {
                    // If no results on this page, assume we've reached the end
                    hasMorePages = false;
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            console.log(`Total drawings fetched: ${results.length}`);
            
            // If still no results, try text parsing as a fallback
            if (results.length === 0) {
                // Try to fetch again with a different approach
                const url = `https://www.powerball.com/previous-results?gc=powerball&sd=${startDate}&ed=${endDate}`;
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                
                const response = await fetch(proxyUrl);
                const text = await response.text();
                
                const textResults = parseFromTextContent(text);
                if (textResults.length > 0) {
                    return textResults;
                }
            }
            
            return results;
        } catch (error) {
            console.error('Error fetching from Powerball website:', error);
            throw error;
        }
    };
    
    /**
     * Attempts to fetch data directly from the Powerball API endpoints
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise} - Promise resolving to drawing data
     */
    const fetchFromApi = async (startDate, endDate) => {
        try {
            // The Powerball site likely has an API endpoint that powers their results page
            // This is an educated guess at what the endpoint might be
            const apiUrl = `https://www.powerball.com/api/v1/drawings/powerball?_format=json&from=${startDate}&to=${endDate}`;
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`API HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Transform the API response to our standard format
            const results = data.map(item => {
                // Extract the 5 white balls and 1 powerball
                const allNumbers = Array.isArray(item.field_winning_numbers)
                    ? item.field_winning_numbers
                    : String(item.field_winning_numbers).split(/\s+/).map(n => parseInt(n, 10));
                
                const whiteBalls = allNumbers.slice(0, 5);
                const powerball = allNumbers[5];
                
                // Format the date
                const drawDate = new Date(item.field_draw_date);
                const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
                const formattedDate = drawDate.toLocaleDateString('en-US', options)
                    .replace(/,\s*(\d{4})$/, ', $1'); // Ensure format: "Day, Mon DD, YYYY"
                
                return {
                    date: formattedDate,
                    numbers: whiteBalls,
                    powerball: powerball,
                    powerPlay: item.field_multiplier ? `${item.field_multiplier}x` : "N/A"
                };
            });
            
            return results;
        } catch (error) {
            console.warn('Error fetching from API:', error);
            // This is expected to fail if the API endpoint is incorrect
            // We'll let the calling function try the website parsing approach
            throw error;
        }
    };
    
    /**
     * Main data fetching function
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise} - Promise resolving to drawing data and source
     */
    const fetchData = async (startDate, endDate) => {
        // Show a warning in the console about CORS issues
        console.info('Note: This app may need a CORS proxy to fetch live data from Powerball.com.');
        
        let results = [];
        let source = "";
        
        try {
            // First try the API approach
            try {
                console.log('Attempting to fetch data from Powerball API...');
                results = await fetchFromApi(startDate, endDate);
                source = "Powerball.com API";
                console.log(`Successfully fetched ${results.length} drawings from API.`);
            } catch (apiError) {
                console.warn('API fetch failed, falling back to website parsing...');
                
                // If API fails, try website parsing
                results = await fetchFromWebsite(startDate, endDate);
                source = "Powerball.com website";
                console.log(`Successfully fetched ${results.length} drawings from website.`);
            }
            
            // If we got results, filter by date range
            if (results && results.length > 0) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Include the entire end day
                
                // Add year if missing in date string
                const fixDate = (dateStr) => {
                    if (!dateStr.includes(', 20')) {
                        const currentYear = new Date().getFullYear();
                        const parts = dateStr.split(', ');
                        return `${parts[0]}, ${parts[1]}, ${currentYear}`;
                    }
                    return dateStr;
                };
                
                const filteredResults = results.filter(entry => {
                    try {
                        const entryDate = new Date(fixDate(entry.date));
                        return entryDate >= start && entryDate <= end;
                    } catch (dateError) {
                        console.warn(`Invalid date format: ${entry.date}`);
                        return false;
                    }
                });
                
                console.log(`Filtered to ${filteredResults.length} drawings within date range.`);
                
                return {
                    data: filteredResults,
                    source: `${filteredResults.length} drawings from ${source}`
                };
            } else {
                throw new Error("No drawings found for the specified date range.");
            }
        } catch (error) {
            console.error('Error in fetchData:', error);
            throw error;
        }
    };

    // Public methods
    return {
        fetchData,
        parseHTML,
        parseFromTextContent
    };
})();