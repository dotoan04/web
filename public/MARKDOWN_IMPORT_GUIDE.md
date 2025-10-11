# 📝 Hướng dẫn Import Markdown/MDX vào Blog

## 🚀 Tính năng mới: Import Markdown

Bạn có thể import file Markdown (`.md`, `.mdx`, `.markdown`) trực tiếp vào form đăng bài viết!

## 📋 Cách sử dụng

### Bước 1: Chuẩn bị file Markdown

Tạo file `.md` hoặc `.mdx` với cấu trúc:

```markdown
---
title: "Tiêu đề bài viết"
slug: "duong-dan-url"
excerpt: "Mô tả ngắn"
status: "DRAFT"
categoryId: "id-cua-chuyen-muc"
tagIds: ["tag-id-1", "tag-id-2"]
coverImageId: "id-cua-anh-bia"
publishedAt: "2024-10-11T10:00:00"
---

# Nội dung bài viết

Viết nội dung của bạn ở đây...
```

### Bước 2: Import vào Admin

1. Vào **Admin → Posts → New Post**
2. Click nút **"Import Markdown"** ở góc phải trên
3. Chọn file `.md` hoặc `.mdx` của bạn
4. Hệ thống sẽ tự động:
   - Parse metadata từ frontmatter
   - Chuyển đổi markdown thành rich text
   - Điền vào form
5. Kiểm tra và chỉnh sửa nếu cần
6. Click **"Lưu bài viết"**

## 📁 Templates có sẵn

### 1. Template đầy đủ: `blog-post-template.mdx`

File template chi tiết với:
- Tất cả các metadata fields
- Ví dụ về formatting
- Code blocks với syntax highlighting
- Hình ảnh và links
- Tables và lists
- Hướng dẫn chi tiết

**Download:** `/blog-post-template.mdx`

### 2. Template đơn giản: `blog-post-simple-template.md`

File template tối giản để bắt đầu nhanh:
- Metadata cơ bản
- Cấu trúc đơn giản
- Dễ chỉnh sửa

**Download:** `/blog-post-simple-template.md`

## 📖 Frontmatter Fields

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|---------|-------|-------|
| `title` | Có | Tiêu đề bài viết | "Hướng dẫn Next.js" |
| `slug` | Không | URL slug (tự tạo nếu trống) | "huong-dan-nextjs" |
| `excerpt` | Không | Mô tả ngắn cho SEO | "Tìm hiểu Next.js..." |
| `status` | Không | DRAFT/PUBLISHED/SCHEDULED | "DRAFT" |
| `categoryId` | Không | ID chuyên mục | "uuid-string" |
| `tagIds` | Không | Mảng ID các thẻ | ["id1", "id2"] |
| `coverImageId` | Không | ID ảnh bìa | "uuid-string" |
| `publishedAt` | Không | Thời gian xuất bản | "2024-10-11T10:00" |

### Lấy IDs:

**CategoryId:**
```
Admin → Categories → Copy ID từ danh sách
```

**TagIds:**
```
Admin → Tags → Copy ID từ các thẻ muốn gắn
```

**CoverImageId:**
```
Admin → Media → Upload ảnh → Copy ID (không phải URL)
```

## 🎨 Markdown Syntax được hỗ trợ

### Text Formatting
```markdown
**Bold text**
*Italic text*
***Bold and italic***
`Inline code`
```

### Headings
```markdown
# H1
## H2
### H3
#### H4
```

### Lists
```markdown
- Unordered list
- Item 2

1. Ordered list
2. Item 2
```

### Links & Images
```markdown
[Link text](https://example.com)
![Alt text](image-url.jpg)
```

### Code Blocks
````markdown
```javascript
const greeting = "Hello World";
console.log(greeting);
```
````

### Blockquotes
```markdown
> This is a quote
> Multiple lines
```

### Tables
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
```

## 🔧 Các ngôn ngữ code được hỗ trợ

- JavaScript / TypeScript
- Python
- HTML / CSS
- JSON
- Bash / Shell
- SQL
- Go
- Rust
- Java
- C / C++
- PHP
- Ruby
- Và nhiều hơn nữa...

## 💡 Tips & Best Practices

### 1. Viết metadata đầy đủ
- Luôn điền `title` và `excerpt` cho SEO tốt
- Chọn `categoryId` phù hợp
- Gắn `tagIds` để dễ tìm kiếm

### 2. Tối ưu hình ảnh
- Upload ảnh lên Media Library trước
- Sử dụng `coverImageId` thay vì URL
- Alt text cho accessibility

### 3. Cấu trúc heading
- Chỉ dùng một H1 (`#`) cho tiêu đề chính
- Dùng H2 (`##`) cho các phần lớn
- H3 (`###`) cho các phần nhỏ

### 4. Code blocks
- Luôn chỉ định ngôn ngữ: ` ```javascript `
- Giữ code ngắn gọn và dễ hiểu
- Thêm comments giải thích

### 5. Internal links
- Link đến các bài viết khác
- Link đến categories/tags

## 🐛 Troubleshooting

### Import thất bại?

**1. Kiểm tra file encoding:**
- File phải là UTF-8
- Không có ký tự đặc biệt lỗi

**2. Kiểm tra frontmatter:**
- Phải bắt đầu và kết thúc với `---`
- YAML syntax phải đúng
- Strings có dấu phải đặt trong quotes

**3. IDs không hợp lệ:**
- CategoryId phải tồn tại trong hệ thống
- TagIds phải là array
- CoverImageId phải là ID của media đã upload

**4. Content không hiển thị đúng:**
- Kiểm tra markdown syntax
- Code blocks cần có closing backticks
- Links và images cần format đúng

### Một số trường không import?

Các trường trong frontmatter tùy chọn, chỉ cần `title` là bắt buộc. Các trường khác có thể điền sau khi import.

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log trong Developer Tools
2. Thử với template mẫu trước
3. Đảm bảo file markdown syntax đúng
4. Liên hệ admin nếu vẫn lỗi

## 🎉 Examples

### Ví dụ 1: Blog post về công nghệ
```markdown
---
title: "10 Tips để code React hiệu quả"
slug: "10-tips-code-react"
excerpt: "Khám phá 10 tips giúp bạn code React tốt hơn"
status: "PUBLISHED"
---

# 10 Tips để code React hiệu quả

React là thư viện UI phổ biến nhất hiện nay...
```

### Ví dụ 2: Tutorial with code
```markdown
---
title: "Hướng dẫn Next.js App Router"
slug: "huong-dan-nextjs-app-router"
excerpt: "Tìm hiểu về App Router mới trong Next.js 13+"
status: "DRAFT"
---

# Hướng dẫn Next.js App Router

## Setup

```bash
npx create-next-app@latest
```
```

---

**Chúc bạn viết blog vui vẻ! 🚀**

