# TimeCard Management System

A comprehensive time card management system built with the MERN stack (MongoDB, Express, React, Node.js) using TypeScript and Vite.

## Features

- **Time Tracking**: Clock in/out functionality with automatic calculation
- **Salary Calculation**: 
  - Regular hours: ¥1000/hour
  - Night shift (after 10 PM): ¥1250/hour
  - Automatic computation based on work hours
- **Schedule Management**: Create, view, edit, and delete schedules with calendar view
- **Reports**: Comprehensive reports with charts and export functionality
- **Modern UI**: Beautiful design using Material-UI and Framer Motion
- **Full CRUD Operations**: Complete Create, Read, Update, Delete functionality

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- Date-fns for date handling

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Material-UI for components
- FullCalendar for schedule view
- Recharts for data visualization
- Framer Motion for animations
- Zustand for state management
- Axios for API calls

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file and update the MongoDB connection string:
```env
MONGODB_URI=mongodb://localhost:27017/timecard_management
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

4. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. **Register/Login**: Create a new account or login with existing credentials
2. **Clock In/Out**: Use the TimeCard page to clock in and out
3. **View Dashboard**: See your work summary, earnings, and charts
4. **Manage Schedule**: Add events to your calendar
5. **Generate Reports**: View detailed reports and export data

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### TimeCards
- GET `/api/timecards` - Get all time cards
- POST `/api/timecards/clockin` - Clock in
- POST `/api/timecards/clockout` - Clock out
- PUT `/api/timecards/:id` - Update time card
- DELETE `/api/timecards/:id` - Delete time card

### Schedules
- GET `/api/schedules` - Get all schedules
- POST `/api/schedules` - Create schedule
- PUT `/api/schedules/:id` - Update schedule
- DELETE `/api/schedules/:id` - Delete schedule

## Project Structure

```
timecard-management-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand store
│   │   └── theme.ts      # MUI theme configuration
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   └── index.ts      # Server entry point
│   └── package.json
└── README.md
```

## Features in Detail

### Time Tracking
- Real-time clock in/out
- Automatic break calculation
- Status indicator (clocked in/out)

### Salary Calculation
- Regular hours: ¥1000/hour (6 AM - 10 PM)
- Night shift: ¥1250/hour (10 PM - 6 AM)
- Automatic calculation on clock out
- Monthly and weekly summaries

### Schedule Management
- Full calendar view
- Different event types (work, meeting, break, holiday)
- Color-coded events
- Drag and drop support

### Reports
- Daily, weekly, monthly, and yearly reports
- Visual charts for better insights
- Export to CSV
- Print functionality

## License

MIT License