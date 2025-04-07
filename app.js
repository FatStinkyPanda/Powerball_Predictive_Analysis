/**
 * Main application module for Powerball Predictor
 * Coordinates between all other modules
 */
(() => {
    /**
     * Initialize the application
     */
    const initApp = () => {
        // Create a hidden field to hold the provided Powerball content
        const contentField = document.createElement('textarea');
        contentField.id = 'powerball-content';
        contentField.style.display = 'none';
        
        // Get the raw content directly from PowerballData module
        const powerballContent = PowerballData.parseFromProvidedContent;
        
        // Use the raw content from the PowerballData module if needed
        contentField.value = document.documentElement.innerHTML.includes('Previous Results | Powerball') ? 
            document.documentElement.innerHTML : 
            PowerballData.powerballRawContent;
            
        document.body.appendChild(contentField);
        
        // Initialize the UI
        UI.init();
        
        // Log initialization
        console.log('Powerball Predictor application initialized');
    };
    
    // Run when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', initApp);
})();