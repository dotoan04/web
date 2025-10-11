const endpoint = process.env.NEXT_PUBLIC_SUBSCRIBE_ENDPOINT
const placeholder = process.env.NEXT_PUBLIC_SUBSCRIBE_PLACEHOLDER ?? 'Nhập email của bạn'

type SubscriptionBannerProps = {
  siteName: string
}

export const SubscriptionBanner = ({ siteName }: SubscriptionBannerProps) => (
  <section className="rounded-[2.5rem] border border-ink-100 bg-white/80 p-8 shadow-[0_18px_45px_rgba(33,38,94,0.12)] backdrop-blur-xl dark:border-ink-700 dark:bg-ink-800/60 dark:shadow-[0_18px_45px_rgba(9,11,38,0.45)]">
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="font-display text-3xl text-ink-900 dark:text-ink-100">Nhận thư từ {siteName}</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-500 dark:text-ink-300">
          Cập nhật câu chuyện mới nhất và các ghi chú chuyên sâu qua email. Không spam, chỉ những điều đáng đọc.
        </p>
      </div>
      {endpoint ? (
        <form action={endpoint} method="post" className="flex w-full max-w-xl flex-col gap-3 md:flex-row md:items-center">
          <input
            type="email"
            name="email"
            required
            className="h-12 flex-1 rounded-full border border-ink-200 bg-white px-5 text-sm text-ink-700 shadow-inner focus:border-ink-400 focus:outline-none dark:border-ink-600 dark:bg-ink-900/70 dark:text-ink-100"
            placeholder={placeholder}
          />
          <button
            type="submit"
            className="h-12 rounded-full bg-ink-900 px-6 text-sm font-medium text-ink-50 transition hover:bg-ink-700 dark:bg-ink-100 dark:text-ink-900 dark:hover:bg-ink-200"
          >
            Đăng ký
          </button>
        </form>
      ) : (
        <p className="rounded-2xl border border-dashed border-ink-200 px-4 py-3 text-sm text-ink-500 dark:border-ink-600 dark:text-ink-300">
          Thiết lập biến <code>NEXT_PUBLIC_SUBSCRIBE_ENDPOINT</code> để kích hoạt form đăng ký. Tạm thời bạn có thể gửi
          email tới <a className="underline" href="mailto:dotoan159@gmail.com">dotoan159@gmail.com</a>.
        </p>
      )}
    </div>
  </section>
)
