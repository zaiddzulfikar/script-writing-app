# Script Writing App

AI-powered script writing application with mobile-optimized UI, Firebase integration, and advanced features.

## 🚀 Features

- **AI-Powered Script Generation**: Generate scripts using advanced AI models
- **Mobile-First Design**: Optimized for mobile devices with responsive UI
- **Firebase Integration**: Real-time database and authentication
- **Project Management**: Create and manage multiple script projects
- **Episode Management**: Organize scripts into episodes with continuity
- **Style DNA Analysis**: Analyze and maintain consistent writing style
- **Knowledge Graph**: Build character and plot relationships
- **PDF Upload**: Extract text from PDF documents
- **Real-time Chat Interface**: Interactive script development

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Custom CSS
- **Animations**: Framer Motion
- **Backend**: Firebase Functions, Firestore
- **Authentication**: Firebase Auth
- **AI**: Google Gemini API
- **Deployment**: Firebase Hosting

## 📱 Mobile Features

- Responsive design for all screen sizes
- Touch-optimized interface
- Mobile-specific navigation
- Carousel mode buttons
- Touch feedback animations
- Optimized scrolling and performance

## 🎨 UI Components

- **Project Detail Page**: Mobile-optimized with custom CSS classes
- **Chat Interface**: Real-time messaging with AI
- **Script Renderer**: Professional script formatting
- **Modal System**: High z-index modals for proper layering
- **Analysis Tools**: Style DNA and Knowledge Graph analysis

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI
- Google Cloud account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/script-writing-app.git
cd script-writing-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
```bash
firebase login
firebase init
```

4. Configure environment variables:
```bash
cp .env.example .env.local
# Add your Firebase and API keys
```

5. Run the development server:
```bash
npm run dev
```

### Deployment

1. Build the application:
```bash
npm run build:static
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── projects/          # Project pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI components
│   └── ...               # Feature components
├── lib/                   # Utility libraries
├── types/                 # TypeScript types
├── functions/             # Firebase Functions
└── public/                # Static assets
```

## 🎯 Key Features

### Mobile Optimization
- Custom CSS classes for mobile layout
- Touch-friendly interface
- Responsive design patterns
- Performance optimizations

### AI Integration
- Gemini API for script generation
- Context-aware responses
- Style DNA analysis
- Knowledge graph building

### Real-time Features
- Live chat interface
- Real-time updates
- Collaborative editing
- Instant feedback

## 🔧 Development

### CSS Architecture
- Custom CSS classes in `project-detail.css`
- Global styles in `globals.css`
- Mobile-first responsive design
- Touch feedback animations

### Component Structure
- Modular React components
- TypeScript interfaces
- Custom hooks for state management
- Error boundaries for stability

## 📱 Mobile Support

The application is fully optimized for mobile devices with:
- Touch-optimized buttons and inputs
- Responsive layouts for all screen sizes
- Mobile-specific navigation patterns
- Performance optimizations for mobile
- Touch feedback and animations

## 🚀 Deployment

The application is deployed on Firebase Hosting with:
- Automatic builds on push
- CDN distribution
- SSL certificates
- Custom domain support

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue on GitHub.

---

**Live Demo**: https://emtek-script-generation.web.app