# Data Storyteller Studio - PRD

## Original Problem Statement
Build a full-stack web app called "Data Storyteller Studio" that lets users upload data files (CSV, Excel, Google Sheets, PDFs) and turn them into interactive charts, insights, and storyboards.

## User Choices
- **LLM Provider**: OpenAI GPT-5.2 via Emergent LLM Key
- **Google Sheets**: Simple URL parsing (public sheets only)
- **PDF Extraction**: Advanced table detection with pdfplumber
- **Export Formats**: Both PDF and PPTX
- **Design**: Bento style minimal white with light/dark theme toggle

## Architecture

### Backend (FastAPI)
- `/app/backend/server.py` - Main API with all endpoints
- MongoDB for persistence (workspaces, datasets, chat messages, story tiles, storyboards, chat_settings)
- In-memory DataFrame storage for dataset analysis
- OpenAI GPT-5.2 integration via emergentintegrations library

### Frontend (React + Tailwind)
- **Sidebar.jsx** - Workspace selector, navigation, dataset list, theme toggle
- **WorkspaceView.jsx** - File upload, Google Sheets import, data profiling
- **ChatView.jsx** - Natural language chat with chart rendering, settings
- **ChatSettings.jsx** - AI customization modal (context & response style)
- **ChartRenderer.jsx** - Recharts-based visualization (bar, line, pie, scatter)
- **DataTable.jsx** - Paginated data display
- **StoryboardView.jsx** - Story tiles, storyboard editor with drag-drop
- **RightSidebar.jsx** - Storyboard, Pinned Insights, Narrative Coach

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
- [x] Chat Settings with Context and Response Style customization

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

## What's Been Implemented

### Feb 16, 2026
- **Chat Settings Feature**: Added settings modal to customize AI behavior
  - Context: Custom instructions the AI remembers (up to 1000 chars)
  - Response Style: How the AI responds (up to 50 chars, e.g., "professional, concise")
  - Backend: `/api/chat-settings/{workspace_id}` GET/PUT endpoints
  - Frontend: ChatSettings.jsx modal component
  - Settings persist per workspace in MongoDB

- **Storyboard UX Improvements**: Simplified the storyboard view
  - Cleaner frame cards with rounded corners and subtle borders
  - Simplified UX copy ("Included Tiles", "Speaker Notes")
  - Removed confusing CTAs and redundant elements
  - Better visual hierarchy with numbered frames (01, 02, 03)
  - Cleaner right sidebar with simplified "Pinned Insights" section

- **Excel-like Data Grid with Row Selection**: Added Profile/Grid tabs
  - New "Grid" tab in left sidebar for Excel-like data view
  - Row selection with checkboxes (single and multi-select)
  - Sortable columns, pagination (50 rows per page)
  - **"Narrate Story"** - AI generates a narrative from selected rows
  - **"Compare Data"** - AI compares and contrasts selected rows
  - Both generate visual charts and can be pinned as insights
  - Backend: `/api/datasets/{id}/rows` and `/api/datasets/selected-rows/analyze` endpoints
  - Frontend: DataGridView.jsx component

### Jan 9, 2026
- 16 API endpoints (all tested and working)
- Workspace CRUD operations
- File upload for CSV, Excel, PDF
- Google Sheets import via URL
- Data profiling with column statistics
- Chat endpoint with LLM analysis
- Story tile creation from messages
- Storyboard generation and editing
- PDF/PPTX/JSON export
- Three-column layout with fixed sidebars
- Bento UI theme with light/dark toggle
- Workspace/dataset deletion with confirmation dialogs
- Progress indicator for chat queries

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
- [x] Chat Settings (Context & Response Style)

### P1 (High Priority)
- [x] Profile/Grid tabs in left sidebar
- [ ] Quick Start Templates (Data Audit, Deep Dive)
- [ ] Excel multi-sheet support
- [ ] Heatmap chart type

### P2 (Medium Priority)
- [ ] Search and filter for Query Navigator
- [ ] Timestamps for queries
- [ ] Bulk deletion for datasets
- [ ] Rename/description editing for datasets
- [ ] Narrative Coach functionality
- [ ] Custom chart color themes

### P3 (Nice to Have)
- [ ] User authentication
- [ ] Workspace sharing
- [ ] Real-time collaboration
- [ ] Scheduled report generation
- [ ] Email export delivery
- [ ] Dashboard embedding

## Key API Endpoints
- `POST /api/workspaces` - Create workspace
- `PUT /api/workspaces/{id}` - Update workspace
- `DELETE /api/workspaces/{id}` - Delete workspace
- `POST /api/datasets/upload` - Upload data file
- `DELETE /api/datasets/{id}` - Delete dataset
- `GET /api/datasets/{id}/rows` - Get paginated rows for grid view
- `POST /api/datasets/selected-rows/analyze` - Analyze selected rows (narrate/compare)
- `POST /api/chat` - Process user query
- `GET /api/chat-settings/{workspace_id}` - Get chat settings
- `PUT /api/chat-settings/{workspace_id}` - Update chat settings
- `POST /api/story-tiles/from-message` - Create story tile
- `POST /api/storyboards/generate` - Generate storyboard
- `POST /api/export/pdf/{id}` - Export to PDF
- `POST /api/export/pptx/{id}` - Export to PPTX

## Files of Reference
- `/app/backend/server.py` - All API logic
- `/app/frontend/src/App.js` - Root React component
- `/app/frontend/src/components/ChatView.jsx` - Chat interface
- `/app/frontend/src/components/ChatSettings.jsx` - Settings modal
- `/app/frontend/src/components/Sidebar.jsx` - Left sidebar
- `/app/frontend/src/components/RightSidebar.jsx` - Right sidebar

