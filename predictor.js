/**
 * Predictor - Module for generating Powerball number predictions based on analysis
 */
const Predictor = (() => {
    /**
     * Helper for weighted random selection
     * @param {Array} items - Array of items to select from
     * @param {Array} weights - Array of weights corresponding to items
     * @returns {*} - Selected item
     */
    const weightedRandom = (items, weights) => {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        let weightSum = 0;
        
        for (let i = 0; i < items.length; i++) {
            weightSum += weights[i];
            if (random <= weightSum) {
                return items[i];
            }
        }
        
        return items[0];
    };
    
    /**
     * Generate white ball numbers
     * @param {Object} analysis - Analysis results
     * @returns {Array} - Array of 5 white ball numbers
     */
    const generateWhiteBalls = (analysis) => {
        const selectedNumbers = new Set();
        const { 
            whiteBallFrequency, 
            hotWhiteBalls, 
            coldWhiteBalls, 
            commonPairs,
            overdueNumbers,
            evenOddPatterns
        } = analysis;
        
        // Calculate weights for all numbers
        const weights = {};
        for (let i = 1; i <= 69; i++) {
            weights[i] = whiteBallFrequency[i] || 0.1;
        }
        
        // Boost hot numbers
        hotWhiteBalls.forEach(item => {
            weights[item.number] *= 1.5;
        });
        
        // Slightly boost cold numbers
        coldWhiteBalls.forEach(item => {
            weights[item.number] *= 1.2;
        });
        
        // Boost overdue numbers
        overdueNumbers.forEach(item => {
            weights[item.number] *= 1.3;
        });
        
        // Select first number
        const availableNumbers = [];
        const availableWeights = [];
        
        for (let i = 1; i <= 69; i++) {
            availableNumbers.push(i);
            availableWeights.push(weights[i]);
        }
        
        const firstNumber = weightedRandom(availableNumbers, availableWeights);
        selectedNumbers.add(firstNumber);
        
        // Maybe add a common pair
        if (Math.random() < 0.4) {
            for (const { pair } of commonPairs) {
                if (pair[0] === firstNumber && !selectedNumbers.has(pair[1])) {
                    selectedNumbers.add(pair[1]);
                    break;
                } else if (pair[1] === firstNumber && !selectedNumbers.has(pair[0])) {
                    selectedNumbers.add(pair[0]);
                    break;
                }
            }
        }
        
        // Get likely even/odd pattern
        const patternEntries = Object.entries(evenOddPatterns);
        const patternNames = patternEntries.map(entry => entry[0]);
        const patternWeights = patternEntries.map(entry => entry[1]);
        
        const pattern = weightedRandom(patternNames, patternWeights);
        
        let targetEvenCount = 2; // Default
        
        switch (pattern) {
            case 'All Even': targetEvenCount = 5; break;
            case 'All Odd': targetEvenCount = 0; break;
            case '1 Even, 4 Odd': targetEvenCount = 1; break;
            case '2 Even, 3 Odd': targetEvenCount = 2; break;
            case '3 Even, 2 Odd': targetEvenCount = 3; break;
            case '4 Even, 1 Odd': targetEvenCount = 4; break;
        }
        
        // Add remaining numbers
        while (selectedNumbers.size < 5) {
            const currentNumbers = Array.from(selectedNumbers);
            const currentEvenCount = currentNumbers.filter(n => n % 2 === 0).length;
            const remainingEven = targetEvenCount - currentEvenCount;
            const remainingOdd = (5 - targetEvenCount) - (currentNumbers.length - currentEvenCount);
            
            // Update weights based on even/odd pattern
            const tempWeights = {...weights};
            
            if (remainingEven <= 0) {
                // Need only odd numbers
                for (let i = 1; i <= 69; i++) {
                    if (!selectedNumbers.has(i)) {
                        if (i % 2 === 0) { // Even
                            tempWeights[i] *= 0.1; // Reduce even numbers
                        } else {
                            tempWeights[i] *= 1.5; // Boost odd numbers
                        }
                    }
                }
            } else if (remainingOdd <= 0) {
                // Need only even numbers
                for (let i = 1; i <= 69; i++) {
                    if (!selectedNumbers.has(i)) {
                        if (i % 2 === 0) { // Even
                            tempWeights[i] *= 1.5; // Boost even numbers
                        } else {
                            tempWeights[i] *= 0.1; // Reduce odd numbers
                        }
                    }
                }
            }
            
            // Select next number
            const availNums = [];
            const availWeights = [];
            
            for (let i = 1; i <= 69; i++) {
                if (!selectedNumbers.has(i)) {
                    availNums.push(i);
                    availWeights.push(tempWeights[i]);
                }
            }
            
            const nextNumber = weightedRandom(availNums, availWeights);
            selectedNumbers.add(nextNumber);
        }
        
        return Array.from(selectedNumbers).sort((a, b) => a - b);
    };
    
    /**
     * Generate powerball number
     * @param {Object} analysis - Analysis results
     * @returns {number} - Powerball number
     */
    const generatePowerball = (analysis) => {
        const { powerballFrequency, hotPowerball, coldPowerball } = analysis;
        
        // Calculate weights
        const weights = [];
        const numbers = [];
        
        for (let i = 1; i <= 26; i++) {
            numbers.push(i);
            
            // Base weight from frequency
            let weight = powerballFrequency[i] || 0.1;
            
            // Boost hot numbers
            const isHot = hotPowerball.some(item => item.number === i);
            if (isHot) {
                weight *= 1.5;
            }
            
            // Slightly boost cold numbers
            const isCold = coldPowerball.some(item => item.number === i);
            if (isCold) {
                weight *= 1.2;
            }
            
            weights.push(weight);
        }
        
        // Select powerball based on weights
        return weightedRandom(numbers, weights);
    };
    
    /**
     * Generate multiple prediction sets
     * @param {Object} analysis - Analysis results
     * @param {number} count - Number of prediction sets to generate
     * @returns {Array} - Array of prediction objects
     */
    const generatePredictions = (analysis, count = 10) => {
        const predictions = [];
        
        for (let i = 0; i < count; i++) {
            predictions.push({
                whiteBalls: generateWhiteBalls(analysis),
                powerball: generatePowerball(analysis)
            });
        }
        
        return predictions;
    };
    
    // Public methods
    return {
        generatePredictions,
        generateWhiteBalls,
        generatePowerball,
        weightedRandom
    };
})();