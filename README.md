# MyFreeMusic - Backend

Backend monorepo cho ứng dụng nghe nhạc MyFreeMusic.

## Kiến trúc

Sử dụng **Clean Architecture** với 3 lớp chính:

- **Controller**: Xử lý HTTP request/response
- **Service**: Business logic
- **Repository**: Data access

## Cài đặt

```bash
npm install
npm run dev:api
```

## Microservices

| Service | Port | Mô tả |
|---------|------|-------|
| music-api | 3000 | API chính |
| streaming-service | 4000 | HLS Streaming |

Xem thêm tại [README chung](../README.md).
