# Requirements Document

## Introduction

The Beef Quality Assessment System is a production web application that evaluates beef quality through image analysis. The system uses trained machine learning models to assess freshness, marbling, and fat content, producing a comprehensive Meat Quality Score (MQS). The application consists of a Next.js frontend for user interaction and a FastAPI backend for ML inference, with Supabase providing authentication, database, and storage services.

## Glossary

- **System**: The complete Beef Quality Assessment web application (frontend + backend + database)
- **Frontend**: Next.js application with TypeScript, React, Tailwind CSS, and shadcn/ui components
- **Backend**: FastAPI Python service providing ML inference and image processing
- **Freshness_Classifier**: ReXNet-150 PyTorch model trained to classify beef as Fresh (0) or Spoiled (1)
- **Marbling_Classifier**: ReXNet-150 PyTorch model trained to classify marbling into 5 grades
- **Fat_Ratio_Estimator**: HSV-based computer vision module using rembg and OpenCV
- **MQS**: Meat Quality Score (0-100 scale) = f_freshness + m_grade + min(r_fat, 20)
- **Database**: Supabase PostgreSQL instance storing user data and assessment history
- **Storage**: Supabase Storage for uploaded beef images
- **User**: Authenticated person using the system to assess beef quality

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to register and log in securely, so that I can access my personal assessment history.

#### Acceptance Criteria

1. THE Frontend SHALL integrate Supabase authentication for user registration
2. THE Frontend SHALL integrate Supabase authentication for user login
3. THE Frontend SHALL integrate Supabase authentication for user logout
4. WHEN a user successfully authenticates, THE System SHALL create a user session
5. WHEN a user session exists, THE Frontend SHALL display authenticated user interface
6. THE Database SHALL enforce Row Level Security policies to isolate user data

### Requirement 2: Image Upload and Capture

**User Story:** As a user, I want to upload or capture beef images, so that I can assess their quality.

#### Acceptance Criteria

1. THE Frontend SHALL provide a file upload interface accepting JPEG and PNG formats
2. THE Frontend SHALL provide a camera capture interface for mobile and desktop devices
3. WHEN an image is selected or captured, THE Frontend SHALL display a preview
4. THE Frontend SHALL validate that uploaded files are images before submission
5. WHEN an image exceeds 10MB, THE Frontend SHALL display an error message
6. THE Frontend SHALL send images to the Backend using multipart/form-data format

### Requirement 3: Model Loading and Initialization

**User Story:** As a backend service, I want to load trained models at startup, so that I can perform inference efficiently.

#### Acceptance Criteria

1. WHEN the Backend starts, THE Backend SHALL load rexnet150_freshness_best.pth as state_dict into Freshness_Classifier
2. WHEN the Backend starts, THE Backend SHALL load rexnet150_marbling_best.pth as state_dict into Marbling_Classifier
3. THE Backend SHALL initialize Freshness_Classifier using timm.create_model("rexnet_150", pretrained=False, num_classes=2)
4. THE Backend SHALL initialize Marbling_Classifier using timm.create_model("rexnet_150", pretrained=False, num_classes=5)
5. THE Backend SHALL load the provided .pth files without retraining or modifying architecture
6. THE Backend SHALL set both models to evaluation mode
7. THE Backend SHALL select CUDA device when an available GPU exists, otherwise CPU device
8. THE Backend SHALL move both models to the selected device
9. IF model loading fails, THEN THE Backend SHALL log an error and exit

### Requirement 4: Image Preprocessing

**User Story:** As a backend service, I want to preprocess images correctly, so that model predictions are accurate.

#### Acceptance Criteria

1. THE Backend SHALL resize input images to 224x224 pixels
2. THE Backend SHALL convert images to PyTorch tensors
3. THE Backend SHALL normalize tensors with ImageNet mean=[0.485, 0.456, 0.406]
4. THE Backend SHALL normalize tensors with ImageNet std=[0.229, 0.224, 0.225]
5. THE Backend SHALL add batch dimension before model inference
6. THE Backend SHALL move input tensors to the selected device
7. THE Backend SHALL use torch.inference_mode() during inference

### Requirement 5: Freshness Classification

**User Story:** As a user, I want to know if beef is fresh or spoiled, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN an image is submitted, THE Freshness_Classifier SHALL predict one of two classes: Fresh (0) or Spoiled (1)
2. THE Backend SHALL compute softmax probabilities for freshness prediction
3. THE Backend SHALL extract confidence score as the maximum probability
4. WHEN freshness class is 0, THE Backend SHALL assign freshness score of 50 points
5. WHEN freshness class is 1, THE Backend SHALL assign freshness score of 0 points
6. THE Backend SHALL return freshness label as "Fresh" or "Spoiled"
7. THE Backend SHALL return freshness confidence as a percentage

### Requirement 6: Marbling Classification

**User Story:** As a user, I want to assess marbling quality, so that I can evaluate beef grade.

#### Acceptance Criteria

1. WHEN an image is submitted, THE Marbling_Classifier SHALL predict one of five classes: small (0), modest (1), moderate (2), slight (3), slightly_abundant (4)
2. THE Backend SHALL compute softmax probabilities for marbling prediction
3. THE Backend SHALL extract confidence score as the maximum probability
4. THE Backend SHALL map marbling class to grade: small=10, slight=15, modest=20, moderate=25, slightly_abundant=30
5. THE Backend SHALL return marbling label as string class name
6. THE Backend SHALL return marbling confidence as a percentage

### Requirement 7: Fat Ratio Estimation

**User Story:** As a user, I want to measure visible fat content, so that I can assess fat distribution.

#### Acceptance Criteria

1. WHEN an image is submitted, THE Fat_Ratio_Estimator SHALL resize the image to 800x800 pixels
2. THE Fat_Ratio_Estimator SHALL remove background using rembg library
3. THE Fat_Ratio_Estimator SHALL create a meat mask from the alpha channel with threshold 127
4. THE Fat_Ratio_Estimator SHALL apply morphological closing with 7x7 ellipse kernel
5. THE Fat_Ratio_Estimator SHALL apply morphological opening with 7x7 ellipse kernel
6. THE Fat_Ratio_Estimator SHALL convert meat region to HSV color space
7. THE Fat_Ratio_Estimator SHALL detect fat pixels using HSV lower bound [0, 0, 120]
8. THE Fat_Ratio_Estimator SHALL detect fat pixels using HSV upper bound [180, 120, 255]
9. THE Fat_Ratio_Estimator SHALL compute fat ratio as (fat_pixels / meat_pixels * 100)
10. WHEN fat ratio is less than 1.0, THE Backend SHALL categorize as "None"
11. WHEN fat ratio is greater than or equal to 1.0 and less than 15.0, THE Backend SHALL categorize as "Small"
12. WHEN fat ratio is greater than or equal to 15.0, THE Backend SHALL categorize as "Large"
13. THE Backend SHALL return fat ratio percentage rounded to 2 decimal places

### Requirement 8: Meat Quality Score Calculation

**User Story:** As a user, I want an overall quality score, so that I can quickly evaluate beef quality.

#### Acceptance Criteria

1. THE Backend SHALL compute MQS as f_freshness + m_grade + min(r_fat, 20)
2. THE Backend SHALL cap fat ratio contribution at 20 points maximum
3. THE Backend SHALL validate that computed MQS does not exceed 50 points when freshness is "Spoiled"
4. THE Backend SHALL return MQS rounded to 1 decimal place
5. THE MQS SHALL have a theoretical maximum of 100 points
6. THE MQS SHALL have a valid range of 0 to 100

### Requirement 9: Prediction API Endpoint

**User Story:** As a frontend developer, I want a REST API endpoint, so that I can submit images and receive predictions.

#### Acceptance Criteria

1. THE Backend SHALL expose a POST endpoint at /predict
2. THE Backend SHALL accept multipart/form-data with file field named "file"
3. THE Frontend SHALL send the authenticated user's Supabase access token with protected Backend requests
4. THE Backend SHALL validate the access token before processing authenticated prediction requests
5. THE Backend SHALL associate each prediction with the authenticated user's user_id
6. WHEN a valid image is received, THE Backend SHALL return HTTP 200 with JSON response
7. THE Backend SHALL return JSON containing freshness (string), freshness_confidence (float 0-100), marbling (string), marbling_confidence (float 0-100), fat_ratio_percent (float 0-100), fat_ratio_category (string), and meat_quality_score (float 0-100)
8. IF image processing fails, THEN THE Backend SHALL return HTTP 400 with error message
9. IF an internal error occurs, THEN THE Backend SHALL return HTTP 500 with error message

### Requirement 10: CORS Configuration

**User Story:** As a frontend application, I want to make cross-origin requests, so that I can communicate with the backend.

#### Acceptance Criteria

1. THE Backend SHALL configure CORS middleware
2. THE Backend SHALL allow requests from Frontend origin during development
3. THE Backend SHALL allow POST method for /predict endpoint
4. THE Backend SHALL allow Content-Type header
5. WHERE production deployment, THE Backend SHALL restrict allowed origins to production Frontend URL

### Requirement 11: Results Display

**User Story:** As a user, I want to view assessment results clearly, so that I can understand the beef quality.

#### Acceptance Criteria

1. WHEN prediction results are received, THE Frontend SHALL display freshness status with confidence
2. THE Frontend SHALL display marbling grade with confidence
3. THE Frontend SHALL display fat ratio percentage and category
4. THE Frontend SHALL display overall MQS prominently
5. THE Frontend SHALL use color coding to indicate quality levels
6. THE Frontend SHALL display the analyzed image alongside results

### Requirement 12: Assessment History

**User Story:** As a user, I want to view my past assessments, so that I can track quality over time.

#### Acceptance Criteria

1. WHEN a prediction is completed, THE Backend SHALL store results in Database
2. THE Database SHALL record user_id, image_url, freshness, marbling, fat_ratio, mqs, and timestamp
3. THE Frontend SHALL display a history page listing past assessments
4. THE Frontend SHALL sort history by most recent first
5. WHEN a user clicks a history entry, THE Frontend SHALL display full assessment details
6. THE Database SHALL enforce Row Level Security so users only see their own history

### Requirement 13: Image Storage

**User Story:** As a system, I want to store uploaded images securely, so that users can reference past assessments.

#### Acceptance Criteria

1. WHEN an image is uploaded, THE Backend SHALL upload the image to Storage
2. THE Storage SHALL organize images by user_id folder structure
3. THE Storage SHALL generate a unique filename using UUID
4. THE Backend SHALL store the Storage URL in Database with assessment record
5. THE Storage SHALL enforce access policies so users only access their own images

### Requirement 14: Dashboard Analytics

**User Story:** As a user, I want to see aggregate statistics, so that I can understand trends in my assessments.

#### Acceptance Criteria

1. THE Frontend SHALL display a dashboard page with analytics
2. THE Frontend SHALL show total number of assessments
3. THE Frontend SHALL show average MQS across all assessments
4. THE Frontend SHALL show distribution of freshness classifications
5. THE Frontend SHALL show distribution of marbling grades

### Requirement 15: Error Handling

**User Story:** As a user, I want clear error messages, so that I can resolve issues when they occur.

#### Acceptance Criteria

1. IF network connection fails, THEN THE Frontend SHALL display a connection error message
2. IF image upload fails, THEN THE Frontend SHALL display an upload error message
3. IF prediction fails, THEN THE Frontend SHALL display a processing error message
4. THE Frontend SHALL provide retry options for failed operations
5. THE Backend SHALL log all errors with timestamps and context

### Requirement 16: Environment Configuration

**User Story:** As a developer, I want environment-based configuration, so that I can deploy to different environments safely.

#### Acceptance Criteria

1. THE Backend SHALL load model paths from environment variables
2. THE Backend SHALL load Supabase credentials from environment variables
3. THE Frontend SHALL load API endpoint URL from environment variables
4. THE Frontend SHALL load Supabase credentials from environment variables
5. THE System SHALL NOT include hardcoded secrets in source code

### Requirement 17: Testing Infrastructure

**User Story:** As a developer, I want automated tests, so that I can verify system correctness.

#### Acceptance Criteria

1. THE Backend SHALL include pytest tests for model loading
2. THE Backend SHALL include pytest tests for freshness prediction
3. THE Backend SHALL include pytest tests for marbling prediction
4. THE Backend SHALL include pytest tests for HSV fat ratio calculation
5. THE Backend SHALL include pytest tests for MQS computation
6. THE Backend SHALL include pytest tests for error handling
7. FOR ALL valid beef images, THE System SHALL produce MQS between 0 and 100
8. FOR ALL predictions, THE System SHALL return valid JSON matching the defined schema

### Requirement 18: Prediction Pipeline

**User Story:** As a backend service, I want to execute the complete prediction pipeline in the correct order, so that results are accurate and consistent.

#### Acceptance Criteria

1. THE Backend SHALL execute the prediction pipeline in the following order: image validation, freshness preprocessing (224x224), freshness inference, marbling preprocessing (224x224), marbling inference, fat ratio preprocessing (800x800), rembg background removal, meat mask creation, morphological operations, HSV segmentation, fat ratio calculation, MQS calculation, result JSON formatting, database storage, and image storage
2. WHEN any pipeline stage fails, THE Backend SHALL halt execution and return an appropriate error response
3. THE Backend SHALL reuse the same preprocessed 224x224 tensor for both freshness and marbling inference
4. THE Backend SHALL perform fat ratio estimation on a separate 800x800 resized image
5. THE Backend SHALL store prediction results in Database only after successful completion of all pipeline stages
6. THE Backend SHALL store uploaded images in Storage only after successful completion of all pipeline stages
