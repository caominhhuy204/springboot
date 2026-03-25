# NHOM04 - Hướng Dẫn Chạy Dự Án Bằng Docker Compose

## 1. Yêu cầu
- Cài `Docker Desktop` (hoặc Docker Engine + Docker Compose plugin).
- Bật Docker trước khi chạy lệnh.

## 2. Cấu trúc hiện tại
- `backend/english`: Spring Boot (Java 17, Maven).
- `frontend`: trang tĩnh `hello.html` chạy qua Nginx.
- `docker-compose.yml`: chạy toàn bộ stack (`mysql`, `backend`, `frontend`).

## 3. Chạy dự án
Từ thư mục gốc `D:\nhom04`, chạy:

```bash
docker compose up -d --build
```

Nếu cổng `3306` đang bị chiếm, chạy với port khác cho MySQL:

```bash
# PowerShell
$env:MYSQL_HOST_PORT=13306
docker compose up -d --build
```

## 4. Truy cập dịch vụ
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- MySQL: `localhost:3306`

Thông tin MySQL mặc định:
- Database: `mydb`
- Username: `root`
- Password: `123456`

Nếu bạn set `MYSQL_HOST_PORT`, MySQL sẽ chạy theo port đó (ví dụ `localhost:13306`).

## 5. Lệnh Docker Compose thường dùng

Xem trạng thái container:

```bash
docker compose ps
```

Xem log:

```bash
docker compose logs -f
```

Dừng và xóa container:

```bash
docker compose down
```

Dừng và xóa cả dữ liệu MySQL volume:

```bash
docker compose down -v
```

## 6. Cấu hình backend với database
Backend đọc biến môi trường trong `application.yaml`:
- `DB_HOST` (mặc định: `localhost`)
- `DB_PORT` (mặc định: `3306`)
- `DB_NAME` (mặc định: `mydb`)
- `DB_USERNAME` (mặc định: `root`)
- `DB_PASSWORD` (mặc định: `123456`)

Khi chạy bằng Docker Compose, các biến này đã được set sẵn để backend kết nối service `mysql`.

## 7. Khi code thay đổi
- Nếu sửa backend/frontend và muốn build lại image:

```bash
docker compose up -d --build
```

- Nếu chỉ restart nhanh service:

```bash
docker compose restart backend
docker compose restart frontend
```
