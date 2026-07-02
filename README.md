# Test Management Dashboard

A comprehensive test management system built with React, TypeScript, and modern web technologies. This application provides a complete solution for managing test cases, test suites, bug reports, and quality assurance workflows.

## 🚀 Features

### Core Functionality
- **Test Case Management** - Create, edit, and organize test cases with detailed steps and expected results
- **Test Suite Management** - Group test cases into logical test suites for better organization
- **Bug Report Tracking** - Comprehensive bug reporting with severity levels, status tracking, and resolution management
- **Bug Bash Events** - Organize and manage collaborative testing sessions
- **Requirements Traceability Matrix (RTM)** - Link requirements to test cases for complete coverage tracking
- **QA Reports** - Generate detailed quality assurance reports and metrics
- **User Management** - Role-based access control with different permission levels

### Dashboard & Analytics
- **Interactive Dashboard** - Real-time metrics and visualizations
- **Test Execution Trends** - Track testing progress over time
- **Bug Severity Analysis** - Visual breakdown of bug priorities and types
- **Project-based Filtering** - Multi-project support with filtering capabilities

### User Experience
- **Modern UI** - Built with shadcn/ui components and Tailwind CSS
- **Dark/Light Theme** - Automatic theme switching with system preference detection
- **Responsive Design** - Works seamlessly across desktop and mobile devices
- **Real-time Updates** - Live data synchronization using React Query
- **Idle Session Management** - Automatic session timeout with warnings

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Radix UI** - Accessible component primitives

### State Management & Data
- **Zustand** - Lightweight state management
- **React Query** - Server state management and caching
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

### Routing & Navigation
- **React Router DOM** - Client-side routing
- **Protected Routes** - Role-based route protection
- **Lazy Loading** - Code splitting for better performance

### Additional Libraries
- **Axios** - HTTP client for API communication
- **Recharts** - Data visualization and charts
- **Framer Motion** - Smooth animations
- **date-fns** - Date manipulation utilities
- **jsPDF** - PDF generation for reports
- **XLSX** - Excel file handling

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Modern web browser

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd test-management-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=your-api-base-url
   DATABASE_URL=your-database-connection-string
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── dashboard/      # Dashboard-specific components
│   ├── bug-bash/       # Bug bash event components
│   ├── bug-report/     # Bug reporting components
│   ├── test-case/      # Test case management components
│   ├── test-suite/     # Test suite management components
│   └── layout/         # Layout components
├── pages/              # Page components
├── services/           # API service functions
├── store/              # Zustand state stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── hooks/              # Custom React hooks
└── lib/                # Library configurations
```

## 🔐 Authentication & Authorization

The application implements a comprehensive authentication system:

- **JWT-based Authentication** - Secure token-based auth
- **Role-based Access Control** - Different permission levels (Admin, QA, Developer)
- **Protected Routes** - Route-level access control
- **Session Management** - Automatic session timeout and renewal
- **Demo User Support** - Restricted demo accounts for testing

### User Roles

- **Superadmin** - Full system access, user management
- **Admin** - Project management, advanced features
- **QA** - Test case and bug report management
- **Developer** - Limited access to relevant features

## 📊 Database Schema

The application uses Prisma ORM with PostgreSQL:

### Key Models
- **BugReport** - Bug tracking with severity, priority, and status
- **RTMEntry** - Requirements traceability matrix entries
- **TestSuite** - Test suite organization
- **TestCase** - Individual test case details

## 🔧 Configuration

### Vite Configuration
- **Development Server** - Runs on port 8080
- **API Proxy** - Proxies `/api` requests to backend
- **Path Aliases** - `@/` maps to `src/`
- **Build Optimization** - Code splitting and minification

### Tailwind Configuration
- **Custom Theme** - Extended color palette and design tokens
- **Dark Mode** - Class-based dark mode support
- **Custom Animations** - Smooth transitions and effects

## 🧪 Testing

The application includes comprehensive testing utilities:

- **Test Case Execution** - Track test results and status
- **Bug Report Generation** - Detailed bug documentation
- **RTM Coverage** - Requirements coverage analysis
- **Export Capabilities** - PDF and Excel report generation

## 📱 Features in Detail

### Test Management
- Create and organize test cases with detailed steps
- Group test cases into test suites
- Track execution status and results
- Link test cases to requirements

### Bug Tracking
- Comprehensive bug reporting with attachments
- Severity and priority classification
- Status tracking through resolution
- Assignment and collaboration features

### Reporting & Analytics
- Real-time dashboard with key metrics
- Test execution trend analysis
- Bug severity distribution charts
- Exportable reports in multiple formats

### Collaboration
- Bug bash event management
- Team collaboration features
- Comment and discussion threads
- File attachment support

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Ensure all required environment variables are set:
- `VITE_API_BASE_URL` - Backend API URL
- `DATABASE_URL` - Database connection string

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the component examples in the codebase

## 🔄 Version History

- **v1.0.0** - Initial release with core test management features
- **v1.1.0** - Added bug bash functionality and enhanced reporting
- **v1.2.0** - Improved UI/UX with dark mode and responsive design



Built with ❤️ using React, TypeScript, and modern web technologies.
