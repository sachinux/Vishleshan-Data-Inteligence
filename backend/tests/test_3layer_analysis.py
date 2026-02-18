"""
Test suite for 3-Layer Analysis Architecture in Vishleshan App
Tests: Layer 1 (Business Intelligence), Layer 2 (AI Reasoning), Layer 3 (Runtime)
       Failure state handling, Alternative analysis methods
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_workspace(api_client):
    """Create a test workspace for the test session"""
    response = api_client.post(f"{BASE_URL}/api/workspaces", json={
        "name": "TEST_3Layer_Workspace",
        "description": "Test workspace for 3-layer analysis testing"
    })
    assert response.status_code == 200
    workspace = response.json()
    yield workspace
    # Cleanup
    api_client.delete(f"{BASE_URL}/api/workspaces/{workspace['id']}")

@pytest.fixture(scope="module")
def test_dataset(api_client, test_workspace):
    """Upload a test dataset"""
    import io
    
    # Create test CSV content
    csv_content = """name,age,salary,department,years_experience
Alice,30,75000,Engineering,5
Bob,35,85000,Engineering,8
Charlie,28,65000,Marketing,3
Diana,42,95000,Engineering,15
Eve,25,55000,Marketing,2
Frank,38,90000,Sales,10
Grace,32,78000,Engineering,7
Henry,45,110000,Sales,18
Ivy,29,62000,Marketing,4
Jack,33,82000,Engineering,6"""
    
    # Use a fresh session without Content-Type header for multipart
    upload_session = requests.Session()
    files = {'file': ('test_data.csv', io.StringIO(csv_content), 'text/csv')}
    data = {'workspace_id': test_workspace['id']}
    
    response = upload_session.post(
        f"{BASE_URL}/api/datasets/upload",
        files=files,
        data=data
    )
    assert response.status_code == 200, f"Upload failed: {response.text}"
    result = response.json()
    return result['dataset']


class TestChatEndpoint3LayerResponse:
    """Test /api/chat endpoint returns proper 3-layer structure"""
    
    def test_chat_returns_layer1_insight(self, api_client, test_workspace, test_dataset):
        """Layer 1 (Business Intelligence) should be present in response"""
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "workspace_id": test_workspace['id'],
            "message": "Show me average salary by department",
            "dataset_id": test_dataset['id']
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify layer1_insight exists
        assert "layer1_insight" in data, "layer1_insight field missing"
        layer1 = data["layer1_insight"]
        assert "summary" in layer1, "layer1_insight.summary missing"
        assert "recommendations" in layer1, "layer1_insight.recommendations missing"
        assert "key_findings" in layer1, "layer1_insight.key_findings missing"
    
    def test_chat_returns_layer2_reasoning(self, api_client, test_workspace, test_dataset):
        """Layer 2 (AI Reasoning) should be present in response"""
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "workspace_id": test_workspace['id'],
            "message": "What is the total salary?",
            "dataset_id": test_dataset['id']
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify layer2_reasoning exists
        assert "layer2_reasoning" in data, "layer2_reasoning field missing"
        layer2 = data["layer2_reasoning"]
        assert "methodology" in layer2, "layer2_reasoning.methodology missing"
        assert "steps" in layer2, "layer2_reasoning.steps missing"
        assert "data_quality_notes" in layer2, "layer2_reasoning.data_quality_notes missing"
    
    def test_chat_returns_layer3_runtime(self, api_client, test_workspace, test_dataset):
        """Layer 3 (Runtime) should be present in response"""
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "workspace_id": test_workspace['id'],
            "message": "Count employees by department",
            "dataset_id": test_dataset['id']
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify layer3_runtime exists
        assert "layer3_runtime" in data, "layer3_runtime field missing"
        layer3 = data["layer3_runtime"]
        assert "code" in layer3, "layer3_runtime.code missing"
        assert "execution_time_ms" in layer3, "layer3_runtime.execution_time_ms missing"
        assert "error_details" in layer3, "layer3_runtime.error_details missing"
        assert "stack_trace" in layer3, "layer3_runtime.stack_trace missing"
    
    def test_chat_returns_analysis_success_flag(self, api_client, test_workspace, test_dataset):
        """Response should include analysis_success boolean"""
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "workspace_id": test_workspace['id'],
            "message": "Show me the data",
            "dataset_id": test_dataset['id']
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "analysis_success" in data, "analysis_success field missing"
        assert isinstance(data["analysis_success"], bool), "analysis_success should be boolean"
    
    def test_chat_returns_analysis_method(self, api_client, test_workspace, test_dataset):
        """Response should include analysis_method field"""
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "workspace_id": test_workspace['id'],
            "message": "Describe the dataset",
            "dataset_id": test_dataset['id']
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "analysis_method" in data, "analysis_method field missing"
        assert data["analysis_method"] in ["auto", "statistical", "aggregation", "chart_only"]
    
    def test_confidence_score_present_on_success(self, api_client, test_workspace, test_dataset):
        """Confidence score should be present when analysis succeeds"""
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "workspace_id": test_workspace['id'],
            "message": "What is the average age?",
            "dataset_id": test_dataset['id']
        })
        assert response.status_code == 200
        data = response.json()
        
        # If analysis succeeded, confidence_score should be present
        if data.get("analysis_success", True):
            assert "confidence_score" in data, "confidence_score missing on successful analysis"
            if data["confidence_score"] is not None:
                assert 0 <= data["confidence_score"] <= 100, "confidence_score should be 0-100"


class TestAlternativeAnalysisEndpoint:
    """Test /api/chat/alternative endpoint with all 3 methods"""
    
    def test_statistical_method(self, api_client, test_workspace, test_dataset):
        """Statistical Summary method should work"""
        response = api_client.post(f"{BASE_URL}/api/chat/alternative", json={
            "workspace_id": test_workspace['id'],
            "dataset_id": test_dataset['id'],
            "method": "statistical"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["analysis_success"] == True
        assert data["analysis_method"] == "statistical"
        assert data["layer1_insight"]["summary"] is not None
        assert "numeric_stats" in str(data.get("table_data", {})) or "total_rows" in str(data.get("table_data", {}))
    
    def test_aggregation_method(self, api_client, test_workspace, test_dataset):
        """Simple Aggregation method should work"""
        response = api_client.post(f"{BASE_URL}/api/chat/alternative", json={
            "workspace_id": test_workspace['id'],
            "dataset_id": test_dataset['id'],
            "method": "aggregation"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["analysis_success"] == True
        assert data["analysis_method"] == "aggregation"
        assert data["layer1_insight"]["summary"] is not None
        # Should have aggregation results
        table_data = data.get("table_data", {})
        if table_data and table_data.get("data"):
            assert "sum" in str(table_data["data"]) or "mean" in str(table_data["data"])
    
    def test_chart_only_method(self, api_client, test_workspace, test_dataset):
        """Chart Only method should work"""
        response = api_client.post(f"{BASE_URL}/api/chat/alternative", json={
            "workspace_id": test_workspace['id'],
            "dataset_id": test_dataset['id'],
            "method": "chart_only"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["analysis_success"] == True
        assert data["analysis_method"] == "chart_only"
        # Should have chart config
        assert data.get("chart_config") is not None, "chart_config should be present for chart_only method"
        assert data["chart_config"].get("type") in ["bar", "scatter", "line", "pie"]
    
    def test_alternative_returns_3_layers(self, api_client, test_workspace, test_dataset):
        """Alternative analysis should also return 3-layer structure"""
        response = api_client.post(f"{BASE_URL}/api/chat/alternative", json={
            "workspace_id": test_workspace['id'],
            "dataset_id": test_dataset['id'],
            "method": "statistical"
        })
        assert response.status_code == 200
        data = response.json()
        
        # All 3 layers should be present
        assert "layer1_insight" in data
        assert "layer2_reasoning" in data
        assert "layer3_runtime" in data
    
    def test_alternative_with_invalid_dataset(self, api_client, test_workspace):
        """Should return 404 for non-existent dataset"""
        response = api_client.post(f"{BASE_URL}/api/chat/alternative", json={
            "workspace_id": test_workspace['id'],
            "dataset_id": "non-existent-dataset-id",
            "method": "statistical"
        })
        assert response.status_code == 404
        assert "not found" in response.json().get("detail", "").lower()
    
    def test_alternative_methods_list(self, api_client, test_workspace, test_dataset):
        """Alternative methods should be listed when analysis fails"""
        # This tests that the alternative_methods field is populated
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "workspace_id": test_workspace['id'],
            "message": "Show me data",
            "dataset_id": test_dataset['id']
        })
        assert response.status_code == 200
        data = response.json()
        
        # alternative_methods should be a list
        assert "alternative_methods" in data
        assert isinstance(data["alternative_methods"], list)


class TestFailureStateHandling:
    """Test failure state behavior"""
    
    def test_confidence_hidden_on_failure(self, api_client, test_workspace):
        """Confidence score should be None/hidden when analysis fails"""
        # Try to analyze without a dataset (should fail or return error)
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "workspace_id": test_workspace['id'],
            "message": "Analyze the data"
            # No dataset_id - may cause failure
        })
        assert response.status_code == 200
        data = response.json()
        
        # If analysis failed, confidence should be None
        if data.get("analysis_success") == False or data.get("error"):
            assert data.get("confidence_score") is None, "Confidence should be hidden on failure"
    
    def test_alternative_methods_provided_on_failure(self, api_client, test_workspace):
        """Alternative methods should be provided when analysis fails"""
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "workspace_id": test_workspace['id'],
            "message": "Run complex analysis"
            # No dataset - may cause issues
        })
        assert response.status_code == 200
        data = response.json()
        
        # If failed, should have alternative methods
        if data.get("analysis_success") == False:
            assert len(data.get("alternative_methods", [])) > 0, "Should provide alternative methods on failure"


class TestChatMessageModel:
    """Test ChatMessage model fields"""
    
    def test_all_3layer_fields_in_response(self, api_client, test_workspace, test_dataset):
        """All 3-layer fields should be present in ChatMessage response"""
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "workspace_id": test_workspace['id'],
            "message": "Show summary",
            "dataset_id": test_dataset['id']
        })
        assert response.status_code == 200
        data = response.json()
        
        # Required 3-layer fields
        required_fields = [
            "analysis_success",
            "analysis_method",
            "layer1_insight",
            "layer2_reasoning",
            "layer3_runtime",
            "confidence_score",
            "alternative_methods"
        ]
        
        for field in required_fields:
            assert field in data, f"Required field '{field}' missing from response"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
