# SCM Pro - Supply Chain Management System

A professional supply chain management system for creating and managing documentation including purchase orders, invoices, and shipping documents.

## Features

- Document management for supply chain operations
- Purchase order creation and tracking
- Invoice generation and management
- Shipping document handling
- Real-time tracking and monitoring
- User authentication and role-based access
- Responsive design for desktop and mobile

## Technologies Used

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **QR Code**: qrcode.react and html5-qrcode
- **Maps**: Mapbox GL

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd scms-lean-dart
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts
├── data/              # Static data and configurations
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── pages/             # Page components
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Key Features

### Authentication
- Secure login system
- Role-based access control
- Protected routes

### Document Management
- Create and manage various document types
- PDF generation and printing
- QR code integration for tracking

### Supply Chain Operations
- Customer and supplier management
- Inventory tracking
- Order management (purchase and sales)
- Shipping and delivery tracking

### Reporting
- Comprehensive reporting system
- Data visualization with charts
- Export capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.# scms-frontend
# scms-frontend
