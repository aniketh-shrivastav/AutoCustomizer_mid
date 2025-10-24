# AutoCustomizer React Client

This is a Create React App style client for the AutoCustomizer project. It includes Login and Signup pages that mirror the existing EJS templates and talk to the existing Express backend.

## Prerequisites

- Node.js 18+
- Backend running at http://localhost:3000 (that's what `server.js` uses)

## Install & Run (Windows PowerShell)

```powershell
cd "$PSScriptRoot\client"
npm install
npm start
```

This starts the React dev server on port 5173 and proxies API calls (e.g. `/signup`, `/login`) to `http://localhost:3000`.

## Routes

- `/login`: HTML form posts directly to `/login` on the backend so you still get role-based redirects (manager/customer/seller/service-provider)
- `/signup`: Uses `fetch` to POST JSON to `/signup`. On success, navigates to `/login`.

## Styling

The client uses the same CSS classes as your EJS pages. The `style.css` is included via `public/` so components render consistently.

## Env/Config

If you need a different backend base URL, set the `proxy` value in `client/package.json`.
