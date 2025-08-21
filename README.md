# CiteFinder

Automatically extract statements from your paper, find sources from the world's largest academic databases, and generate citations.

![CiteFinder](https://img.shields.io/badge/Next.js-14.0.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18.0.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎯 **Core Functionality**
- **Statement Extraction**: Automatically extracts key statements and claims from your text that need academic support
- **Multi-Database Source Discovery**: Finds supporting sources across arXiv, OpenAlex, CrossRef, and PubMed
- **Citation & References Generator**: Generates citations and formatted references for your selected sources
- **PDF & Text Support**: Upload PDFs or paste text for instant processing
- **Confidence Scoring**: Intelligent confidence ratings for matches and extracted citations

### 🎨 **User Experience**
- **Modern Glass Morphism Design**: Beautiful, professional interface
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Accessibility**: Full ARIA support and screen reader compatibility
- **PWA Ready**: Install as a mobile app for offline access
- **SEO Optimized**: Built for discoverability and search engine ranking

### 🔍 **Academic Database Integration**
- **arXiv**: Computer science, physics, mathematics papers
- **OpenAlex**: 200+ million papers across all disciplines
- **CrossRef**: 140+ million DOIs and journal articles
- **PubMed**: Biomedical and life sciences research

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 14**: App Router with server-side rendering
- **React 18**: Latest React with concurrent features
- **TypeScript**: Full type safety and better development experience
- **Tailwind CSS**: Utility-first CSS framework

### **Backend & APIs**
- **PDF Processing**: pdf-parse for text extraction
- **Academic APIs**: Real-time integration with major databases
- **Error Handling**: Robust error handling and fallbacks
- **Rate Limiting**: Respectful API usage with built-in delays

### **Performance & SEO**
- **Core Web Vitals**: Optimized for Google's performance metrics
- **Structured Data**: JSON-LD schema markup
- **Sitemap & Robots**: Automatic generation for search engines
- **PWA Support**: Web app manifest and service worker ready

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** 
- **npm or yarn**

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd citefinder
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env.local
```
Then edit `.env.local` with your actual values (see Authentication Setup below).

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication Setup

CiteFinder uses NextAuth.js with multiple authentication providers. Follow these steps to set up authentication:

### 1. Supabase Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys from Settings > API
3. Add them to your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

### 2. OAuth Providers (Optional)
#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`