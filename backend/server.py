from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import pandas as pd
import numpy as np
import json
import io
import re
import httpx
import pdfplumber
import openpyxl
from emergentintegrations.llm.chat import LlmChat, UserMessage
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from pptx import Presentation
from pptx.util import Inches, Pt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM API Key
LLM_API_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# In-memory storage for datasets (in production, use Redis or file storage)
datasets_store: Dict[str, pd.DataFrame] = {}

# ============== MODELS ==============

class Workspace(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class DatasetFile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    filename: str
    file_type: str
    row_count: int = 0
    column_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ColumnProfile(BaseModel):
    name: str
    dtype: str
    null_count: int
    null_percentage: float
    unique_count: int
    min_value: Optional[str] = None
    max_value: Optional[str] = None
    mean_value: Optional[float] = None
    sample_values: List[str] = []

class DataProfile(BaseModel):
    dataset_id: str
    row_count: int
    column_count: int
    columns: List[ColumnProfile]
    memory_usage: str

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    role: str  # user, assistant
    content: str
    plan: Optional[str] = None
    code: Optional[str] = None
    table_data: Optional[Dict[str, Any]] = None
    chart_config: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    suggestions: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    workspace_id: str
    message: str
    dataset_id: Optional[str] = None

class StoryTile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    title: str
    key_metrics: List[str] = []
    explanation: str
    chart_config: Optional[Dict[str, Any]] = None
    table_data: Optional[Dict[str, Any]] = None
    tags: List[str] = []
    source_message_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StoryTileCreate(BaseModel):
    workspace_id: str
    title: str
    key_metrics: List[str] = []
    explanation: str
    chart_config: Optional[Dict[str, Any]] = None
    table_data: Optional[Dict[str, Any]] = None
    tags: List[str] = []
    source_message_id: Optional[str] = None

class StoryboardFrame(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    summary: str
    tile_refs: List[str] = []
    narrative_notes: str = ""
    order: int = 0

class Storyboard(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    title: str
    frames: List[StoryboardFrame] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StoryboardCreate(BaseModel):
    workspace_id: str
    title: str

class StoryboardUpdate(BaseModel):
    title: Optional[str] = None
    frames: Optional[List[StoryboardFrame]] = None

# ============== HELPER FUNCTIONS ==============

def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def prepare_for_mongo(doc: dict) -> dict:
    """Prepare a document for MongoDB storage"""
    result = {}
    for key, value in doc.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [prepare_for_mongo(v) if isinstance(v, dict) else serialize_datetime(v) for v in value]
        elif isinstance(value, dict):
            result[key] = prepare_for_mongo(value)
        else:
            result[key] = value
    return result

def parse_datetime_fields(doc: dict, fields: List[str]) -> dict:
    """Parse datetime fields from ISO strings"""
    for field in fields:
        if field in doc and isinstance(doc[field], str):
            doc[field] = datetime.fromisoformat(doc[field])
    return doc

async def get_llm_response(prompt: str, system_message: str = "You are a data analysis assistant.") -> str:
    """Get response from LLM"""
    if not LLM_API_KEY:
        return "LLM API key not configured"
    
    chat = LlmChat(
        api_key=LLM_API_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)
    return response

def profile_dataframe(df: pd.DataFrame) -> DataProfile:
    """Profile a pandas DataFrame"""
    columns = []
    for col in df.columns:
        col_data = df[col]
        null_count = int(col_data.isnull().sum())
        null_pct = (null_count / len(df)) * 100 if len(df) > 0 else 0
        unique_count = int(col_data.nunique())
        
        col_profile = ColumnProfile(
            name=str(col),
            dtype=str(col_data.dtype),
            null_count=null_count,
            null_percentage=round(null_pct, 2),
            unique_count=unique_count,
            sample_values=[str(v) for v in col_data.dropna().head(5).tolist()]
        )
        
        # Add numeric statistics
        if pd.api.types.is_numeric_dtype(col_data):
            col_profile.min_value = str(col_data.min()) if not col_data.isnull().all() else None
            col_profile.max_value = str(col_data.max()) if not col_data.isnull().all() else None
            col_profile.mean_value = float(col_data.mean()) if not col_data.isnull().all() else None
        else:
            col_profile.min_value = str(col_data.min()) if not col_data.isnull().all() else None
            col_profile.max_value = str(col_data.max()) if not col_data.isnull().all() else None
        
        columns.append(col_profile)
    
    memory = df.memory_usage(deep=True).sum()
    if memory > 1024 * 1024:
        memory_str = f"{memory / (1024 * 1024):.2f} MB"
    else:
        memory_str = f"{memory / 1024:.2f} KB"
    
    return DataProfile(
        dataset_id="",
        row_count=len(df),
        column_count=len(df.columns),
        columns=columns,
        memory_usage=memory_str
    )

def parse_google_sheets_url(url: str) -> Optional[str]:
    """Extract the spreadsheet ID from a Google Sheets URL"""
    patterns = [
        r'/spreadsheets/d/([a-zA-Z0-9-_]+)',
        r'id=([a-zA-Z0-9-_]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

async def fetch_google_sheet(url: str) -> pd.DataFrame:
    """Fetch data from a public Google Sheet"""
    sheet_id = parse_google_sheets_url(url)
    if not sheet_id:
        raise ValueError("Invalid Google Sheets URL")
    
    export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    
    async with httpx.AsyncClient(follow_redirects=True) as client_http:
        response = await client_http.get(export_url)
        if response.status_code != 200:
            raise ValueError("Could not fetch Google Sheet. Make sure it's publicly accessible.")
        
        df = pd.read_csv(io.StringIO(response.text))
        return df

def extract_pdf_content(file_bytes: bytes) -> tuple[str, List[Dict]]:
    """Extract text and tables from PDF"""
    text_content = []
    tables = []
    
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page_num, page in enumerate(pdf.pages):
            # Extract text
            text = page.extract_text()
            if text:
                text_content.append(f"[Page {page_num + 1}]\n{text}")
            
            # Extract tables
            page_tables = page.extract_tables()
            for table in page_tables:
                if table and len(table) > 1:
                    headers = table[0]
                    data = table[1:]
                    tables.append({
                        "page": page_num + 1,
                        "headers": headers,
                        "data": data
                    })
    
    return "\n\n".join(text_content), tables

def execute_data_query(df: pd.DataFrame, query_code: str) -> Dict[str, Any]:
    """Execute a data query on a DataFrame safely"""
    try:
        # Create a safe execution environment
        local_vars = {"df": df, "pd": pd, "np": np}
        exec(query_code, {"__builtins__": {}}, local_vars)
        
        result = local_vars.get("result", None)
        
        if result is None:
            return {"error": "No result variable found in query"}
        
        if isinstance(result, pd.DataFrame):
            return {
                "type": "dataframe",
                "data": result.head(100).to_dict(orient="records"),
                "columns": list(result.columns),
                "row_count": len(result)
            }
        elif isinstance(result, pd.Series):
            return {
                "type": "series",
                "data": result.head(100).to_dict(),
                "name": result.name
            }
        elif isinstance(result, (int, float, str, bool)):
            return {
                "type": "scalar",
                "data": result
            }
        elif isinstance(result, dict):
            return {
                "type": "dict",
                "data": result
            }
        else:
            return {
                "type": "unknown",
                "data": str(result)
            }
    except Exception as e:
        return {"error": str(e)}

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "Data Storyteller Studio API"}

# Workspace endpoints
@api_router.post("/workspaces", response_model=Workspace)
async def create_workspace(input: WorkspaceCreate):
    workspace = Workspace(**input.model_dump())
    doc = prepare_for_mongo(workspace.model_dump())
    await db.workspaces.insert_one(doc)
    return workspace

@api_router.get("/workspaces", response_model=List[Workspace])
async def get_workspaces():
    workspaces = await db.workspaces.find({}, {"_id": 0}).to_list(100)
    for ws in workspaces:
        parse_datetime_fields(ws, ["created_at", "updated_at"])
    return workspaces

@api_router.get("/workspaces/{workspace_id}", response_model=Workspace)
async def get_workspace(workspace_id: str):
    workspace = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    parse_datetime_fields(workspace, ["created_at", "updated_at"])
    return workspace

@api_router.delete("/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: str):
    result = await db.workspaces.delete_one({"id": workspace_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workspace not found")
    # Also delete related data
    await db.datasets.delete_many({"workspace_id": workspace_id})
    await db.chat_messages.delete_many({"workspace_id": workspace_id})
    await db.story_tiles.delete_many({"workspace_id": workspace_id})
    await db.storyboards.delete_many({"workspace_id": workspace_id})
    return {"message": "Workspace deleted"}

# File upload endpoints
@api_router.post("/datasets/upload")
async def upload_dataset(
    workspace_id: str = Form(...),
    file: UploadFile = File(...)
):
    filename = file.filename or "unknown"
    file_ext = filename.split(".")[-1].lower()
    
    try:
        content = await file.read()
        
        if file_ext == "csv":
            df = pd.read_csv(io.BytesIO(content))
            file_type = "csv"
        elif file_ext in ["xlsx", "xls"]:
            df = pd.read_excel(io.BytesIO(content))
            file_type = "excel"
        elif file_ext == "pdf":
            text_content, tables = extract_pdf_content(content)
            
            # If tables found, use the first one as the main dataset
            if tables:
                first_table = tables[0]
                df = pd.DataFrame(first_table["data"], columns=first_table["headers"])
            else:
                # Create a simple text dataset
                df = pd.DataFrame({"text_content": [text_content]})
            file_type = "pdf"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")
        
        dataset_file = DatasetFile(
            workspace_id=workspace_id,
            filename=filename,
            file_type=file_type,
            row_count=len(df),
            column_count=len(df.columns)
        )
        
        # Store DataFrame in memory
        datasets_store[dataset_file.id] = df
        
        # Store metadata in MongoDB
        doc = prepare_for_mongo(dataset_file.model_dump())
        await db.datasets.insert_one(doc)
        
        # Get profile
        profile = profile_dataframe(df)
        profile.dataset_id = dataset_file.id
        
        return {
            "dataset": dataset_file.model_dump(),
            "profile": profile.model_dump()
        }
    
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/datasets/google-sheets")
async def import_google_sheet(workspace_id: str = Form(...), url: str = Form(...)):
    try:
        df = await fetch_google_sheet(url)
        
        dataset_file = DatasetFile(
            workspace_id=workspace_id,
            filename=f"google_sheet_{uuid.uuid4().hex[:8]}",
            file_type="google_sheets",
            row_count=len(df),
            column_count=len(df.columns)
        )
        
        datasets_store[dataset_file.id] = df
        
        doc = prepare_for_mongo(dataset_file.model_dump())
        await db.datasets.insert_one(doc)
        
        profile = profile_dataframe(df)
        profile.dataset_id = dataset_file.id
        
        return {
            "dataset": dataset_file.model_dump(),
            "profile": profile.model_dump()
        }
    
    except Exception as e:
        logger.error(f"Error importing Google Sheet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/datasets/{workspace_id}")
async def get_datasets(workspace_id: str):
    datasets = await db.datasets.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(100)
    for ds in datasets:
        parse_datetime_fields(ds, ["created_at"])
    return datasets

@api_router.get("/datasets/{dataset_id}/profile")
async def get_dataset_profile(dataset_id: str):
    if dataset_id not in datasets_store:
        raise HTTPException(status_code=404, detail="Dataset not found in memory")
    
    df = datasets_store[dataset_id]
    profile = profile_dataframe(df)
    profile.dataset_id = dataset_id
    return profile.model_dump()

@api_router.get("/datasets/{dataset_id}/preview")
async def preview_dataset(dataset_id: str, rows: int = 10):
    if dataset_id not in datasets_store:
        raise HTTPException(status_code=404, detail="Dataset not found in memory")
    
    df = datasets_store[dataset_id]
    return {
        "columns": list(df.columns),
        "data": df.head(rows).to_dict(orient="records"),
        "total_rows": len(df)
    }

# Chat endpoints
@api_router.post("/chat")
async def chat(request: ChatRequest):
    workspace_id = request.workspace_id
    user_message = request.message
    dataset_id = request.dataset_id
    
    # Save user message
    user_chat = ChatMessage(
        workspace_id=workspace_id,
        role="user",
        content=user_message
    )
    doc = prepare_for_mongo(user_chat.model_dump())
    await db.chat_messages.insert_one(doc)
    
    # Get dataset info if available
    df = None
    schema_info = ""
    if dataset_id and dataset_id in datasets_store:
        df = datasets_store[dataset_id]
        profile = profile_dataframe(df)
        schema_info = f"""
Dataset Schema:
- Rows: {profile.row_count}
- Columns: {profile.column_count}
- Column Details:
"""
        for col in profile.columns:
            schema_info += f"  * {col.name} ({col.dtype}): {col.unique_count} unique values, {col.null_percentage}% null"
            if col.mean_value is not None:
                schema_info += f", mean={col.mean_value:.2f}"
            schema_info += "\n"
    
    # Generate analysis plan using LLM
    analysis_prompt = f"""
You are a data analysis assistant. The user asked: "{user_message}"

{schema_info}

Generate a JSON response with:
1. "plan": A brief explanation of what analysis you'll perform (1-2 sentences)
2. "code": Python code using pandas to analyze the data. The DataFrame is available as 'df'. Store the result in a variable called 'result'. The result should be a DataFrame, Series, or scalar value.
3. "chart_type": If visualization is appropriate, specify one of: "bar", "line", "scatter", "pie", "heatmap", or null if no chart needed
4. "chart_config": If chart_type is specified, provide config with "x_column", "y_column", "title", and optionally "color_by"
5. "suggestions": List of 3 follow-up questions the user might want to ask

Return ONLY valid JSON, no markdown formatting.
Example:
{{"plan": "I'll calculate the average sales by region", "code": "result = df.groupby('region')['sales'].mean()", "chart_type": "bar", "chart_config": {{"x_column": "region", "y_column": "sales", "title": "Average Sales by Region"}}, "suggestions": ["Show top 5 regions", "Compare year over year", "Filter by date range"]}}
"""
    
    try:
        llm_response = await get_llm_response(analysis_prompt)
        
        # Parse LLM response
        try:
            # Clean up the response - remove markdown if present
            clean_response = llm_response.strip()
            if clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
            clean_response = clean_response.strip()
            
            analysis = json.loads(clean_response)
        except json.JSONDecodeError:
            analysis = {
                "plan": "I'll analyze your request",
                "code": "result = df.describe()" if df is not None else "result = 'No dataset loaded'",
                "chart_type": None,
                "chart_config": None,
                "suggestions": ["Upload a dataset first", "Ask about specific columns", "Request a summary"]
            }
        
        # Execute the analysis code
        result_data = None
        error = None
        if df is not None and "code" in analysis:
            result_data = execute_data_query(df, analysis["code"])
            if "error" in result_data:
                error = result_data["error"]
                result_data = None
        
        # Generate natural language answer
        answer_prompt = f"""
The user asked: "{user_message}"
Analysis plan: {analysis.get('plan', 'N/A')}
Result: {json.dumps(result_data) if result_data else 'No result'}
Error: {error if error else 'None'}

Provide a clear, concise answer in 2-3 sentences. If there was an error, explain what might have gone wrong and suggest fixes.
"""
        answer = await get_llm_response(answer_prompt, "You are a friendly data analyst explaining results to a business user.")
        
        # Create assistant response
        assistant_chat = ChatMessage(
            workspace_id=workspace_id,
            role="assistant",
            content=answer,
            plan=analysis.get("plan"),
            code=analysis.get("code"),
            table_data=result_data if result_data and result_data.get("type") in ["dataframe", "series", "dict"] else None,
            chart_config={
                "type": analysis.get("chart_type"),
                **analysis.get("chart_config", {})
            } if analysis.get("chart_type") else None,
            error=error,
            suggestions=analysis.get("suggestions", [])
        )
        
        doc = prepare_for_mongo(assistant_chat.model_dump())
        await db.chat_messages.insert_one(doc)
        
        return assistant_chat.model_dump()
    
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        error_chat = ChatMessage(
            workspace_id=workspace_id,
            role="assistant",
            content=f"I encountered an error while processing your request. Please try rephrasing your question.",
            error=str(e),
            suggestions=["Try a simpler question", "Check if dataset is loaded", "Ask about available columns"]
        )
        doc = prepare_for_mongo(error_chat.model_dump())
        await db.chat_messages.insert_one(doc)
        return error_chat.model_dump()

@api_router.get("/chat/{workspace_id}")
async def get_chat_history(workspace_id: str):
    messages = await db.chat_messages.find(
        {"workspace_id": workspace_id}, 
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    for msg in messages:
        parse_datetime_fields(msg, ["created_at"])
    
    return messages

# Story Tiles endpoints
@api_router.post("/story-tiles", response_model=StoryTile)
async def create_story_tile(input: StoryTileCreate):
    tile = StoryTile(**input.model_dump())
    doc = prepare_for_mongo(tile.model_dump())
    await db.story_tiles.insert_one(doc)
    return tile

@api_router.post("/story-tiles/from-message")
async def create_tile_from_message(workspace_id: str = Form(...), message_id: str = Form(...)):
    """Create a story tile from a chat message"""
    message = await db.chat_messages.find_one({"id": message_id}, {"_id": 0})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Use LLM to generate tile content
    tile_prompt = f"""
Based on this analysis result, create a story tile with:
1. "title": A catchy, brief title (5-8 words)
2. "key_metrics": List of 2-3 key numbers/insights from the result
3. "explanation": A 1-2 sentence explanation for business users
4. "tags": List of 2-3 relevant tags

Analysis content: {message.get('content')}
Result data: {json.dumps(message.get('table_data')) if message.get('table_data') else 'N/A'}

Return ONLY valid JSON.
"""
    
    llm_response = await get_llm_response(tile_prompt)
    
    try:
        clean_response = llm_response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        tile_data = json.loads(clean_response.strip())
    except json.JSONDecodeError:
        tile_data = {
            "title": "Analysis Result",
            "key_metrics": [],
            "explanation": message.get("content", "")[:200],
            "tags": []
        }
    
    tile = StoryTile(
        workspace_id=workspace_id,
        title=tile_data.get("title", "Analysis Result"),
        key_metrics=tile_data.get("key_metrics", []),
        explanation=tile_data.get("explanation", ""),
        chart_config=message.get("chart_config"),
        table_data=message.get("table_data"),
        tags=tile_data.get("tags", []),
        source_message_id=message_id
    )
    
    doc = prepare_for_mongo(tile.model_dump())
    await db.story_tiles.insert_one(doc)
    
    return tile.model_dump()

@api_router.get("/story-tiles/{workspace_id}")
async def get_story_tiles(workspace_id: str):
    tiles = await db.story_tiles.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(100)
    for tile in tiles:
        parse_datetime_fields(tile, ["created_at"])
    return tiles

@api_router.delete("/story-tiles/{tile_id}")
async def delete_story_tile(tile_id: str):
    result = await db.story_tiles.delete_one({"id": tile_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Story tile not found")
    return {"message": "Story tile deleted"}

# Storyboard endpoints
@api_router.post("/storyboards", response_model=Storyboard)
async def create_storyboard(input: StoryboardCreate):
    storyboard = Storyboard(**input.model_dump())
    doc = prepare_for_mongo(storyboard.model_dump())
    await db.storyboards.insert_one(doc)
    return storyboard

@api_router.post("/storyboards/generate")
async def generate_storyboard(workspace_id: str = Form(...), title: str = Form("Data Story")):
    """Auto-generate a storyboard from existing story tiles"""
    tiles = await db.story_tiles.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(100)
    
    if not tiles:
        raise HTTPException(status_code=400, detail="No story tiles found. Create some tiles first.")
    
    # Use LLM to organize tiles into frames
    tiles_summary = json.dumps([{"id": t["id"], "title": t["title"], "explanation": t.get("explanation", "")} for t in tiles])
    
    storyboard_prompt = f"""
Create a storyboard from these story tiles: {tiles_summary}

Generate a JSON response with "frames" array. Each frame should have:
- "title": Frame title
- "summary": 1-2 sentence summary
- "tile_refs": List of tile IDs to include (from the tiles provided)
- "narrative_notes": Speaker notes (what to say when presenting this frame)

Organize the tiles into a logical narrative flow (intro, body, conclusion).
Return ONLY valid JSON with a "frames" array.
"""
    
    llm_response = await get_llm_response(storyboard_prompt)
    
    try:
        clean_response = llm_response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        storyboard_data = json.loads(clean_response.strip())
    except json.JSONDecodeError:
        # Default structure
        storyboard_data = {
            "frames": [{
                "title": "Overview",
                "summary": "Key findings from the analysis",
                "tile_refs": [t["id"] for t in tiles[:3]],
                "narrative_notes": "Let's walk through the main insights."
            }]
        }
    
    frames = []
    for i, frame_data in enumerate(storyboard_data.get("frames", [])):
        frame = StoryboardFrame(
            title=frame_data.get("title", f"Frame {i+1}"),
            summary=frame_data.get("summary", ""),
            tile_refs=frame_data.get("tile_refs", []),
            narrative_notes=frame_data.get("narrative_notes", ""),
            order=i
        )
        frames.append(frame)
    
    storyboard = Storyboard(
        workspace_id=workspace_id,
        title=title,
        frames=frames
    )
    
    doc = prepare_for_mongo(storyboard.model_dump())
    await db.storyboards.insert_one(doc)
    
    return storyboard.model_dump()

@api_router.get("/storyboards/{workspace_id}")
async def get_storyboards(workspace_id: str):
    storyboards = await db.storyboards.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(100)
    for sb in storyboards:
        parse_datetime_fields(sb, ["created_at", "updated_at"])
    return storyboards

@api_router.get("/storyboards/detail/{storyboard_id}")
async def get_storyboard(storyboard_id: str):
    storyboard = await db.storyboards.find_one({"id": storyboard_id}, {"_id": 0})
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    parse_datetime_fields(storyboard, ["created_at", "updated_at"])
    return storyboard

@api_router.put("/storyboards/{storyboard_id}")
async def update_storyboard(storyboard_id: str, update: StoryboardUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if "frames" in update_data:
        update_data["frames"] = [f.model_dump() if hasattr(f, 'model_dump') else f for f in update_data["frames"]]
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.storyboards.update_one(
        {"id": storyboard_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    
    return await get_storyboard(storyboard_id)

@api_router.delete("/storyboards/{storyboard_id}")
async def delete_storyboard(storyboard_id: str):
    result = await db.storyboards.delete_one({"id": storyboard_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    return {"message": "Storyboard deleted"}

# Export endpoints
@api_router.post("/export/pdf/{storyboard_id}")
async def export_storyboard_pdf(storyboard_id: str):
    storyboard = await db.storyboards.find_one({"id": storyboard_id}, {"_id": 0})
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    
    # Get tiles for the storyboard
    tile_ids = []
    for frame in storyboard.get("frames", []):
        tile_ids.extend(frame.get("tile_refs", []))
    
    tiles = {}
    if tile_ids:
        tiles_list = await db.story_tiles.find({"id": {"$in": tile_ids}}, {"_id": 0}).to_list(100)
        tiles = {t["id"]: t for t in tiles_list}
    
    # Generate PDF
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Title page
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width/2, height - 2*inch, storyboard.get("title", "Data Story"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(width/2, height - 2.5*inch, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    c.showPage()
    
    # Frames
    for frame in storyboard.get("frames", []):
        c.setFont("Helvetica-Bold", 18)
        c.drawString(0.75*inch, height - 1*inch, frame.get("title", "Frame"))
        
        c.setFont("Helvetica", 12)
        y = height - 1.5*inch
        
        # Summary
        c.drawString(0.75*inch, y, "Summary:")
        y -= 0.25*inch
        summary_text = frame.get("summary", "")
        c.drawString(0.75*inch, y, summary_text[:80])
        y -= 0.5*inch
        
        # Tiles content
        for tile_id in frame.get("tile_refs", []):
            tile = tiles.get(tile_id, {})
            if tile:
                c.setFont("Helvetica-Bold", 12)
                c.drawString(0.75*inch, y, tile.get("title", "Insight"))
                y -= 0.25*inch
                
                c.setFont("Helvetica", 10)
                for metric in tile.get("key_metrics", [])[:3]:
                    c.drawString(1*inch, y, f"• {metric}")
                    y -= 0.2*inch
                
                explanation = tile.get("explanation", "")[:200]
                c.drawString(0.75*inch, y, explanation)
                y -= 0.4*inch
                
                if y < 2*inch:
                    break
        
        # Narrative notes
        y -= 0.25*inch
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(0.75*inch, y, "Notes: " + frame.get("narrative_notes", "")[:100])
        
        c.showPage()
    
    c.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={storyboard.get('title', 'storyboard')}.pdf"}
    )

@api_router.post("/export/pptx/{storyboard_id}")
async def export_storyboard_pptx(storyboard_id: str):
    storyboard = await db.storyboards.find_one({"id": storyboard_id}, {"_id": 0})
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    
    # Get tiles
    tile_ids = []
    for frame in storyboard.get("frames", []):
        tile_ids.extend(frame.get("tile_refs", []))
    
    tiles = {}
    if tile_ids:
        tiles_list = await db.story_tiles.find({"id": {"$in": tile_ids}}, {"_id": 0}).to_list(100)
        tiles = {t["id"]: t for t in tiles_list}
    
    # Create presentation
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # Title slide
    title_slide_layout = prs.slide_layouts[6]  # Blank
    slide = prs.slides.add_slide(title_slide_layout)
    
    title_box = slide.shapes.add_textbox(Inches(0.5), Inches(2.5), Inches(12), Inches(1))
    title_frame = title_box.text_frame
    title_para = title_frame.paragraphs[0]
    title_para.text = storyboard.get("title", "Data Story")
    title_para.font.size = Pt(44)
    title_para.font.bold = True
    
    # Frame slides
    for frame in storyboard.get("frames", []):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        
        # Frame title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(12), Inches(0.8))
        tf = title_box.text_frame
        p = tf.paragraphs[0]
        p.text = frame.get("title", "Frame")
        p.font.size = Pt(32)
        p.font.bold = True
        
        # Summary
        summary_box = slide.shapes.add_textbox(Inches(0.5), Inches(1.2), Inches(12), Inches(0.6))
        tf = summary_box.text_frame
        p = tf.paragraphs[0]
        p.text = frame.get("summary", "")
        p.font.size = Pt(18)
        
        # Tiles content
        y_pos = 2.0
        for tile_id in frame.get("tile_refs", [])[:2]:
            tile = tiles.get(tile_id, {})
            if tile:
                tile_box = slide.shapes.add_textbox(Inches(0.5), Inches(y_pos), Inches(6), Inches(2))
                tf = tile_box.text_frame
                tf.word_wrap = True
                
                p = tf.paragraphs[0]
                p.text = tile.get("title", "")
                p.font.size = Pt(20)
                p.font.bold = True
                
                for metric in tile.get("key_metrics", [])[:3]:
                    p = tf.add_paragraph()
                    p.text = f"• {metric}"
                    p.font.size = Pt(14)
                
                p = tf.add_paragraph()
                p.text = tile.get("explanation", "")[:150]
                p.font.size = Pt(12)
                
                y_pos += 2.5
        
        # Narrative notes at bottom
        notes_box = slide.shapes.add_textbox(Inches(0.5), Inches(6.5), Inches(12), Inches(0.8))
        tf = notes_box.text_frame
        p = tf.paragraphs[0]
        p.text = f"Notes: {frame.get('narrative_notes', '')}"
        p.font.size = Pt(12)
        p.font.italic = True
    
    # Save to buffer
    buffer = io.BytesIO()
    prs.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f"attachment; filename={storyboard.get('title', 'storyboard')}.pptx"}
    )

@api_router.get("/export/json/{storyboard_id}")
async def export_storyboard_json(storyboard_id: str):
    storyboard = await db.storyboards.find_one({"id": storyboard_id}, {"_id": 0})
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    
    # Get tiles
    tile_ids = []
    for frame in storyboard.get("frames", []):
        tile_ids.extend(frame.get("tile_refs", []))
    
    tiles = []
    if tile_ids:
        tiles = await db.story_tiles.find({"id": {"$in": tile_ids}}, {"_id": 0}).to_list(100)
    
    return {
        "storyboard": storyboard,
        "tiles": tiles,
        "exported_at": datetime.now(timezone.utc).isoformat()
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
