import { renderRichText } from '@/lib/render-html'
import { absoluteUrl, siteConfig } from '@/lib/metadata'
import { getPublishedPosts } from '@/server/posts'

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export const buildRssFeed = async () => {
  const posts = await getPublishedPosts()
  const entries = await Promise.all(
    posts.map(async (post) => {
      const { html } = await renderRichText(post.content as Record<string, unknown>)
      return {
        title: post.title,
        link: absoluteUrl(`/bai-viet/${post.slug}`),
        description: post.excerpt || siteConfig.description,
        content: html,
        pubDate: new Date(post.publishedAt ?? post.createdAt).toUTCString(),
        updated: new Date(post.updatedAt ?? post.publishedAt ?? post.createdAt).toUTCString(),
      }
    })
  )

  const itemsXml = entries
    .map(
      (entry) => `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(entry.link)}</link>
      <guid>${escapeXml(entry.link)}</guid>
      <description><![CDATA[${entry.description}]]></description>
      <content:encoded><![CDATA[${entry.content}]]></content:encoded>
      <pubDate>${entry.pubDate}</pubDate>
      <lastBuildDate>${entry.updated}</lastBuildDate>
    </item>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${escapeXml(siteConfig.url)}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>vi</language>
${itemsXml}
  </channel>
</rss>`
}

export const buildJsonFeed = async () => {
  const posts = await getPublishedPosts()
  const items = await Promise.all(
    posts.map(async (post) => {
      const { html } = await renderRichText(post.content as Record<string, unknown>)
      return {
        id: absoluteUrl(`/bai-viet/${post.slug}`),
        url: absoluteUrl(`/bai-viet/${post.slug}`),
        title: post.title,
        summary: post.excerpt ?? siteConfig.description,
        content_html: html,
        date_published: new Date(post.publishedAt ?? post.createdAt).toISOString(),
        date_modified: new Date(post.updatedAt ?? post.publishedAt ?? post.createdAt).toISOString(),
      }
    })
  )

  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: siteConfig.name,
    home_page_url: siteConfig.url,
    feed_url: absoluteUrl('/feed.json'),
    description: siteConfig.description,
    language: 'vi',
    items,
  }
}
