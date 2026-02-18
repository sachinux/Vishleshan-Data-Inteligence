# Vishleshan - Data Intelligence Platform

## Product Overview
Vishleshan is a full-stack web application for data analysis that allows users to upload data files (CSV, Excel, Google Sheets, PDF), analyze them using natural language queries in a chat interface, and generate interactive charts and insights.

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **LLM**: OpenAI GPT-5.2 via Emergent LLM Key
- **ML Libraries**: scikit-learn, scipy, pandas, numpy

## Core Features

### 1. Data Management (Your Data View)
- Upload CSV, Excel, Google Sheets (via URL), PDF files
- Auto-profiling of uploaded datasets
- Dataset preview and management
- Inactive chat preview with smooth transition to Analysis

### 2. Chat-Based Analysis (Analysis View)
- Natural language querying of data
- In-chat file uploads
- Prompt Library for saving/reusing prompts
- Smart suggestions for follow-up questions

### 3. 3-Layer Analysis System ✅
A stable architecture that separates concerns:

**Layer 1 - Business Intelligence (User Visible)**
- Charts, insights, recommendations
- Key findings
- Clean, actionable results
- Confidence score (only shown on success)

**Layer 2 - AI Reasoning (Collapsible, collapsed by default)**
- "What I did" explanation
- Methodology used
- Steps taken
- Model selection info

**Layer 3 - Runtime (Collapsible, collapsed by default)**
- Python sandbox details
- Generated code
- Execution time
- Error details (for debugging)

### 4. AI Model Orchestrator ✅
AI-powered automatic model selection:

**Available Models:**
- Deep Analysis - LLM-powered code generation for complex queries
- Statistical Summary - Fast statistical profiling
- Aggregation Engine - Direct numeric calculations (sum, mean, count)
- Chart Generator - Direct visualization
- Pattern Detector - Anomaly and trend detection

**Features:**
- Automatic model selection based on query analysis
- Percentage scores for each model considered
- Small popover badge showing selected model
- Model selection info in Layer 2

### 5. ML-Powered Analysis ✅ (NEW - Feb 2026)
Full machine learning capabilities:

**Auto-Preprocessing:**
- Yes/No columns automatically converted to 0/1 (_encoded suffix)
- Categorical encoding handled automatically
- Data cleaning for ML operations

**Available ML Operations:**
- **Churn Drivers**: Random Forest feature importance
- **Churn Probability**: Predict risk for each customer
- **Correlation Analysis**: Find factors correlated with outcomes
- **Classification**: Logistic Regression, Decision Trees
- **Clustering**: K-means, DBSCAN

**Whitelisted Libraries:**
- sklearn (model_selection, preprocessing, ensemble, linear_model, tree, metrics)
- scipy
- pandas, numpy
- math, statistics, datetime

### 6. Failure State Handling ✅
- Graceful failure UI with amber/mild alert styling
- "Retry" button
- "Switch Method" dropdown
- "Learn More" collapsible
- No confidence % shown on failure

### 7. Data Actions (Storyboard View)
- Collapsible Kanban board (Draft, In Progress, Completed)
- Report management with tabs
- Executive summary, KPIs, action items
- PDF/PPTX export (UI only, backend pending)

## API Endpoints

### Chat Endpoints
- `POST /api/chat` - Main analysis endpoint with 3-layer response
- `POST /api/chat/alternative` - Alternative analysis methods
- `GET /api/chat/{workspace_id}` - Get chat history

### Dataset Endpoints
- `POST /api/datasets/upload` - Upload dataset
- `GET /api/datasets/{workspace_id}` - List datasets
- `GET /api/datasets/{dataset_id}/profile` - Get profile
- `GET /api/datasets/{dataset_id}/preview` - Preview data

### Workspace Endpoints
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces` - List workspaces
- `PUT /api/workspaces/{workspace_id}` - Update workspace

## Data Models

### ChatMessage
```python
{
  id: str,
  workspace_id: str,
  role: str,  # user, assistant
  content: str,
  plan: str,
  code: str,
  table_data: dict,
  chart_config: dict,
  error: str,
  suggestions: list,
  # 3-Layer System
  analysis_success: bool,
  analysis_method: str,
  layer1_insight: dict,
  layer2_reasoning: dict,
  layer3_runtime: dict,
  confidence_score: int,
  alternative_methods: list,
  model_selection: dict  # {selected, reason, alternatives}
}
```

## Completed Work (Feb 2026)

### Session 1
- Basic app scaffolding
- Workspace and dataset management
- Chat interface
- Chart generation

### Session 2 (Current)
- ✅ 3-Layer Analysis System (Layer 1, 2, 3)
- ✅ AI Model Orchestrator with automatic selection
- ✅ Failure state redesign with Retry/Switch Method
- ✅ Confidence score only on success
- ✅ Model selector popover badge
- ✅ Layer 2 includes model selection info

## Upcoming Tasks (P1)
- Quick Start Templates (Data Audit, Deep Dive)
- Assignees and due dates for action items
- "Select All" checkbox in Data Grid header

## Future Tasks (P2)
- PDF/PPTX Export for Data Actions
- Search and filter for Query Navigator
- Bulk deletion for datasets
- What-If scenario analysis
- Drill-down charts

## Known Limitations
- PDF/PPTX export buttons are UI-only (no backend)
- Dataset store is in-memory (cleared on restart)
- No user authentication implemented

## File Structure
```
/app/
├── backend/
│   ├── server.py          # FastAPI app with 3-layer system
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── components/
│   │       ├── ChatView.jsx    # 3-layer UI, model selector
│   │       ├── WorkspaceView.jsx
│   │       ├── StoryboardView.jsx
│   │       ├── RightSidebar.jsx
│   │       └── Sidebar.jsx
│   ├── package.json
│   └── .env
└── memory/
    └── PRD.md
```
