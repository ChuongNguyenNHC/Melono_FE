# Melono Frontend

Dự án này được phát triển bằng [Angular CLI](https://github.com/angular/angular-cli) phiên bản hiện đại kết hợp với **Tailwind CSS v4**.

## 🚀 Hướng Dẫn Clone & Chạy Dự Án (Dành cho Team)

Khi bạn clone dự án này từ GitHub về một cấu hình máy tính mới, hãy làm theo các bước chuẩn sau đây để đảm bảo mọi thứ chạy mượt mà ngay lập tức.

### Bước 1: Tải Code
Giải nén hoặc clone thẳng mã nguồn từ Repository nhánh chính:

```bash
git clone <link-repo-github>
cd Melono
```

### Bước 2: Cài Đặt Thư Viện Thiếu
Thư mục `node_modules/` khổng lồ đã bị chặn tải lên qua Git. Tại bước này, bạn phải yêu cầu máy tính rà soát và tải lại các thư viện mà dự án đang sử dụng (Angular, Tailwind, CSS plugins...):

```bash
npm install
```

### Bước 3: Khởi Động Máy Chủ Ngay
Bạn không cần thiết lập gì thêm do toàn bộ đường link trỏ Backend hay API Public Key đã được cắm sẵn tại các file cấu hình `src/environments/`. Khởi chạy luồng lập trình bằng:

```bash
npm start
```
*(Lưu ý: Nếu máy không nhận, bạn có thể chạy bằng `ng serve` hoặc cài bổ trợ Angular bằng cách chạy `npm install -g @angular/cli` )*

### Bước 4: Tận hưởng kết quả
Mở trình duyệt bất kỳ của bạn để xem Website phát trực tiếp ở cổng tĩnh mặc định:
👉 **http://localhost:4200/**

Website sẽ liên tục tự động reload lại bản mới nhất nếu bạn thay đổi mã nguồn, hãy thả hồn sửa code nhé!

---
## 🧰 Các Lệnh Angular CLI Hay Dùng (Cheat Sheet)

Nếu máy bạn chưa có `ng`, bạn có thể phết thêm chữ `npx` lên đầu (VD: `npx ng...`) hoặc cài toàn cục trên máy bằng: `npm install -g @angular/cli`.

### 1. Tạo Component / Trang Mới (Pages)
Tạo một mảnh ghép giao diện mới. Phím tắt lệnh là `ng g c` thay cho `ng generate component`.

```bash
# Tạo một component lẻ tẻ
ng generate component ten-component

# Tạo Component gộp vào chung một cấu trúc thư mục (Ví dụ thư mục auth)
ng generate component pages/auth/login
```

### 2. Tạo Service
Service dùng để chứa Logic xử lý data (như gọi API lấy khóa học, xử lý đăng nhập) tách biệt hoàn toàn khỏi giao diện HTML.

```bash
ng generate service services/api
```

### 3. Build Code Đẩy Lên Mạng
Lệnh này nén toàn bộ HTML, CSS và JavaScript của web lại ở dạng siêu tối ưu nhất, phục vụ việc tung lên Vercel, Netlify hoặc đưa cho Backend:

```bash
npm run build
# Các file nén xịn xò sẽ trả về trong thư mục `/dist/frontend/browser/`
```
