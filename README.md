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

<h4 align="center">A comprehensive no-code ETL & data visualization platform that transforms your CSV data into stunning visual insights.</h4>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## ✨ Features

### 📂 Data Import & Management

| Feature | Description |
|---------|-------------|
| **Drag & Drop Upload** | Simply drag your CSV file onto the upload zone |
| **Multi-File Support** | Upload multiple files and merge/join them together |
| **Smart Type Detection** | Automatically identifies numeric, date, categorical columns |
| **Column Reordering** | Drag & drop to reorder columns in your dataset |

### 🧹 Data Cleaning & Transformation

| Feature | Description |
|---------|-------------|
| **Missing Value Handler** | Fill with mean/median/mode/custom value or drop rows |
| **Remove Duplicates** | Identify and remove duplicate rows based on selected columns |
| **Type Conversion** | Convert columns between number, string, and date types |
| **Find & Replace** | Search and replace values across any column |
| **Outlier Removal** | Remove statistical outliers using IQR method |
| **Calculated Columns** | Create new columns using formulas and expressions |
| **Advanced Transformations** | Log, sqrt, normalize, one-hot encoding, regex operations |
| **Group By & Aggregation** | Aggregate data with sum, mean, count, min, max |

### 📊 Data Visualization

| Chart Type | Use Case |
|------------|----------|
| **Bar Chart** | Compare categories |
| **Line Chart** | Show trends over time |
| **Area Chart** | Display cumulative values |
| **Pie Chart** | Show proportions |
| **Scatter Plot** | Explore relationships between numeric columns |
| **Histogram** | Visualize distributions |
| **Treemap** | Hierarchical data visualization |
| **Dual-Axis Chart** | Compare two metrics with different scales |
| **Geographic Map** | Visualize location-based data with Leaflet |
| **Correlation Heatmap** | See relationships between numeric columns |

### 🧠 Advanced Analytics

| Feature | Description |
|---------|-------------|
| **Auto-Insights** | Automatic discovery of patterns and anomalies |
| **Anomaly Detection** | IQR-based outlier identification |
| **Trend Analysis** | Detect increasing/decreasing trends |
| **Correlation Analysis** | Pearson correlation between all numeric columns |
| **Natural Language Queries** | Query your data using plain English |
| **PDF Data Profiling Report** | Export comprehensive statistics as PDF |

### 💾 Data Management

| Feature | Description |
|---------|-------------|
| **Undo/Redo History** | Revert any transformation with full history |
| **Dashboard Save/Load** | Persist your chart configurations locally |
| **CSV Export** | Download transformed data as CSV |
| **Excel Export** | Export data to XLSX format |

### 🎨 User Interface

| Feature | Description |
|---------|-------------|
| **Clean Minimal Design** | Simple, functional interface without distractions |
| **Light/Dark Theme** | Toggle between light and dark modes |
| **Organized Sidebar** | All tools accessible from categorized sidebar |
| **Responsive Layout** | Works on desktop and tablet screens |

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
| **Leaflet / React-Leaflet** | Interactive geographic maps |
| **jsPDF / jspdf-autotable** | PDF report generation |
| **@dnd-kit** | Drag and drop functionality |
| **html2canvas** | Dashboard screenshot export |

---

## 📁 Project Structure

```
dataweave/
├── 📂 src/
│   ├── 📂 app/                      # Next.js App Router
│   │   ├── 📄 layout.tsx            # Root layout with fonts & SEO
│   │   ├── 📄 page.tsx              # Main application page
│   │   └── 📄 globals.css           # Global styles
│   │
│   ├── 📂 components/               # React components
│   │   ├── 📄 FileUploader.tsx      # Drag & drop file upload
│   │   ├── 📄 DataTable.tsx         # Interactive data table with filtering
│   │   ├── 📄 ChartCard.tsx         # Chart visualization cards
│   │   ├── 📄 AddChartPanel.tsx     # Custom chart builder
│   │   ├── 📄 ColumnEditor.tsx      # Column management
│   │   ├── 📄 MissingValuePanel.tsx # Handle missing values
│   │   ├── 📄 DataCleaningPanel.tsx # Duplicates, type conversion, etc.
│   │   ├── 📄 CalculatedColumnPanel.tsx # Formula-based columns
│   │   ├── 📄 TransformationPanel.tsx   # Math/string transformations
│   │   ├── 📄 InsightsPanel.tsx     # Auto-insights & anomaly detection
│   │   ├── 📄 CorrelationHeatmap.tsx # Correlation matrix visualization
│   │   ├── 📄 GeoMap.tsx            # Geographic map visualization
│   │   ├── 📄 PDFReportPanel.tsx    # PDF data profiling report
│   │   ├── 📄 ColumnReorderPanel.tsx # Drag-drop column reordering
│   │   ├── 📄 NLQueryPanel.tsx      # Natural language queries
│   │   ├── 📄 MultiFilePanel.tsx    # Multi-file upload & merge
│   │   ├── 📄 DashboardManager.tsx  # Save/load dashboards
│   │   └── 📄 ThemeToggle.tsx       # Light/dark theme switcher
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

Drag and drop any CSV file onto the upload zone, or click to browse.

### 2️⃣ Clean & Transform

Use the sidebar tools to:
- Handle missing values
- Remove duplicates
- Convert data types
- Create calculated columns
- Apply transformations (log, normalize, etc.)

### 3️⃣ Explore & Analyze

- View data in the interactive table with sorting and filtering
- Use **Auto Insights** to discover patterns and anomalies
- Ask questions using **Natural Language** queries
- See correlations with the **Correlation Heatmap**

### 4️⃣ Visualize

Switch to the **Dashboard** tab to:
- View auto-generated charts
- Add custom charts (Bar, Line, Pie, Scatter, Treemap, Dual-Axis)
- Create geographic maps for location data
- Save and load dashboard configurations

### 5️⃣ Export

- **CSV/Excel Export**: Download transformed data
- **PDF Report**: Generate comprehensive data profiling report
- **Save Dashboard**: Persist chart configurations for later

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

- [Recharts](https://recharts.org/) for the charting library
- [Leaflet](https://leafletjs.com/) for map functionality
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide](https://lucide.dev/) for beautiful icons
- [PapaParse](https://www.papaparse.com/) for CSV parsing
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation
- [dnd-kit](https://dndkit.com/) for drag and drop

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ranazaeem-1">Rana Zaeem</a> & <a href="https://github.com/effendii69">Azam Effendi</a>
</p>
