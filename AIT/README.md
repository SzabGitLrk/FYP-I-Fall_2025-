# 🎓 AI Timetable Generator (AITG)

An intelligent, comprehensive academic scheduling system built with Next.js 15, Prisma, and modern web technologies. This system creates conflict-free academic schedules with student-aware capacity management, faculty preferences, and advanced analytics.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-green)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)](https://tailwindcss.com/)

> **A complete academic management solution for educational institutions worldwide**

## ✨ Features

### 🎯 **Intelligent Timetable Generation**
- **Student-Aware Scheduling**: Considers actual student enrollments for optimal room assignment
- **7-Day Week Support**: Full Monday-Sunday scheduling capability
- **Conflict-Free Generation**: Advanced algorithms prevent room, faculty, and time conflicts
- **Capacity Optimization**: Matches room capacity with course enrollment for efficiency
- **Priority-Based Assignment**: Labs scheduled first, theory courses optimized for balance

### 👥 **Comprehensive Student Management**
- **Student Registration**: Complete student lifecycle management with unique registration IDs
- **Course Enrollment**: Individual and bulk enrollment capabilities
- **Academic Records**: Grade and attendance tracking with performance analytics
- **Program Integration**: Seamless integration with academic programs and semesters
- **Real-time Analytics**: Live enrollment statistics and student distribution analysis

### 🏢 **Department Organization**
- **Hierarchical Structure**: Departments → Programs → Semesters → Courses
- **Faculty Management**: Department-based faculty organization and assignment
- **Resource Allocation**: Department-wise resource management and analytics
- **Contact Management**: Complete department contact information and leadership

### 🎓 **Faculty Preferences System**
- **Time Preferences**: Preferred and unavailable time slots with flexibility levels
- **Workload Management**: Maximum daily and consecutive hour constraints
- **Room Preferences**: Preferred room types, buildings, and course preferences
- **Constraint Integration**: Seamless integration with timetable generation algorithm

### 📊 **Enhanced Timetable Display**
- **Interactive Grid**: Click-to-select with detailed course information
- **Capacity Visualization**: Real-time capacity utilization with color-coded status
- **Conflict Detection**: Visual indicators for scheduling conflicts and issues
- **Multiple Views**: Compact/expanded views with weekend toggle options
- **Rich Tooltips**: Comprehensive hover information for all timetable entries

### 📈 **Advanced Analytics & Reporting**
- **Real-time Statistics**: Live dashboard with key performance indicators
- **Utilization Analysis**: Room, faculty, and time slot utilization metrics
- **Capacity Management**: Enrollment vs. capacity analysis with optimization suggestions
- **Conflict Reporting**: Detailed conflict analysis and resolution tracking
- **Export Capabilities**: PDF and Excel export for schedules and reports

### 🎨 **Modern UI/UX**
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Interactive Components**: Rich user interactions with smooth animations
- **Professional Design**: Modern, clean interface with consistent design system
- **Accessibility**: Built-in accessibility features and keyboard navigation

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm/yarn**: Package manager
- **Git**: Version control system

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-timetable-generator.git
   cd ai-timetable-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize the database**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - **Main App**: [http://localhost:3000](http://localhost:3000)
   - **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Database Studio**: `npx prisma studio` (optional)

### Sample Data
The system comes pre-loaded with:
- **3 Departments**: Computer Science, Software Engineering, Business Administration
- **3 Programs**: BSCS, BSSE, BBA with 8 semesters each
- **712 Students**: Distributed across all programs and semesters
- **162 Courses**: Theory and Lab courses with faculty assignments
- **3,772 Enrollments**: Realistic student-course enrollments
- **18 Rooms**: Classrooms and labs with capacity information

## 📱 Usage

### Admin Dashboard
Access the comprehensive admin panel at `/admin`:

#### **Student Management**
- **Register Students**: Add students with unique registration IDs
- **Manage Enrollments**: Individual and bulk course enrollment
- **Track Performance**: Monitor grades and attendance
- **Analytics**: Real-time enrollment and performance statistics

#### **Academic Structure**
- **Departments**: Organize academic departments with faculty and programs
- **Programs**: Manage degree programs (BSCS, BSSE, BBA, etc.)
- **Courses**: Create theory and lab courses with faculty assignments
- **Faculty**: Manage faculty with department assignments and preferences

#### **Resource Management**
- **Rooms**: Configure classrooms and labs with capacity information
- **Time Slots**: Set up flexible daily time periods
- **Equipment**: Track room equipment and features (enhanced model)

#### **Timetable Operations**
- **Generate Schedules**: Create conflict-free timetables with student-aware capacity management
- **View & Analyze**: Interactive timetable grid with capacity utilization
- **Resolve Conflicts**: Visual conflict detection and resolution tools
- **Export**: PDF and Excel export capabilities

### Key Workflows

#### **Student Enrollment Process**
1. **Register Students** → Students Management
2. **Assign to Programs** → Select program and semester
3. **Enroll in Courses** → Individual or bulk enrollment
4. **Generate Timetable** → Create schedule considering enrollments

#### **Timetable Generation**
1. **Verify Data** → Ensure students, courses, and rooms are configured
2. **Set Preferences** → Configure faculty preferences and constraints
3. **Generate** → Click "Generate Timetable" with desired options
4. **Review & Optimize** → Analyze capacity utilization and resolve conflicts

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **UI Framework**: Tailwind CSS 4, shadcn/ui, Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics
- **Animations**: Framer Motion

### Enhanced Database Schema
```
Departments (1:N) → Programs (1:N) → Semesters (1:N) → Courses
                         ↓                                ↓
                    Students (N:M) ←→ Enrollments ←→ Courses
                                                        ↓
Faculty (N:1) ← Courses → Timetable ← Rooms ← RoomEnhancement
     ↓                        ↓
FacultyPreferences      TimeSlots
```

### Advanced Features
- **Student-Aware Algorithm**: Considers actual enrollments for room assignment
- **Faculty Preferences**: Time, day, and workload preference integration
- **Capacity Management**: Room capacity vs. enrollment optimization
- **Conflict Resolution**: Multi-level conflict detection and resolution
- **Analytics Engine**: Real-time statistics and utilization analysis

## 📊 Statistics & Analytics

### Real-time Dashboard Metrics
- **Student Analytics**: 712 total students across 3 programs with 3,772 active enrollments
- **Academic Metrics**: 162 courses, 18 rooms, comprehensive faculty assignments
- **Utilization Analysis**: Room capacity vs. enrollment with efficiency scoring
- **Conflict Tracking**: Real-time conflict detection and resolution metrics

### Advanced Analytics Features
- **Capacity Utilization**: Color-coded status (Perfect 80-100%, Good 60-80%, etc.)
- **Enrollment Trends**: Historical and predictive enrollment analysis
- **Faculty Workload**: Balanced teaching load distribution analysis
- **Resource Optimization**: Room and time slot utilization efficiency
- **Performance Metrics**: System performance and generation success rates

### Visual Analytics
- **Interactive Charts**: Real-time data visualization with Recharts
- **Utilization Bars**: Visual capacity utilization in timetable grid
- **Status Indicators**: Color-coded system status throughout the interface
- **Trend Analysis**: Historical data trends and pattern recognition

## 🔧 Configuration

### Environment Variables
```env
# Database Configuration
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://user:password@localhost:5432/timetable_db"  # PostgreSQL for production

# Next.js Configuration
NEXTAUTH_SECRET="your-super-secret-key-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Production Settings
NODE_ENV="production"
PORT=3000
```

### Database Options
- **Development**: SQLite (default, zero-config)
- **Production**: PostgreSQL (recommended)
- **Alternative**: MySQL, SQL Server (Prisma supported)

### Available Scripts
```bash
npm run dev          # Development server with Turbopack
npm run build        # Production build
npm start           # Start production server
npm run lint        # Code linting
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema changes
npm run db:migrate  # Run migrations
npm run db:studio   # Open Prisma Studio
npm run db:seed     # Seed database with sample data
```

## 📚 Documentation

### Comprehensive Guides
- **[Complete Documentation](DOCUMENTATION.md)**: Comprehensive system documentation
- **[API Reference](docs/api-reference.md)**: Detailed API endpoint documentation
- **[User Guide](docs/user-guide.md)**: Step-by-step user instructions
- **[Deployment Guide](docs/deployment-guide.md)**: Production deployment instructions

### Feature Documentation
- **[Student Management System](docs/student-management-system.md)**: Complete student lifecycle management
- **[Enhanced Timetable Grid](docs/enhanced-timetable-grid.md)**: Interactive timetable features
- **[Departments Management](docs/departments-management.md)**: Organizational structure management
- **[Timetable Algorithm](TIMETABLE_ALGORITHM.md)**: Algorithm implementation details

## 🚀 Deployment

### Deploy to Vercel (Recommended)

#### Step 1: Create a Free PostgreSQL Database

1. Go to [Neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)

#### Step 2: Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add environment variables:
   - `DATABASE_URL` = your Neon connection string
   - `DIRECT_URL` = same as DATABASE_URL
4. Click Deploy

#### Step 3: Initialize Database

After deployment, run the database setup:
```bash
# Option 1: Using Vercel CLI
vercel env pull .env.local
npx prisma db push
npm run db:seed

# Option 2: Using Neon Console
# Run the SQL from prisma/migrations in Neon's SQL editor
```

### Alternative: Local Development with PostgreSQL

```bash
# 1. Install dependencies
npm install

# 2. Set up .env with your PostgreSQL URL
cp .env.example .env
# Edit .env with your database URL

# 3. Push schema and seed
npx prisma db push
npm run db:seed

# 4. Run
npm run dev
```

See the [Deployment Guide](docs/deployment-guide.md) for detailed instructions.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup
```bash
git clone https://github.com/your-username/ai-timetable-generator.git
cd ai-timetable-generator
npm install
npm run dev
```

## 🎯 Key Achievements

### System Capabilities
- **✅ 712 Students** managed across 3 academic programs
- **✅ 3,772 Enrollments** with real-time capacity analysis
- **✅ 162 Courses** with faculty assignments and scheduling
- **✅ 18 Rooms** with capacity optimization and utilization tracking
- **✅ Zero-Conflict** timetable generation with student-aware algorithms

### Advanced Features Implemented
- **✅ Student-Aware Scheduling**: Room assignment based on actual enrollments
- **✅ Faculty Preferences**: Comprehensive preference and constraint system
- **✅ Department Organization**: Hierarchical academic structure management
- **✅ Interactive Timetable**: Enhanced grid with capacity visualization
- **✅ Real-time Analytics**: Live statistics and utilization metrics

## 🔮 Future Enhancements

### Planned Features
- **Student Portal**: Self-service portal for students
- **Mobile Application**: Native mobile apps for all user types
- **Advanced Analytics**: Predictive analytics and AI insights
- **Integration APIs**: LMS and external system integrations
- **Multi-language Support**: Internationalization capabilities

### Roadmap
- **Q1 2025**: Student portal and authentication system
- **Q2 2025**: Mobile applications and offline support
- **Q3 2025**: Advanced analytics and reporting
- **Q4 2025**: Enterprise integrations and scalability improvements

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Technology Partners
- **[Next.js](https://nextjs.org/)**: React framework for production
- **[Prisma](https://prisma.io/)**: Next-generation ORM for Node.js and TypeScript
- **[shadcn/ui](https://ui.shadcn.com/)**: Beautifully designed components
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)**: Low-level UI primitives
- **[Lucide](https://lucide.dev/)**: Beautiful & consistent icon toolkit

### Community
- **Open Source Community**: For inspiration and contributions
- **Educational Institutions**: For feedback and real-world testing
- **Developers**: For code reviews and feature suggestions

## 📞 Support & Community

### Getting Help
- **📖 Documentation**: Comprehensive guides and API reference
- **🐛 Issues**: GitHub Issues for bug reports and feature requests
- **💬 Discussions**: GitHub Discussions for community support
- **📧 Email**: Direct support for enterprise users

### Community Links
- **GitHub**: [Repository](https://github.com/your-username/ai-timetable-generator)
- **Documentation**: [Complete Docs](DOCUMENTATION.md)
- **Live Demo**: [Demo Instance](https://your-demo-url.com) (if available)

---

<div align="center">

**🎓 Made with ❤️ for educational institutions worldwide**

*Empowering academic excellence through intelligent scheduling*

[![GitHub stars](https://img.shields.io/github/stars/your-username/ai-timetable-generator?style=social)](https://github.com/your-username/ai-timetable-generator)
[![GitHub forks](https://img.shields.io/github/forks/your-username/ai-timetable-generator?style=social)](https://github.com/your-username/ai-timetable-generator)

</div>