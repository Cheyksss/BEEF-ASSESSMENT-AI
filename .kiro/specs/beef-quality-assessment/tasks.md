# Implementation Plan: Beef Quality Assessment System

## Overview

This implementation plan guides the development of a production web application for automated beef quality evaluation. The system consists of a Next.js/TypeScript frontend for user interaction, a FastAPI/Python backend for ML inference using pre-trained ReXNet-150 models and HSV-based computer vision, and Supabase for authentication, database, and storage. The implementation follows a staged approach: backend infrastructure and ML pipeline first, then frontend components, followed by integration and testing.

## Tasks

- [x] 1. Set up backend project structure and environment
  - Create FastAPI project directory structure (app/, tests/, config/)
  - Initialize Python virtual environment and install core dependencies (fastapi, uvicorn, python-multipart, python-dotenv)
  - Install ML dependencies (torch, timm, opencv-python, rembg, numpy, pillow)
  - Install Supabase Python client
  - Create .env.example with required environment variables (FRESHNESS_MODEL_PATH, MARBLING_MODEL_PATH, SUPABASE_URL, SUPABASE_SERVICE_KEY, FRONTEND_URL)
  - Set up pytest with Hypothesis for property-based testing
  - _Requirements: 3.1, 3.2, 16.1, 16.2, 17.1_

- [x] 2. Implement model loading and initialization module
  - [x] 2.1 Create ModelManager class for singleton model management
    - Implement device selection logic (CUDA if available, otherwise CPU)
    - Implement freshness model initialization using timm.create_model("rexnet_150", pretrained=False, num_classes=2)
    - Implement marbling model initialization using timm.create_model("rexnet_150", pretrained=False, num_classes=5)
    - Load state_dict from rexnet150_freshness_best.pth into freshness model
    - Load state_dict from rexnet150_marbling_best.pth into marbling model
    - Set both models to evaluation mode
    - Move both models to selected device
    - Implement error handling that logs and exits on failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 2.2 Write unit tests for model loading
    - Test successful model loading
    - Test device selection (CUDA vs CPU)
    - Test evaluation mode setting
    - Test error handling for missing model files
    - _Requirements: 17.1_

- [x] 3. Implement image preprocessing module
  - [x] 3.1 Create ImagePreprocessor class
    - Implement 224x224 resize with ImageNet normalization for classifiers
    - Implement tensor conversion with proper normalization (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    - Implement batch dimension addition
    - Implement device transfer
    - Implement 800x800 resize method for fat estimation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 3.2 Write unit tests for preprocessing
    - Test image resize to 224x224
    - Test tensor shape (batch dimension present)
    - Test normalization values
    - Test 800x800 resize for fat estimation
    - _Requirements: 17.1_

- [x] 4. Implement core scoring and mapping functions
  - [x] 4.1 Create freshness classification mapper
    - Implement map_freshness_class(class_idx) function
    - Map class 0 → ("Fresh", 50 points)
    - Map class 1 → ("Spoiled", 0 points)
    - Return dictionary with label, score, and confidence
    - _Requirements: 5.4, 5.5, 5.6_

  - [x] 4.2 Create marbling classification mapper
    - Implement map_marbling_class(class_idx) function
    - Map class 0 → ("small", 10 points)
    - Map class 1 → ("modest", 20 points)
    - Map class 2 → ("moderate", 25 points)
    - Map class 3 → ("slight", 15 points)
    - Map class 4 → ("slightly_abundant", 30 points)
    - Return dictionary with label, score, and confidence
    - _Requirements: 6.4, 6.5_

  - [x] 4.3 Create fat ratio calculation and categorization functions
    - Implement calculate_fat_ratio(fat_pixels, meat_pixels) function returning percentage rounded to 2 decimals
    - Implement categorize_fat_ratio(ratio) function with thresholds: <1.0="None", 1.0-14.99="Small", >=15.0="Large"
    - Handle zero meat_pixels edge case (return 0.0)
    - _Requirements: 7.9, 7.10, 7.11, 7.12, 7.13_

  - [x] 4.4 Create MQS calculator
    - Implement calculate_mqs(freshness_score, marbling_score, fat_ratio) function
    - Apply formula: MQS = f_freshness + m_grade + min(r_fat, 20)
    - Enforce spoiled constraint: if freshness_score == 0, cap MQS at 50
    - Round result to 1 decimal place
    - Validate range [0.0, 100.0]
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

  - [x] 4.5 Write property test for freshness mapping (Property 1)
    - **Property 1: Freshness Classification Mapping**
    - **Validates: Requirements 5.4, 5.5, 5.6**
    - Use Hypothesis to generate class indices 0 and 1
    - Assert correct label and score for each class
    - _Requirements: 17.1_

  - [x] 4.6 Write property test for marbling mapping (Property 2)
    - **Property 2: Marbling Classification Mapping**
    - **Validates: Requirements 6.4, 6.5**
    - Use Hypothesis to generate class indices 0-4
    - Assert correct label and score mapping for all classes
    - _Requirements: 17.1_

  - [x] 4.7 Write property test for confidence conversion (Property 3)
    - **Property 3: Confidence Percentage Conversion**
    - **Validates: Requirements 5.7, 6.6**
    - Use Hypothesis to generate floats in [0.0, 1.0]
    - Assert converted percentage is in [0.0, 100.0] and equals input * 100
    - _Requirements: 17.1_

  - [x] 4.8 Write property test for fat ratio calculation (Property 4)
    - **Property 4: Fat Ratio Calculation**
    - **Validates: Requirements 7.9, 7.13**
    - Use Hypothesis to generate fat_pixels and meat_pixels (>0)
    - Assert ratio equals (fat_pixels / meat_pixels * 100) rounded to 2 decimals
    - Assert ratio is in [0.0, 100.0]
    - _Requirements: 17.1, 17.4_

  - [x] 4.9 Write property test for fat categorization (Property 5)
    - **Property 5: Fat Ratio Categorization**
    - **Validates: Requirements 7.10, 7.11, 7.12**
    - Use Hypothesis to generate fat ratios [0.0, 100.0]
    - Assert correct category for all boundary conditions
    - _Requirements: 17.1_

  - [x] 4.10 Write property test for MQS calculation (Property 6)
    - **Property 6: MQS Calculation and Range Validation**
    - **Validates: Requirements 8.1, 8.2, 8.4, 8.6, 17.7**
    - Use Hypothesis to generate valid score combinations
    - Assert MQS equals formula with fat capped at 20
    - Assert result is in [0.0, 100.0]
    - _Requirements: 17.1, 17.5_

  - [x] 4.11 Write property test for spoiled constraint (Property 7)
    - **Property 7: MQS Spoiled Beef Constraint**
    - **Validates: Requirements 8.3**
    - Use Hypothesis to generate marbling and fat scores with freshness=0
    - Assert MQS never exceeds 50.0
    - _Requirements: 17.1_

- [x] 5. Implement freshness inference module
  - [x] 5.1 Create FreshnessPredictor class
    - Implement predict(model, tensor, device) method
    - Use torch.inference_mode() context
    - Compute softmax probabilities from model logits
    - Extract max probability and class index
    - Convert confidence to percentage
    - Call map_freshness_class for label and score
    - Return result dictionary
    - _Requirements: 5.1, 5.2, 5.3, 4.7_

  - [x] 5.2 Write unit tests for freshness prediction
    - Test inference with mock model outputs
    - Test softmax probability computation
    - Test confidence extraction
    - _Requirements: 17.2_

- [x] 6. Implement marbling inference module
  - [x] 6.1 Create MarblingPredictor class
    - Implement predict(model, tensor, device) method
    - Use torch.inference_mode() context
    - Compute softmax probabilities from model logits
    - Extract max probability and class index
    - Convert confidence to percentage
    - Call map_marbling_class for label and score
    - Return result dictionary
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.2 Write unit tests for marbling prediction
    - Test inference with mock model outputs
    - Test softmax probability computation
    - Test confidence extraction
    - _Requirements: 17.3_

- [x] 7. Implement HSV-based fat ratio estimator
  - [x] 7.1 Create FatRatioEstimator class
    - Implement estimate(image) method that accepts PIL Image
    - Resize image to 800x800
    - Remove background using rembg library
    - Create meat mask from alpha channel with threshold 127
    - Apply morphological closing with 7x7 ellipse kernel
    - Apply morphological opening with 7x7 ellipse kernel
    - Extract meat region using mask
    - Convert meat region to HSV color space
    - Detect fat pixels using HSV range [0,0,120] to [180,120,255]
    - Count meat and fat pixels
    - Call calculate_fat_ratio and categorize_fat_ratio
    - Return dictionary with percent, category, and score (capped at 20)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8.2_

  - [x] 7.2 Write unit tests for HSV fat estimation
    - Test with synthetic images (known fat/meat ratios)
    - Test zero meat pixels edge case
    - Test fat score capping at 20 points
    - _Requirements: 17.4_

- [x] 8. Checkpoint - Core ML pipeline validation
  - Run all unit tests and property tests
  - Verify all 8 correctness properties pass with 100+ iterations
  - Run all tests. Fix implementation issues found during testing. Continue until the checkpoint criteria pass.

- [x] 9. Implement Supabase integration service
  - [x] 9.1 Create SupabaseService class
    - Initialize Supabase client with environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY)
    - Implement verify_token(token) method using Supabase auth.get_user()
    - Implement upload_image(user_id, image_bytes) method with UUID filename generation
    - Organize uploads in user_id folder structure
    - Return signed URL with expiration time for secure access
    - Implement store_assessment() method to insert records into assessments table
    - Include all assessment fields (user_id, image_url, freshness, marbling, fat_ratio, mqs, etc.)
    - Return assessment_id from inserted record
    - _Requirements: 9.3, 9.4, 9.5, 12.1, 12.2, 13.1, 13.2, 13.3, 13.4_

  - [x] 9.2 Write integration tests for Supabase service
    - Test token verification (valid and invalid tokens)
    - Test image upload and URL generation
    - Test assessment record insertion
    - Test Row Level Security enforcement
    - _Requirements: 17.1_

- [x] 10. Implement main prediction pipeline endpoint
  - [x] 10.1 Create POST /predict endpoint in FastAPI
    - Accept multipart/form-data with "file" field
    - Accept Authorization header with Bearer token
    - Validate token presence and format (must start with "Bearer ")
    - Call SupabaseService.verify_token() to get user_id
    - Load image bytes and convert to PIL Image (RGB mode)
    - Validate image format and size (max 10MB)
    - Preprocess image to 224x224 tensor (reuse for both classifiers)
    - Call FreshnessPredictor.predict() with freshness model
    - Call MarblingPredictor.predict() with marbling model (reuse same tensor)
    - Resize original image to 800x800 for fat estimation
    - Call FatRatioEstimator.estimate() for fat analysis
    - Call calculate_mqs() with all three scores
    - Upload image to Supabase Storage
    - Store assessment record in database
    - Format and return JSON response with all metrics
    - Return HTTP 200 on success
    - Return HTTP 400 for invalid images
    - Return HTTP 401 for authentication failures
    - Return HTTP 500 for internal errors
    - Log all errors with context
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 15.5_

  - [x] 10.2 Create GET /health endpoint
    - Return status and models_loaded flag
    - _Requirements: 9.1_

  - [x] 10.3 Write property test for response schema (Property 8)
    - **Property 8: Prediction Response Schema Completeness**
    - **Validates: Requirements 9.7, 17.8**
    - Use Hypothesis to generate valid score combinations
    - Format mock prediction response
    - Assert all required fields present with correct types
    - Assert all values in valid ranges
    - _Requirements: 17.8_

  - [x] 10.4 Write integration tests for prediction endpoint
    - Test full prediction pipeline with real models and test images
    - Test with fresh beef image fixture
    - Test with spoiled beef image fixture
    - Test authentication error scenarios
    - Test invalid image format handling
    - Test file size limit enforcement
    - Verify MQS is always between 0 and 100
    - _Requirements: 17.1, 17.7_

- [x] 11. Configure CORS and application startup
  - [x] 11.1 Set up FastAPI application with lifespan events
    - Create lifespan context manager for model loading
    - Load models on application startup
    - Add CORS middleware with allowed origins from environment
    - Allow POST and GET methods
    - Allow Content-Type and Authorization headers
    - Configure allowed origins: localhost:3000 for dev, FRONTEND_URL env var for production
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 3.1, 3.2_

  - [x] 11.2 Write startup tests
    - Test lifespan context model loading
    - Test CORS configuration
    - _Requirements: 17.1_

- [x] 12. Checkpoint - Backend completion
  - Run full test suite (unit, property, integration)
  - Test /predict endpoint manually with Postman/curl
  - Verify models load correctly on startup
  - Test with various beef images
  - Run all tests. Fix implementation issues found during testing. Continue until the checkpoint criteria pass.

- [x] 13. Set up frontend project structure
  - Create Next.js 14+ project with TypeScript and App Router
  - Install dependencies: React 18+, Tailwind CSS, shadcn/ui components, Supabase JS client
  - Configure Tailwind with custom color scheme for quality indicators
  - Set up environment variables (.env.local): NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Create project structure: app/, components/, lib/, types/, hooks/
  - Define TypeScript types (User, Session, PredictionResponse, Assessment, AnalyticsData)
  - _Requirements: 16.3, 16.4_

- [x] 14. Implement authentication context and components
  - [x] 14.1 Create AuthContext provider
    - Initialize Supabase client
    - Manage user and session state
    - Implement signUp(email, password) method
    - Implement signIn(email, password) method
    - Implement signOut() method
    - Implement getAccessToken() method
    - Handle session persistence and refresh
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 14.2 Create LoginPage component
    - Build email/password form with validation
    - Display authentication errors
    - Redirect to dashboard on successful login
    - _Requirements: 1.1, 1.2_

  - [x] 14.3 Create ProtectedRoute guard component
    - Check session validity
    - Redirect to login if unauthenticated
    - Render children if authenticated
    - _Requirements: 1.5_

  - [~] 14.4 Write component tests for authentication
    - Test AuthProvider state management
    - Test login form validation
    - Test ProtectedRoute redirection
    - _Requirements: 17.1_

- [x] 15. Implement image input components
  - [x] 15.1 Create ImageUploadWidget component
    - Build drag-and-drop zone
    - Add file picker button
    - Validate file format (JPEG, PNG only)
    - Validate file size (max 10MB)
    - Display image preview
    - Implement clear/reset functionality
    - Show error messages for invalid files
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 15.2_

  - [x] 15.2 Create CameraCaptureWidget component
    - Request camera permissions
    - Display live video stream preview
    - Implement capture button
    - Support device selection (front/back camera)
    - Fallback to file upload if camera unavailable
    - _Requirements: 2.2, 2.3_

  - [~] 15.3 Write component tests for image input
    - Test file upload with valid images
    - Test file size validation
    - Test format validation
    - Test image preview display
    - _Requirements: 17.1_

- [x] 16. Implement API client module
  - [x] 16.1 Create API client with authentication
    - Create HTTP client wrapper using fetch
    - Implement predictBeefQuality(file, accessToken) function
    - Send multipart/form-data with Authorization header
    - Handle network errors with retry logic (3 attempts, exponential backoff)
    - Parse and validate response JSON
    - Implement proper error handling for 400, 401, 500 responses
    - _Requirements: 2.6, 9.1, 9.2, 15.1_

  - [~] 16.2 Write unit tests for API client
    - Test request formatting
    - Test error handling
    - Test retry logic
    - _Requirements: 17.1_

- [x] 17. Implement results display component
  - [x] 17.1 Create ResultsDisplay component
    - Display MQS with large prominent badge
    - Implement color gradient: 0-50 red, 51-75 yellow, 76-100 green
    - Show freshness status with icon and confidence bar
    - Show marbling grade with icon and confidence bar
    - Show fat ratio gauge with category badge
    - Display original image thumbnail
    - Show assessment timestamp
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [~] 17.2 Write component tests for results display
    - Test MQS color coding for different score ranges
    - Test all metric displays
    - Test image rendering
    - _Requirements: 17.1_

- [x] 18. Implement assessment page and workflow
  - [x] 18.1 Create AssessmentPage component
    - Integrate ImageUploadWidget and CameraCaptureWidget
    - Manage state: selectedImage, isProcessing, results, error
    - Implement handleImageSubmit() to call API
    - Show loading state during processing
    - Display ResultsDisplay on success
    - Show error messages on failure
    - Implement handleReset() to start new assessment
    - Provide retry option for failed operations
    - _Requirements: 2.1, 2.2, 2.6, 11.1, 15.1, 15.2, 15.3, 15.4_

  - [~] 18.2 Write integration tests for assessment flow
    - Test complete workflow from upload to results
    - Test error handling scenarios
    - _Requirements: 17.1_

- [~] 19. Checkpoint - Core assessment flow
  - Test complete user journey: login → upload → assess → view results
  - Test with multiple beef images
  - Verify error handling and retry logic
  - Run all tests. Fix implementation issues found during testing. Continue until the checkpoint criteria pass.

- [x] 20. Implement Supabase database queries for history
  - [x] 20.1 Create database query functions
    - Implement fetchUserAssessments(userId) to query assessments table
    - Sort by created_at DESC
    - Implement fetchAssessmentById(assessmentId) for detail view
    - Handle query errors gracefully
    - _Requirements: 12.3, 12.4, 12.5, 12.6_

  - [~] 20.2 Write integration tests for database queries
    - Test assessment retrieval
    - Test Row Level Security isolation
    - _Requirements: 17.1_

- [x] 21. Implement history components
  - [x] 21.1 Create HistoryPage component
    - Fetch assessments from Supabase on mount
    - Display loading state during fetch
    - Handle empty state (no assessments)
    - Implement HistoryTable with assessments data
    - Handle row click to navigate to detail view
    - _Requirements: 12.3, 12.4, 12.5_

  - [x] 21.2 Create HistoryTable component
    - Display columns: thumbnail, date/time, MQS, freshness, marbling, fat ratio
    - Implement sorting by date
    - Add view and delete actions
    - Style with Tailwind and shadcn/ui components
    - _Requirements: 12.3, 12.4_

  - [x] 21.3 Create AssessmentDetailPage component
    - Fetch specific assessment by ID from route params
    - Display full ResultsDisplay with all metrics
    - Show large image view
    - Add back to history navigation
    - _Requirements: 12.5_

  - [~] 21.4 Write component tests for history
    - Test HistoryPage rendering with mock data
    - Test empty state
    - Test navigation to detail view
    - _Requirements: 17.1_

- [x] 22. Implement dashboard analytics
  - [x] 22.1 Create analytics aggregation functions
    - Implement calculateTotalAssessments(assessments)
    - Implement calculateAverageMQS(assessments)
    - Implement calculateFreshnessDistribution(assessments)
    - Implement calculateMarblingDistribution(assessments)
    - _Requirements: 14.2, 14.3, 14.4, 14.5_

  - [x] 22.2 Create DashboardPage component
    - Fetch all user assessments from Supabase
    - Calculate analytics using aggregation functions
    - Display AnalyticsCards with summary metrics
    - Display DistributionCharts with visualizations
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 22.3 Create AnalyticsCards component
    - Display total assessments count
    - Display average MQS
    - Display fresh vs spoiled ratio
    - Display most common marbling grade
    - _Requirements: 14.2, 14.3, 14.4, 14.5_

  - [x] 22.4 Create DistributionCharts component
    - Implement pie chart for freshness distribution
    - Implement bar chart for marbling grade distribution
    - Use recharts or chart.js library
    - _Requirements: 14.4, 14.5_

  - [~] 22.5 Write component tests for dashboard
    - Test analytics calculations
    - Test chart rendering with mock data
    - _Requirements: 17.1_

- [x] 23. Implement navigation and layout
  - [x] 23.1 Create app layout component
    - Build navigation bar with links (Dashboard, Assess, History)
    - Add user profile menu with logout
    - Display current user email
    - Make responsive for mobile and desktop
    - _Requirements: 1.5_

  - [x] 23.2 Set up routing structure
    - Configure app router routes: /, /login, /assess, /history, /history/[id], /dashboard
    - Apply ProtectedRoute guards to authenticated routes
    - _Requirements: 1.5_

  - [~] 23.3 Write navigation tests
    - Test route transitions
    - Test protected route guards
    - _Requirements: 17.1_

- [x] 24. Implement database schema and RLS policies
  - [x] 24.1 Create Supabase migration for assessments table
    - Define table schema with all columns (id, user_id, image_url, freshness, marbling, fat_ratio, mqs, timestamps)
    - Add CHECK constraints for value ranges
    - Create indexes on user_id and created_at
    - _Requirements: 12.1, 12.2_

  - [x] 24.2 Create Row Level Security policies
    - Enable RLS on assessments table
    - Create SELECT policy: users can view own assessments
    - Create INSERT policy: users can insert own assessments
    - Create DELETE policy: users can delete own assessments
    - _Requirements: 1.6, 12.6_

  - [x] 24.3 Create Supabase storage bucket
    - Create private "beef-images" bucket
    - Configure bucket policies so users can only upload, view, and delete their own images
    - Create folder structure by user_id
    - Backend SHALL generate signed URLs when an image needs to be displayed
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 24.4 Create storage access policies
    - Policy: users can upload to own folder
    - Policy: users can view own images
    - Policy: users can delete own images
    - _Requirements: 13.5_

- [ ] 25. Final integration and E2E testing
  - [~] 25.1 Set up E2E test framework (Playwright or Cypress)
    - Configure test environment
    - Create test fixtures (sample beef images)
    - Set up test database and auth
    - _Requirements: 17.1_

  - [~] 25.2 Write E2E tests for critical flows
    - Test: Complete authentication flow
    - Test: Complete assessment workflow (upload → assess → results)
    - Test: History view and detail navigation
    - Test: Dashboard analytics display
    - Test: Error scenarios (network failure, invalid image)
    - _Requirements: 17.1_

- [~] 26. Final checkpoint - System validation
  - Run complete test suite (backend + frontend)
  - Perform manual testing checklist (cross-browser, responsive, accessibility)
  - Test with real beef images from training set
  - Verify all requirements are met
  - Test production deployment configuration
  - Run all tests. Fix implementation issues found during testing. Continue until the checkpoint criteria pass.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- The implementation follows a backend-first approach: ML pipeline (tasks 1-8) → Integration (tasks 9-12) → Frontend core (tasks 13-19) → Features (tasks 20-23) → Infrastructure (task 24) → Validation (tasks 25-26)
- Property-based tests (tasks 4.5-4.11, 10.3) validate the 8 correctness properties defined in the design document using Hypothesis with 100+ iterations
- Backend and frontend can be developed in parallel after task 12 (Backend completion checkpoint)
- The prediction pipeline reuses the 224x224 preprocessed tensor for both freshness and marbling inference to optimize performance
- Fat estimation uses a separate 800x800 resized image for HSV-based computer vision processing
- All Supabase integration (auth, database, storage) uses Row Level Security to ensure user data isolation
- Storage bucket is private with signed URL access - users can only view, upload, and delete their own images
- Assessment results are automatically saved to history after successful prediction - no manual save action needed
- Each task references specific requirements for traceability
- Checkpoints (tasks 8, 12, 19, 26) ensure incremental validation and provide opportunities for fixing issues

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "13.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "14.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.1", "4.2", "4.3", "4.4", "14.2", "14.3"] },
    { "id": 3, "tasks": ["4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "4.11", "5.1", "6.1", "7.1", "14.4", "15.1", "15.2"] },
    { "id": 4, "tasks": ["5.2", "6.2", "7.2", "15.3", "16.1"] },
    { "id": 5, "tasks": ["9.1", "16.2", "17.1"] },
    { "id": 6, "tasks": ["9.2", "17.2", "18.1", "20.1"] },
    { "id": 7, "tasks": ["10.1", "10.2", "18.2", "20.2", "21.1", "21.2", "21.3", "22.1"] },
    { "id": 8, "tasks": ["10.3", "10.4", "11.1", "21.4", "22.2", "22.3", "22.4", "23.1", "23.2"] },
    { "id": 9, "tasks": ["11.2", "22.5", "23.3", "24.1", "24.2", "24.3", "24.4"] },
    { "id": 10, "tasks": ["25.1"] },
    { "id": 11, "tasks": ["25.2"] }
  ]
}
```
