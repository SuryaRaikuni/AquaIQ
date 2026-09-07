# AquaIQ 🌊

**Integrated Water Resource Intelligence Platform with IoT Hardware Integration**

AquaIQ is an end-to-end intelligent water resource monitoring and decision-support system. It combines real-time IoT sensor telemetry (soil moisture, tank water levels, flow rate) with national and regional open datasets (CGWB, IMD, FAO AQUASTAT, WRI Aqueduct) to provide actionable insights for individuals, farmers, industry, and policymakers.

---

## 🌟 Core Modules

1. **Water Stress Dashboard**
   - Interactive district-level India map color-coded by Groundwater Stress Index.
   - Filter by state and agricultural season (Kharif, Rabi, Summer).
   - District tooltip and data quality indicators (`real`, `interpolated`, `mock`).
   - Floating **Live Local Water Status** widget streaming real-time sensor metrics via Server-Sent Events (SSE) or client-side simulation.

2. **Water Footprint Calculator**
   - Virtual Water Content (VWC) calculation engine powered by Hoekstra / IWMI benchmarks.
   - Evaluates diet type, domestic consumption (showers, laundry, baths, flushes), vehicle footprint, and agricultural activities.
   - Interactive doughnut breakdown and national average comparison charts with automated conservation tips.

3. **Irrigation Advisor**
   - Crop × Soil × Stress Index rule engine recommending optimal irrigation methods (Drip, Sprinkler, Furrow, Flood).
   - Real-time soil moisture auto-fill directly from ESP32 sensor stream.
   - 5-year water savings (KL) and financial return (₹) estimation with payback period calculation.
   - Direct links to government subsidy schemes (PMKSY, NMMI, RKVY).

4. **Legal Compliance Checker**
   - State-wise database of water extraction regulations, borewell NOC rules, and Central Ground Water Authority (CGWA) guidelines.
   - Rainwater Harvesting (RWH) mandate checker with built-in catchment capacity estimator.

5. **Policy Economics Simulator**
   - Dynamic client-side econometric simulation tool with D3.js area & line dual-axis visualization.
   - Adjust water tariff (₹/KL), agricultural subsidy (%), industrial cap (ML/day), and monsoon deviation (%) to evaluate consumer demand elasticity, utility revenue, and equity distribution.
   - Scenario manager with save/compare slots.

6. **IoT Hardware Integration & Auto-Irrigation**
   - Complete ESP32 DevKit firmware supporting:
     - Capacitive Soil Moisture Sensor (Analog ADC)
     - HC-SR04 Ultrasonic Distance Sensor (Tank level %)
     - YF-S201 Hall-Effect Flow Sensor (Pulse counter interrupt)
     - 5V Relay Module for automated pump actuation
   - Bidirectional communication: ESP32 posts telemetry every 30s and receives server-queued pump control commands and trigger thresholds.
   - **Simulated Hardware Mode** built-in for zero-hardware software demos.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Chart.js, D3.js, Leaflet.js (`react-leaflet`), Lucide Icons, Zustand
- **Backend & APIs**: Next.js Server Components & Route Handlers, Server-Sent Events (SSE), NextAuth.js
- **Database & ORM**: PostgreSQL with Prisma ORM
- **IoT Firmware**: PlatformIO / Arduino C++ for ESP32 DevKit (`ArduinoJson`, `NewPing`, `PubSubClient`)

---

## 📁 Repository Structure

```
AquaIQ/
├── app/                        # Next.js App Router pages & layouts
│   ├── api/                    # API Route Handlers
│   │   ├── auth/               # NextAuth & registration routes
│   │   ├── districts/          # District stress index GET route
│   │   ├── footprint/          # VWC calculator POST route
│   │   ├── irrigation/         # Irrigation advisor recommendation engine
│   │   ├── legal/              # State-wise water regulations route
│   │   ├── live-status/        # Server-Sent Events (SSE) telemetry stream
│   │   ├── pump-control/       # Relay control PATCH endpoint
│   │   └── sensor-data/        # ESP32 telemetry ingestion endpoint
│   ├── auth/                   # Login & Register UI
│   ├── calculator/             # Water Footprint Calculator UI
│   ├── dashboard/              # Water Stress Dashboard & Map UI
│   ├── irrigation/             # Irrigation Advisor UI
│   ├── legal/                  # Legal Compliance Checker UI
│   ├── simulator/              # Policy Economics Simulator (D3.js)
│   ├── globals.css             # Aqua brand theme & styling
│   ├── layout.tsx              # Root Layout
│   └── page.tsx                # Hero Landing Page
├── components/                 # Reusable UI components
│   ├── dashboard/              # Leaflet MapPanel & Tooltips
│   ├── layout/                 # Sticky Navigation & Headers
│   └── sensor/                 # LiveLocalWidget & SensorProvider
├── firmware/                   # ESP32 Firmware
│   ├── src/main.cpp            # C++ Arduino firmware source
│   └── platformio.ini          # PlatformIO board & library configuration
├── lib/                        # Shared utilities, Prisma client & Auth options
├── prisma/                     # Database schema & database seeding script
│   ├── schema.prisma           # Prisma Data Model
│   └── seed.ts                 # Database seed data (districts, crops, rules, VWC)
└── store/                      # Zustand state stores (live telemetry state)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20+)
- PostgreSQL database instance
- (Optional) PlatformIO / VS Code for flashing physical ESP32

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/SuryaRaikuni/AquaIQ.git
cd AquaIQ
npm install
```

### 2. Configure Environment Variables
Create `.env.local` based on `.env.example`:
```bash
cp .env.example .env.local
```
Fill in your PostgreSQL connection string and secrets:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/aquaiq?schema=public"
NEXTAUTH_SECRET="your-secure-random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"
ESP32_API_KEY="aq_dev_secret_token_001"
```

### 3. Database Migration & Seed
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 Hardware / ESP32 Setup

1. Connect sensors to ESP32:
   - **Soil Moisture**: Pin `GPIO34` (Analog ADC)
   - **YF-S201 Flow Sensor**: Pin `GPIO5` (Digital Input Pullup)
   - **HC-SR04 Trig/Echo**: Pins `GPIO18` / `GPIO19`
   - **5V Relay IN**: Pin `GPIO4` (Active Low)
2. Open `firmware/` in VS Code with PlatformIO extension.
3. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `BACKEND_URL` in `firmware/src/main.cpp`.
4. Build and upload firmware to ESP32.

---

## 📄 License
MIT License. Open for educational, agricultural, and research usage.
