"use client"

import Giscus from '@giscus/react'

const repo = process.env.NEXT_PUBLIC_GISCUS_REPO
const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID
const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY
const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID

type GiscusThreadProps = {
  mapping: string
}

export const GiscusThread = ({ mapping }: GiscusThreadProps) => {
  if (!repo || !repoId || !category || !categoryId) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white/70 p-6 text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300">
        Bình luận chưa được bật. Thiết lập các biến môi trường <code>NEXT_PUBLIC_GISCUS_*</code> để kết nối Giscus.
      </div>
    )
  }

  return (
    <Giscus
      repo={repo as `${string}/${string}`}
      repoId={repoId}
      category={category}
      categoryId={categoryId}
      mapping="specific"
      term={mapping}
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme="preferred_color_scheme"
      lang="vi"
      loading="lazy"
      strict="1"
    />
  )
}

const GiscusThreadDefault = GiscusThread

export default GiscusThreadDefault
