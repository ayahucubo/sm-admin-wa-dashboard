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

# SM Admin WA Dashboard

Admin dashboard for WhatsApp workflow management, built with Next.js and TypeScript.

## Features
- Authentication (login/logout)
- Real-time Google Sheets data
- PDF to Markdown & Markdown to Vector pipelines
- Admin modules: Dashboard, Mapping CC Benefit/PP, Menu Master
- Responsive UI with dark/light mode

## Tech Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- Google Sheets API
- N8N webhooks

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)

## Project Structure
See `src/` for app, api, components, contexts, and utils.

## License
MIT
