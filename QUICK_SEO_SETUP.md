# Quick SEO Setup - 5 phút để Google index website

## 🚀 Các bước cần làm NGAY

### 1. Kiểm tra Domain trong code (30 giây)

**File: `src/lib/metadata.ts` line 7-9**

```typescript
const appUrl = process.env.NODE_ENV === 'production'
  ? 'https://thetoan.id.vn'  // ← THAY ĐỔI DOMAIN NÀY!
  : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
```

**Thay bằng domain thật của bạn:**
```typescript
  ? 'https://your-actual-domain.com'  // ← Domain production của bạn
```

### 2. Deploy website lên production (đã có)

Đảm bảo website đang chạy ở domain production.

### 3. Kiểm tra các URLs quan trọng hoạt động

Mở browser, test các URLs sau (thay `thetoan.id.vn` bằng domain bạn):

```
✅ https://thetoan.id.vn
✅ https://thetoan.id.vn/robots.txt
✅ https://thetoan.id.vn/sitemap.xml
```

**Nếu có lỗi 404 hoặc 500** → Liên hệ hosting support hoặc check deployment.

### 4. Google Search Console - Verify Domain (3 phút)

1. **Vào:** https://search.google.com/search-console
2. **Click:** "Add Property" → "URL prefix"
3. **Nhập domain:** `https://thetoan.id.vn`
4. **Chọn phương pháp verify:** HTML file (đơn giản nhất)

#### Phương pháp HTML file:
- Google cho file `googleXXXXXXXX.html`
- Tải về
- Copy file vào folder: `public/`
- Deploy lại website
- Click "Verify" trong Google Search Console

**HOẶC** sử dụng Meta tag (không cần deploy lại):

1. Google cho code: `<meta name="google-site-verification" content="YOUR_CODE" />`
2. Tạo file `.env.local` trong project root
3. Thêm dòng:
   ```
   NEXT_PUBLIC_GOOGLE_VERIFICATION="YOUR_CODE_HERE"
   ```
4. Deploy lại website
5. Click "Verify"

### 5. Submit Sitemap (1 phút)

Sau khi verify thành công:

1. Trong Google Search Console
2. Menu bên trái → **Sitemaps**
3. Nhập: `sitemap.xml`
4. Click **Submit**

### 6. Request Index trang chủ (1 phút)

1. Google Search Console → **URL Inspection** (menu trái)
2. Nhập URL: `https://thetoan.id.vn`
3. Click **"Request Indexing"**

---

## ✅ Xong! 

Đợi **3-7 ngày** để Google crawl và index website.

## 🔍 Kiểm tra kết quả

### Sau 24 giờ:
```
site:thetoan.id.vn
```
Tìm trên Google. Nếu thấy kết quả = thành công! 🎉

### Theo dõi trong Google Search Console:
- **Coverage** → Xem bao nhiêu trang đã index
- **Performance** → Xem traffic từ Google

---

## ⚠️ Nếu sau 2 tuần vẫn không có kết quả

Đọc file: **`GOOGLE_SEO_GUIDE.md`** để troubleshoot chi tiết.

## 💡 Tips tăng tốc indexing

1. **Share links trên social media** (Facebook, Twitter, LinkedIn)
2. **Post link trong forums** (Reddit, Quora) liên quan
3. **Viết 5-10 bài viết chất lượng** trước khi submit
4. **Update nội dung thường xuyên** (ít nhất 1 tuần 1 bài)

---

**Checklist nhanh:**
- [ ] Sửa domain trong `src/lib/metadata.ts`
- [ ] Deploy website
- [ ] Test robots.txt và sitemap.xml
- [ ] Verify domain trong Google Search Console
- [ ] Submit sitemap
- [ ] Request indexing trang chủ
- [ ] Đợi 3-7 ngày
- [ ] Check `site:domain.com` trên Google
