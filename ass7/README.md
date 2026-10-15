# Personal Expense Tracker (MERN)

React (Vite) frontend + Express API + MongoDB. Record expenses, edit/delete them,
and analyze spending by category and by month.

## Requirements
Node.js, MongoDB running locally on port 27017.

## First time only (needs internet)
    cd server
    npm install
    cd ../client
    npm install

## Every session (two terminals)
Terminal 1:
    cd server
    npm start          -> API on http://localhost:5050

Terminal 2:
    cd client
    npm run dev        -> open http://localhost:5173

## MongoDB
URI is in server/.env:  mongodb://127.0.0.1:27017/expensedb
Database `expensedb`, collection `expenses` (created on the first saved expense).
View it in MongoDB Compass or the VS Code MongoDB extension with: mongodb://127.0.0.1:27017

## API
GET    /api/expenses?month=2026-10&category=Food
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
GET    /api/summary?month=2026-10     (totals, category split, 6-month trend)
