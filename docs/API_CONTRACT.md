# 🔌 FixGo API Contract

This document outlines the standard conventions, payload structures, and status codes used for communication between the React Frontend and the PHP Backend.

## 1. Base URL & Environment

All API requests must be routed through the `api.js` wrapper on the frontend.
*   **Local Development:** `http://localhost:8000/api`
*   **Production (Azure):** `https://fixgo-backend.azurewebsites.net/api` (Example)

## 2. Authentication

Endpoints requiring authentication must include a JSON Web Token (JWT) in the HTTP headers. The `api.js` wrapper handles this automatically if a token exists in `localStorage`.

```http
Authorization: Bearer <YOUR_JWT_TOKEN>
```
*If a token is missing, expired, or the user lacks the required RBAC role, the API will return `401 Unauthorized` or `403 Forbidden`.*

## 3. Standard Request Format

For `POST` and `PUT` requests, the backend expects a standard JSON payload. 

**Headers Required:**
```http
Content-Type: application/json
```

**Example Payload:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "vehicle_category_id": 2
}
```

*Note: For file uploads (like profile pictures), the frontend should send `multipart/form-data` using standard HTML Forms or Base64 encoded strings.*

## 4. Standard Response Format

The backend guarantees a consistent JSON response structure across all endpoints. Every response will contain a `success` boolean.

**Successful Response (200 OK / 201 Created):**
```json
{
    "success": true,
    "message": "Operation completed successfully.",
    "data": {
        "id": 123,
        "status": "Confirmed"
    }
}
```
*(Note: `message` and `data` are optional depending on the endpoint).*

**Error Response (400 / 401 / 403 / 404 / 500):**
```json
{
    "success": false,
    "message": "A human-readable error explaining what went wrong."
}
```

## 5. HTTP Status Code Guide

The FixGo backend strictly adheres to RESTful HTTP status codes:

*   **`200 OK`**: The request was successful (e.g., Data fetched, record updated).
*   **`201 Created`**: A new resource was successfully created (e.g., Registration successful).
*   **`400 Bad Request`**: The client sent invalid data (e.g., Missing fields, failed regex validation, invalid file type).
*   **`401 Unauthorized`**: The user is not logged in or the JWT token is expired.
*   **`403 Forbidden`**: The user is logged in, but their role (e.g., `customer`) does not have permission to access the endpoint (e.g., an `admin` endpoint).
*   **`404 Not Found`**: The requested resource (e.g., a specific invoice ID) does not exist in the database.
*   **`405 Method Not Allowed`**: The endpoint was accessed with the wrong HTTP verb (e.g., sending a `GET` request to a `POST` endpoint).
*   **`500 Internal Server Error`**: Something broke on the server (e.g., Database connection failed, unexpected exception).
