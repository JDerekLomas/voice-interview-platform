// Configuration for Claude API integration
class Config {
    constructor() {
        // API Configuration
        this.CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
        this.CLAUDE_MODEL = 'claude-3-sonnet-20240229';
        this.MAX_TOKENS = 1000;
        
        // Get API key from environment or prompt user
        this.apiKey = this.getApiKey();
    }

    getApiKey() {
        // Try environment variable first (Vite exposes VITE_ prefixed vars)
        const envKey = import.meta.env?.VITE_CLAUDE_API_KEY;
        console.log('Environment variable check:', {
            'import.meta.env available': !!import.meta.env,
            'VITE_CLAUDE_API_KEY': envKey ? 'Present' : 'Missing',
            'All env vars': import.meta.env
        });
        
        if (envKey) {
            console.log('✅ Using API key from environment');
            return envKey;
        }
        
        // Fallback to localStorage
        const localKey = localStorage.getItem('claude_api_key');
        console.log('localStorage API key:', localKey ? 'Present' : 'Missing');
        return localKey;
    }

    hasApiKey() {
        return !!this.getApiKey();
    }

    clearApiKey() {
        localStorage.removeItem('claude_api_key');
    }

    updateApiKey(newKey) {
        localStorage.setItem('claude_api_key', newKey);
        this.apiKey = newKey;
    }
}

// Create global config instance
window.appConfig = new Config();