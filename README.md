# SM Admin WA Dashboard

A comprehensive Next.js-based admin dashboard for WhatsApp workflow management and data processing pipelines.

## 🚀 Features

### Core Functionality
- **Authentication System** - Secure login/logout with token-based authentication
- **Real-time Data Management** - Google Sheets integration with auto-refresh capabilities
- **Responsive Design** - Modern UI with dark/light mode support
- **Pipeline Management** - PDF to Markdown and Markdown to Vector conversion pipelines

### Admin Modules
- **Dashboard** - WhatsApp Admin workflow monitoring
- **Mapping CC Benefit** - Company Code benefit mapping with N8N workflow integration
- **Mapping CC PP** - Company Code payment plan mapping
- **Menu Master** - System menu configuration and management

### Pipeline Operations
- **PDF to Markdown Pipeline** - Convert PDF documents to Markdown format
- **Markdown to Vector Pipeline** - Convert Markdown files to vector embeddings for AI processing

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Local Storage-based token system
- **Data Source**: Google Sheets API
- **Workflow Integration**: N8N webhooks
- **UI Components**: Custom React components with SVG icons

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── mapping-cc-benefit/     # CC Benefit mapping page
│   │   ├── mapping-cc-pp/          # CC PP mapping page
│   │   ├── menu-master/            # Menu master management
│   │   └── page.tsx                # Main admin dashboard
│   ├── api/
│   │   ├── md-to-vector-pipeline/  # MD to Vector API
│   │   ├── n8n-webhook/            # N8N workflow integration
│   │   ├── pdf-to-md-pipeline/     # PDF to MD API
│   │   └── sheets/                 # Google Sheets API
│   ├── dashboard/                  # WhatsApp dashboard
│   ├── login/                      # Authentication page
│   └── page.tsx                    # Landing page
├── components/
│   ├── ChatDetailPanel.tsx         # Chat interface component
│   └── SidebarChatList.tsx         # Chat list sidebar
├── contexts/
│   └── AuthContext.tsx             # Authentication context
└── utils/
    ├── api.ts                      # API utilities
    └── sheets.ts                   # Google Sheets utilities
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sm-admin-wa-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Google Sheets API (if needed)
   GOOGLE_SHEETS_API_KEY=your_api_key_here
   
   # N8N Webhook URLs (if needed)
   N8N_WEBHOOK_URL=your_n8n_webhook_url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Google Sheets Integration
The application integrates with Google Sheets for data management:
- **CC Benefit Data**: Real-time mapping data from Google Sheets
- **Menu Master Data**: System menu configuration
- **Auto-refresh**: Data updates every 30 seconds

### N8N Workflow Integration
- **Webhook Support**: Direct integration with N8N workflows
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **Custom URLs**: Support for custom webhook URLs

## 📊 Features Overview

### Authentication
- Token-based authentication system
- Automatic redirect to login for unauthenticated users
- Secure logout functionality

### Data Management
- Real-time Google Sheets data fetching
- Fallback data support when sheets are unavailable
- Search and filter capabilities across all data columns
- Responsive data tables with horizontal/vertical scrolling

### Pipeline Operations
- **PDF to Markdown**: Process PDF documents and convert to Markdown
- **Markdown to Vector**: Convert Markdown files to vector embeddings
- Loading states and progress indicators
- Error handling and user feedback

### Admin Dashboard
- **System Statistics**: Real-time system metrics
- **Menu Navigation**: Intuitive navigation between admin modules
- **Pipeline Controls**: Centralized pipeline management
- **Responsive Design**: Works on desktop and mobile devices

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Dark/Light Mode**: Automatic theme detection
- **Responsive Layout**: Mobile-first design approach
- **Loading States**: Smooth loading animations
- **Error Handling**: User-friendly error messages
- **Interactive Elements**: Hover effects and transitions

## 🔒 Security

- **Token-based Authentication**: Secure user sessions
- **API Route Protection**: Server-side authentication checks
- **Input Validation**: Client and server-side validation
- **Error Sanitization**: Safe error message handling

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

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
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔄 Version History

- **v1.0.0** - Initial release with basic admin functionality
- **v1.1.0** - Added pipeline operations and N8N integration
- **v1.2.0** - Enhanced UI/UX and Google Sheets integration
- **v1.3.0** - Added real-time data refresh and error handling

---

Built with ❤️ using Next.js and TypeScript
