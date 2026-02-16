import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { WorkspaceView } from "@/components/WorkspaceView";
import { ChatView } from "@/components/ChatView";
import { StoryboardView } from "@/components/StoryboardView";
import { DataGridView } from "@/components/DataGridView";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Database, MessageSquare, LayoutDashboard } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AppContent() {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [dataProfile, setDataProfile] = useState(null);
  const [activeView, setActiveView] = useState("chat");
  const [storyTiles, setStoryTiles] = useState([]);
  const [storyboards, setStoryboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSettings, setChatSettings] = useState({ context: "", response_style: "" });
  const [showGridSplit, setShowGridSplit] = useState(false); // Show grid in split view with chat

  // Fetch workspaces
  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/workspaces`);
      setWorkspaces(response.data);
      if (response.data.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    }
  }, [currentWorkspace]);

  // Fetch datasets for workspace
  const fetchDatasets = useCallback(async (workspaceId) => {
    try {
      const response = await axios.get(`${API}/datasets/${workspaceId}`);
      setDatasets(response.data);
      if (response.data.length > 0) {
        setSelectedDataset(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  }, []);

  // Fetch data profile
  const fetchDataProfile = useCallback(async (datasetId) => {
    try {
      const response = await axios.get(`${API}/datasets/${datasetId}/profile`);
      setDataProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setDataProfile(null);
    }
  }, []);

  // Fetch story tiles
  const fetchStoryTiles = useCallback(async (workspaceId) => {
    try {
      const response = await axios.get(`${API}/story-tiles/${workspaceId}`);
      setStoryTiles(response.data);
    } catch (error) {
      console.error("Error fetching story tiles:", error);
    }
  }, []);

  // Fetch storyboards
  const fetchStoryboards = useCallback(async (workspaceId) => {
    try {
      const response = await axios.get(`${API}/storyboards/${workspaceId}`);
      setStoryboards(response.data);
    } catch (error) {
      console.error("Error fetching storyboards:", error);
    }
  }, []);

  // Fetch chat messages
  const fetchChatMessages = useCallback(async (workspaceId) => {
    try {
      const response = await axios.get(`${API}/chat/${workspaceId}`);
      setChatMessages(response.data);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  }, []);

  // Fetch chat settings
  const fetchChatSettings = useCallback(async (workspaceId) => {
    try {
      const response = await axios.get(`${API}/chat-settings/${workspaceId}`);
      setChatSettings(response.data);
    } catch (error) {
      console.error("Error fetching chat settings:", error);
      setChatSettings({ context: "", response_style: "" });
    }
  }, []);

  // Update chat settings
  const updateChatSettings = async (settings) => {
    if (!currentWorkspace) return;
    
    try {
      setLoading(true);
      const response = await axios.put(`${API}/chat-settings/${currentWorkspace.id}`, settings);
      setChatSettings(response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating chat settings:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create workspace
  const createWorkspace = async (name, description = "") => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/workspaces`, { name, description });
      setWorkspaces([...workspaces, response.data]);
      setCurrentWorkspace(response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating workspace:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const uploadFile = async (file) => {
    if (!currentWorkspace) return null;
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspace_id", currentWorkspace.id);
      
      const response = await axios.post(`${API}/datasets/upload`, formData);
      const newDataset = response.data.dataset;
      setDatasets([...datasets, newDataset]);
      setSelectedDataset(newDataset);
      setDataProfile(response.data.profile);
      return response.data;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Import Google Sheets
  const importGoogleSheet = async (url) => {
    if (!currentWorkspace) return null;
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("url", url);
      formData.append("workspace_id", currentWorkspace.id);
      
      const response = await axios.post(`${API}/datasets/google-sheets`, formData);
      const newDataset = response.data.dataset;
      setDatasets([...datasets, newDataset]);
      setSelectedDataset(newDataset);
      setDataProfile(response.data.profile);
      return response.data;
    } catch (error) {
      console.error("Error importing Google Sheet:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create story tile from message
  const createStoryTile = async (messageId) => {
    if (!currentWorkspace) return null;
    
    try {
      const formData = new FormData();
      formData.append("workspace_id", currentWorkspace.id);
      formData.append("message_id", messageId);
      
      const response = await axios.post(`${API}/story-tiles/from-message`, formData);
      setStoryTiles([...storyTiles, response.data]);
      return response.data;
    } catch (error) {
      console.error("Error creating story tile:", error);
      throw error;
    }
  };

  // Generate storyboard
  const generateStoryboard = async (title = "Data Actions") => {
    if (!currentWorkspace) return null;
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("workspace_id", currentWorkspace.id);
      formData.append("title", title);
      
      const response = await axios.post(`${API}/storyboards/generate`, formData);
      setStoryboards([...storyboards, response.data]);
      return response.data;
    } catch (error) {
      console.error("Error generating storyboard:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete story tile (pinned insight)
  const deleteStoryTile = async (tileId) => {
    try {
      await axios.delete(`${API}/story-tiles/${tileId}`);
      setStoryTiles(storyTiles.filter(tile => tile.id !== tileId));
      return true;
    } catch (error) {
      console.error("Error deleting story tile:", error);
      throw error;
    }
  };

  // Delete storyboard
  const deleteStoryboard = async (storyboardId) => {
    try {
      await axios.delete(`${API}/storyboards/${storyboardId}`);
      setStoryboards(storyboards.filter(sb => sb.id !== storyboardId));
      return true;
    } catch (error) {
      console.error("Error deleting storyboard:", error);
      throw error;
    }
  };

  // Update storyboard
  const updateStoryboard = async (storyboardId, updates) => {
    try {
      const response = await axios.put(`${API}/storyboards/${storyboardId}`, updates);
      setStoryboards(storyboards.map(sb => 
        sb.id === storyboardId ? response.data : sb
      ));
      return response.data;
    } catch (error) {
      console.error("Error updating storyboard:", error);
      throw error;
    }
  };

  // Export storyboard
  const exportStoryboard = async (storyboardId, format) => {
    try {
      const response = await axios.post(
        `${API}/export/${format}/${storyboardId}`,
        {},
        { responseType: "blob" }
      );
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `storyboard.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting storyboard:", error);
      throw error;
    }
  };

  // Handle workspace deleted
  const handleWorkspaceDeleted = (workspaceId) => {
    const newWorkspaces = workspaces.filter(ws => ws.id !== workspaceId);
    setWorkspaces(newWorkspaces);
    if (currentWorkspace?.id === workspaceId) {
      setCurrentWorkspace(newWorkspaces[0] || null);
      setDatasets([]);
      setSelectedDataset(null);
      setDataProfile(null);
      setStoryTiles([]);
      setStoryboards([]);
      setChatMessages([]);
    }
  };

  // Handle workspace updated
  const handleWorkspaceUpdated = (updatedWorkspace) => {
    setWorkspaces(workspaces.map(ws => 
      ws.id === updatedWorkspace.id ? updatedWorkspace : ws
    ));
    if (currentWorkspace?.id === updatedWorkspace.id) {
      setCurrentWorkspace(updatedWorkspace);
    }
  };

  // Handle dataset deleted
  const handleDatasetDeleted = (datasetId) => {
    const newDatasets = datasets.filter(ds => ds.id !== datasetId);
    setDatasets(newDatasets);
    if (selectedDataset?.id === datasetId) {
      setSelectedDataset(newDatasets[0] || null);
      if (newDatasets.length === 0) {
        setDataProfile(null);
      }
    }
  };

  // Effects
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchDatasets(currentWorkspace.id);
      fetchStoryTiles(currentWorkspace.id);
      fetchStoryboards(currentWorkspace.id);
      fetchChatMessages(currentWorkspace.id);
      fetchChatSettings(currentWorkspace.id);
    }
  }, [currentWorkspace, fetchDatasets, fetchStoryTiles, fetchStoryboards, fetchChatMessages, fetchChatSettings]);

  useEffect(() => {
    if (selectedDataset) {
      fetchDataProfile(selectedDataset.id);
    }
  }, [selectedDataset, fetchDataProfile]);

  const navItems = [
    { id: "workspace", label: "Workspace", icon: Database },
    { id: "chat", label: "Analysis", icon: MessageSquare },
    { id: "storyboard", label: "Data Actions", icon: LayoutDashboard },
  ];

  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <Sidebar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        setCurrentWorkspace={setCurrentWorkspace}
        createWorkspace={createWorkspace}
        navItems={navItems}
        activeView={activeView}
        setActiveView={setActiveView}
        datasets={datasets}
        selectedDataset={selectedDataset}
        setSelectedDataset={setSelectedDataset}
        dataProfile={dataProfile}
        loading={loading}
        onWorkspaceDeleted={handleWorkspaceDeleted}
        onWorkspaceUpdated={handleWorkspaceUpdated}
        onDatasetDeleted={handleDatasetDeleted}
      />
      
      {/* Main Content */}
      <main className="main-content">
        {activeView === "workspace" && (
          <WorkspaceView
            workspace={currentWorkspace}
            datasets={datasets}
            selectedDataset={selectedDataset}
            setSelectedDataset={setSelectedDataset}
            dataProfile={dataProfile}
            uploadFile={uploadFile}
            importGoogleSheet={importGoogleSheet}
            loading={loading}
            onDatasetDeleted={handleDatasetDeleted}
          />
        )}
        
        {activeView === "chat" && (
          <div className="flex flex-col h-full">
            {/* Grid Panel - Top Half (when split view is active) */}
            {showGridSplit && selectedDataset && (
              <div className="h-1/2 border-b border-border">
                <DataGridView
                  dataset={selectedDataset}
                  workspace={currentWorkspace}
                  API={API}
                  onAnalysisComplete={(result) => {
                    fetchChatMessages(currentWorkspace.id);
                  }}
                />
              </div>
            )}
            
            {/* Chat Panel - Full or Bottom Half */}
            <div className={showGridSplit && selectedDataset ? "h-1/2" : "h-full"}>
              <ChatView
                workspace={currentWorkspace}
                selectedDataset={selectedDataset}
                createStoryTile={createStoryTile}
                API={API}
                chatMessages={chatMessages}
                setChatMessages={setChatMessages}
                chatSettings={chatSettings}
                updateChatSettings={updateChatSettings}
                loading={loading}
                showGridSplit={showGridSplit}
                setShowGridSplit={setShowGridSplit}
              />
            </div>
          </div>
        )}
        
        {activeView === "storyboard" && (
          <StoryboardView
            workspace={currentWorkspace}
            storyTiles={storyTiles}
            storyboards={storyboards}
            generateStoryboard={generateStoryboard}
            updateStoryboard={updateStoryboard}
            exportStoryboard={exportStoryboard}
            deleteStoryboard={deleteStoryboard}
            deleteStoryTile={deleteStoryTile}
            loading={loading}
          />
        )}
      </main>
      
      {/* Right Sidebar - Insights & Actions */}
      <RightSidebar
        workspace={currentWorkspace}
        storyTiles={storyTiles}
        storyboards={storyboards}
        generateStoryboard={generateStoryboard}
        deleteStoryTile={deleteStoryTile}
        API={API}
        loading={loading}
      />
      
      <Toaster position="bottom-right" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vishleshan-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
