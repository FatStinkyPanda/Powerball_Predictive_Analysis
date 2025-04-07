/**
 * Analyzer - Module for analyzing Powerball drawing data and finding patterns
 */
const Analyzer = (() => {
    /**
     * Count frequency of white ball numbers
     * @param {Array} data - Array of drawing data objects
     * @returns {Object} - Object mapping number to frequency
     */
    const getWhiteBallFrequency = (data) => {
        const frequency = {};
        
        // Initialize all possible numbers (1-69)
        for (let i = 1; i <= 69; i++) {
            frequency[i] = 0;
        }
        
        // Count occurrences
        data.forEach(drawing => {
            drawing.numbers.forEach(num => {
                frequency[num]++;
            });
        });
        
        return frequency;
    };
    
    /**
     * Count frequency of powerball numbers
     * @param {Array} data - Array of drawing data objects
     * @returns {Object} - Object mapping number to frequency
     */
    const getPowerballFrequency = (data) => {
        const frequency = {};
        
        // Initialize all possible numbers (1-26)
        for (let i = 1; i <= 26; i++) {
            frequency[i] = 0;
        }
        
        // Count occurrences
        data.forEach(drawing => {
            frequency[drawing.powerball]++;
        });
        
        return frequency;
    };
    
    /**
     * Get hot (most frequent) numbers
     * @param {Object} frequencyObj - Object mapping number to frequency
     * @param {number} count - Number of hot numbers to return
     * @returns {Array} - Array of hot number objects
     */
    const getHotNumbers = (frequencyObj, count = 10) => {
        return Object.entries(frequencyObj)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(entry => ({
                number: parseInt(entry[0]),
                frequency: entry[1]
            }));
    };
    
    /**
     * Get cold (least frequent) numbers
     * @param {Object} frequencyObj - Object mapping number to frequency
     * @param {number} count - Number of cold numbers to return
     * @returns {Array} - Array of cold number objects
     */
    const getColdNumbers = (frequencyObj, count = 10) => {
        return Object.entries(frequencyObj)
            .filter(entry => entry[1] > 0) // Only include numbers that have appeared
            .sort((a, b) => a[1] - b[1])
            .slice(0, count)
            .map(entry => ({
                number: parseInt(entry[0]),
                frequency: entry[1]
            }));
    };
    
    /**
     * Find number pairs that appear together frequently
     * @param {Array} data - Array of drawing data objects
     * @param {number} count - Number of pairs to return
     * @returns {Array} - Array of common pair objects
     */
    const findCommonPairs = (data, count = 10) => {
        const pairFrequency = {};
        
        // Count pair occurrences
        data.forEach(drawing => {
            const numbers = drawing.numbers;
            
            // Check all possible pairs
            for (let i = 0; i < numbers.length; i++) {
                for (let j = i + 1; j < numbers.length; j++) {
                    const pair = [numbers[i], numbers[j]].sort((a, b) => a - b);
                    const key = `${pair[0]}-${pair[1]}`;
                    
                    pairFrequency[key] = (pairFrequency[key] || 0) + 1;
                }
            }
        });
        
        // Sort by frequency and return top results
        return Object.entries(pairFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(entry => ({
                pair: entry[0].split('-').map(Number),
                frequency: entry[1]
            }));
    };
    
    /**
     * Find number pairs that rarely appear together
     * @param {Array} data - Array of drawing data objects
     * @param {number} count - Number of pairs to return
     * @returns {Array} - Array of rare pair objects
     */
    const findRarePairs = (data, count = 10) => {
        const pairFrequency = {};
        
        // Initialize with all possible pairs
        for (let i = 1; i <= 69; i++) {
            for (let j = i + 1; j <= 69; j++) {
                pairFrequency[`${i}-${j}`] = 0;
            }
        }
        
        // Count occurrences
        data.forEach(drawing => {
            const numbers = drawing.numbers;
            
            for (let i = 0; i < numbers.length; i++) {
                for (let j = i + 1; j < numbers.length; j++) {
                    const pair = [numbers[i], numbers[j]].sort((a, b) => a - b);
                    const key = `${pair[0]}-${pair[1]}`;
                    
                    pairFrequency[key]++;
                }
            }
        });
        
        // Find pairs that have appeared at least once
        const activePairs = Object.entries(pairFrequency)
            .filter(entry => entry[1] > 0);
        
        // Sort by frequency (ascending)
        return activePairs
            .sort((a, b) => a[1] - b[1])
            .slice(0, count)
            .map(entry => ({
                pair: entry[0].split('-').map(Number),
                frequency: entry[1]
            }));
    };
    
    /**
     * Analyze sum patterns of winning numbers
     * @param {Array} data - Array of drawing data objects
     * @returns {Object} - Sum analysis results
     */
    const analyzeSums = (data) => {
        const sums = data.map(drawing => {
            return drawing.numbers.reduce((sum, num) => sum + num, 0);
        });
        
        const average = Math.round(sums.reduce((acc, sum) => acc + sum, 0) / sums.length);
        const min = Math.min(...sums);
        const max = Math.max(...sums);
        
        // Count by range
        const ranges = {
            '< 100': 0,
            '100-149': 0,
            '150-199': 0,
            '200-249': 0,
            '250+': 0
        };
        
        sums.forEach(sum => {
            if (sum < 100) ranges['< 100']++;
            else if (sum < 150) ranges['100-149']++;
            else if (sum < 200) ranges['150-199']++;
            else if (sum < 250) ranges['200-249']++;
            else ranges['250+']++;
        });
        
        return { average, min, max, ranges };
    };
    
    /**
     * Analyze even/odd patterns
     * @param {Array} data - Array of drawing data objects
     * @returns {Object} - Even/odd pattern results
     */
    const analyzeEvenOdd = (data) => {
        const patterns = {
            'All Even': 0,
            'All Odd': 0,
            '1 Even, 4 Odd': 0,
            '2 Even, 3 Odd': 0,
            '3 Even, 2 Odd': 0,
            '4 Even, 1 Odd': 0
        };
        
        data.forEach(drawing => {
            const evenCount = drawing.numbers.filter(num => num % 2 === 0).length;
            
            if (evenCount === 0) patterns['All Odd']++;
            else if (evenCount === 5) patterns['All Even']++;
            else if (evenCount === 1) patterns['1 Even, 4 Odd']++;
            else if (evenCount === 2) patterns['2 Even, 3 Odd']++;
            else if (evenCount === 3) patterns['3 Even, 2 Odd']++;
            else if (evenCount === 4) patterns['4 Even, 1 Odd']++;
        });
        
        return patterns;
    };
    
    /**
     * Find overdue numbers (haven't appeared recently)
     * @param {Array} data - Array of drawing data objects
     * @param {number} count - Number of overdue numbers to return
     * @returns {Array} - Array of overdue number objects
     */
    const findOverdueNumbers = (data, count = 10) => {
        const lastAppearance = {};
        const totalDrawings = data.length;
        
        // Initialize all numbers
        for (let i = 1; i <= 69; i++) {
            lastAppearance[i] = totalDrawings;
        }
        
        // Find most recent appearance
        data.forEach((drawing, index) => {
            drawing.numbers.forEach(num => {
                if (lastAppearance[num] === totalDrawings) {
                    lastAppearance[num] = index;
                }
            });
        });
        
        // Sort by drawings since last appearance
        return Object.entries(lastAppearance)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(entry => ({
                number: parseInt(entry[0]),
                drawingsSince: entry[1]
            }));
    };
    
    /**
     * Run all analyses on the provided data
     * @param {Array} data - Array of drawing data objects
     * @returns {Object} - Complete analysis results
     */
    const analyzeData = (data) => {
        // Make sure data is valid
        if (!data || data.length === 0) {
            throw new Error("No valid data to analyze");
        }
        
        const whiteBallFrequency = getWhiteBallFrequency(data);
        const powerballFrequency = getPowerballFrequency(data);
        
        return {
            whiteBallFrequency,
            powerballFrequency,
            hotWhiteBalls: getHotNumbers(whiteBallFrequency, 10),
            coldWhiteBalls: getColdNumbers(whiteBallFrequency, 10),
            hotPowerball: getHotNumbers(powerballFrequency, 5),
            coldPowerball: getColdNumbers(powerballFrequency, 5),
            commonPairs: findCommonPairs(data, 10),
            rarePairs: findRarePairs(data, 10),
            overdueNumbers: findOverdueNumbers(data, 10),
            sumAnalysis: analyzeSums(data),
            evenOddPatterns: analyzeEvenOdd(data)
        };
    };
    
    // Public methods
    return {
        analyzeData,
        getWhiteBallFrequency,
        getPowerballFrequency,
        getHotNumbers,
        getColdNumbers,
        findCommonPairs,
        findRarePairs,
        analyzeSums,
        analyzeEvenOdd,
        findOverdueNumbers
    };
})();