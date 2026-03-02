# Hệ Thống Điều Phối Cứu Hộ và Quản Lý Cứu Trợ Lũ Lụt

Phần mềm frontend hỗ trợ điều phối cứu hộ và quản lý cứu trợ lũ lụt, xây dựng bằng **Vue.js 3 + Bootstrap 5 + Axios**.

## Chức năng

| Vai trò | Chức năng |
|---------|-----------|
| **Người dân** | Gửi yêu cầu cứu hộ (vị trí, mô tả, hình ảnh), theo dõi trạng thái, xác nhận đã được cứu |
| **Đội cứu hộ** | Nhận nhiệm vụ được phân công, xem chi tiết & vị trí GPS, cập nhật trạng thái, báo cáo kết quả |
| **Điều phối viên** | Tiếp nhận & xác minh yêu cầu, phân loại mức độ khẩn cấp, điều phối đội cứu hộ, theo dõi toàn bộ |
| **Quản lý** | Quản lý kho hàng cứu trợ, ghi nhận phân phối, thống kê nguồn lực |
| **Admin** | Quản lý người dùng, phân quyền, khóa/mở khóa tài khoản |

## Tài khoản demo

| Username | Mật khẩu | Vai trò |
|----------|----------|---------|
| `citizen1` | `123456` | Người dân |
| `team1` | `123456` | Đội cứu hộ Alpha |
| `team2` | `123456` | Đội cứu hộ Beta |
| `coord1` | `123456` | Điều phối viên |
| `manager1` | `123456` | Quản lý kho |
| `admin` | `admin123` | Quản trị viên |

## Cách chạy để test

### Yêu cầu
- Node.js >= 18
- npm >= 9

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Chạy ở chế độ development

```bash
npm run dev
```

Sau đó mở trình duyệt và truy cập: **http://localhost:5173**

### Bước 3 (tuỳ chọn): Build bản production

```bash
npm run build
npm run preview
```

Truy cập: **http://localhost:4173**

## Công nghệ sử dụng

- **Vue.js 3** (Composition API)
- **Vue Router 4** (điều hướng, bảo vệ route theo vai trò)
- **Bootstrap 5** (UI components, responsive)
- **Bootstrap Icons** (icon set)
- **Axios** (HTTP client, cấu hình sẵn)
- **Vite** (build tool)

## Cấu trúc thư mục

```
src/
├── router/         # Vue Router (bảo vệ route theo role)
├── store/          # State management đơn giản (reactive + localStorage)
├── views/
│   ├── LoginView.vue       # Đăng nhập
│   ├── CitizenView.vue     # Người dân
│   ├── RescueTeamView.vue  # Đội cứu hộ
│   ├── CoordinatorView.vue # Điều phối viên
│   ├── ManagerView.vue     # Quản lý kho
│   └── AdminView.vue       # Quản trị viên
└── components/
    ├── NavBar.vue      # Thanh điều hướng
    └── StatusBadge.vue # Badge trạng thái
```
