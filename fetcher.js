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
            
            const results = [];
            let dateBlock = null;
            let numbers = [];
            let powerball = null;
            let powerPlay = null;
            
            // Process each line of text in the document
            const textNodes = [];
            const walker = document.createTreeWalker(
                doc.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let node;
            while (node = walker.nextNode()) {
                const text = node.nodeValue.trim();
                if (text) {
                    textNodes.push(text);
                }
            }
            
            // Process the extracted text
            for (let i = 0; i < textNodes.length; i++) {
                const line = textNodes[i].trim();
                
                // Look for date line (e.g., "Sat, Apr 5, 2025")
                if (line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), [A-Z][a-z]+ \d+, \d{4}$/) || 
                    line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), [A-Z][a-z]+ \d+$/)) {
                    
                    // If we already have a date, save the previous entry
                    if (dateBlock && numbers.length === 5 && powerball !== null) {
                        results.push({
                            date: dateBlock,
                            numbers: [...numbers],
                            powerball,
                            powerPlay: powerPlay || "N/A"
                        });
                    }
                    
                    // Start a new entry
                    dateBlock = line;
                    numbers = [];
                    powerball = null;
                    powerPlay = null;
                    continue;
                }
                
                // If we found a date, look for numbers
                if (dateBlock) {
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
                        if (i + 1 < textNodes.length) {
                            powerPlay = textNodes[i + 1].trim();
                            i++; // Skip the next line
                        }
                    }
                }
            }
            
            // Don't forget the last entry
            if (dateBlock && numbers.length === 5 && powerball !== null) {
                results.push({
                    date: dateBlock,
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
            console.error('Error parsing HTML:', error);
            return [];
        }
    };
    
    /**
     * Parse drawing data directly from website text content
     * @param {string} content - Text content from Powerball website
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
                    } else if (line.match(/^\d+x$/)) {
                        // If it's just a multiplier like "4x"
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
            console.error('Error parsing text content:', error);
            return [];
        }
    };
    
    /**
     * Handles pagination by loading all pages from the Powerball website
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Array>} - Promise resolving to all drawing data
     */
    const fetchAllPages = async (startDate, endDate) => {
        let allResults = [];
        let pageNum = 1;
        let hasMoreData = true;
        
        // Detect if the browser is running in a CORS environment where we need a proxy
        const needsProxy = window.location.protocol === 'http:' || 
                          window.location.protocol === 'https:' &&
                          window.location.hostname !== 'powerball.com';
        
        const getUrl = (page) => {
            const baseUrl = `https://www.powerball.com/previous-results?gc=powerball&sd=${startDate}&ed=${endDate}&page=${page}`;
            return needsProxy ? `https://corsproxy.io/?${encodeURIComponent(baseUrl)}` : baseUrl;
        };
        
        try {
            while (hasMoreData) {
                console.log(`Fetching page ${pageNum} of Powerball results...`);
                
                // Fetch the current page
                const response = await fetch(getUrl(pageNum));
                
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
                
                const html = await response.text();
                
                // Parse the data from this page
                const pageResults = parseFromTextContent(html);
                
                if (pageResults.length > 0) {
                    console.log(`Found ${pageResults.length} drawings on page ${pageNum}`);
                    allResults = [...allResults, ...pageResults];
                    
                    // Check if there's a "Load More" button or similar pagination indicator
                    if (html.includes('Load More') || html.includes('load-more') || 
                        html.includes('pagination') || html.includes('pager')) {
                        pageNum++;
                        
                        // Safety check - don't go beyond a reasonable number of pages
                        if (pageNum > 50) {
                            console.warn('Reached maximum page limit (50)');
                            hasMoreData = false;
                        }
                        
                        // Add a small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 300));
                    } else {
                        // If no indication of more pages, assume we're done
                        hasMoreData = false;
                    }
                } else {
                    // No results on this page, we're done
                    hasMoreData = false;
                }
            }
            
            console.log(`Total drawings fetched: ${allResults.length}`);
            return allResults;
            
        } catch (error) {
            console.error('Error fetching all pages:', error);
            throw error;
        }
    };
    
    /**
     * Fetches Powerball data directly by simulating browser requests to the API
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Array>} - Promise resolving to drawing data
     */
    const fetchDirectFromAPI = async (startDate, endDate) => {
        try {
            // We'll try to find the actual API endpoint the Powerball site uses
            const apiUrl = `https://www.powerball.com/api/v1/drawings/powerball?startDate=${startDate}&endDate=${endDate}&_format=json`;
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`API HTTP error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Convert API data to our standard format
            return data.map(item => {
                // Different API responses might have different structures
                // This is a guess based on common API patterns
                let whiteBalls = [];
                let powerballNum = null;
                
                if (item.winning_numbers || item.numbers) {
                    const numbers = (item.winning_numbers || item.numbers || '').split(/[\s,]+/).map(Number);
                    whiteBalls = numbers.slice(0, 5);
                    powerballNum = numbers[5];
                } else if (item.white_balls && item.powerball) {
                    whiteBalls = item.white_balls;
                    powerballNum = item.powerball;
                }
                
                return {
                    date: item.draw_date || item.date,
                    numbers: whiteBalls,
                    powerball: powerballNum,
                    powerPlay: item.power_play || item.multiplier || "N/A"
                };
            });
            
        } catch (error) {
            console.warn('Direct API fetch failed:', error);
            // This is expected if the API endpoint is incorrect
            throw error;
        }
    };
    
    /**
     * Alternative method to fetch data: Break the date range into chunks
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise<Array>} - Promise resolving to drawing data
     */
    const fetchByDateChunks = async (startDate, endDate) => {
        try {
            // Convert dates to Date objects
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            // Calculate the total number of days
            const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            
            // If the range is small enough, fetch it as one chunk
            if (totalDays <= 90) {
                return await fetchAllPages(startDate, endDate);
            }
            
            // Split into 90-day chunks
            const allResults = [];
            let currentStart = new Date(start);
            
            while (currentStart < end) {
                // Calculate chunk end date (90 days later or the overall end date)
                let currentEnd = new Date(currentStart);
                currentEnd.setDate(currentStart.getDate() + 90);
                
                if (currentEnd > end) {
                    currentEnd = end;
                }
                
                // Format dates for API
                const formatDate = (date) => {
                    return date.toISOString().split('T')[0]; // YYYY-MM-DD
                };
                
                console.log(`Fetching chunk: ${formatDate(currentStart)} to ${formatDate(currentEnd)}`);
                
                // Fetch this chunk
                const chunkResults = await fetchAllPages(
                    formatDate(currentStart),
                    formatDate(currentEnd)
                );
                
                // Add to results
                allResults.push(...chunkResults);
                
                // Move to next chunk
                currentStart = new Date(currentEnd);
                currentStart.setDate(currentStart.getDate() + 1);
                
                // Add a delay between chunks
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Remove any duplicates by date
            const uniqueResults = [];
            const datesSeen = new Set();
            
            allResults.forEach(result => {
                if (!datesSeen.has(result.date)) {
                    datesSeen.add(result.date);
                    uniqueResults.push(result);
                }
            });
            
            console.log(`Total unique drawings fetched: ${uniqueResults.length}`);
            return uniqueResults;
            
        } catch (error) {
            console.error('Error fetching by date chunks:', error);
            throw error;
        }
    };
    
    /**
     * Additional method: Use a headless browser or scraping service
     * This is a placeholder for server-side implementation
     */
    const fetchUsingExternalScraper = async (startDate, endDate) => {
        // This would typically be implemented on the server side using:
        // - A headless browser like Puppeteer or Playwright
        // - A scraping service API
        // - A server-side proxy with proper sessions and cookies
        
        // For client-side, we'll throw an error to fall back to other methods
        throw new Error("External scraper not implemented in client-side code");
    };
    
    /**
     * Main data fetching function that tries multiple approaches
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise} - Promise resolving to drawing data and source
     */
    const fetchData = async (startDate, endDate) => {
        console.log(`Fetching Powerball data from ${startDate} to ${endDate}`);
        
        // Arrays to store results and track which methods succeeded
        let results = [];
        let source = "";
        let successfulMethod = "";
        
        // Try all methods in sequence until one works
        const methods = [
            { name: "Direct API", fn: fetchDirectFromAPI },
            { name: "Date Chunking", fn: fetchByDateChunks },
            { name: "All Pages", fn: fetchAllPages },
            { name: "External Scraper", fn: fetchUsingExternalScraper }
        ];
        
        for (const method of methods) {
            try {
                console.log(`Trying method: ${method.name}`);
                const methodResults = await method.fn(startDate, endDate);
                
                if (methodResults && methodResults.length > 0) {
                    console.log(`Method ${method.name} succeeded with ${methodResults.length} results`);
                    results = methodResults;
                    successfulMethod = method.name;
                    source = `${method.name} method`;
                    break;
                }
            } catch (error) {
                console.warn(`Method ${method.name} failed:`, error);
                // Continue to next method
            }
        }
        
        // If all methods failed but we have content from fetcher.js, parse it directly
        if (results.length === 0 && typeof document !== 'undefined') {
            try {
                console.log("Trying direct content parsing as last resort");
                const content = document.body.innerText || document.body.textContent;
                results = parseFromTextContent(content);
                
                if (results.length > 0) {
                    source = "Direct content parsing";
                    successfulMethod = "Content Parsing";
                }
            } catch (contentError) {
                console.warn("Content parsing failed:", contentError);
            }
        }
        
        // Final fallback for the example content you provided
        if (results.length === 0) {
            console.log("All methods failed. Using provided example content.");
            const exampleContent = document.querySelector('pre')?.textContent || '';
            
            if (exampleContent.includes('Powerball') && exampleContent.includes('Power Play')) {
                results = parseFromTextContent(exampleContent);
                source = "Example content";
                successfulMethod = "Example Content";
            }
        }
        
        // Filter results by date range
        if (results.length > 0) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the entire end day
            
            // Add year if missing in date string (assuming current year)
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
            
            // Sort by date (newest first)
            filteredResults.sort((a, b) => {
                return new Date(fixDate(b.date)) - new Date(fixDate(a.date));
            });
            
            console.log(`Filtered to ${filteredResults.length} drawings within date range.`);
            
            return {
                data: filteredResults,
                source: `${filteredResults.length} drawings from ${source}`
            };
        }
        
        // If we still have no results, throw an error
        throw new Error("Unable to retrieve Powerball data for the selected date range. Please try a different date range or check your internet connection.");
    };
    
    // Return public methods
    return {
        fetchData,
        parseFromTextContent,
        parseHTML
    };
})();
