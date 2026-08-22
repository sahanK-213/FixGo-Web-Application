# FixGo Architecture Overview

FixGo is built using a modern, decoupled client-server architecture. This document outlines how the system operates end-to-end to help developers understand the lifecycle of a request and the boundaries of our codebase.

## High-Level Architecture

*   **Frontend:** React (built with Vite), hosted on Vercel.
*   **Backend:** Raw PHP 8+, hosted on Azure App Service.
*   **Database:** Azure MySQL.
*   **CI/CD:** GitHub Actions for automated PHPUnit testing and Azure deployment.

---

## The HTTP Request Lifecycle

When a user interacts with the React frontend, the following lifecycle occurs. It is critical that developers do not bypass any step in this lifecycle.

### 1. The Frontend API Wrapper (`frontend/src/services/api.js`)
All outgoing HTTP requests from React components are routed through this central wrapper. 
- It dynamically determines the Base URL (`http://localhost:8000` for local development, or the Azure production URL).
- It intercepts the request and injects the `Authorization: Bearer <JWT_TOKEN>` header if the user is authenticated.
- **Rule:** Never use raw `fetch()` in a component. It will bypass the auth token injection and break in production.

### 2. The Backend Entry Point & Middleware (`backend/config/bootstrap.php`)
When the request hits the PHP backend, the very first file it encounters is the API endpoint (e.g., `api/customer/getProfile.php`). This file immediately includes `bootstrap.php`.
- **CORS Handling:** `bootstrap.php` reads the `Origin` header and issues the correct Access-Control headers, allowing the Vercel frontend to communicate with the Azure backend without being blocked by the browser.
- **Core Dependencies:** It loads the necessary core files like `Database.php`, `AuthMiddleware.php`, and `RequestValidator.php` so they are immediately available to the endpoint.

### 3. Authentication & RBAC (`AuthMiddleware.php`)
If the endpoint requires a logged-in user, it calls `AuthMiddleware::authenticate(['allowed_role'])`.
- The middleware extracts the JSON Web Token (JWT) from the `Authorization` header.
- It validates the token's cryptographic signature and expiration.
- It verifies that the user possesses the required Role-Based Access Control (RBAC) permissions (e.g., `admin`, `shop_owner`, `customer`) before allowing the request to proceed.

### 4. The Controller Layer (`backend/controllers/`)
Once authenticated, the request is passed to a specific Controller method.
- **Payload & File Parsing:** The Controller uses `RequestValidator.php` to parse the incoming data. `RequestValidator::getJsonPayload()` extracts JSON directly from `php://input`. For images and files, it handles traditional multipart form uploads via `handleFileUpload()` and encoded images via `handleBase64Upload()`.
- It acts as the traffic cop, deciding which Models need to be called and enforcing business rules (like checking a billing state machine or service request handshake).
- **Rule: Controllers contain zero SQL. They are the EXCLUSIVE home for application business logic.** They handle all logic and HTTP formatting, while models only handle SQL execution.

### 5. The Model Layer (`backend/models/`)
The Controller instantiates one or more Models to interact with the MySQL Database.
- **The Query Builder:** Instead of writing raw SQL strings, all database interactions are routed through a custom `QueryBuilder` (Fluent Interface) located in `backend/database/QueryBuilder.php`.
- This abstraction handles PDO prepared statements automatically, eliminating the risk of SQL injection while keeping model methods clean and chainable (e.g., `$this->qb->table('users')->where('id', $id)->first()`).
- They execute the database query and return structured arrays back to the Controller.

### 6. The Response
The Controller takes the array provided by the Model, formats it into a standard JSON response (`json_encode`), sets the appropriate HTTP Status Code (e.g., `200 OK`, `400 Bad Request`), and sends it back down the pipeline to the Vite frontend.
