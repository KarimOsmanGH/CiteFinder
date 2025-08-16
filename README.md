# CiteFinder 📄

Intelligent Citation Discovery - Upload your paper or paste text, and our AI finds the perfect academic sources to support your content. We intelligently identify concepts that need citations and automatically generate proper references from the world's largest databases.

![CiteFinder](https://img.shields.io/badge/Next.js-14.0.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18.0.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎯 **Core Functionality**
- **Smart PDF Upload**: Drag & drop interface with instant file validation
- **Citation Extraction**: Automatically extracts citations using multiple styles (APA, MLA, Chicago, etc.)
- **Multi-Database Search**: Searches across major academic databases simultaneously
- **Real-time Processing**: Live status updates with beautiful animations
- **Confidence Scoring**: Intelligent confidence ratings for extracted citations

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
6. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```



### 3. Email Provider (Optional)
For passwordless email authentication:
1. Set up SMTP credentials (Gmail, SendGrid, etc.)
2. Add to `.env.local`:
   ```
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your-email@gmail.com
   EMAIL_SERVER_PASSWORD=your-app-password
   EMAIL_FROM=noreply@citefinder.app
   ```

### 4. NextAuth Secret
Generate a secure random string for NextAuth:
```bash
openssl rand -base64 32
```
Add to `.env.local`:
```
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000
```

## 📖 How It Works

### Citation Extraction

The application uses advanced regex patterns to identify citations in multiple formats:

- **APA Style**: `Author, A. A., & Author, B. B. (Year). Title. Journal, Volume(Issue), Pages.`
- **MLA Style**: `Author, A. "Title." Journal, vol. Volume, no. Issue, Year, pp. Pages.`
- **Chicago Style**: `Author, A. A., and B. B. Author. "Title." Journal Volume, no. Issue (Year): Pages.`
- **Simple Citations**: `(Author, Year)` or `Author et al. (Year)`

### Related Paper Search

For each extracted citation, the app:
1. **Extracts key information** (authors, title, year)
2. **Searches 4 databases simultaneously** (arXiv, OpenAlex, CrossRef, PubMed)
3. **Removes duplicates** and calculates similarity scores
4. **Returns up to 15 most relevant papers** with metadata

### Processing Pipeline

```
PDF Upload → Text Extraction → Citation Detection → Multi-API Search → Results Display
```

## 🔧 API Endpoints

### POST `/api/process-pdf`

Processes a PDF file and returns extracted citations and related papers.

**Request:**
- Content-Type: `multipart/form-data`
- Body: PDF file (max 50MB)

**Response:**
```json
{
  "citations": [
    {
      "id": "citation-1",
      "text": "Author, A. (2023). Title. Journal, 1(1), 1-10.",
      "authors": "Author, A.",
      "year": "2023",
      "title": "Title",
      "confidence": 0.9
    }
  ],
  "relatedPapers": [
    {
      "id": "arxiv-1",
      "title": "Related Paper Title",
      "authors": ["Author A", "Author B"],
      "year": "2023",
      "abstract": "Paper abstract...",
      "url": "https://arxiv.org/abs/...",
      "similarity": 0.85
    }
  ],
  "textLength": 15000,
  "pages": 15
}
```

## 📁 Project Structure

```
citefinder/
├── app/
│   ├── api/
│   │   └── process-pdf/
│   │       └── route.ts          # PDF processing API
│   ├── contact/
│   │   └── page.tsx              # Contact page with form
│   ├── faq/
│   │   └── page.tsx              # FAQ page with expandable sections
│   ├── pricing/
│   │   └── page.tsx              # Pricing page with plans
│   ├── globals.css               # Global styles & animations
│   ├── layout.tsx                # Root layout with SEO
│   ├── page.tsx                  # Main application page
│   ├── sitemap.ts                # XML sitemap generation
│   └── robots.ts                 # Robots.txt generation
├── components/
│   ├── PDFUploader.tsx           # Drag & drop file upload
│   ├── CitationList.tsx          # Citation display with confidence
│   └── RelatedPapers.tsx         # Related papers with metadata
├── types/
│   └── pdf-parse.d.ts            # Type declarations
├── public/
│   └── site.webmanifest          # PWA manifest
├── package.json
├── next.config.js
├── tailwind.config.js
├── README.md
└── SEO.md                        # SEO optimization guide
```

## 🎨 Design Features

### **Visual Design**
- **Glass Morphism**: Modern transparency effects
- **Gradient Backgrounds**: Beautiful color transitions
- **Smooth Animations**: Fade-in, slide, and hover effects
- **Professional Typography**: Clean, readable fonts

### **User Interface**
- **Intuitive Upload**: Clear drag & drop instructions
- **Progress Indicators**: Real-time processing feedback
- **Confidence Bars**: Visual confidence scoring
- **Responsive Cards**: Adaptive layout for all screen sizes

## 🔍 SEO Optimization

### **Technical SEO**
- ✅ **Meta Tags**: Optimized titles, descriptions, and keywords
- ✅ **Structured Data**: JSON-LD schema markup
- ✅ **Sitemap**: Automatic XML sitemap generation
- ✅ **Robots.txt**: Search engine crawling directives
- ✅ **Semantic HTML**: Proper heading hierarchy and ARIA labels

### **Performance SEO**
- ✅ **Core Web Vitals**: Optimized for Google's metrics
- ✅ **Mobile-First**: Responsive design for all devices
- ✅ **Fast Loading**: Optimized images and code splitting
- ✅ **PWA Ready**: Progressive web app capabilities

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

### **Netlify**
```bash
npm run build
# Deploy the .next folder
```

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔮 Future Enhancements

### **Planned Features**
- **OCR Support**: Better text extraction from scanned PDFs
- **Citation Networks**: Visualize citation relationships
- **Export Options**: BibTeX, EndNote, Mendeley formats
- **User Accounts**: Save and manage citation collections
- **Advanced Search**: Filter by date, journal, author, etc.

### **API Enhancements**
- **More Databases**: Integration with additional academic sources
- **Citation Validation**: Verify citations against databases
- **Batch Processing**: Handle multiple PDFs simultaneously
- **API Rate Limits**: Intelligent request management

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Setup**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📄 License

This project is proprietary software owned by CiteFinder. All rights reserved. See the [LICENSE](LICENSE) file for details.

For licensing inquiries, contact: support@citefinder.app

## 🙏 Acknowledgments

- **arXiv** for providing free access to academic papers
- **OpenAlex** for comprehensive academic database
- **CrossRef** for DOI registration and metadata
- **PubMed** for biomedical research papers
- **Next.js** and **React** communities for excellent tooling
- **Tailwind CSS** for the beautiful design system

## 📞 Support

- **Documentation**: [Read the docs](https://citefinder.app/docs)
- **Email**: support@citefinder.app

 