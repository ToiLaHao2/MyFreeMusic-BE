# MyFreeMusic Backend - Coding Rules

## Clean Architecture Rules

### 1. Dependency Rule
- Layer trên **CHỈ** gọi layer dưới
- KHÔNG gọi ngược: Repository → Service ❌

### 2. Layer Responsibilities

| Layer | LÀM | KHÔNG LÀM |
|-------|-----|-----------|
| **Route** | Map URL → Controller | Logic, DB access |
| **Middleware** | Auth, Validate, Log | Business logic |
| **Controller** | Parse request, call Service, return response | Business logic, DB access |
| **Service** | Business logic, orchestrate repos | HTTP (req/res), direct DB |
| **Repository** | CRUD operations only | Business logic, validation |
| **Model** | Schema definition | Logic |

### 3. Naming Conventions

```
controllers/
  song.controller.js     ✅
  SongController.js      ❌

services/
  song.service.js        ✅

repositories/
  song.repository.js     ✅
```

### 4. File Structure

```
src/
├── controllers/    # HTTP handlers only
├── services/       # Business logic
├── repositories/   # Database access
├── routes/         # URL mapping
├── middlewares/    # Cross-cutting concerns
├── models/         # Sequelize schemas
├── dtos/           # Input validation schemas
├── config/         # App configuration
└── util/           # Helper functions
```

### 5. Golden Rules

1. **Controller không chứa business logic**
2. **Service không biết HTTP (req/res)**
3. **Repository chỉ CRUD, không validate**
4. **Mỗi function làm 1 việc**
5. **Tên function mô tả rõ việc làm**
