# Implementation Plan: Chatbot Integration

## Overview

This implementation plan integrates a standalone chatbot module into the Inventory Management System. The approach follows a phased integration strategy: first setting up the backend infrastructure, then integrating frontend components, and finally wiring everything together with comprehensive testing. Each task builds incrementally to ensure the chatbot can access IMS data while preserving all existing functionality.

## Tasks

- [ ] 1. Set up backend chatbot directory structure and copy modules
  - Create `backend/src/chatbot/` directory with subdirectories (services, adapters, controllers, routes)
  - Copy all 11 chatbot modules from source project to appropriate directories
  - Update import paths in copied modules to reflect new directory structure
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create database adapter for IMS integration
  - [ ] 2.1 Implement databaseAdapter.js with IMS-specific queries
    - Create `queryProducts()` function to query IMS products table
    - Create `querySuppliers()` function to query IMS suppliers table
    - Create `getStockLevels()` function to retrieve inventory quantities
    - Create `getLowStockItems()` function to find items below reorder level
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 2.2 Write property test for database query correctness
    - **Property 7: Database Query Correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  
  - [ ] 2.3 Write property test for database error handling
    - **Property 8: Database Error Handling**
    - **Validates: Requirements 5.6**

- [ ] 3. Configure Supabase client for chatbot
  - [ ] 3.1 Update supabaseClient.js to use IMS environment variables
    - Ensure SUPABASE_URL and SUPABASE_KEY are read from IMS .env
    - Verify connection uses same credentials as IMS
    - _Requirements: 5.5_
  
  - [ ] 3.2 Write unit test for Supabase client initialization
    - Test client connects successfully with IMS credentials
    - Test error handling for missing credentials
    - _Requirements: 5.5_

- [ ] 4. Implement chatbot controller and routes
  - [ ] 4.1 Create chatbotController.js with request handlers
    - Implement `handleMessage()` function for POST /api/v1/chatbot/message
    - Implement `healthCheck()` function for GET /api/v1/chatbot/health
    - Add error handling for all controller methods
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  
  - [ ] 4.2 Create chatbotRoutes.js and register routes
    - Define POST /api/v1/chatbot/message route
    - Define GET /api/v1/chatbot/health route
    - Ensure no conflicts with existing IMS routes
    - _Requirements: 4.1, 4.3_
  
  - [ ] 4.3 Write property test for API request routing
    - **Property 3: API Request Routing**
    - **Validates: Requirements 4.2**
  
  - [ ] 4.4 Write property test for route uniqueness
    - **Property 4: Route Uniqueness**
    - **Validates: Requirements 4.3**
  
  - [ ] 4.5 Write property test for response format consistency
    - **Property 5: Response Format Consistency**
    - **Validates: Requirements 4.4**
  
  - [ ] 4.6 Write property test for error status codes
    - **Property 6: Error Status Codes**
    - **Validates: Requirements 4.5**

- [ ] 5. Integrate chatbot routes into IMS backend
  - [ ] 5.1 Update backend/src/app.js to include chatbot routes
    - Import chatbotRoutes module
    - Register routes at /api/v1/chatbot
    - Ensure middleware order is correct (body parser before routes)
    - _Requirements: 4.1_
  
  - [ ] 5.2 Write unit test for backend initialization
    - Test server starts without errors with chatbot routes
    - Test chatbot endpoints are accessible
    - _Requirements: 1.4_

- [ ] 6. Checkpoint - Verify backend integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Merge backend dependencies
  - [ ] 7.1 Update backend/package.json with chatbot dependencies
    - Add `pg` package (^8.18.0) for PostgreSQL support
    - Verify axios and nodemailer versions (already present)
    - Run npm install to verify no conflicts
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [ ] 7.2 Write property test for dependency version selection
    - **Property 2: Dependency Version Selection**
    - **Validates: Requirements 3.2**

- [ ] 8. Configure environment variables
  - [ ] 8.1 Add chatbot environment variables to backend/.env
    - Add CHATBOT_ENABLED, CHATBOT_LLM_API_KEY, CHATBOT_LLM_ENDPOINT
    - Verify SUPABASE_URL and SUPABASE_KEY exist
    - Add SMTP configuration if not present (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 8.2 Write property test for environment variable error messages
    - **Property 9: Environment Variable Error Messages**
    - **Validates: Requirements 6.5**

- [ ] 9. Implement intent detection and entity extraction
  - [ ] 9.1 Update intentDetector.js with inventory-specific intents
    - Add patterns for product_lookup, stock_check, supplier_inquiry, supplier_contact
    - Ensure all supported intents are defined
    - _Requirements: 10.1_
  
  - [ ] 9.2 Update entityExtractor.js for inventory entities
    - Add extraction patterns for product names, supplier names, quantities
    - Add extraction for email subject and body
    - _Requirements: 9.1, 9.2_
  
  - [ ] 9.3 Write property test for intent classification
    - **Property 16: Intent Classification**
    - **Validates: Requirements 10.1**
  
  - [ ] 9.4 Write property test for supplier entity extraction
    - **Property 13: Supplier Entity Extraction**
    - **Validates: Requirements 9.1, 9.2**

- [ ] 10. Implement intent-based routing and handlers
  - [ ] 10.1 Update chatbot.js to route intents to appropriate handlers
    - Route inventory intents to database adapter
    - Route casual intents to casualResponder
    - Route unknown intents to clarification handler
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [ ] 10.2 Write property test for intent-based routing
    - **Property 17: Intent-Based Routing**
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6**

- [ ] 11. Implement email service integration
  - [ ] 11.1 Update emailService.js to use IMS SMTP configuration
    - Configure nodemailer with IMS environment variables
    - Implement sendSupplierEmail() function
    - Add error handling for email failures
    - _Requirements: 9.3_
  
  - [ ] 11.2 Write property test for email success confirmation
    - **Property 14: Email Success Confirmation**
    - **Validates: Requirements 9.4**
  
  - [ ] 11.3 Write property test for email failure notification
    - **Property 15: Email Failure Notification**
    - **Validates: Requirements 9.5**

- [ ] 12. Checkpoint - Verify backend services
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Copy frontend chatbot component
  - [ ] 13.1 Create frontend/src/components/chatbot directory
    - Copy ChatbotWithVoice.jsx from source project
    - Create chatbot.css for component styles
    - Update import paths to work with Vite
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 13.2 Write property test for module import resolution
    - **Property 1: Module Import Resolution**
    - **Validates: Requirements 1.3, 2.3**

- [ ] 14. Create chatbot service for API communication
  - [ ] 14.1 Implement frontend/src/services/chatbotService.js
    - Create sendMessage() function to call backend API
    - Create checkHealth() function for health checks
    - Use axios for HTTP requests
    - _Requirements: 4.1_
  
  - [ ] 14.2 Write unit test for chatbot service
    - Test sendMessage() with mock responses
    - Test error handling for API failures
    - _Requirements: 4.1_

- [ ] 15. Implement ChatbotButton component
  - [ ] 15.1 Create ChatbotButton.jsx component
    - Implement floating button with positioning props
    - Add click handler to open chatbot
    - Style with Tailwind CSS to match IMS design
    - _Requirements: 7.1, 7.5_
  
  - [ ] 15.2 Write unit test for ChatbotButton
    - Test button renders correctly
    - Test click handler triggers callback
    - _Requirements: 7.1_

- [ ] 16. Integrate chatbot into IMS frontend
  - [ ] 16.1 Update frontend/src/App.jsx to include chatbot
    - Import ChatbotWithVoice and ChatbotButton components
    - Add state management for chatbot open/close
    - Add ChatbotButton to main layout
    - Conditionally render ChatbotWithVoice when open
    - _Requirements: 7.1, 7.2, 7.4_
  
  - [ ] 16.2 Write property test for frontend component integrity
    - **Property 21: Frontend Component Integrity**
    - **Validates: Requirements 12.3**

- [ ] 17. Merge frontend dependencies
  - [ ] 17.1 Update frontend/package.json with chatbot dependencies
    - Add `gsap` package (^3.14.2) for animations
    - Run npm install to verify installation
    - _Requirements: 3.3, 3.5_
  
  - [ ] 17.2 Write unit test for dependency installation
    - Test all packages install without errors
    - _Requirements: 3.5_

- [ ] 18. Implement voice functionality
  - [ ] 18.1 Add voice input handling to ChatbotWithVoice
    - Implement startVoiceInput() using Web Speech API
    - Implement stopVoiceInput() to stop recognition
    - Add microphone permission request
    - Add fallback to text-only mode if unavailable
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [ ] 18.2 Add voice output handling to ChatbotWithVoice
    - Implement speakResponse() using Speech Synthesis API
    - Add visual feedback for speaking state
    - _Requirements: 8.3, 8.5_
  
  - [ ] 18.3 Write property test for voice input transcription
    - **Property 10: Voice Input Transcription**
    - **Validates: Requirements 8.2**
  
  - [ ] 18.4 Write property test for voice output synthesis
    - **Property 11: Voice Output Synthesis**
    - **Validates: Requirements 8.3**
  
  - [ ] 18.5 Write property test for voice state visual feedback
    - **Property 12: Voice State Visual Feedback**
    - **Validates: Requirements 8.5**

- [ ] 19. Checkpoint - Verify frontend integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Write integration tests
  - [ ] 20.1 Write integration test for chatbot API endpoints
    - Test POST /api/v1/chatbot/message with real database
    - Test GET /api/v1/chatbot/health endpoint
    - _Requirements: 11.1_
  
  - [ ] 20.2 Write property test for query result accuracy
    - **Property 18: Query Result Accuracy**
    - **Validates: Requirements 11.2, 11.3**
  
  - [ ] 20.3 Write property test for error condition handling
    - **Property 19: Error Condition Handling**
    - **Validates: Requirements 11.4**

- [ ] 21. Write backward compatibility tests
  - [ ] 21.1 Write property test for backward compatibility
    - **Property 20: Backward Compatibility**
    - **Validates: Requirements 12.1, 12.2, 12.4**
  
  - [ ] 21.2 Write property test for fault isolation
    - **Property 22: Fault Isolation**
    - **Validates: Requirements 12.5**

- [ ] 22. Final integration and testing
  - [ ] 22.1 Test complete message flow end-to-end
    - Test user sends message → backend processes → database queries → response returns
    - Test voice input → transcription → API call → voice output
    - Test email functionality with test SMTP server
    - _Requirements: 11.5_
  
  - [ ] 22.2 Verify all existing IMS features still work
    - Test product management, sales, purchases, suppliers, customers
    - Verify no regressions in existing functionality
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 22.3 Test chatbot with inventory-specific queries
    - Test "show me products in electronics category"
    - Test "what's the stock level for [product]?"
    - Test "contact [supplier] about restocking"
    - Test "show me low stock items"
    - _Requirements: 10.2, 10.3, 10.4_

- [ ] 23. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- Integration tests verify the complete system works end-to-end
- The implementation follows a backend-first approach to establish data access before UI integration
- All tests are required for comprehensive validation of the integration
