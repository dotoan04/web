# 📝 Markdown Templates cho Blog

## Templates có sẵn

### 1. [Template đầy đủ](../blog-post-template.mdx)
`/blog-post-template.mdx`

File template chi tiết với:
- ✅ Tất cả metadata fields
- ✅ Ví dụ formatting đầy đủ
- ✅ Code blocks, images, tables
- ✅ Hướng dẫn chi tiết

**Phù hợp cho:** Bài viết dài, tutorial, technical blog

---

### 2. [Template đơn giản](../blog-post-simple-template.md)
`/blog-post-simple-template.md`

File template tối giản:
- ✅ Metadata cơ bản
- ✅ Cấu trúc đơn giản
- ✅ Dễ chỉnh sửa

**Phù hợp cho:** Bài viết ngắn, notes, quick posts

---

### 3. [Template chi tiết](../blog-template.md) ⭐ NEW
`/blog-template.md`

Template mới nhất với hướng dẫn đầy đủ:
- ✅ Frontmatter guide chi tiết
- ✅ Markdown syntax examples
- ✅ Tips & best practices
- ✅ Common mistakes to avoid
- ✅ Hướng dẫn tags (dùng tên thay vì ID)

**Phù hợp cho:** Tất cả loại bài viết, **recommended**

---

### 4. [Ví dụ thực tế](../blog-post-example.md) ⭐ NEW
`/blog-post-example.md`

Ví dụ bài viết hoàn chỉnh về Next.js:
- ✅ Frontmatter đúng format
- ✅ Tags sử dụng tên (không cần ID)
- ✅ Code blocks với nhiều ngôn ngữ
- ✅ Structure tốt cho SEO

**Phù hợp cho:** Tham khảo khi viết technical posts

---

### 5. [Hướng dẫn sử dụng](../MARKDOWN_IMPORT_GUIDE.md)
`/MARKDOWN_IMPORT_GUIDE.md`

Hướng dẫn chi tiết về:
- 📖 Cách import markdown
- 📋 Frontmatter fields
- 🎨 Markdown syntax
- 💡 Tips & best practices
- 🐛 Troubleshooting

---

## 🚀 Quick Start

1. Download template phù hợp (khuyến nghị `blog-template.md`)
2. Chỉnh sửa metadata và nội dung
3. Vào Admin → Posts → New Post
4. Click "Import Markdown"
5. Chọn file của bạn
6. Review content (tags sẽ tự động khớp theo tên)
7. Lưu bài viết!

## 🏷️ Tags: Sử dụng Tên thay vì IDs

**Update mới:** Giờ bạn có thể dùng tên tag trực tiếp!

```yaml
# ✅ Recommended - Dùng tên tag
tags: ["javascript", "tutorial", "nextjs"]

# ⚙️ Alternative - Dùng IDs
tagIds: ["clxxxxxxxxxxxxx", "clxxxxxxxxxxxxx"]
```

**Lợi ích:**
- Dễ đọc và dễ viết
- Không cần tra cứu IDs từ Admin
- Hệ thống tự động tìm và match (case-insensitive)
- Nếu tag không tồn tại, bạn sẽ được thông báo

## 🐛 Fixed Issues

### ✅ Tag Validation Error
**Trước đây:** Import markdown với tags bị lỗi "Invalid cuid"

**Bây giờ:** Hệ thống tự động:
- Convert tag names thành IDs
- Thông báo nếu tag không tìm thấy
- Cho phép chọn tags từ danh sách

### ✅ Service Worker Errors
**Trước đây:** Lỗi với Vercel analytics scripts

**Bây giờ:** Service worker skip caching cho external scripts

---

## 📍 Truy cập templates

Các templates nằm trong thư mục `public/`:

```
public/
├── blog-template.md                ⭐ (Template mới - Recommended)
├── blog-post-example.md            ⭐ (Ví dụ thực tế)
├── blog-post-template.mdx          (Template đầy đủ cũ)
├── blog-post-simple-template.md    (Template đơn giản)
├── MARKDOWN_IMPORT_GUIDE.md        (Hướng dẫn)
└── templates/
    └── README.md                    (File này)
```

Truy cập qua URL:
- https://your-domain.com/blog-post-template.mdx
- https://your-domain.com/blog-post-simple-template.md
- https://your-domain.com/MARKDOWN_IMPORT_GUIDE.md

---

**Happy blogging! 🎉**

