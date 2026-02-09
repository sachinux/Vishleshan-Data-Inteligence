import requests
import sys
import json
import io
from datetime import datetime

class DataStorytellerAPITester:
    def __init__(self, base_url="https://dataviz-studio-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.workspace_id = None
        self.dataset_id = None
        self.message_id = None
        self.story_tile_id = None
        self.storyboard_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_create_workspace(self):
        """Test workspace creation"""
        workspace_data = {
            "name": f"Test Workspace {datetime.now().strftime('%H%M%S')}",
            "description": "Test workspace for API testing"
        }
        
        success, response = self.run_test(
            "Create Workspace",
            "POST",
            "workspaces",
            200,
            data=workspace_data
        )
        
        if success and 'id' in response:
            self.workspace_id = response['id']
            print(f"   Created workspace ID: {self.workspace_id}")
        
        return success

    def test_get_workspaces(self):
        """Test getting workspaces"""
        success, response = self.run_test(
            "Get Workspaces",
            "GET",
            "workspaces",
            200
        )
        
        if success:
            print(f"   Found {len(response)} workspaces")
        
        return success

    def test_get_workspace_by_id(self):
        """Test getting specific workspace"""
        if not self.workspace_id:
            print("❌ Skipped - No workspace ID available")
            return False
            
        success, response = self.run_test(
            "Get Workspace by ID",
            "GET",
            f"workspaces/{self.workspace_id}",
            200
        )
        return success

    def test_upload_csv_dataset(self):
        """Test CSV file upload"""
        if not self.workspace_id:
            print("❌ Skipped - No workspace ID available")
            return False

        # Create a simple CSV content
        csv_content = """name,age,city,salary
John Doe,30,New York,75000
Jane Smith,25,Los Angeles,65000
Bob Johnson,35,Chicago,80000
Alice Brown,28,Houston,70000
Charlie Wilson,32,Phoenix,72000"""

        csv_file = io.StringIO(csv_content)
        
        files = {
            'file': ('test_data.csv', csv_content, 'text/csv')
        }
        data = {
            'workspace_id': self.workspace_id
        }
        
        success, response = self.run_test(
            "Upload CSV Dataset",
            "POST",
            "datasets/upload",
            200,
            data=data,
            files=files
        )
        
        if success and 'dataset' in response:
            self.dataset_id = response['dataset']['id']
            print(f"   Created dataset ID: {self.dataset_id}")
            print(f"   Rows: {response['dataset']['row_count']}")
            print(f"   Columns: {response['dataset']['column_count']}")
            
            # Check if profile is included
            if 'profile' in response:
                print(f"   Profile columns: {len(response['profile']['columns'])}")
        
        return success

    def test_get_datasets(self):
        """Test getting datasets for workspace"""
        if not self.workspace_id:
            print("❌ Skipped - No workspace ID available")
            return False
            
        success, response = self.run_test(
            "Get Datasets",
            "GET",
            f"datasets/{self.workspace_id}",
            200
        )
        
        if success:
            print(f"   Found {len(response)} datasets")
        
        return success

    def test_get_dataset_profile(self):
        """Test getting dataset profile"""
        if not self.dataset_id:
            print("❌ Skipped - No dataset ID available")
            return False
            
        success, response = self.run_test(
            "Get Dataset Profile",
            "GET",
            f"datasets/{self.dataset_id}/profile",
            200
        )
        
        if success:
            print(f"   Columns profiled: {len(response.get('columns', []))}")
            print(f"   Memory usage: {response.get('memory_usage', 'N/A')}")
        
        return success

    def test_dataset_preview(self):
        """Test dataset preview"""
        if not self.dataset_id:
            print("❌ Skipped - No dataset ID available")
            return False
            
        success, response = self.run_test(
            "Dataset Preview",
            "GET",
            f"datasets/{self.dataset_id}/preview?rows=5",
            200
        )
        
        if success:
            print(f"   Preview rows: {len(response.get('data', []))}")
            print(f"   Total rows: {response.get('total_rows', 'N/A')}")
        
        return success

    def test_chat_query(self):
        """Test chat functionality"""
        if not self.workspace_id or not self.dataset_id:
            print("❌ Skipped - No workspace or dataset ID available")
            return False

        chat_data = {
            "workspace_id": self.workspace_id,
            "message": "What is the average salary by city?",
            "dataset_id": self.dataset_id
        }
        
        success, response = self.run_test(
            "Chat Query",
            "POST",
            "chat",
            200,
            data=chat_data
        )
        
        if success and 'id' in response:
            self.message_id = response['id']
            print(f"   Message ID: {self.message_id}")
            print(f"   Response content: {response.get('content', '')[:100]}...")
            if response.get('table_data'):
                print(f"   Has table data: Yes")
            if response.get('chart_config'):
                print(f"   Has chart config: Yes")
        
        return success

    def test_get_chat_history(self):
        """Test getting chat history"""
        if not self.workspace_id:
            print("❌ Skipped - No workspace ID available")
            return False
            
        success, response = self.run_test(
            "Get Chat History",
            "GET",
            f"chat/{self.workspace_id}",
            200
        )
        
        if success:
            print(f"   Chat messages: {len(response)}")
        
        return success

    def test_create_story_tile_from_message(self):
        """Test creating story tile from chat message"""
        if not self.workspace_id or not self.message_id:
            print("❌ Skipped - No workspace or message ID available")
            return False

        # Use form data for this endpoint
        url = f"{self.api_url}/story-tiles/from-message"
        data = {
            'workspace_id': self.workspace_id,
            'message_id': self.message_id
        }
        
        self.tests_run += 1
        print(f"\n🔍 Testing Create Story Tile from Message...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, data=data)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                if 'id' in response_data:
                    self.story_tile_id = response_data['id']
                    print(f"   Story tile ID: {self.story_tile_id}")
                    print(f"   Title: {response_data.get('title', 'N/A')}")
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_get_story_tiles(self):
        """Test getting story tiles"""
        if not self.workspace_id:
            print("❌ Skipped - No workspace ID available")
            return False
            
        success, response = self.run_test(
            "Get Story Tiles",
            "GET",
            f"story-tiles/{self.workspace_id}",
            200
        )
        
        if success:
            print(f"   Story tiles: {len(response)}")
        
        return success

    def test_generate_storyboard(self):
        """Test generating storyboard"""
        if not self.workspace_id:
            print("❌ Skipped - No workspace ID available")
            return False

        # Use form data for this endpoint
        url = f"{self.api_url}/storyboards/generate"
        data = {
            'workspace_id': self.workspace_id,
            'title': 'Test Data Story'
        }
        
        self.tests_run += 1
        print(f"\n🔍 Testing Generate Storyboard...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, data=data)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                if 'id' in response_data:
                    self.storyboard_id = response_data['id']
                    print(f"   Storyboard ID: {self.storyboard_id}")
                    print(f"   Frames: {len(response_data.get('frames', []))}")
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_get_storyboards(self):
        """Test getting storyboards"""
        if not self.workspace_id:
            print("❌ Skipped - No workspace ID available")
            return False
            
        success, response = self.run_test(
            "Get Storyboards",
            "GET",
            f"storyboards/{self.workspace_id}",
            200
        )
        
        if success:
            print(f"   Storyboards: {len(response)}")
        
        return success

    def test_export_pdf(self):
        """Test PDF export"""
        if not self.storyboard_id:
            print("❌ Skipped - No storyboard ID available")
            return False
            
        success, response = self.run_test(
            "Export PDF",
            "POST",
            f"export/pdf/{self.storyboard_id}",
            200
        )
        
        if success:
            print(f"   PDF export successful")
        
        return success

    def test_export_pptx(self):
        """Test PPTX export"""
        if not self.storyboard_id:
            print("❌ Skipped - No storyboard ID available")
            return False
            
        success, response = self.run_test(
            "Export PPTX",
            "POST",
            f"export/pptx/{self.storyboard_id}",
            200
        )
        
        if success:
            print(f"   PPTX export successful")
        
        return success

def main():
    print("🚀 Starting Data Storyteller Studio API Tests")
    print("=" * 60)
    
    tester = DataStorytellerAPITester()
    
    # Run all tests in sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_create_workspace,
        tester.test_get_workspaces,
        tester.test_get_workspace_by_id,
        tester.test_upload_csv_dataset,
        tester.test_get_datasets,
        tester.test_get_dataset_profile,
        tester.test_dataset_preview,
        tester.test_chat_query,
        tester.test_get_chat_history,
        tester.test_create_story_tile_from_message,
        tester.test_get_story_tiles,
        tester.test_generate_storyboard,
        tester.test_get_storyboards,
        tester.test_export_pdf,
        tester.test_export_pptx,
    ]
    
    print(f"\n📋 Running {len(tests)} API tests...")
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())