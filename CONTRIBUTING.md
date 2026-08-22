# Contributing to FixGo

Welcome to the FixGo development team! To ensure a smooth development process and maintain our clean architecture, please read and follow these guidelines before contributing.

## Mandatory Reading

> [!IMPORTANT]  
> Before writing any code, you **must** read the [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) document to understand how the decoupled React/PHP system operates.

### 1. The Golden Rules (Do Not Break These)
- **Frontend | No Raw Fetch Calls:** Never use raw `fetch()` or `axios()`. All communication MUST go through `src/services/api.js` to ensure auth tokens are attached.
- **Backend | The Bootstrap Pipeline:** Every API endpoint must include `bootstrap.php` on line 1. Do not bypass the middleware.
- **Backend | No SQL in Controllers:** Controllers are the exclusive home for business logic. All database queries must be written in `models/` using the custom `QueryBuilder`.
- **Backend | State Machine Integrity:** Never manually force a status change in the database via raw updates (e.g., setting an invoice to 'Paid' manually). Always route state changes through the designated controller workflows to guarantee all business side-effects execute properly.

### 2. Development Workflow
1. **Branching:** Do not work directly on `main` or `development`. Create a feature branch: `git checkout -b feature/your-feature-name`.
2. **Database Changes:** If your feature requires database modifications, do not just change your local MySQL database. You must write a migration script or update the core SQL schema file so the cloud database stays in sync.

### 3. Testing
1. **Automated Testing:** You must write a PHPUnit integration test for new backend features. 
2. **Test Maintenance:** If you are modifying an existing feature (e.g., changing a JSON response structure), you **must** update the corresponding test. If you don't, the automated pipeline will fail.
3. **Teardown Pattern:** If your test involves file uploads (like base64 images), you must implement the File Diffing Teardown Pattern to prevent polluting the server's filesystem with test artifacts.
4. **Local Verification:** Run your tests locally to ensure they pass before committing.

### 4. Pull Requests
- Open your Pull Request against the `development` branch.
- The GitHub Actions CI/CD pipeline will automatically run your tests. If the tests fail, your code will not be merged.
- **Do not hardcode secrets:** Never commit API keys or database passwords. Use `.env` variables locally and Azure App Settings/Vercel Environment Variables in production.
