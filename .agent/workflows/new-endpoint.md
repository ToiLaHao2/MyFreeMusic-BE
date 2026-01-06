---
description: How to create a new API endpoint following Clean Architecture
---

# Creating a New API Endpoint

Follow these steps to create a new endpoint (e.g., for "Playlist"):

## 1. Create Model (if new entity)
```bash
# File: src/models/playlist.model.js
```
Define Sequelize schema with fields and relations.

## 2. Create Repository
```bash
# File: src/repositories/playlist.repository.js
```
Only CRUD operations: findAll, findById, create, update, delete.

## 3. Create Service
```bash
# File: src/services/playlist.service.js
```
Business logic: validation, calculations, orchestrate repos.

## 4. Create Controller
```bash
# File: src/controllers/playlist.controller.js
```
Parse request → Call service → Return response. NO logic here.

## 5. Create Route
```bash
# File: src/routes/playlist.route.js
```
Map HTTP methods to controller functions.

## 6. Register Route
```javascript
// In src/server.js
const playlistRouter = require("./routes/playlist.route");
app.use("/api/playlist", playlistRouter);
```

## Checklist
- [ ] Model created
- [ ] Repository created (CRUD only)
- [ ] Service created (business logic)
- [ ] Controller created (no logic)
- [ ] Route created
- [ ] Route registered in server.js
