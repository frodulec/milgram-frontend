# Milgram Experiment Frontend

## 🎯 Overview

A React-based frontend application for visualisation of Milgram experiment conversations which are generated using this repo:
https://github.com/frodulec/milgram-experiments


This application provides a platform for running psychological experiments that study learning dynamics, obedience patterns, and decision-making processes. The frontend features real-time audio-visual synchronization, dynamic image generation, and an intuitive interface for both researchers and participants.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd milgram-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Serve the build**
   ```bash
   npm run serve
   ```

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build the Docker image
make docker-build

# Run the container
make docker-run

# Or build and run in one command
make docker-dev
```

### Manual Docker Commands

```bash
# Build image
docker build -t learning-experiment-app .

# Run container
docker run -p 3000:80 learning-experiment-app
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

### Backend Integration

The application connects to a backend API for:
- Text-to-speech audio generation
- Experiment data streaming
- Conversation management
- Real-time experiment execution

Default backend URL: `https://milgram-experiments-production.up.railway.app`

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # UI components (sliders, color mode)
│   ├── AudioControls.js # Audio playback controls
│   ├── ImageDisplay.js  # Dynamic image rendering
│   ├── MessageHistory.js # Conversation display
│   └── Sidebar.js      # Navigation sidebar
├── hooks/              # Custom React hooks
│   ├── useAudioPlayer.js    # Audio management
│   ├── useExperienceManager.js # Experiment flow
│   └── useSyncQueue.js      # Synchronization logic
├── pages/              # Page components
│   ├── ApiKeySetup.js  # API configuration
│   └── Settings.js     # Application settings
├── services/           # API and external services
│   ├── apiService.js   # Backend communication
│   └── imageGenerator.js # Dynamic image generation
├── utils/              # Utility functions
│   └── imageCache.js   # Image caching system
└── assets/             # Static assets
    └── optimized/      # Optimized images
```

## 🎯 Key Components

### ImageGenerator
- Uses Fabric.js for dynamic canvas rendering
- Generates real-time scenes with characters and speech bubbles
- Implements intelligent caching for performance
- Supports multiple character positions and animations

### AudioPlayer Hook
- Manages synchronized audio playback
- Controls playback rate and volume
- Handles audio queue management
- Integrates with text-to-speech API

### SyncQueue System
- Coordinates audio and visual synchronization
- Processes real-time experiment data
- Manages message flow and timing
- Ensures smooth user experience

## 🛠️ Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run optimize-images` - Optimize image assets
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App

## 🎨 Customization

### Themes
The application supports custom theming through Chakra UI:
- Light and dark mode support
- Custom color schemes
- Responsive design breakpoints

### Experiment Parameters
Configure experiment settings in the Settings page:
- Voltage ranges and increments
- Character profiles and personas
- Message templates
- Audio and visual preferences

## 🔒 Security Considerations

- API keys are stored securely in browser storage
- HTTPS enforcement for production deployments
- CORS configuration for backend communication
- Input validation and sanitization

## 📊 Performance Optimizations

- **Image Optimization**: Automatic image compression and caching
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Tree shaking and minification
- **CDN Ready**: Static asset optimization for CDN deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information

## 🔬 Research Applications

This application is designed for psychological research and educational purposes. It provides a controlled environment for studying:
- Learning behaviors and patterns
- Decision-making processes
- Social influence and obedience
- Educational technology effectiveness

---

**Note**: This application is designed for research and educational purposes. Please ensure compliance with relevant ethical guidelines and institutional review board requirements when conducting experiments.
