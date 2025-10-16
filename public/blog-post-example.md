---
title: "Hướng dẫn sử dụng Next.js 14 với App Router"
slug: "huong-dan-nextjs-14-app-router"
excerpt: "Tìm hiểu cách sử dụng App Router mới trong Next.js 14 với các tính năng Server Components, Streaming và nhiều hơn nữa."
tags: ["nextjs", "javascript", "tutorial"]
status: "DRAFT"
---

## Giới thiệu

Next.js 14 đã ra mắt với nhiều cải tiến quan trọng, đặc biệt là **App Router** - một cách tiếp cận hoàn toàn mới để xây dựng ứng dụng React. Trong bài viết này, chúng ta sẽ tìm hiểu cách sử dụng App Router và các tính năng mới.

## Tại sao nên dùng App Router?

App Router mang lại nhiều lợi ích:

- **Server Components** mặc định giúp tối ưu hiệu suất
- **Streaming** cho phép render từng phần trang web
- **Layouts** dễ dàng tái sử dụng
- **Loading states** và error handling tốt hơn

## Cài đặt Next.js 14

Để bắt đầu, chạy lệnh sau:

```bash
npx create-next-app@latest my-app
cd my-app
npm run dev
```

## Cấu trúc thư mục

Trong App Router, cấu trúc thư mục của bạn sẽ như sau:

```plaintext
app/
├── layout.tsx      # Root layout
├── page.tsx        # Home page
├── about/
│   └── page.tsx    # About page
└── blog/
    ├── layout.tsx  # Blog layout
    └── [slug]/
        └── page.tsx # Dynamic blog post
```

## Server Components vs Client Components

### Server Components

Server Components render trên server, giúp giảm bundle size:

```typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts');
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  
  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

### Client Components

Client Components cần khi sử dụng hooks hoặc browser APIs:

```typescript
'use client'

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

## Layouts và Templates

Layouts cho phép chia sẻ UI giữa nhiều pages:

```typescript
// app/blog/layout.tsx
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="blog-container">
      <nav>
        <a href="/blog">All Posts</a>
        <a href="/blog/categories">Categories</a>
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

## Loading States

Tạo `loading.tsx` để hiển thị loading state:

```typescript
// app/blog/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}
```

## Error Handling

Xử lý lỗi với `error.tsx`:

```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## Dynamic Routes

Tạo dynamic routes với folder `[param]`:

```typescript
// app/blog/[slug]/page.tsx
interface PageProps {
  params: { slug: string }
}

export default async function BlogPost({ params }: PageProps) {
  const post = await getPost(params.slug);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}

// Generate static paths
export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

## Metadata và SEO

Next.js 14 cung cấp API mới cho metadata:

```typescript
// app/blog/[slug]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const post = await getPost(params.slug);
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}
```

## Best Practices

### 1. Sử dụng Server Components khi có thể

> **Tip:** Chỉ dùng `'use client'` khi thực sự cần thiết.

### 2. Optimize Images

```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
/>
```

### 3. Streaming với Suspense

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<LoadingSkeleton />}>
        <Posts />
      </Suspense>
    </>
  );
}
```

## Kết luận

App Router trong Next.js 14 mang lại nhiều cải tiến:

1. **Performance** tốt hơn với Server Components
2. **Developer Experience** được cải thiện
3. **SEO** và metadata dễ quản lý hơn

### Next Steps

- Đọc [Next.js Documentation](https://nextjs.org/docs)
- Thực hành với [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- Tham gia [Next.js Discord](https://nextjs.org/discord)

## Tài liệu tham khảo

- [Next.js 14 Release Notes](https://nextjs.org/blog/next-14)
- [App Router Documentation](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

