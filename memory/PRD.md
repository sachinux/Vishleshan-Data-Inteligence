# Data Storyteller Studio - PRD

## Original Problem Statement
Build a full-stack web app called "Data Storyteller Studio" that lets users upload data files (CSV, Excel, Google Sheets, PDFs) and turn them into interactive charts, insights, and storyboards.

## User Choices
- **LLM Provider**: OpenAI GPT-5.2 via Emergent LLM Key
- **Google Sheets**: Simple URL parsing (public sheets only)
- **PDF Extraction**: Advanced table detection with pdfplumber
- **Export Formats**: Both PDF and PPTX
- **Design**: Black minimalism Retro look

## Architecture

### Backend (FastAPI)
- `/app/backend/server.py` - Main API with all endpoints
- MongoDB for persistence (workspaces, datasets, chat messages, story tiles, storyboards)
- In-memory DataFrame storage for dataset analysis
- OpenAI GPT-5.2 integration via emergentintegrations library

### Frontend (React + Tailwind)
- **Sidebar.jsx** - Workspace selector, navigation, dataset list
- **WorkspaceView.jsx** - File upload, Google Sheets import, data profiling
- **ChatView.jsx** - Natural language chat with chart rendering
- **ChartRenderer.jsx** - Recharts-based visualization (bar, line, pie, scatter)
- **DataTable.jsx** - Paginated data display
- **StoryboardView.jsx** - Story tiles, storyboard editor with drag-drop

## Core Requirements (Static)

### File Handling
- [x] CSV upload with pandas parsing
- [x] Excel (.xlsx, .xls) upload with openpyxl
- [x] Google Sheets via public URL export
- [x] PDF text/table extraction with pdfplumber

### Data Engine
- [x] Unified dataset model with column profiles
- [x] Type detection (numeric, string, datetime)
- [x] Statistics: nulls, unique counts, min/max, mean
- [x] DataFrame operations for query execution

### Chat UX
- [x] Left sidebar with file list and profile
- [x] Main chat with plan, result, table, chart
- [x] Toggleable code view (hidden by default)
- [x] Error explanations with suggestions

### Visualization
- [x] Auto-generated chart specs (bar, line, pie, scatter)
- [x] Interactive charts with hover, legend toggle
- [x] Chart type switching controls
- [x] CSV export for chart data

### Story Tiles & Storyboard
- [x] Create tiles from chat messages
- [x] Tile fields: id, title, key_metrics, explanation, chart_config
- [x] Storyboard with ordered frames
- [x] Drag-and-drop frame reordering
- [x] Edit frame titles and narrative notes

### Export
- [x] PDF export with reportlab
- [x] PPTX export with python-pptx
- [x] JSON export endpoint

## What's Been Implemented (Jan 9, 2026)

### Backend
- 16 API endpoints (all tested and working)
- Workspace CRUD operations
- File upload for CSV, Excel, PDF
- Google Sheets import via URL
- Data profiling with column statistics
- Chat endpoint with LLM analysis
- Story tile creation from messages
- Storyboard generation and editing
- PDF/PPTX/JSON export

### Frontend
- Black minimalist retro theme (amber accents, Space Mono font)
- Three-view navigation (Workspace, Chat, Storyboard)
- Drag-drop file upload zone
- Data profile panel with column details
- Chat interface with suggestions
- Chart rendering (4 chart types)
- Storyboard editor with drag reorder
- Export buttons for PDF/PPTX

## User Personas

### Primary: Business Analyst
- Uploads sales/marketing data
- Asks natural language questions
- Creates executive presentation decks

### Secondary: Data Scientist
- Quick exploration of datasets
- Validates patterns with visualizations
- Shares findings with stakeholders

## Prioritized Backlog

### P0 (MVP Complete)
- [x] All core features implemented

### P1 (High Priority)
- [ ] Excel multi-sheet support
- [ ] Heatmap chart type
- [ ] Correlation analysis
- [ ] Date range filters on charts

### P2 (Medium Priority)
- [ ] User authentication
- [ ] Workspace sharing
- [ ] Custom chart color themes
- [ ] Template storyboards

### P3 (Nice to Have)
- [ ] Real-time collaboration
- [ ] Scheduled report generation
- [ ] Email export delivery
- [ ] Dashboard embedding

## Next Tasks
1. Add user authentication (JWT or social login)
2. Implement Excel multi-sheet selection
3. Add more chart types (heatmap, area, funnel)
4. Improve error handling for LLM failures
5. Add chart image export (PNG)
