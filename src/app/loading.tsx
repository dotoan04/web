export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-ink-200 border-t-ink-900 dark:border-ink-700 dark:border-t-ink-100" />
        </div>
        <p className="text-sm text-ink-500 dark:text-ink-400">Đang tải...</p>
      </div>
    </div>
  )
}

