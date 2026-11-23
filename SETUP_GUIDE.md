# Mandi Gate Pass Generator - Local Deployment Guide

## Overview
This is a Progressive Web App (PWA) for generating Mandi Gate Passes with:
- **Frontend**: React + Vite (PWA ready for iPhone/Android home screen)
- **Backend**: Python FastAPI (serves API, generates PDF/DOCX, handles printing)
- **Local Printing**: Silent print directly to Windows-connected printers

---

## Prerequisites

### Windows Host Machine (Server)
- Windows 10/11
- Python 3.10+
- Physical printer connected via USB/Network
- WiFi network for phone access

### Phone (Client)
- iPhone (Safari) or Android (Chrome)
- Connected to same WiFi network

---

## Installation Steps

### 1. Clone/Download Project
```powershell
# Navigate to desired folder
cd D:\Projects
# Copy the BMR App folder here
```

### 2. Backend Setup
```powershell
cd D:\Projects\BMR App\backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install pywin32 system extensions (required for printing)
python -m pip install pywin32
# Or if above fails:
cd venv\Scripts
python pywin32_postinstall.py -install
```

### 3. Frontend Build
```powershell
cd D:\Projects\BMR App\frontend

# Install dependencies
npm install

# Build for production
npm run build
```

### 4. Configure Windows Firewall
Allow Python/uvicorn through firewall for port 8000:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Mandi Gate Pass Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Mandi Gate Pass Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

Or manually:
1. Windows Security → Firewall & network protection → Allow an app through firewall
2. Click "Change settings" → "Allow another app"
3. Browse to `python.exe` in your venv: `D:\Projects\BMR App\backend\venv\Scripts\python.exe`
4. Check both Private and Public

### 5. Find Your PC's IP Address
```powershell
ipconfig
# Look for "IPv4 Address" under your WiFi adapter (e.g., 192.168.1.100)
```

---

## Running the Application

### Option A: Development Mode (Both terminals needed)

**Terminal 1 - Backend:**
```powershell
cd D:\Projects\BMR App\backend
venv\Scripts\activate
python main.py
# Runs on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```powershell
cd D:\Projects\BMR App\frontend
npm run dev
# Runs on http://0.0.0.0:3000 (proxies API to backend)
```

### Option B: Production Mode (Single terminal)

```powershell
# Build frontend first
cd D:\Projects\BMR App\frontend
npm run build

# Serve frontend via backend (configure in main.py) or use a static server
# For simplicity, run both:

# Terminal 1:
cd D:\Projects\BMR App\backend
venv\Scripts\activate
python main.py

# Terminal 2:
cd D:\Projects\BMR App\frontend\dist
python -m http.server 3000
```

---

## Accessing from Phone

### On iPhone/iPad (Safari)
1. Connect to same WiFi network
2. Open Safari → go to `http://YOUR_PC_IP:3000` (e.g., `http://192.168.1.100:3000`)
3. Tap **Share** button (square with arrow up)
4. Scroll down → **"Add to Home Screen"**
5. Tap **"Add"** → App installs as standalone PWA
6. Works offline after first load!

### On Android (Chrome)
1. Connect to same WiFi network
2. Open Chrome → go to `http://YOUR_PC_IP:3000`
3. Tap **Menu** (3 dots) → **"Add to Home screen"** or **"Install app"**
4. Tap **"Install"** → App appears in app drawer
5. Works offline after first load!

---

## Using the App

### 1. Fill Gate Pass Details
- **Mandi Name**: Dropdown (Raisen Mandi, Vidisha Mandi)
- **Variety**: Dropdown (PUSA, 1886)
- **Firm Name**: Dropdown (Babu Lal Manoj Kumar, Ankit Traders, Siddharth Traders)
- **FRTC Number**: Text input (e.g., 9004)
- **Full Name**: Text input (e.g., Naved Khan) → combines as FRTC-9004(Naved Khan)
- **Village**: Text input
- **No. of Bages**: Number input → Shows print calculation
- **Tag Color**: Color selector (8 colors)

### 2. Print Calculation
When you enter bags, it shows:
- **Total Bages**: Your input
- **Bages per Print**: 21 (configurable)
- **Min Prints Required**: Total ÷ 21 (integer)
- **Labels Left**: Remainder

### 3. Print Options

#### Browser Print (Works everywhere)
- Click **Print** → Select copies → Click **Print**
- Opens browser print dialog for each copy
- You must click "Print" in each dialog

#### Silent Print (Windows only, Direct to Printer)
- Click **Print** → Enable **"Silent Print (Direct to Printer)"**
- Select printer from dropdown
- Select copies → Click **Print**
- Sends directly to printer without dialogs!
- **Requirement**: Backend running on same PC as printer

---

## Configuration

Edit `frontend/public/config.json`:
```json
{
  "mandi_names": ["Raisen Mandi", "Vidisha Mandi"],
  "varieties": ["PUSA", "1886"],
  "firm_names": ["Babu Lal Manoj Kumar", "Ankit Traders", "Siddharth Traders"],
  "tag_colors": ["Red", "Green", "Blue", "Yellow", "Orange", "Purple", "Black", "White"],
  "default_mandi": "Raisen Mandi",
  "default_variety": "PUSA",
  "default_firm": "Babu Lal Manoj Kumar",
  "default_tag_color": "Red",
  "bages_per_print": 21
}
```

---

## Troubleshooting

### Silent Print Not Working
1. **Check pywin32 installed**: `pip show pywin32`
2. **Run postinstall**: `cd backend\venv\Scripts && python pywin32_postinstall.py -install`
3. **Physical printer required**: "Microsoft Print to PDF" won't work for silent print
4. **Check printer name**: Use exact name from Printers list in app
5. **Run as Admin**: Try running backend terminal as Administrator

### Can't Access from Phone
1. **Same WiFi**: Both devices on same network
2. **Firewall**: Port 3000 and 8000 allowed
3. **Correct IP**: Use `ipconfig` to get current IPv4
4. **HTTP not HTTPS**: PWA works on HTTP for localhost/LAN

### Printer Not Detected
1. **Restart backend** after connecting printer
2. **Check Windows Printers**: Settings → Devices → Printers
3. **Network printer**: Add via IP in Windows first

### PDF Generation Issues
- Ensure `reportlab` installed: `pip show reportlab`
- Check backend logs for errors

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/document/config` | Get dropdown config |
| POST | `/api/document/generate-docx` | Generate Word doc |
| POST | `/api/document/generate-pdf` | Generate PDF |
| POST | `/api/print/pdf` | Get PDF for browser print |
| POST | `/api/print/silent-print` | **Direct to printer (Windows)** |
| GET | `/api/print/printers` | List available printers |

---

## Project Structure
```
BMR App/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── document.py    # Doc/PDF generation
│   │   │   └── print.py       # Print endpoints (incl. silent)
│   │   ├── models/schemas.py  # Pydantic models
│   │   ├── services/
│   │   │   ├── document_generator.py
│   │   │   └── pdf_generator.py
│   │   └── __init__.py
│   ├── main.py                # FastAPI entry
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── config.json        # Dropdown configuration
│   │   └── manifest.webmanifest
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── Sample.doc                 # Reference document
└── Sampl.pdf                  # Reference PDF (21-cell grid)
```

---

## Updating the App

### Frontend Changes
```powershell
cd frontend
npm run build
# Copy dist/ to backend static folder or serve separately
```

### Backend Changes
```powershell
cd backend
venv\Scripts\activate
# Edit .py files - auto-reloads in dev mode
```

### Config Changes
Edit `frontend/public/config.json` → rebuild frontend → restart backend

---

## Security Notes

- **Local network only**: No authentication by default
- **HTTPS**: For production, use reverse proxy (nginx) with SSL
- **Firewall**: Only allow trusted networks
- **Printer access**: Silent print requires local OS access

---

## Support

For issues:
1. Check backend console for error logs
2. Check browser DevTools (F12) for frontend errors
3. Verify printer works from Windows test page
4. Ensure all dependencies installed correctly