class VoiceInterviewApp {
    constructor() {
        this.currentUser = null;
        this.isRecording = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentSession = null;
        this.sessions = JSON.parse(localStorage.getItem('voiceSessions') || '[]');
        this.sharedSessions = JSON.parse(localStorage.getItem('sharedSessions') || '[]');
        this.claudeAPI = null;
        this.apiKey = import.meta.env?.VITE_CLAUDE_API_KEY || null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeSpeechRecognition();
        
        // Wait for DOM and scripts to load before initializing Claude API
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeClaudeAPI());
        } else {
            setTimeout(() => this.initializeClaudeAPI(), 100);
        }
        
        this.checkAuthState();
    }

    initializeElements() {
        this.elements = {
            signInBtn: document.getElementById('signInBtn'),
            signOutBtn: document.getElementById('signOutBtn'),
            userInfo: document.getElementById('userInfo'),
            userName: document.getElementById('userName'),
            mainContent: document.getElementById('mainContent'),
            signInModal: document.getElementById('signInModal'),
            signInForm: document.getElementById('signInForm'),
            cancelSignIn: document.getElementById('cancelSignIn'),
            apiKeyBtn: document.getElementById('apiKeyBtn'),
            apiKeyModal: document.getElementById('apiKeyModal'),
            apiKeyForm: document.getElementById('apiKeyForm'),
            cancelApiKey: document.getElementById('cancelApiKey'),
            clearApiKey: document.getElementById('clearApiKey'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            openingLine: document.getElementById('openingLine'),
            systemPrompt: document.getElementById('systemPrompt'),
            startSessionBtn: document.getElementById('startSessionBtn'),
            createShareLinkBtn: document.getElementById('createShareLinkBtn'),
            voiceSession: document.getElementById('voiceSession'),
            endSessionBtn: document.getElementById('endSessionBtn'),
            conversation: document.getElementById('conversation'),
            micBtn: document.getElementById('micBtn'),
            voiceStatus: document.getElementById('voiceStatus'),
            historyList: document.getElementById('historyList'),
            sharedList: document.getElementById('sharedList')
        };
    }

    initializeEventListeners() {
        console.log('Initializing event listeners...');
        console.log('Sign in button:', this.elements.signInBtn);
        
        if (this.elements.signInBtn) {
            this.elements.signInBtn.addEventListener('click', () => {
                console.log('Sign in button clicked');
                this.showSignInModal();
            });
        } else {
            console.error('Sign in button not found!');
        }
        
        this.elements.signOutBtn.addEventListener('click', () => this.signOut());
        this.elements.cancelSignIn.addEventListener('click', () => this.hideSignInModal());
        this.elements.signInForm.addEventListener('submit', (e) => this.handleSignIn(e));
        this.elements.apiKeyBtn.addEventListener('click', () => this.showApiKeyModal());
        this.elements.cancelApiKey.addEventListener('click', () => this.hideApiKeyModal());
        this.elements.clearApiKey.addEventListener('click', () => this.clearApiKey());
        this.elements.apiKeyForm.addEventListener('submit', (e) => this.handleApiKeySubmit(e));
        this.elements.startSessionBtn.addEventListener('click', () => this.startSession());
        this.elements.createShareLinkBtn.addEventListener('click', () => this.createShareLink());
        this.elements.endSessionBtn.addEventListener('click', () => this.endSession());
        this.elements.micBtn.addEventListener('click', () => this.toggleRecording());

        // Tab functionality
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    initializeClaudeAPI() {
        try {
            console.log('Initializing Claude API...');
            console.log('window.appConfig:', !!window.appConfig);
            console.log('window.claudeAPI:', !!window.claudeAPI);
            
            // Initialize our own simple Claude API if the global ones aren't available
            if (!window.claudeAPI || !window.appConfig) {
                console.log('Creating simplified Claude API...');
                this.claudeAPI = {
                    generateResponse: async (userInput, systemPrompt) => {
                        try {
                            const response = await fetch('http://localhost:3001/api/claude', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    model: 'claude-3-sonnet-20240229',
                                    max_tokens: 1000,
                                    system: systemPrompt,
                                    messages: [{ role: 'user', content: userInput }]
                                })
                            });
                            
                            if (!response.ok) {
                                throw new Error(`API request failed: ${response.status}`);
                            }
                            
                            const data = await response.json();
                            return data.content[0].text;
                        } catch (error) {
                            console.error('Claude API Error:', error);
                            throw error;
                        }
                    }
                };
                console.log('✅ Simplified Claude API created');
            } else {
                this.claudeAPI = window.claudeAPI;
                localStorage.setItem('claude_api_key', this.apiKey);
                window.appConfig.apiKey = this.apiKey;
                if (this.claudeAPI.config) {
                    this.claudeAPI.config.apiKey = this.apiKey;
                }
                console.log('✅ Using global Claude API');
            }
            
            this.updateApiStatus();
        } catch (error) {
            console.error('Failed to initialize Claude API:', error);
            this.showAPIError(error.message);
        }
    }

    async updateApiStatus() {
        if (!window.appConfig?.hasApiKey()) {
            this.setApiStatus('⚪', 'Not configured');
            return;
        }

        this.setApiStatus('🟡', 'Testing...');
        
        if (this.claudeAPI) {
            const result = await this.claudeAPI.testConnection();
            if (result.success) {
                this.setApiStatus('🟢', 'Connected');
            } else {
                this.setApiStatus('🔴', 'Connection failed');
                console.warn('Claude API connection test failed:', result.message);
            }
        }
    }

    setApiStatus(indicator, text) {
        if (this.elements.statusIndicator) {
            this.elements.statusIndicator.textContent = indicator;
            this.elements.statusText.textContent = text;
        }
    }

    showAPIError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(231, 76, 60, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            backdrop-filter: blur(10px);
        `;
        errorDiv.innerHTML = `
            <strong>API Error:</strong><br>
            ${message}<br>
            <small>Using fallback responses for now.</small>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.elements.voiceStatus.textContent = 'Listening...';
                this.elements.micBtn.classList.add('active');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('Speech recognition result:', transcript);
                console.log('Confidence:', event.results[0][0].confidence);
                this.handleUserSpeech(transcript);
            };

            this.recognition.onend = () => {
                this.elements.voiceStatus.textContent = 'Ready';
                this.elements.micBtn.classList.remove('active');
                this.isRecording = false;
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.elements.voiceStatus.textContent = 'Error: ' + event.error;
                this.elements.micBtn.classList.remove('active');
                this.isRecording = false;
            };
        } else {
            console.warn('Speech recognition not supported');
            this.elements.voiceStatus.textContent = 'Speech recognition not supported';
        }
    }

    checkAuthState() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainContent();
        }
    }

    showSignInModal() {
        console.log('showSignInModal called');
        console.log('Sign in modal element:', this.elements.signInModal);
        if (this.elements.signInModal) {
            this.elements.signInModal.classList.remove('hidden');
            console.log('Modal should now be visible');
        } else {
            console.error('Sign in modal element not found!');
        }
    }

    hideSignInModal() {
        this.elements.signInModal.classList.add('hidden');
    }

    showApiKeyModal() {
        // Pre-fill current API key if exists
        const currentKey = window.appConfig?.getApiKey();
        if (currentKey) {
            this.elements.apiKeyInput.value = currentKey;
        }
        this.elements.apiKeyModal.classList.remove('hidden');
        this.updateApiStatus();
    }

    hideApiKeyModal() {
        this.elements.apiKeyModal.classList.add('hidden');
        this.elements.apiKeyInput.value = '';
    }

    async handleApiKeySubmit(e) {
        e.preventDefault();
        const apiKey = this.elements.apiKeyInput.value.trim();
        
        if (!apiKey) {
            alert('Please enter a valid API key');
            return;
        }

        // Update config
        if (window.appConfig) {
            window.appConfig.updateApiKey(apiKey);
        }
        if (this.claudeAPI) {
            this.claudeAPI.config.apiKey = apiKey;
        }

        // Test the connection
        this.setApiStatus('🟡', 'Testing...');
        const result = await this.claudeAPI.testConnection();
        
        if (result.success) {
            this.setApiStatus('🟢', 'Connected');
            this.hideApiKeyModal();
            this.showSuccessMessage('API key saved and tested successfully!');
        } else {
            this.setApiStatus('🔴', 'Connection failed');
            alert(`API connection failed: ${result.message}`);
        }
    }

    clearApiKey() {
        if (window.appConfig) {
            window.appConfig.clearApiKey();
        }
        if (this.claudeAPI) {
            this.claudeAPI.config.apiKey = null;
        }
        this.setApiStatus('⚪', 'Not configured');
        this.elements.apiKeyInput.value = '';
        this.showSuccessMessage('API key cleared');
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(39, 174, 96, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            backdrop-filter: blur(10px);
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    handleSignIn(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Simple mock authentication
        if (email && password) {
            this.currentUser = {
                id: Date.now().toString(),
                email: email,
                name: email.split('@')[0]
            };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.showMainContent();
            this.hideSignInModal();
        }
    }

    signOut() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.elements.mainContent.classList.add('hidden');
        this.elements.userInfo.classList.add('hidden');
        this.elements.signInBtn.classList.remove('hidden');
    }

    showMainContent() {
        this.elements.userName.textContent = this.currentUser.name;
        this.elements.userInfo.classList.remove('hidden');
        this.elements.signInBtn.classList.add('hidden');
        this.elements.mainContent.classList.remove('hidden');
        this.loadHistory();
        this.loadSharedSessions();
        this.loadDefaultPrompts();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Load data when switching to history/shared tabs
        if (tabName === 'history') this.loadHistory();
        if (tabName === 'shared') this.loadSharedSessions();
    }

    startSession() {
        const openingLine = this.elements.openingLine.value.trim();
        const systemPrompt = this.elements.systemPrompt.value.trim();

        if (!openingLine || !systemPrompt) {
            alert('Please fill in both opening line and system prompt');
            return;
        }

        this.currentSession = {
            id: Date.now().toString(),
            userId: this.currentUser.id,
            openingLine: openingLine,
            systemPrompt: systemPrompt,
            messages: [],
            startTime: new Date().toISOString(),
            endTime: null
        };

        this.elements.mainContent.classList.add('hidden');
        this.elements.voiceSession.classList.remove('hidden');
        this.elements.conversation.innerHTML = '';

        // Start with AI opening line
        this.addMessage('ai', openingLine);
        this.speakText(openingLine);
    }

    endSession() {
        if (this.currentSession) {
            this.currentSession.endTime = new Date().toISOString();
            this.sessions.push(this.currentSession);
            localStorage.setItem('voiceSessions', JSON.stringify(this.sessions));
            this.currentSession = null;
        }

        this.elements.voiceSession.classList.add('hidden');
        this.elements.mainContent.classList.remove('hidden');
        
        // Reset Claude API conversation history
        if (this.claudeAPI) {
            this.claudeAPI.resetConversation();
        }
        
        this.loadHistory();
    }

    toggleRecording() {
        if (!this.recognition) {
            alert('Speech recognition not supported in this browser');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.isRecording = true;
            this.recognition.start();
        }
    }

    handleUserSpeech(transcript) {
        console.log('User speech detected:', transcript);
        this.addMessage('user', transcript);
        
        // Generate AI response
        this.generateAIResponse(transcript);
    }

    async generateAIResponse(userInput) {
        try {
            console.log('=== Generating AI Response ===');
            console.log('User input:', userInput);
            console.log('Claude API available:', !!this.claudeAPI);
            console.log('Current session exists:', !!this.currentSession);
            console.log('AppConfig available:', !!window.appConfig);
            
            const hasApiKey = window.appConfig?.hasApiKey() || false;
            const apiKeyPresent = window.appConfig?.getApiKey() ? 'Present' : 'Missing';
            
            console.log('Has API key:', hasApiKey);
            console.log('API key value:', apiKeyPresent);
            
            // Show thinking indicator
            this.addMessage('ai', '...');
            
            let response;
            if (this.claudeAPI && this.currentSession) {
                console.log('✅ Using Claude API for response');
                // Use Claude API for real responses
                response = await this.claudeAPI.generateResponse(
                    userInput, 
                    this.currentSession.systemPrompt
                );
                console.log('Claude API response received:', response);
            } else {
                console.log('❌ Using mock response - claudeAPI:', !!this.claudeAPI, 'currentSession:', !!this.currentSession);
                // Fallback to mock responses
                response = this.getMockResponse(userInput);
                console.log('Mock response generated:', response);
            }
            
            // Remove thinking indicator and add real response
            const messages = this.elements.conversation.querySelectorAll('.message');
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.textContent === '...') {
                lastMessage.remove();
            }
            
            this.addMessage('ai', response);
            this.speakText(response);
            
        } catch (error) {
            console.error('Error generating AI response:', error);
            // Remove thinking indicator
            const messages = this.elements.conversation.querySelectorAll('.message');
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.textContent === '...') {
                lastMessage.remove();
            }
            
            // Show specific error message to help debug
            let errorMessage = "I'm having technical difficulties. ";
            if (error.message.includes('API request failed')) {
                errorMessage += `API Error: ${error.message}`;
            } else if (!window.appConfig?.hasApiKey()) {
                errorMessage += "No API key configured. Please set your Claude API key.";
            } else {
                errorMessage += `Error: ${error.message}`;
            }
            
            this.addMessage('ai', errorMessage);
            this.speakText("I'm having technical difficulties right now.");
        }
    }

    getMockResponse(userInput) {
        // Intelligent mock responses based on user input
        const input = userInput.toLowerCase();
        
        if (input.includes('hello') || input.includes('hi')) {
            return "Hello! It's great to meet you. I'm really interested in learning about your experiences today. What would you like to share with me?";
        }
        
        if (input.includes('work') || input.includes('job') || input.includes('career')) {
            return "That sounds like an important part of your professional journey. Can you walk me through what that experience was like for you? What were the key challenges you faced?";
        }
        
        if (input.includes('challenge') || input.includes('difficult') || input.includes('problem')) {
            return "It sounds like that was quite challenging. I'd love to understand more about how you approached that situation. What was your thought process when you realized you were facing this difficulty?";
        }
        
        if (input.includes('team') || input.includes('people') || input.includes('colleagues')) {
            return "Working with others can be really rewarding but also complex. How did you navigate the team dynamics in that situation? What role did you play?";
        }
        
        if (input.includes('learn') || input.includes('growth') || input.includes('develop')) {
            return "Personal and professional growth is so important. What specific insights or skills did you gain from that experience? How has it influenced your approach since then?";
        }
        
        // Contextual follow-ups
        const contextualResponses = [
            "That's fascinating. Can you help me understand the 'why' behind that decision? What was driving your thinking?",
            "I can sense that was meaningful to you. What made that moment particularly significant?",
            "It sounds like there were multiple factors at play. Which one do you think had the biggest impact?",
            "That gives me good insight into your approach. Can you share a specific example of how that played out?",
            "I'm curious about the outcome. How did things unfold after that? What was the result?",
            "That shows real thoughtfulness. What would you do differently if you faced a similar situation again?",
            "It sounds like you learned something important there. How has that experience shaped your perspective?",
            "That's a great point. Can you elaborate on what made that strategy effective?"
        ];

        return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
    }

    addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        this.elements.conversation.appendChild(messageDiv);
        this.elements.conversation.scrollTop = this.elements.conversation.scrollHeight;

        if (this.currentSession) {
            this.currentSession.messages.push({
                sender: sender,
                text: text,
                timestamp: new Date().toISOString()
            });
        }
    }

    speakText(text) {
        if (this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            this.synthesis.speak(utterance);
        }
    }

    loadHistory() {
        const userSessions = this.sessions.filter(session => session.userId === this.currentUser.id);
        this.elements.historyList.innerHTML = '';

        userSessions.forEach(session => {
            const historyItem = this.createHistoryItem(session);
            this.elements.historyList.appendChild(historyItem);
        });
    }

    createHistoryItem(session) {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const date = new Date(session.startTime).toLocaleDateString();
        const time = new Date(session.startTime).toLocaleTimeString();
        
        div.innerHTML = `
            <div class="item-header">
                <div class="item-title">Session ${session.id}</div>
                <div class="item-date">${date} ${time}</div>
            </div>
            <div class="item-content">
                <div class="item-field">
                    <strong>Opening Line:</strong><br>
                    ${session.openingLine}
                </div>
                <div class="item-field">
                    <strong>System Prompt:</strong><br>
                    ${session.systemPrompt}
                </div>
            </div>
            <div class="item-field">
                <strong>Messages:</strong> ${session.messages.length}
                <button class="btn btn-secondary" onclick="app.viewSession('${session.id}')">View Details</button>
                <button class="btn btn-primary" onclick="app.shareSession('${session.id}')">Share</button>
            </div>
        `;
        
        return div;
    }

    viewSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            let details = `Session Details:\n\n`;
            details += `Opening Line: ${session.openingLine}\n\n`;
            details += `System Prompt: ${session.systemPrompt}\n\n`;
            details += `Conversation:\n`;
            
            session.messages.forEach(msg => {
                details += `${msg.sender.toUpperCase()}: ${msg.text}\n`;
            });
            
            alert(details);
        }
    }

    shareSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            const summary = this.generateSessionSummary(session);
            const sharedSession = {
                ...session,
                sharedId: Date.now().toString(),
                summary: summary,
                sharedAt: new Date().toISOString()
            };
            
            this.sharedSessions.push(sharedSession);
            localStorage.setItem('sharedSessions', JSON.stringify(this.sharedSessions));
            
            // Generate shareable URL (mock)
            const shareUrl = `${window.location.origin}/shared/${sharedSession.sharedId}`;
            
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert(`Session shared! URL copied to clipboard:\n${shareUrl}`);
            }).catch(() => {
                alert(`Session shared! Share URL:\n${shareUrl}`);
            });
            
            this.loadSharedSessions();
        }
    }

    generateSessionSummary(session) {
        return `Interview session with ${session.messages.length} exchanges`;
    }

    loadSharedSessions() {
        const userSharedSessions = this.sharedSessions.filter(session => session.userId === this.currentUser.id);
        this.elements.sharedList.innerHTML = '';

        userSharedSessions.forEach(session => {
            const sharedItem = this.createSharedItem(session);
            this.elements.sharedList.appendChild(sharedItem);
        });
    }

    createSharedItem(session) {
        const div = document.createElement('div');
        div.className = 'shared-item';
        
        const date = new Date(session.sharedAt).toLocaleDateString();
        const shareUrl = `${window.location.origin}/shared/${session.sharedId}`;
        
        div.innerHTML = `
            <div class="item-header">
                <div class="item-title">${session.summary}</div>
                <div class="item-date">Shared ${date}</div>
            </div>
            <div class="item-content">
                <div class="item-field">
                    <strong>Share URL:</strong><br>
                    <a href="${shareUrl}" target="_blank">${shareUrl}</a>
                </div>
                <div class="item-field">
                    <strong>Messages:</strong> ${session.messages.length}
                </div>
            </div>
        `;
        
        return div;
    }

    loadDefaultPrompts() {
        const defaultPrompts = [
            {
                name: "General Interview",
                openingLine: "Hi! I'm here to learn more about your experiences and perspectives. Let's start with you telling me a bit about yourself and what brings you here today.",
                systemPrompt: "You are conducting a general interview. Ask open-ended questions about the person's background, experiences, and opinions. Be empathetic, curious, and follow up on interesting points they mention."
            },
            {
                name: "User Research",
                openingLine: "Thanks for participating in our user research session! I'd love to understand how you currently approach [problem/task] and what challenges you face.",
                systemPrompt: "You are conducting user research for a product team. Focus on understanding user behaviors, pain points, and workflows. Ask about current tools, frustrations, and desired improvements. Probe for specific examples and concrete use cases."
            },
            {
                name: "Behavioral Interview",
                openingLine: "Welcome! I'm excited to learn about your professional experiences. Let's start by having you walk me through a challenging project you worked on recently.",
                systemPrompt: "You are conducting a behavioral interview. Use the STAR method (Situation, Task, Action, Result) to explore past experiences. Ask for specific examples, probe for details about their role, decisions made, and outcomes achieved."
            },
            {
                name: "Customer Feedback",
                openingLine: "Thank you for taking the time to share your feedback with us. Your experience and insights are really valuable. Can you start by telling me about your overall experience with our product?",
                systemPrompt: "You are gathering customer feedback. Focus on understanding their experience, satisfaction levels, specific use cases, and areas for improvement. Ask about what works well, what doesn't, and what features they wish existed."
            },
            {
                name: "Academic Research",
                openingLine: "Hello! Thank you for participating in this research study. I'm interested in understanding your thoughts and experiences related to [research topic]. There are no right or wrong answers - I'm just looking to learn from your perspective.",
                systemPrompt: "You are conducting academic research. Maintain objectivity, ask open-ended questions, and avoid leading questions. Focus on gathering rich, detailed responses about the research topic. Encourage elaboration and follow interesting threads."
            },
            {
                name: "Therapy/Counseling",
                openingLine: "Hello, I'm glad you're here today. This is a safe space where you can share whatever is on your mind. How are you feeling right now, and what would you like to talk about?",
                systemPrompt: "You are a supportive counselor. Use active listening, empathy, and open-ended questions. Reflect back what you hear, validate emotions, and gently guide towards self-reflection and insight. Focus on their feelings and experiences."
            }
        ];

        this.createPromptSelector(defaultPrompts);
    }

    createPromptSelector(prompts) {
        // Add prompt selector to the form section
        const formSection = document.querySelector('.form-section');
        
        // Check if selector already exists
        if (document.getElementById('promptSelector')) return;

        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'form-group';
        selectorDiv.innerHTML = `
            <label for="promptSelector">Quick Start Templates:</label>
            <select id="promptSelector" class="prompt-selector">
                <option value="">Select a template...</option>
                ${prompts.map((prompt, index) => 
                    `<option value="${index}">${prompt.name}</option>`
                ).join('')}
            </select>
        `;

        // Insert before the opening line field
        const openingLineGroup = this.elements.openingLine.parentElement;
        formSection.insertBefore(selectorDiv, openingLineGroup);

        // Add event listener
        document.getElementById('promptSelector').addEventListener('change', (e) => {
            const selectedIndex = e.target.value;
            if (selectedIndex !== '') {
                const selectedPrompt = prompts[selectedIndex];
                this.elements.openingLine.value = selectedPrompt.openingLine;
                this.elements.systemPrompt.value = selectedPrompt.systemPrompt;
            }
        });
    }

    createShareLink() {
        const openingLine = this.elements.openingLine.value.trim();
        const systemPrompt = this.elements.systemPrompt.value.trim();

        if (!openingLine || !systemPrompt) {
            alert('Please fill in both opening line and system prompt before creating a share link');
            return;
        }

        // Create a shareable session configuration
        const shareConfig = {
            id: Date.now().toString(),
            openingLine: openingLine,
            systemPrompt: systemPrompt,
            createdBy: this.currentUser.id,
            createdAt: new Date().toISOString(),
            purpose: this.generatePurposeSummary(openingLine, systemPrompt)
        };

        // Store the configuration
        const shareConfigs = JSON.parse(localStorage.getItem('shareConfigs') || '[]');
        shareConfigs.push(shareConfig);
        localStorage.setItem('shareConfigs', JSON.stringify(shareConfigs));

        // Generate the share URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareConfig.id}`;

        // Copy to clipboard and show success message
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert(`Share link created and copied to clipboard!\n\n${shareUrl}\n\nParticipants can use this link to directly access the voice interview.`);
        }).catch(() => {
            alert(`Share link created:\n\n${shareUrl}\n\nParticipants can use this link to directly access the voice interview.`);
        });
    }

    generatePurposeSummary(openingLine, systemPrompt) {
        // Extract purpose from the system prompt or create a generic summary
        if (systemPrompt.toLowerCase().includes('user research')) {
            return 'User Research Interview - Help us understand your experience and needs';
        } else if (systemPrompt.toLowerCase().includes('behavioral interview')) {
            return 'Behavioral Interview - Share your professional experiences';
        } else if (systemPrompt.toLowerCase().includes('customer feedback')) {
            return 'Feedback Session - Tell us about your experience with our product';
        } else if (systemPrompt.toLowerCase().includes('academic research')) {
            return 'Research Study - Participate in our academic research';
        } else if (systemPrompt.toLowerCase().includes('counseling') || systemPrompt.toLowerCase().includes('therapy')) {
            return 'Support Session - A safe space to share and reflect';
        } else {
            return 'Voice Interview - Share your thoughts and experiences with us';
        }
    }
}

// Check if this is a shared session on page load
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    
    if (shareId) {
        // This is a shared session, load the minimal interface
        loadSharedSession(shareId);
    }
});

function loadSharedSession(shareId) {
    const shareConfigs = JSON.parse(localStorage.getItem('shareConfigs') || '[]');
    const config = shareConfigs.find(c => c.id === shareId);
    
    if (!config) {
        document.body.innerHTML = '<div class="container"><h1>Session Not Found</h1><p>The shared session link is invalid or has expired.</p></div>';
        return;
    }

    // Replace the entire page with a minimal interface
    document.body.innerHTML = `
        <div class="container">
            <div class="shared-session">
                <h1>Voice Interview</h1>
                <div class="purpose-summary">
                    <h2>${config.purpose}</h2>
                    <p>This voice interview will help us gather valuable insights. Click the button below when you're ready to begin.</p>
                </div>
                <button id="sharedStartBtn" class="btn btn-primary btn-large">Start Voice Interview</button>
                
                <div id="sharedVoiceSession" class="voice-session hidden">
                    <div class="session-header">
                        <h2>Voice Interview in Progress</h2>
                        <button id="sharedEndBtn" class="btn btn-danger">End Interview</button>
                    </div>
                    <div class="conversation" id="sharedConversation"></div>
                    <div class="voice-controls">
                        <button id="sharedMicBtn" class="mic-btn">
                            <span class="mic-icon">🎤</span>
                            <span class="mic-text">Click to Speak</span>
                        </button>
                        <div class="status" id="sharedVoiceStatus">Ready</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize the shared session functionality
    initializeSharedSession(config);
}

function initializeSharedSession(config) {
    let isRecording = false;
    let recognition = null;
    const synthesis = window.speechSynthesis;
    let currentSession = null;

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            document.getElementById('sharedVoiceStatus').textContent = 'Listening...';
            document.getElementById('sharedMicBtn').classList.add('active');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            addSharedMessage('user', transcript);
            generateSharedAIResponse(transcript, config.systemPrompt);
        };

        recognition.onend = () => {
            document.getElementById('sharedVoiceStatus').textContent = 'Ready';
            document.getElementById('sharedMicBtn').classList.remove('active');
            isRecording = false;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            document.getElementById('sharedVoiceStatus').textContent = 'Error: ' + event.error;
            document.getElementById('sharedMicBtn').classList.remove('active');
            isRecording = false;
        };
    }

    // Event listeners
    document.getElementById('sharedStartBtn').addEventListener('click', () => {
        currentSession = {
            id: Date.now().toString(),
            configId: config.id,
            messages: [],
            startTime: new Date().toISOString()
        };

        document.querySelector('.shared-session').style.display = 'none';
        document.getElementById('sharedVoiceSession').classList.remove('hidden');
        
        // Start with AI opening line
        addSharedMessage('ai', config.openingLine);
        speakSharedText(config.openingLine);
    });

    document.getElementById('sharedEndBtn').addEventListener('click', () => {
        if (currentSession) {
            currentSession.endTime = new Date().toISOString();
            // Store the completed session
            const completedSessions = JSON.parse(localStorage.getItem('completedSharedSessions') || '[]');
            completedSessions.push(currentSession);
            localStorage.setItem('completedSharedSessions', JSON.stringify(completedSessions));
        }
        
        document.body.innerHTML = `
            <div class="container">
                <div class="thank-you">
                    <h1>Thank You!</h1>
                    <p>Your interview has been completed. Thank you for your participation.</p>
                </div>
            </div>
        `;
    });

    document.getElementById('sharedMicBtn').addEventListener('click', () => {
        if (!recognition) {
            alert('Speech recognition not supported in this browser');
            return;
        }

        if (isRecording) {
            recognition.stop();
        } else {
            isRecording = true;
            recognition.start();
        }
    });

    function addSharedMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        const conversation = document.getElementById('sharedConversation');
        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;

        if (currentSession) {
            currentSession.messages.push({
                sender: sender,
                text: text,
                timestamp: new Date().toISOString()
            });
        }
    }

    function speakSharedText(text) {
        if (synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            synthesis.speak(utterance);
        }
    }

    function generateSharedAIResponse(userInput, systemPrompt) {
        // Mock AI response generation based on system prompt
        const responses = [
            "That's interesting. Can you tell me more about that?",
            "I see. How did that make you feel?",
            "What do you think caused that situation?",
            "Can you give me a specific example?",
            "How would you handle that differently next time?",
            "What was the most challenging part about that?",
            "How did others react to that?",
            "What did you learn from that experience?"
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        
        setTimeout(() => {
            addSharedMessage('ai', response);
            speakSharedText(response);
        }, 1000);
    }
}

// Initialize the app
console.log('Starting Voice Interview App initialization...');
try {
    const app = new VoiceInterviewApp();
    console.log('Voice Interview App initialized successfully');
    window.app = app; // Make app globally accessible for debugging
} catch (error) {
    console.error('Failed to initialize Voice Interview App:', error);
}

// Export for module system
export default VoiceInterviewApp;