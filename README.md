# Portfolio

Next.js 16 · Tailwind CSS 4. Đang làm lại giao diện mới.

> Bộ component của bản cũ "THE CODER" (phim, neon, three.js) đã được tách ra `~/portfolio-kit` — xem README ở đó.
> Thư viện gsap, @gsap/react, lenis, three, @react-three/fiber vẫn còn cài sẵn nếu muốn dùng lại kit.

## Chạy

```bash
npm run dev     # http://localhost:3000
```

## Sửa nội dung

Toàn bộ chữ, dự án, kinh nghiệm... nằm trong **`src/data/portfolio.json`** — chỉ cần sửa file này.

| Khóa          | Nội dung                                                      |
| ------------- | ------------------------------------------------------------- |
| `profile`     | Tên, vai trò, email, avatar, link CV, mạng xã hội              |
| `intro`       | Đoạn mở đầu phim (`enabled`, `oncePerSession` để bật/tắt)      |
| `about`       | Chương 01 — câu chuyện, sở thích, số liệu                      |
| `skills`      | Chương 02 — nhóm kỹ năng (màu `color` dạng hex)                |
| `projects`    | Chương 03 — dự án; `image` để trống sẽ tự tạo "poster"          |
| `journey`     | Chương 04 — `type`: `"work"` hoặc `"education"`                |
| `contact`     | Chương 05 — lời kêu gọi liên hệ                                |
| `credits`     | End credits + cảnh hậu credit                                 |
| `ui`          | Nhãn nút, chữ giao diện                                       |

Ảnh (avatar, ảnh dự án) và CV đặt trong `public/`, ví dụ `public/cv.pdf` → `"resume": "/cv.pdf"`, `public/projects/shop.png` → `"image": "/projects/shop.png"`.
