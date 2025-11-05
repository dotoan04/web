# Hướng dẫn Sử dụng Câu hỏi Ghép cặp (Matching Questions)

## Tổng quan
Tính năng mới cho phép tạo câu hỏi dạng ghép cặp, giống như câu 30, 31, 32, 33 trong tài liệu. Người dùng cần ghép các mục từ cột trái với cột phải, với cột phải được đảo thứ tự ngẫu nhiên.

## Cách tạo câu hỏi Ghép cặp

### Trong Admin Panel

1. **Truy cập trang tạo/chỉnh sửa quiz**: `/admin/quizzes/[id]` hoặc `/admin/quizzes/new`

2. **Thêm câu hỏi ghép cặp**:
   - Nhấn nút **"+ Câu ghép cặp"** trong phần "Câu hỏi"
   - Hoặc chọn loại câu hỏi **"Ghép cặp"** cho câu hỏi hiện có

3. **Nhập các cặp**:
   - Mỗi cặp có 2 mục: **Bên trái** và **Bên phải**
   - Ví dụ:
     ```
     Cặp 1:
     - Trái: K-means
     - Phải: Có thể phân đoạn ảnh màu
     
     Cặp 2:
     - Trái: Watershed
     - Phải: Phù hợp với ảnh có biên rõ
     
     Cặp 3:
     - Trái: Ngưỡng hóa
     - Phải: Nhanh, đơn giản, tính toán thấp
     ```

4. **Thêm/Xóa cặp**:
   - Nhấn **"+ Thêm cặp"** để thêm cặp mới
   - Nhấn **"Xoá cặp"** để xóa cặp (tối thiểu 2 cặp)

5. **Lưu quiz**: Nhấn **"Lưu quiz"** để hoàn tất

## Cách người dùng trả lời

1. **Khi làm bài**:
   - Cột trái hiển thị các mục theo thứ tự gốc
   - Cột phải hiển thị các mục **đã được đảo thứ tự ngẫu nhiên**
   - Hướng dẫn: "💡 Nhấp vào mục bên trái, sau đó nhấp vào mục bên phải để ghép cặp"

2. **Quy trình ghép**:
   - Bước 1: Nhấp vào một mục bên trái (mục sẽ được highlight màu xanh)
   - Bước 2: Nhấp vào mục tương ứng bên phải để tạo cặp
   - Khi ghép thành công, cặp sẽ được đánh dấu với biểu tượng ✓
   - Có thể thay đổi ghép bằng cách nhấp lại vào mục trái và chọn mục phải khác

3. **Kết quả**:
   - ✅ **Màu xanh lá**: Cặp đúng
   - ❌ **Màu đỏ**: Cặp sai
   - 💙 **Màu xanh da trời**: Đáp án đúng nhưng chưa chọn

## Cấu trúc dữ liệu

### Trong Database
- Các options được lưu theo thứ tự: `[Trái1, Phải1, Trái2, Phải2, ...]`
- Options có index chẵn (0, 2, 4...) là mục bên trái
- Options có index lẻ (1, 3, 5...) là mục bên phải
- Cặp đúng: `option[0]` ghép với `option[1]`, `option[2]` ghép với `option[3]`, v.v.

### Định dạng câu trả lời
- Mỗi câu trả lời được lưu dưới dạng chuỗi: `"leftOptionId:rightOptionId"`
- Ví dụ: `["clx123abc:cly456def", "clx789ghi:cly012jkl"]`

### Validation
- Câu hỏi ghép cặp phải có ít nhất 4 options (2 cặp)
- Số lượng options phải là số chẵn
- Tất cả options trong câu ghép cặp đều được đánh dấu `isCorrect: true` (vì tính đúng/sai dựa trên việc ghép cặp)

## Ví dụ hoàn chỉnh

```javascript
// Câu hỏi trong database
{
  id: "clx12345",
  title: "Ghép phương pháp với ưu điểm",
  type: "MATCHING",
  points: 1,
  options: [
    { id: "opt1", text: "K-means", isCorrect: true, order: 0 },         // Trái 1
    { id: "opt2", text: "Phân đoạn ảnh màu", isCorrect: true, order: 1 }, // Phải 1
    { id: "opt3", text: "Watershed", isCorrect: true, order: 2 },        // Trái 2
    { id: "opt4", text: "Ảnh có biên rõ", isCorrect: true, order: 3 },   // Phải 2
    { id: "opt5", text: "Ngưỡng hóa", isCorrect: true, order: 4 },       // Trái 3
    { id: "opt6", text: "Nhanh, đơn giản", isCorrect: true, order: 5 }   // Phải 3
  ]
}

// Câu trả lời đúng
{
  "clx12345": [
    "opt1:opt2",  // K-means -> Phân đoạn ảnh màu
    "opt3:opt4",  // Watershed -> Ảnh có biên rõ
    "opt5:opt6"   // Ngưỡng hóa -> Nhanh, đơn giản
  ]
}
```

## Lưu ý kỹ thuật

1. **Shuffle Logic**: Chỉ cột phải được đảo, cột trái giữ nguyên thứ tự để dễ tham chiếu
2. **State Management**: Sử dụng localStorage để lưu tiến độ làm bài
3. **Scoring**: Chỉ được điểm khi TẤT CẢ các cặp đều đúng
4. **UI/UX**: Sử dụng màu sắc và icons để phân biệt trạng thái (đang chọn, đã ghép, đúng, sai)

## Các file đã thay đổi

1. **prisma/schema.prisma**: Thêm `MATCHING` vào enum `QuizQuestionType`
2. **src/lib/validators/quiz.ts**: Cập nhật validation cho câu hỏi ghép cặp
3. **src/components/admin/quiz-form.tsx**: UI tạo câu hỏi ghép cặp
4. **src/components/quiz/quiz-playground.tsx**: UI làm bài và logic scoring

## Migration

Migration đã được tạo: `20251105144004_add_matching_question_type`

```bash
# Để apply migration:
npx prisma migrate dev
```

## Testing

Để test tính năng:
1. Tạo một quiz mới
2. Thêm câu hỏi ghép cặp với ít nhất 2 cặp
3. Lưu quiz và publish
4. Làm bài quiz và kiểm tra:
   - Cột phải có bị đảo không
   - Có ghép được cặp không
   - Kết quả có chính xác không
   - Màu sắc hiển thị đúng không
