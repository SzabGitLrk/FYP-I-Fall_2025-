# Underwater Species Detection

**AI-powered web application for identifying marine species from underwater photographs using deep learning.**

## Overview

Underwater Species Detection is a web application that identifies marine species from underwater photographs using deep learning. Built with React and TensorFlow.js, the application uses a custom-trained MobileNetV2 model to analyze images and detect 10 species commonly found in the Arabian Sea region.

The application runs entirely in the browser, utilizing edge AI to process images without requiring a backend server, ensuring privacy and fast processing times.

## Key Features

### Core Detection
- **AI-Powered Detection**: Runs a pre-trained MobileNetV2 neural network (2.5M parameters) directly in the browser with 85%+ validation accuracy
- **Real-Time Analysis**: Processes underwater photos instantly without backend dependencies
- **Species Recognition**: Can identify sharks, dolphins, whales, sea turtles, jellyfish, crabs, seahorses, octopuses, sea rays, and starfish
- **Confidence Scoring**: Shows confidence percentages for top predictions and all matched species

### User Features
- **Interactive Dashboard**: Displays analytics with activity charts and species distribution pie charts
- **Species Encyclopedia**: Browse detailed information about detected species, including habitat, conservation status, and fun facts
- **Detection History**: Track all identifications with timestamps and full search/filter capabilities
- **Export Capabilities**: Export detection history as CSV, JSON, or PDF reports
- **Image Gallery**: View and search through detected species with categorization by type (shark, fish, invertebrate, mammal, reptile)
- **Share Cards**: Generate and download shareable cards for detections with species info
- **Responsive Design**: Optimized for mobile and desktop viewing with smooth animations

### User Experience
- Drag-and-drop image upload interface
- Live processing visualization with stage indicators
- Animated UI elements with bubble effects and smooth transitions
- Mobile-friendly navigation with intuitive routing
- Error handling with retry mechanisms
- Dark theme optimized for viewing underwater imagery

## Technology Stack

### Frontend Framework
- **React** 19.2.0 - UI library
- **React Router DOM** 7.11.0 - Client-side routing
- **Vite** 6.0.3 - Build tool with HMR

### Machine Learning
- **TensorFlow.js** 4.22.0 - JavaScript ML library
- **TensorFlow Models (MobileNet)** 2.1.1 - Pre-trained model

### Styling & UI
- **Tailwind CSS** 4.1.17 - Utility-first CSS framework
- **Lucide React** 0.554.0 - Icon library
- **Custom CSS** animations and effects

### Data Visualization
- **Recharts** 3.6.0 - Chart and graph library

### Utilities
- **jsPDF** 4.0.0 - PDF generation
- **jsPDF AutoTable** 5.0.7 - PDF table generation
- **UUID** 13.0.0 - Unique ID generation

### Development
- **ESLint** 9.39.1 - Code linting
- **React Hooks ESLint Plugin** - Hook validation

## Project Structure

```
src/
├── App.jsx                          # Main app component with routing
├── UnderWater.jsx                   # Main detection interface
├── App.css                          # Global styles
├── index.css                        # Base CSS
├── main.jsx                         # Entry point
│
├── pages/                           # Route pages
│   ├── HomePage.jsx                 # Home page (detection interface)
│   ├── DashboardPage.jsx            # Analytics dashboard
│   ├── GalleryPage.jsx              # Species gallery
│   ├── HistoryPage.jsx              # Detection history
│   └── SpeciesDetailPage.jsx        # Individual species details
│
├── components/                      # Reusable components
│   ├── Layout/
│   │   ├── MainLayout.jsx           # Main layout wrapper
│   │   └── Sidebar.jsx              # Navigation sidebar
│   ├── Dashboard/
│   │   ├── StatsCard.jsx            # Statistics cards
│   │   ├── ActivityBarChart.jsx     # Activity visualization
│   │   ├── SpeciesPieChart.jsx      # Species distribution
│   │   └── RecentDetections.jsx     # Recent detection list
│   ├── Gallery/
│   │   ├── SpeciesGrid.jsx          # Species grid display
│   │   ├── SpeciesCard.jsx          # Individual species card
│   │   └── SpeciesModal.jsx         # Species detail modal
│   └── History/
│       ├── HistoryTable.jsx         # Detection history table
│       └── ExportButtons.jsx        # Export functionality
│
├── hooks/                           # Custom React hooks
│   ├── useFishDetector.js           # ML model and detection logic
│   ├── useDetectionHistory.js       # History management
│   └── useLocalStorage.js           # Local storage utilities
│
├── context/                         # React Context
│   └── DetectionContext.jsx         # Global detection state
│
└── utils/                           # Utility functions
    ├── speciesData.js               # Species database
    ├── fishCategories.js            # Fish category classification
    ├── shareCard.js                 # Share card generation
    └── exportUtils.js               # Export functionality
```

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm lint
```

### Usage

1. **Navigate to Home**: The application opens with the detection interface
2. **Upload Image**: Drag and drop or click to upload an underwater photo (JPG/PNG)
3. **Run Detection**: Click "Detect Species" to analyze the image
4. **View Results**: See identified species, confidence scores, and detailed information
5. **Explore More**: 
   - View analytics on the Dashboard
   - Browse species in the Gallery
   - Review detection history in History

## Features in Detail

### Detection Tool
- Accepts JPG and PNG format images
- Shows real-time processing stages
- Displays confidence breakdown for top predictions
- Highlights detected species with bounding box on image
- Automatic history saving

### Dashboard
- Total detections count
- Detections per species pie chart
- Daily activity bar chart
- Recent detections list with timestamps
- Quick access to detection statistics

### Species Gallery
- Browse all 10 detectable species
- Filter by category (shark, fish, invertebrate, mammal, reptile)
- View scientific names and conservation status
- Click to see detailed species information

### Detection History
- Complete log of all detections with timestamps
- Search and filter capabilities
- View detection confidence and date
- Export as CSV for spreadsheet analysis
- Export as JSON for data processing
- Export as PDF report with charts and summaries

## Supported Species

The application can detect the following 10 marine species from the Arabian Sea:

1. **Shark** (Predator) 🦈
2. **Dolphin** (Mammal) 🐬
3. **Whale** (Mammal) 🐋
4. **Sea Turtle** (Reptile) 🐢
5. **Jellyfish** (Invertebrate) 🪼
6. **Crab** (Invertebrate) 🦀
7. **Octopus** (Invertebrate) 🦑
8. **Seahorse** (Fish) 🐠
9. **Sea Ray** (Fish) 🌊
10. **Starfish** (Invertebrate) ⭐

## Model Information

- **Architecture**: MobileNetV2 (Efficient CNN for mobile/web)
- **Parameters**: 2.5 Million
- **Validation Accuracy**: 85%+
- **Training Images**: 5,800+
- **Input Size**: 224 × 224 pixels
- **Execution**: Client-side (TensorFlow.js WebGL backend)

## Performance

- **Detection Speed**: ~1-3 seconds per image (varies by device)
- **Model Load Time**: ~2-5 seconds (cached after first load)
- **Memory Usage**: ~50-100MB (includes model and browser runtime)
- **Browser Support**: Modern browsers with WebGL support

## Key Architectural Decisions

### Client-Side Processing
All ML model execution happens in the browser using TensorFlow.js, ensuring:
- **Privacy**: Images never leave the user's device
- **Speed**: No network latency for inference
- **Offline Capability**: Works without internet after initial load
- **Cost**: No server infrastructure needed

### State Management
- **React Context API** for global detection state
- **Custom Hooks** for reusable logic (detection, history, storage)
- **Local Storage** for persistent history and preferences

### UI/UX
- **Dark Theme**: Optimized for underwater imagery visualization
- **Smooth Animations**: CSS animations for responsive feedback
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Accessibility**: Semantic HTML and keyboard navigation support

## Use Cases

- **Marine Biology Research**: Assist in species identification and tracking
- **Fishery Management**: Monitor catches and species distribution
- **Environmental Education**: Teach marine biology with visual identification
- **Citizen Science**: Enable public participation in marine data collection
- **Aquarium Applications**: Interactive exhibits for species identification
- **Conservation Efforts**: Track endangered species populations

## Future Enhancements

- Extended species database (50+ species)
- Real-time video stream detection
- Object detection with bounding boxes
- Geographic data collection and mapping
- Integration with marine databases
- Multi-language support
- Mobile app version with camera integration
- Collaborative identification features

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 15+)
- **Mobile Browsers**: Full support with responsive design

## Performance Tips

- Use clear, well-lit underwater photos
- Ensure the species is the main subject
- Avoid blurry or heavily filtered images
- For best results, upload 224×224 or larger images

## Development Notes

- Hot Module Replacement (HMR) enabled for fast development
- ESLint configured for code quality
- Modular component structure for scalability
- Separation of concerns: ML logic, UI components, and utilities
- React 19+ features utilized (where supported)

## License & Attribution

This project uses:
- TensorFlow.js (Apache 2.0)
- MobileNet model (Apache 2.0)
- React & React Router (MIT)
- Tailwind CSS (MIT)
- Lucide Icons (ISC)

---

**Created**: 2024  
**Status**: Production Ready  
**Version**: 1.0.0
