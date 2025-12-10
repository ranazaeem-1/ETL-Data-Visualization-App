<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<h1 align="center">
  <br>
  🌀 DataWeave
  <br>
</h1>

<h4 align="center">A no-code ETL & data visualization platform that transforms your CSV data into stunning visual insights.</h4>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## ✨ Features

### 🎯 Core Capabilities

| Feature | Description |
|---------|-------------|
| **📂 Drag & Drop Upload** | Simply drag your CSV file onto the upload zone |
| **🔍 Smart Type Detection** | Automatically identifies numeric, date, categorical, and text columns |
| **⚡ Auto Transformations** | Extracts year/month/day from dates, creates bins from numbers |
| **📊 Instant Visualizations** | Generates charts automatically based on your data types |
| **🎨 Beautiful Dark Theme** | Premium glassmorphism UI with animated gradients |
| **📥 Export Options** | Download transformed CSV or screenshot your dashboard |

### 🧠 Intelligent Data Processing

- **Type Inference**: Automatically detects column data types
- **Missing Value Detection**: Identifies and reports gaps in your data  
- **Statistical Analysis**: Calculates min, max, mean, median, and standard deviation
- **Feature Engineering**:
  - Date columns → Extracts Year, Month, DayOfWeek
  - Numeric columns → Creates categorical bins (Low/Medium/High)

### 📈 Auto-Visualization Engine

DataWeave analyzes your data structure and suggests the optimal chart type:

| Data Pattern | Suggested Chart |
|--------------|-----------------|
| Date + Numeric | Line Chart / Area Chart |
| Category + Numeric | Bar Chart |
| Single Category | Pie Chart / Donut Chart |
| Two Numeric Columns | Scatter Plot |
| Numeric Distribution | Histogram |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.18 or later
- **npm** 9.0 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ETL-Data-Visualization-App.git

# Navigate to project directory
cd ETL-Data-Visualization-App/dataweave

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 Tech Stack

<table>
<tr>
<td align="center" width="120">
<img src="https://cdn.simpleicons.org/nextdotjs/white" width="48" height="48" alt="Next.js" />
<br>Next.js 16
</td>
<td align="center" width="120">
<img src="https://cdn.simpleicons.org/typescript" width="48" height="48" alt="TypeScript" />
<br>TypeScript
</td>
<td align="center" width="120">
<img src="https://cdn.simpleicons.org/tailwindcss" width="48" height="48" alt="Tailwind" />
<br>Tailwind CSS
</td>
<td align="center" width="120">
<img src="https://cdn.simpleicons.org/react" width="48" height="48" alt="React" />
<br>React 19
</td>
</tr>
</table>

### Key Libraries

| Library | Purpose |
|---------|---------|
| **Zustand** | Lightweight state management |
| **Recharts** | Declarative charting library |
| **PapaParse** | High-performance CSV parsing |
| **Lucide React** | Beautiful icon library |
| **html2canvas** | Dashboard screenshot export |

---

## 📁 Project Structure

```
dataweave/
├── 📂 src/
│   ├── 📂 app/                      # Next.js App Router
│   │   ├── 📄 layout.tsx            # Root layout with fonts & SEO
│   │   ├── 📄 page.tsx              # Main application page
│   │   └── 📄 globals.css           # Global styles & animations
│   │
│   ├── 📂 components/               # React components
│   │   ├── 📄 FileUploader.tsx      # Drag & drop file upload
│   │   ├── 📄 DataTable.tsx         # Interactive data table
│   │   ├── 📄 ChartCard.tsx         # Chart visualization cards
│   │   ├── 📄 ColumnAnalysisPanel.tsx # Column statistics display
│   │   └── 📄 AddChartPanel.tsx     # Custom chart builder
│   │
│   └── 📂 lib/                      # Core logic
│       ├── 📄 store.ts              # Zustand state management
│       ├── 📄 data-engine.ts        # CSV parsing & transformations
│       └── 📄 vis-engine.ts         # Chart recommendation engine
│
├── 📄 package.json
├── 📄 tailwind.config.ts
└── 📄 tsconfig.json
```

---

## 📖 Usage

### 1️⃣ Upload Your Data

Drag and drop any CSV file onto the upload zone, or click to browse. DataWeave supports files up to 100MB.

### 2️⃣ Explore Your Data

Switch to the **Data** tab to:
- View your data in an interactive, paginated table
- Search across all columns
- Sort by clicking column headers
- See newly generated columns highlighted in green
- View column statistics in the side panel

### 3️⃣ Visualize with Dashboard

Switch to the **Dashboard** tab to:
- See auto-generated charts based on your data
- Add custom charts using the "Add Chart" button
- Remove charts by hovering and clicking the X
- Choose from Bar, Line, Area, Pie, Scatter, and Histogram types

### 4️⃣ Export Your Work

- **CSV Export**: Download your transformed data with new columns
- **Screenshot**: Capture your dashboard (or use browser screenshot tools)

---

## 🎨 UI Features

- 🌌 **Animated Mesh Gradient** background
- 💎 **Glassmorphism** cards and panels
- ✨ **Glow Effects** on interactive elements
- 🎭 **Smooth Animations** with staggered reveals
- 📊 **Gradient-filled Charts** with custom color palettes
- 🌙 **Dark Theme First** design philosophy

---

## 🔧 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Recharts](https://recharts.org/) for the amazing charting library
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide](https://lucide.dev/) for beautiful icons
- [PapaParse](https://www.papaparse.com/) for robust CSV parsing

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ranazaeem-1">Your Name</a>
</p>