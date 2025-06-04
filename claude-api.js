// Claude API integration for voice interview responses
class ClaudeAPI {
    constructor(config) {
        this.config = config;
        this.conversationHistory = [];
    }

    async generateResponse(userMessage, systemPrompt) {
        try {
            console.log('Generating Claude response for:', userMessage);
            console.log('System prompt:', systemPrompt);
            console.log('API Key present:', !!this.config.apiKey);

            if (!this.config.apiKey) {
                console.warn('No API key available, using fallback');
                return this.getFallbackResponse(userMessage);
            }

            // Build conversation history
            const messages = [
                ...this.conversationHistory,
                {
                    role: 'user',
                    content: userMessage
                }
            ];

            const requestBody = {
                model: this.config.CLAUDE_MODEL,
                max_tokens: this.config.MAX_TOKENS,
                system: systemPrompt,
                messages: messages
            };

            console.log('Sending request to Claude API:', requestBody);

            const response = await fetch(this.config.CLAUDE_API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Claude API response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Claude API error response:', errorData);
                throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('Claude API response data:', data);
            
            const assistantMessage = data.content[0].text;
            console.log('Assistant message:', assistantMessage);

            // Update conversation history
            this.conversationHistory.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: assistantMessage }
            );

            // Keep conversation history manageable (last 10 exchanges)
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }

            return assistantMessage;

        } catch (error) {
            console.error('Claude API Error:', error);
            
            // Don't use fallback - throw the error so we can see what's wrong
            throw error;
        }
    }

    getFallbackResponse(userMessage) {
        const fallbackResponses = [
            "I apologize, but I'm having trouble connecting to my AI service right now. Could you please repeat that?",
            "I'm experiencing some technical difficulties. Let me try to understand - could you elaborate on what you just said?",
            "There seems to be a connection issue on my end. Can you help me by rephrasing your response?",
            "I want to make sure I understand you correctly, but I'm having some technical challenges. Could you tell me more about that?",
            "I'm sorry, I'm having trouble processing that right now. Could you share more details about your experience?"
        ];
        
        return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    resetConversation() {
        this.conversationHistory = [];
    }

    // Test API connection
    async testConnection() {
        try {
            console.log('Testing connection with API key:', this.config.apiKey ? 'Present' : 'Missing');
            console.log('API URL:', this.config.CLAUDE_API_URL);
            console.log('Model:', this.config.CLAUDE_MODEL);
            
            const response = await fetch(this.config.CLAUDE_API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.config.CLAUDE_MODEL,
                    max_tokens: 50,
                    messages: [{ role: 'user', content: 'Hello' }]
                })
            });

            console.log('Test response status:', response.status);
            console.log('Test response headers:', response.headers);

            if (response.ok) {
                const data = await response.json();
                console.log('Test response data:', data);
                return { success: true, message: 'API connection successful' };
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Test API error:', errorData);
                return { 
                    success: false, 
                    message: `API connection failed: ${response.status} - ${errorData.error?.message || response.statusText}` 
                };
            }
        } catch (error) {
            console.error('Test connection error:', error);
            return { 
                success: false, 
                message: `Network error: ${error.message}` 
            };
        }
    }
}

// Create global Claude API instance
window.claudeAPI = new ClaudeAPI(window.appConfig);