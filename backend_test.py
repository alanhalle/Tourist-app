import requests
import sys
from datetime import datetime

class GoogleMapsAPITester:
    def __init__(self, base_url="https://custom-mapper.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, expected_data_checks=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json() if response.text else {}
            except:
                response_data = {}

            if success:
                # Additional data validation if provided
                if expected_data_checks and response_data:
                    for check_name, check_func in expected_data_checks.items():
                        try:
                            check_result = check_func(response_data)
                            if not check_result:
                                success = False
                                print(f"   ❌ Data validation failed: {check_name}")
                            else:
                                print(f"   ✅ Data validation passed: {check_name}")
                        except Exception as e:
                            success = False
                            print(f"   ❌ Data validation error: {check_name} - {str(e)}")

            if success:
                self.tests_passed += 1
                print(f"   ✅ Passed - Status: {response.status_code}")
            else:
                print(f"   ❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}...")

            self.test_results.append({
                'name': name,
                'success': success,
                'status_code': response.status_code,
                'expected_status': expected_status,
                'response_size': len(str(response_data)) if response_data else 0
            })

            return success, response_data

        except Exception as e:
            print(f"   ❌ Failed - Error: {str(e)}")
            self.test_results.append({
                'name': name,
                'success': False,
                'error': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "api/",
            200,
            {
                "has_message": lambda data: "message" in data and "Ilhéus" in data["message"]
            }
        )

    def test_layers_endpoint(self):
        """Test layers endpoint - should return 3 layers with correct data"""
        def validate_layers(data):
            if not isinstance(data, list):
                return False
            if len(data) != 3:
                print(f"     Expected 3 layers, got {len(data)}")
                return False
            
            expected_layers = {
                "restaurants": {"name": "Restaurantes", "color": "#FF6B6B"},
                "hotels": {"name": "Hotéis", "color": "#4ECDC4"},
                "tourist_sights": {"name": "Pontos Turísticos", "color": "#FFD93D"}
            }
            
            for layer in data:
                if layer["id"] not in expected_layers:
                    print(f"     Unexpected layer ID: {layer['id']}")
                    return False
                expected = expected_layers[layer["id"]]
                if layer["name"] != expected["name"]:
                    print(f"     Wrong name for {layer['id']}: expected {expected['name']}, got {layer['name']}")
                    return False
                if layer["color"] != expected["color"]:
                    print(f"     Wrong color for {layer['id']}: expected {expected['color']}, got {layer['color']}")
                    return False
                if not isinstance(layer["visible"], bool):
                    print(f"     Layer {layer['id']} visible field is not boolean")
                    return False
            
            print(f"     ✅ All 3 layers validated successfully")
            return True

        return self.run_test(
            "Layers Endpoint",
            "GET",
            "api/layers",
            200,
            {"validate_layers": validate_layers}
        )

    def test_markers_endpoint(self):
        """Test markers endpoint - should return 18 markers with coordinates"""
        def validate_markers(data):
            if not isinstance(data, list):
                return False
            if len(data) != 18:
                print(f"     Expected 18 markers, got {len(data)}")
                return False
            
            # Count markers by layer
            layer_counts = {"restaurants": 0, "hotels": 0, "tourist_sights": 0}
            
            for marker in data:
                # Check required fields
                required_fields = ["id", "name", "description", "lat", "lng", "layer_id"]
                for field in required_fields:
                    if field not in marker:
                        print(f"     Marker missing field: {field}")
                        return False
                
                # Check coordinate types and ranges (Ilhéus coordinates)
                if not isinstance(marker["lat"], (int, float)) or not isinstance(marker["lng"], (int, float)):
                    print(f"     Invalid coordinate types for marker {marker['name']}")
                    return False
                
                # Check if coordinates are in Ilhéus area (approximate bounds)
                if not (-15.0 <= marker["lat"] <= -14.5) or not (-39.5 <= marker["lng"] <= -38.5):
                    print(f"     Coordinates out of Ilhéus bounds for marker {marker['name']}: {marker['lat']}, {marker['lng']}")
                    return False
                
                # Count by layer
                if marker["layer_id"] in layer_counts:
                    layer_counts[marker["layer_id"]] += 1
            
            # Verify expected counts (5 restaurants, 5 hotels, 8 tourist sights)
            expected_counts = {"restaurants": 5, "hotels": 5, "tourist_sights": 8}
            for layer_id, expected_count in expected_counts.items():
                if layer_counts[layer_id] != expected_count:
                    print(f"     Wrong count for {layer_id}: expected {expected_count}, got {layer_counts[layer_id]}")
                    return False
            
            print(f"     ✅ All 18 markers validated successfully")
            print(f"     ✅ Layer distribution: {layer_counts}")
            return True

        return self.run_test(
            "Markers Endpoint",
            "GET",
            "api/markers",
            200,
            {"validate_markers": validate_markers}
        )

    def test_markers_by_layer(self):
        """Test markers by layer endpoint"""
        success_count = 0
        
        # Test each layer
        layer_ids = ["restaurants", "hotels", "tourist_sights"]
        expected_counts = {"restaurants": 5, "hotels": 5, "tourist_sights": 8}
        
        for layer_id in layer_ids:
            def validate_layer_markers(data, expected_count=expected_counts[layer_id], layer=layer_id):
                if not isinstance(data, list):
                    return False
                if len(data) != expected_count:
                    print(f"     Expected {expected_count} markers for {layer}, got {len(data)}")
                    return False
                
                # Check all markers belong to this layer
                for marker in data:
                    if marker["layer_id"] != layer:
                        print(f"     Marker {marker['name']} has wrong layer_id: {marker['layer_id']}")
                        return False
                
                print(f"     ✅ {expected_count} markers for {layer} validated")
                return True

            success, _ = self.run_test(
                f"Markers by Layer - {layer_id}",
                "GET",
                f"api/markers/layer/{layer_id}",
                200,
                {"validate_layer_markers": lambda data, l=layer_id: validate_layer_markers(data, expected_counts[l], l)}
            )
            if success:
                success_count += 1
        
        return success_count == len(layer_ids)

def main():
    print("🗺️  Google Maps API Testing for Ilhéus Interactive Map")
    print("=" * 60)
    
    # Setup
    tester = GoogleMapsAPITester()
    
    # Run tests
    print("\n📡 Testing Backend API Endpoints...")
    
    # Test root endpoint
    tester.test_root_endpoint()
    
    # Test layers endpoint
    tester.test_layers_endpoint()
    
    # Test markers endpoint  
    tester.test_markers_endpoint()
    
    # Test markers by layer
    tester.test_markers_by_layer()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend API tests passed!")
        return 0
    else:
        print("❌ Some backend API tests failed!")
        print("\nFailed tests:")
        for result in tester.test_results:
            if not result['success']:
                print(f"  - {result['name']}")
        return 1

if __name__ == "__main__":
    sys.exit(main())