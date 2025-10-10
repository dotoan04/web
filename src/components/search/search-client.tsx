"use client"

import { useEffect, useMemo, useState } from 'react'
import MiniSearch from 'minisearch'
import Link from 'next/link'

import type { SearchDocument } from '@/lib/search-index'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type SearchResult = SearchDocument & {
  score: number
}

const SEARCH_PLACEHOLDER = 'Tìm kiếm bài viết, chủ đề, thẻ…'

export const SearchClient = () => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [documents, setDocuments] = useState<SearchDocument[]>([])

  const miniSearch = useMemo(() => {
    if (!documents.length) return null
    const instance = new MiniSearch<SearchDocument>({
      fields: ['title', 'excerpt', 'content', 'tags', 'category'],
      storeFields: ['slug', 'title', 'excerpt', 'category', 'tags', 'publishedAt'],
      searchOptions: {
        prefix: true,
        boost: { title: 4, tags: 2, category: 1.5 },
        fuzzy: 0.2,
      },
    })
    instance.addAll(documents)
    return instance
  }, [documents])

  useEffect(() => {
    let ignore = false
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/search-index', { cache: 'no-store' })
        if (!response.ok) throw new Error('Không thể tải dữ liệu tìm kiếm')
        const payload = (await response.json()) as SearchDocument[]
        if (!ignore) setDocuments(payload)
      } catch (error) {
        console.error('Load search index failed', error)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!miniSearch) {
      setResults([])
      return
    }
    if (!query.trim()) {
      setResults([])
      return
    }
    const hits = miniSearch.search(query.trim()).map((hit) => ({
      ...(hit as unknown as SearchDocument),
      score: hit.score ?? 0,
    }))
    setResults(hits as SearchResult[])
  }, [miniSearch, query])

  return (
    <div className="flex flex-col gap-10">
      <div className="rounded-[2.5rem] border border-ink-100 bg-white/80 p-10 shadow-[0_20px_50px_rgba(27,20,14,0.08)] backdrop-blur-xl dark:border-ink-700 dark:bg-ink-800/70 dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <h1 className="font-display text-3xl text-ink-900 dark:text-ink-100">Tìm kiếm BlogVibe</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-500 dark:text-ink-300">
          Nhập vài từ khóa để khám phá các bài viết, ghi chú và chuyên mục. Hỗ trợ tìm kiếm tiêu đề, trích đoạn, thẻ và nội dung.
        </p>
        <div className="mt-6 rounded-3xl border border-ink-100 bg-white/90 p-4 shadow-inner dark:border-ink-700 dark:bg-ink-900/70">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={loading ? 'Đang tải dữ liệu tìm kiếm…' : SEARCH_PLACEHOLDER}
            disabled={loading}
            className="h-14 border-none text-lg focus-visible:ring-0"
          />
        </div>
      </div>

      {query.trim() && results.length === 0 ? (
        <div className="rounded-3xl border border-ink-100 bg-white/70 p-8 text-center text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300">
          Không tìm thấy kết quả. Hãy thử với từ khóa khác hoặc kiểm tra chính tả.
        </div>
      ) : null}

      <div className="grid gap-6">
        {results.map((item) => (
          <article
            key={item.id}
            className="rounded-3xl border border-ink-100 bg-white/85 p-6 shadow-[0_15px_35px_rgba(27,20,14,0.08)] transition hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(27,20,14,0.1)] dark:border-ink-700 dark:bg-ink-800/70 dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-300">
              <span>{new Date(item.publishedAt).toLocaleDateString('vi-VN')}</span>
              {item.category ? <span>{item.category}</span> : null}
              <span>Độ phù hợp {(item.score * 100).toFixed(0)}%</span>
            </div>
            <h2 className="mt-3 font-display text-2xl text-ink-900 transition hover:text-ink-600 dark:text-ink-100 dark:hover:text-ink-200">
              <Link href={`/bai-viet/${item.slug}`}>{item.title}</Link>
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-300">{item.excerpt}</p>
            {item.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="border-ink-200/60 bg-white/70 text-xs uppercase tracking-[0.25em] text-ink-500 dark:border-ink-600 dark:bg-ink-800/60 dark:text-ink-200"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}
