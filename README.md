<div align="center">
  
  <!-- Animated Header -->
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,2,12,24&height=300&section=header&text=TimeCard%20Management%20System&fontSize=50&fontAlignY=35&desc=Workforce%20Management%20Made%20Simple&descAlignY=55&animation=fadeIn" alt="header"/>
  
  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/TypeScript-98.9%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status">
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
    <img src="https://img.shields.io/github/stars/JohnGabriel1998/TimeCardSystem?style=for-the-badge&color=yellow" alt="Stars">
  </p>

  <!-- Animated Demo GIF -->
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=22&pause=1000&color=6366F1&center=true&vCenter=true&width=600&lines=Track+Employee+Hours+⏰;Calculate+Salaries+💰;Generate+Reports+📊;Manage+Schedules+📅;Real-time+Dashboard+🎯" alt="Typing SVG">
  
</div>

<br/>

<!-- Feature Cards with Animations -->
<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="https://img.icons8.com/fluency/96/000000/clock.png" width="60" alt="Time Tracking"/>
        <br/><b>⏱️ Time Tracking</b>
      </td>
      <td align="center">
        <img src="https://img.icons8.com/fluency/96/000000/money-bag.png" width="60" alt="Salary"/>
        <br/><b>💵 Salary Management</b>
      </td>
      <td align="center">
        <img src="https://img.icons8.com/fluency/96/000000/analytics.png" width="60" alt="Analytics"/>
        <br/><b>📈 Analytics Dashboard</b>
      </td>
      <td align="center">
        <img src="https://img.icons8.com/fluency/96/000000/calendar.png" width="60" alt="Schedule"/>
        <br/><b>📅 Schedule Events</b>
      </td>
    </tr>
  </table>
</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Core Features
- 🔐 **Secure Authentication**
- ⏰ **Clock In/Out System**
- 📊 **Real-time Dashboard**
- 💰 **Salary Calculations**
- 📈 **Weekly/Monthly Reports**
- 🗓️ **Schedule Management**

</td>
<td width="50%">

### 🚀 Advanced Features
- 📱 **Responsive Design**
- 🌙 **Dark/Light Mode**
- 📧 **Email Notifications**
- 📥 **Export Reports (PDF/Excel)**
- 🔄 **Auto-sync Data**
- 👥 **Multi-user Support**

</td>
</tr>
</table>

---

## 🖼️ Dashboard Preview

<div align="center">
  <img src="https://img.shields.io/badge/Dashboard-Preview-6366F1?style=for-the-badge" alt="Dashboard"/>
</div>

<details>
<summary><b>📸 Click to see Dashboard Screenshots</b></summary>

### Main Dashboard
- **Welcome Screen** with personalized greeting
- **Clock Status** indicator (Currently Clocked In/Out)
- **Quick Stats** showing:
  - 📊 Total Hours: `9.98h`
  - 💵 Current Month Salary: `¥10,500`
  - 📈 Previous Month: `¥72,750`
  - 📅 Scheduled Events: `17`
  - 🔴 Status: `Clocked Out`

### Analytics Views
- **Weekly Hours Overview** - Bar chart visualization
- **Monthly Salary History** - Trend analysis
- **Daily Earnings Breakdown** - Regular vs Night Shift pay

</details>

---

## 🚀 Quick Start Guide

### Prerequisites

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v18.0+-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-v9.0+-CB3837?style=flat-square&logo=npm&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)

</div>

### 📦 Installation Steps

<table>
<tr>
<td>

#### Step 1️⃣: Clone Repository
```bash
git clone https://github.com/JohnGabriel1998/TimeCardSystem.git
cd TimeCardSystem
```

</td>
</tr>
<tr>
<td>

#### Step 2️⃣: Install Dependencies
```bash
npm install
# or
yarn install
```

</td>
</tr>
<tr>
<td>

#### Step 3️⃣: Environment Setup
```bash
# Create .env file
cp .env.example .env

# Edit with your configuration
nano .env
```

</td>
</tr>
<tr>
<td>

#### Step 4️⃣: Database Setup
```bash
# Run migrations
npm run migrate

# Seed sample data (optional)
npm run seed
```

</td>
</tr>
<tr>
<td>

#### Step 5️⃣: Start Development Server
```bash
npm run dev
# App runs on http://localhost:3000
```

</td>
</tr>
</table>

---

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/timecard

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# API Keys
STRIPE_KEY=sk_test_...
GOOGLE_MAPS_API=AIza...
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/logout` | User logout |
| `GET` | `/api/auth/profile` | Get user profile |

### TimeCard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/timecard/clock-in` | Clock in |
| `POST` | `/api/timecard/clock-out` | Clock out |
| `GET` | `/api/timecard/status` | Get clock status |
| `GET` | `/api/timecard/history` | Get timecard history |

### Reports Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/weekly` | Weekly report |
| `GET` | `/api/reports/monthly` | Monthly report |
| `GET` | `/api/reports/salary` | Salary calculation |
| `POST` | `/api/reports/export` | Export to PDF/Excel |

---

## 🏗️ Project Structure

```
TimeCardSystem/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── Dashboard.tsx
│   │   ├── TimeCard.tsx
│   │   ├── Reports.tsx
│   │   └── Schedule.tsx
│   ├── 📁 services/
│   │   ├── auth.service.ts
│   │   ├── timecard.service.ts
│   │   └── report.service.ts
│   ├── 📁 utils/
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── 📁 styles/
│   │   └── globals.css
│   └── 📄 App.tsx
├── 📁 public/
├── 📁 tests/
├── 📄 package.json
├── 📄 tsconfig.json
└── 📄 README.md
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- Dashboard.test.tsx

# E2E testing
npm run test:e2e
```

---

## 📱 Mobile Support

<div align="center">
  <img src="https://img.shields.io/badge/iOS-Compatible-000000?style=for-the-badge&logo=apple&logoColor=white" alt="iOS">
  <img src="https://img.shields.io/badge/Android-Compatible-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android">
  <img src="https://img.shields.io/badge/PWA-Enabled-5A29E4?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA">
</div>

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📊 Stats & Activity

<div align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=JohnGabriel1998&repo=TimeCardSystem&show_icons=true&theme=tokyonight" alt="Stats">
</div>

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">
  <img src="https://github.com/JohnGabriel1998.png" width="100" style="border-radius: 50%;" alt="Author"/>
  <h3>John Gabriel Bagacina</h3>
  <p>
    <a href="https://github.com/JohnGabriel1998">
      <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
    </a>
  </p>
</div>

---

## 🌟 Support

If you find this project helpful, please consider giving it a ⭐️!

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,2,12,24&height=100&section=footer" alt="footer"/>
</div>
