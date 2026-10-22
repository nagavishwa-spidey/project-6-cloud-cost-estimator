# ☁️ Cloud Computing Cost Estimator

A professional, fully client-side web application that helps students and beginners estimate monthly cloud infrastructure costs based on their usage requirements.

> **Note:** All prices shown are illustrative estimates for educational purposes — they are not official live quotations from any cloud provider.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?logo=chartdotjs&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-blue?logo=github)

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Features](#-features)
- [Cloud Computing Concepts](#-cloud-computing-concepts-demonstrated)
- [Technology Stack](#-technology-stack)
- [Architecture & Workflow](#-architecture--workflow)
- [Folder Structure](#-folder-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Local Setup](#-installation--local-setup)
- [How to Use](#-how-to-use)
- [Deployment](#-deployment)
- [Live Website URL](#-live-website-url)
- [Screenshots](#-screenshots)
- [Limitations & Future Improvements](#-limitations--future-improvements)
- [License](#-license)
- [Author](#-author)

---

## 🎯 Problem Statement

Cloud computing costs can be complex and difficult to estimate for students and beginners. With multiple resource types (compute, storage, data transfer, networking, databases) and varying pricing models across providers (AWS, Azure, GCP), understanding and predicting monthly spending is challenging.

This project provides a simplified, interactive cost estimator that breaks down cloud pricing into understandable components, helping users learn how different configurations affect their cloud bills before committing to any provider.

---

## 🏆 Objectives

- Build a fully functional, browser-based cloud cost calculator with no backend dependencies.
- Demonstrate cloud pricing concepts including compute, storage, data transfer, and additional services.
- Enable side-by-side comparison of two cloud configurations.
- Provide visual cost breakdowns using interactive charts.
- Support saving, loading, and exporting cost estimates.
- Implement dark/light theme toggle and multi-currency support (USD/INR).
- Deploy as a static site on GitHub Pages.

---

## ✨ Features

### 📊 Dashboard
- **Monthly & annual cost summary** — see your estimated spend at a glance.
- **Cost distribution chart** — doughnut chart showing the breakdown by resource type.
- **Monthly spending trend** — bar chart of projected costs over 12 months.
- **Recently saved configurations** — quick access to your previous estimates.
- **New estimate button** — jump straight into the calculator.

### 🧮 Cloud Cost Calculator
- **Compute configuration** — number of VMs, vCPUs, RAM, operating hours, hourly rate.
- **Storage configuration** — capacity in GB with type selection (Standard, Block, Archival) and per-GB pricing.
- **Data transfer** — outbound data in GB with tiered pricing.
- **Additional services** — toggle optional services like load balancers, DNS, monitoring, CDN, and managed databases.
- **Real-time calculation** — costs update instantly as inputs change.
- **Input validation** — prevents negative numbers and unreasonable values.

### 🏢 Provider Comparison
- Compare illustrative pricing across **AWS**, **Azure**, and **Google Cloud**.
- Side-by-side table of compute, storage, and data transfer rates.
- See which provider is cheapest for your workload.

### 📈 Cost Breakdown
- Detailed line-item breakdown of every cost component.
- Percentage contribution of each resource type.
- Visual bar chart of costs by category.

### ⚖️ Configuration Comparison
- Compare two saved configurations side by side.
- See differences in compute, storage, transfer, and total costs.
- Identify which configuration is more cost-effective.

### 💾 Saved Estimates
- Save unlimited configurations to LocalStorage.
- Load, delete, or export any saved estimate.
- Persistent across browser sessions.

### 📚 Learning & FinOps
- Brief explanations of cloud computing cost concepts.
- Tips on optimizing cloud spending (reserved instances, right-sizing, auto-scaling).

### 🎨 UI & Accessibility
- **Light/Dark theme** toggle with persistent preference.
- **USD/INR currency** switch with live conversion.
- Responsive sidebar navigation (collapses on mobile).
- Keyboard-accessible forms and controls.
- Toast notifications for save/export actions.

### 📤 Export Options
- **Export as CSV** — download a spreadsheet-friendly cost report.
- **Export as JSON** — download the full configuration and cost data.
- **Print report** — browser print dialog with clean formatting.

---

## ☁️ Cloud Computing Concepts Demonstrated

| Concept | How This Project Demonstrates It |
|---------|----------------------------------|
| **Cloud Pricing Models** | Illustrative per-hour compute, per-GB storage, and tiered data transfer pricing |
| **Resource Provisioning** | Users configure VMs, storage, and networking — simulating real provisioning decisions |
| **Cost Optimization** | Learning section covers reserved instances, right-sizing, and auto-scaling strategies |
| **Multi-Cloud Comparison** | Side-by-side provider pricing comparison (AWS vs Azure vs GCP) |
| **Pay-As-You-Go** | Calculator uses hourly and monthly usage-based pricing |
| **Static Site Hosting** | Deployed on GitHub Pages — a real cloud hosting service |
| **Client-Side Computing** | All calculations run in the browser — no server needed |

---

## 🛠️ Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| HTML5 | Semantic page structure | 5 |
| CSS3 | Styling, themes, responsive layout | 3 |
| JavaScript (ES6+) | Application logic, DOM manipulation | ES2015+ |
| Chart.js | Interactive charts (via CDN) | 4.x |
| LocalStorage | Persistent user preferences and saved estimates | Web API |
| GitHub Pages | Static site hosting | — |

---

## 🏗️ Architecture & Workflow

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│                                                  │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐ │
│  │ index.html│  │  style.css │  │  Chart.js CDN│ │
│  └─────┬────┘  └────────────┘  └──────────────┘ │
│        │                                         │
│  ┌─────▼─────────────────────────────────┐       │
│  │              app.js                    │       │
│  │  (UI controller, navigation, events)  │       │
│  └─────┬──────────┬──────────┬───────────┘       │
│        │          │          │                    │
│  ┌─────▼───┐ ┌───▼────┐ ┌──▼──────┐             │
│  │pricing.js│ │calc.js │ │charts.js│             │
│  │(profiles)│ │(engine)│ │(render) │             │
│  └─────────┘ └────────┘ └─────────┘             │
│        │                                         │
│  ┌─────▼─────────────────────────────────┐       │
│  │          LocalStorage                  │       │
│  │  (saved configs, theme, currency)     │       │
│  └───────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

**Workflow:**
1. User opens the site → Dashboard loads with default or saved configuration.
2. User navigates to Calculator → configures compute, storage, transfer, services.
3. Costs are calculated in real-time by `calculator.js` using rates from `pricing.js`.
4. Charts are rendered by `charts.js` using Chart.js (with HTML fallback if CDN fails).
5. User can save, compare, or export configurations via `app.js`.
6. All data persists in LocalStorage across sessions.

---

## 📁 Folder Structure

```
project-6-cloud-cost-estimator/
├── index.html          # Main HTML page with all sections
├── css/
│   └── style.css       # Complete styling (light/dark themes, responsive)
├── js/
│   ├── app.js          # UI controller, navigation, events, localStorage
│   ├── calculator.js   # Cost calculation engine, default configs
│   ├── pricing.js      # Provider pricing profiles, currency conversion
│   └── charts.js       # Chart.js visualizations with HTML fallback
├── assets/
│   └── icons/          # (Reserved for custom icons)
├── .nojekyll           # Disables Jekyll processing on GitHub Pages
├── LICENSE             # MIT License
└── README.md           # This file
```

---

## 📦 Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari).
- No Node.js, npm, Python, or build tools required.
- No backend server needed.
- Internet connection (for Chart.js CDN on first load; the app has a fallback).

---

## 🚀 Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nagavishwa-spidey/project-6-cloud-cost-estimator.git
   cd project-6-cloud-cost-estimator
   ```

2. **Open in browser:**
   - Simply double-click `index.html`, or
   - Use a local server for best results:
     ```bash
     # Python
     python -m http.server 8000

     # Node.js (if installed)
     npx serve .
     ```
   - Open `http://localhost:8000` in your browser.

3. **That's it!** No installation, no dependencies, no build step.

---

## 📖 How to Use

1. **Dashboard** — View your current cost summary and charts. Click "New Estimate" to start.
2. **Calculator** — Adjust compute (VMs, vCPUs, RAM, hours), storage (type, capacity), data transfer, and additional services. Costs update in real-time.
3. **Provider Comparison** — See how AWS, Azure, and GCP pricing compares for your workload.
4. **Cost Breakdown** — View a detailed line-item breakdown of all costs.
5. **Compare Configs** — Select two saved configurations and compare them side by side.
6. **Saved Estimates** — Save your current configuration, load previous ones, or delete old ones.
7. **Learning** — Read about cloud cost optimization strategies.
8. **Theme Toggle** — Click the moon/sun icon in the top bar to switch themes.
9. **Currency Toggle** — Switch between USD and INR using the currency button.
10. **Export** — Download your estimate as CSV, JSON, or print it.

---

## 🌐 Deployment

### GitHub Pages (Recommended)

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, select **Branch: main** and **Folder: / (root)**.
4. Click **Save**.
5. Wait 1–2 minutes for the site to build.
6. Your site will be live at: `https://<username>.github.io/project-6-cloud-cost-estimator/`

### Other Static Hosts

This project works on any static hosting platform:
- **Netlify** — drag and drop the project folder.
- **Vercel** — import the GitHub repo.
- **Surge** — `npx surge .` from the project directory.

---

## 🔗 Live Website URL

> 🔗 **Live URL:** `https://nagavishwa-spidey.github.io/project-6-cloud-cost-estimator/`
>
> *(Enable GitHub Pages in repo Settings to activate this URL)*

---

## 📸 Screenshots

To capture screenshots of the application:

1. Open the live site or `index.html` locally.
2. Navigate to each section (Dashboard, Calculator, Provider Comparison, etc.).
3. Use your browser's screenshot tool or press `Win + Shift + S` (Windows) / `Cmd + Shift + 4` (Mac).
4. Capture screenshots showing:
   - Dashboard with cost summary and charts
   - Calculator with configured resources
   - Provider comparison table
   - Cost breakdown view
   - Dark theme variant
   - Mobile responsive view

---

## ⚠️ Limitations & Future Improvements

### Current Limitations
- Prices are **illustrative estimates**, not live API data from cloud providers.
- Currency conversion uses a fixed exchange rate (1 USD = 83 INR).
- No real-time pricing API integration (would require backend/API keys).
- Limited to three cloud providers (AWS, Azure, GCP).
- No account-based persistence (uses browser LocalStorage only).

### Future Improvements
- Integrate real cloud pricing APIs (AWS Price List API, Azure Retail Prices API).
- Add more resource types (serverless functions, Kubernetes clusters, AI/ML services).
- Support more currencies with live exchange rates.
- Add cost forecasting with usage growth projections.
- Implement shareable estimate links (URL-encoded configurations).
- Add PDF export with professional formatting.
- Support Reserved Instance and Spot Instance pricing models.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Nagavishwa**

- GitHub: [@nagavishwa-spidey](https://github.com/nagavishwa-spidey)

---

> *Built as an academic Cloud Computing project to demonstrate cloud pricing concepts, static site deployment, and modern frontend development.*
