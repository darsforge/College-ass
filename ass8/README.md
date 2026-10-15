# Student Records REST API

Node.js + Express.js + MongoDB (Mongoose). Full CRUD for student records.

## Setup (once)
    npm install

## Run (MongoDB must be running locally)
    npm start
Server: http://localhost:4000  |  Database: studentdb  |  Collection: students

## Endpoints
| Method | URL                      | Purpose              | Success |
|--------|--------------------------|----------------------|---------|
| POST   | /api/students            | Create a student     | 201     |
| GET    | /api/students            | List all (?branch=&year=) | 200 |
| GET    | /api/students/:id        | Get one student      | 200     |
| PUT    | /api/students/:id        | Update a student     | 200     |
| DELETE | /api/students/:id        | Delete a student     | 200     |

Errors: 400 validation / bad id, 404 not found, 409 duplicate rollNo or email.

## Student JSON
    {
      "name": "Darshan Patil",
      "rollNo": "IT101",
      "email": "darshan@example.com",
      "branch": "IT",
      "year": 3,
      "phone": "9876543210"
    }

## Test in Postman
1. Import Student-API.postman_collection.json
2. Click the collection > Run > Run Student API (runs all 8 requests, tests pass/fail)
   Or send each request one by one in order 1 to 8.
