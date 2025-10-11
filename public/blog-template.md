---
title: "Tiêu đề bài viết của bạn"
slug: ""
excerpt: "Mô tả ngắn gọn về bài viết (hiển thị trong danh sách và SEO)"
status: "DRAFT"
---

## Giới thiệu

Viết phần giới thiệu hấp dẫn để thu hút người đọc. Đoạn đầu tiên nên tóm tắt nội dung chính và lý do tại sao người đọc nên quan tâm.

## Phần 1: Nội dung chính

Trình bày ý tưởng chính của bạn. Sử dụng **in đậm** để nhấn mạnh và *in nghiêng* để đặc biệt.

### Ví dụ code

Nếu là bài technical, thêm code examples:

```javascript
function example() {
  console.log("Hello World");
  return true;
}

// Sử dụng function
example();
```

### Danh sách các điểm quan trọng

- Điểm thứ nhất với giải thích chi tiết
- Điểm thứ hai cũng quan trọng không kém
- Điểm thứ ba để kết thúc phần này

## Phần 2: Đi sâu vào chi tiết

Phát triển ý tưởng của bạn với nhiều chi tiết hơn.

### Ordered list cho các bước

1. Bước đầu tiên cần làm
2. Bước thứ hai tiếp theo
3. Bước cuối cùng để hoàn thành

### Inline code và links

Để cài đặt package, chạy lệnh `npm install package-name` trong terminal.

Tham khảo thêm tại [Official Documentation](https://example.com).

### Code block với ngôn ngữ khác

```python
def calculate(x, y):
    """Hàm tính toán đơn giản"""
    return x + y

result = calculate(5, 3)
print(f"Kết quả: {result}")
```

## Phần 3: Thực hành

> **Lưu ý quan trọng:** Đây là một trích dẫn hoặc ghi chú quan trọng mà bạn muốn nhấn mạnh.

Giải thích cách áp dụng những gì đã học:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const createUser = (data: User): User => {
  console.log("Creating user:", data);
  return data;
};
```

## Kết luận

Tóm tắt lại những điểm chính:

1. **Điểm chính 1**: Tóm tắt ngắn gọn
2. **Điểm chính 2**: Takeaway quan trọng
3. **Điểm chính 3**: Action items cho người đọc

### Next steps

- Hành động tiếp theo người đọc nên làm
- Tài nguyên để tìm hiểu thêm
- Lời khuyến khích

## Tài liệu tham khảo

- [Link 1](https://example.com) - Mô tả tài liệu
- [Link 2](https://example.com) - Nguồn tham khảo
- [Link 3](https://example.com) - Đọc thêm

---

## 📝 Hướng dẫn sử dụng template

### Metadata (Frontmatter)

Phần giữa `---` và `---` ở đầu file là metadata:

- **title** (bắt buộc): Tiêu đề bài viết
- **slug** (tùy chọn): URL slug, để trống để tự tạo từ title
- **excerpt** (khuyến nghị): Mô tả ngắn cho SEO và preview
- **status** (mặc định DRAFT): 
  - `DRAFT` - Bản nháp
  - `PUBLISHED` - Xuất bản ngay
  - `SCHEDULED` - Hẹn giờ xuất bản

### Metadata nâng cao (tùy chọn)

Bạn có thể thêm các field sau:

```yaml
---
title: "Tiêu đề"
slug: "tieu-de-url"
excerpt: "Mô tả"
status: "DRAFT"
categoryId: ""
tagIds: []
coverImageId: ""
publishedAt: ""
---
```

**Lấy IDs:**
- `categoryId`: Admin → Categories → Copy ID
- `tagIds`: Admin → Tags → Copy IDs
- `coverImageId`: Admin → Media → Upload → Copy ID

**publishedAt format:**
```
publishedAt: "2024-10-11T10:00:00"
```

### Markdown Syntax

#### Headings
```markdown
# H1 (không dùng trong content)
## H2 - Section chính
### H3 - Subsection
#### H4 - Sub-subsection
```

#### Text formatting
```markdown
**Bold text**
*Italic text*
`Inline code`
```

#### Links
```markdown
[Link text](https://url.com)
```

#### Lists
```markdown
- Unordered
- Items

1. Ordered
2. Items
```

#### Code blocks
````markdown
```language
code here
```
````

Supported languages: javascript, typescript, python, java, go, rust, html, css, bash, json, sql, php, ruby, v.v.

#### Blockquotes
```markdown
> This is a quote
```

### Tips viết bài hay

1. **Mở đầu hấp dẫn**: Hook người đọc ngay câu đầu
2. **Cấu trúc rõ ràng**: Dùng headings để chia sections
3. **Ví dụ cụ thể**: Code, screenshots, real-world examples
4. **Kết luận mạnh**: Tóm tắt và call-to-action
5. **SEO-friendly**: Excerpt tốt, headings có từ khóa

### Quy trình đăng bài

1. **Viết content** trong file .md này
2. **Vào Admin** → Posts → New Post
3. **Click "Import Markdown"** và chọn file
4. **Review** content trong editor
5. **Chọn Category & Tags** (nếu chưa có trong frontmatter)
6. **Upload ảnh bìa** (tùy chọn) tại Media Library
7. **Set status** và publishedAt nếu cần
8. **Click "Lưu bài viết"**

### Common mistakes to avoid

❌ Không có excerpt → SEO không tốt
❌ Title quá ngắn (< 3 chars) → Validation error
❌ Không có headings → Không có Table of Contents
❌ categoryId/tagIds không đúng format → Validation error
❌ Code blocks không chỉ định language → Không có syntax highlighting

✅ Luôn điền excerpt
✅ Title rõ ràng, dài đủ
✅ Dùng H2, H3, H4 cho structure
✅ Copy đúng IDs từ admin panel
✅ Chỉ định language cho code blocks

