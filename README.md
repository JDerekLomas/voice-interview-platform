# Voice Interview Testing Platform

A premium glass and steel UI for conducting AI-powered voice interviews with researchers and participants. Built with vanilla JavaScript and integrated with Claude API for intelligent responses.

![Voice Interview Platform](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Claude API](https://img.shields.io/badge/Powered%20by-Claude%20API-blue)
![Modern UI](https://img.shields.io/badge/UI-Glass%20%26%20Steel-purple)

## ✨ Features

### 🎯 For Researchers
- **Quick Start Templates** - Pre-built prompts for different interview types
- **Real-time Voice Interviews** - Speech recognition and synthesis
- **Session History** - Track all interviews with detailed transcripts
- **Share Links** - Generate participant-friendly interview links
- **Claude AI Integration** - Intelligent, context-aware responses

### 🗣️ Interview Types
- User Research & Product Feedback
- Behavioral Interviews  
- Customer Experience Sessions
- Academic Research Studies
- Therapeutic/Counseling Sessions
- General Interviews

### 🎨 Premium Design
- Glassmorphism UI with backdrop blur effects
- Smooth animations and micro-interactions
- Mobile-responsive design
- Modern gradient backgrounds
- Accessible color contrasts

## 🚀 Quick Start

### 1. Get Claude API Key
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account and generate an API key
3. Keep your API key secure

### 2. Deploy to GitHub Pages
1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from a branch" → main
4. Your app will be available at `https://yourusername.github.io/voice-interview-platform`

### 3. Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/voice-interview-platform.git
cd voice-interview-platform

# Serve locally (Python 3)
python -m http.server 8000

# Or with Node.js
npx serve .

# Open http://localhost:8000
```

## 🔧 Setup & Configuration

### API Key Configuration
When you first run the app, you'll be prompted to enter your Claude API key. This is stored locally in your browser for the session.

**For Production**: Set up environment variables or a secure key management system.

### Browser Requirements
- Modern browser with Speech Recognition support (Chrome, Edge, Safari)
- Microphone access for voice features
- JavaScript enabled

## 📱 Usage

### Creating an Interview
1. **Sign In** with email/password
2. **Select Template** or create custom prompts
3. **Configure** opening line and system prompt
4. **Start Session** for researcher testing
5. **Create Share Link** for participants

### Sharing with Participants
1. Create a share link from the main interface
2. Send the link to participants
3. Participants see a clean, minimal interface
4. Sessions are automatically saved to your history

### Managing Sessions
- View all past sessions in the **History** tab
- See shared sessions in the **Shared** tab
- Export or analyze conversation transcripts

## 🛠️ Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **API**: Anthropic Claude API
- **Storage**: Local Storage (browser-based)
- **Speech**: Web Speech API
- **Hosting**: GitHub Pages compatible

### File Structure
```
├── index.html          # Main application
├── style.css           # Glass & steel styling
├── script.js           # Core application logic
├── config.js           # Configuration management
├── claude-api.js       # Claude API integration
├── README.md           # Documentation
└── .gitignore         # Git ignore rules
```

### API Integration
The app uses Claude-3-Sonnet for generating intelligent interview responses:
- Context-aware follow-up questions
- Maintains conversation history
- Adapts to different interview styles
- Graceful fallback for API issues

## 🔒 Security & Privacy

### Data Handling
- API keys stored locally in browser
- Session data kept in localStorage
- No server-side data storage
- Participants' responses processed through Claude API

### Best Practices
- Never commit API keys to version control
- Use HTTPS in production
- Regular API key rotation
- Inform participants about AI usage

## 🎨 Customization

### Styling
Modify `style.css` to customize the glass and steel aesthetic:
- Background gradients
- Glassmorphism effects
- Color schemes
- Animation timings

### Interview Templates
Add new templates in `script.js`:
```javascript
{
    name: "Custom Interview Type",
    openingLine: "Your opening message...",
    systemPrompt: "Your system instructions..."
}
```

## 🚀 Deployment Options

### GitHub Pages (Recommended)
1. Push to GitHub repository
2. Enable Pages in repository settings
3. Deploy from main branch

### Netlify
1. Connect GitHub repository
2. Deploy with default settings
3. Add environment variables if needed

### Vercel
1. Import GitHub repository
2. Deploy with static site settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/voice-interview-platform/issues)
- **Documentation**: This README
- **API**: [Anthropic Claude Documentation](https://docs.anthropic.com/)

## 🔮 Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Export to popular formats (PDF, CSV)
- [ ] Multi-language support
- [ ] Integration with research platforms
- [ ] Advanced prompt engineering tools

---

Built with ❤️ for researchers who want to leverage AI for better interviews.