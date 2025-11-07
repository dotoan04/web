# Hướng dẫn tạo đề mẫu cho dạng Ghép cặp và Điền từ

## File mẫu
File `de-mau-ghep-cap-va-dien-tu.docx.txt` chứa các ví dụ về format đúng cho cả hai loại câu hỏi.

## 1. Dạng Ghép cặp (Matching)

### Format:
```
Câu X: [Tiêu đề câu hỏi]:
[Item 1] → A. [Mô tả 1]
[Item 2] → B. [Mô tả 2]
[Item 3] → C. [Mô tả 3]
...
```

### Ví dụ:
```
Câu 1: Kéo và thả để ghép các thuật ngữ công nghệ với định nghĩa tương ứng:
HTML → A. Ngôn ngữ đánh dấu siêu văn bản dùng để tạo cấu trúc trang web
CSS → B. Ngôn ngữ định kiểu dùng để trang trí và bố cục trang web
JavaScript → C. Ngôn ngữ lập trình phía client dùng để tạo tương tác động
API → D. Giao diện lập trình ứng dụng cho phép các hệ thống giao tiếp với nhau
```

### Lưu ý:
- Có thể đặt tất cả các cặp trên cùng một dòng với title (cách nhau bằng dấu cách)
- Hoặc đặt mỗi cặp trên một dòng riêng (khuyến nghị)
- Sử dụng ký tự mũi tên `→` (không phải `->` hay `=>`)
- Cần ít nhất 2 cặp để được nhận diện là matching question
- Có thể dùng bullet points (`•`, `●`, `▪`) trước mỗi cặp

## 2. Dạng Điền từ vào chỗ trống (Fill-in-the-blank)

### Format:
```
Câu X: [Câu hỏi kết thúc bằng dấu ?] [Đáp án]
```

### Ví dụ:
```
Câu 3: Ba loại dịch vụ cơ bản của điện toán đám mây được gọi chung là mô hình gì? SPI

Câu 4: Đâu là công nghệ bảo mật được sử dụng rộng rãi nhất trong ứng dụng SaaS? SSL

Câu 5: Ngôn ngữ lập trình nào được sử dụng phổ biến nhất để phát triển ứng dụng web? JavaScript
```

### Lưu ý:
- Câu hỏi phải kết thúc bằng dấu `?`
- Đáp án ngay sau dấu `?`, cách nhau bằng một hoặc nhiều khoảng trắng
- Đáp án tối đa 80 ký tự
- Đáp án có thể chứa chữ cái, số, dấu ngoặc, dấu gạch chéo, dấu chấm, khoảng trắng

## Cách sử dụng

1. **Tạo file Word (.docx)**:
   - Mở Microsoft Word hoặc Google Docs
   - Copy nội dung từ file `de-mau-ghep-cap-va-dien-tu.docx.txt`
   - Paste vào Word và lưu thành file `.docx`

2. **Hoặc dùng file text trực tiếp**:
   - File text có thể được import trực tiếp qua chức năng "Dán văn bản"

3. **Test parser**:
   ```bash
   npx tsx scripts/test-sample-questions.ts
   ```

## Kiểm tra kết quả

Sau khi import, kiểm tra:
- ✅ Câu hỏi matching có type = "MATCHING" và số options là số chẵn (2 cặp = 4 options, 3 cặp = 6 options, ...)
- ✅ Câu hỏi fill-in-blank có type = "FILL_IN_BLANK" và có 1 option chứa đáp án đúng

