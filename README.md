# DaanGives Frontend — Digital Philanthropy & Impact Transparency Platform

The official client application for the **DaanGives Platform**, providing digital donor engagement, campaign exploration, field distribution proof tracking, multi-role dashboards, CSR marketplace interaction, and automated tax compliance retrieval.

---

## Key Features

- **Public Hub**: Campaign directory, verified NGO directory, NITI Aayog Darpan status badges, public campaign tracking, and field distribution evidence.
- **Donor Portal**: Phased monetary donation flow with Razorpay checkout, live disbursement tracking, instant 80G tax receipt PDF downloads, and ticket management.
- **NGO Suite**: Need request management, campaign creation, milestone proof uploads (photos, GPS coordinates, beneficiary breakdowns), and field distribution impact reports.
- **Admin Center**: NGO verification workflow, campaign moderation queue, distribution proof review, platform monitoring, and interactive analytics dashboards.
- **Corporate CSR Suite**: CSR marketplace, requirement discovery, support request workflow, and partnership MoUs.

---

## Technical Stack

- **Framework**: React 19 + Vite 8
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4 with custom design system tokens (Material Symbols, Outfit font)
- **Data Visualization**: Recharts
- **Testing**: Vitest + React Testing Library + Mock Service Worker (MSW)

---

## System Requirements

- **Node.js**: 20.x or 22.x LTS
- **Package Manager**: npm 10+ (or yarn / pnpm)

---

## Getting Started

### 1. Clone & Navigate to Frontend
```bash
cd daangives-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to configure the API base URL:
```bash
cp .env.example .env
```
Default configuration:
```env
# Point to your DaanGives Django backend API
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

> **Security Note**: `VITE_*` environment variables are embedded into client-side bundles at build time. Never place secrets, private keys, database passwords, or payment gateway secrets in frontend environment files.

### 4. Run Development Server
```bash
npm run dev
```
The application will start locally at `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server with Hot Module Replacement (HMR) |
| `npm run build` | Builds the production bundle into the `dist/` directory |
| `npm run preview` | Locally previews the production build output |
| `npm run test` | Runs the test suite in interactive watch mode |
| `npm run test:run` | Runs the test suite once (CI / headless execution) |
| `npm run coverage` | Runs tests and generates a test coverage report |
| `npm run lint` | Runs ESLint to check for code quality and style issues |

---

## Production Deployment

### Building for Production
```bash
npm run build
```
This produces an optimized, minified bundle in the `dist/` folder ready to be served by any static web server (Nginx, AWS S3 + CloudFront, Vercel, or Netlify).

### Nginx Configuration Example
When serving as a Single Page Application (SPA), ensure all client routes fall back to `index.html`:
```nginx
server {
    listen 80;
    server_name daangives.org;
    root /var/www/daangives-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```
