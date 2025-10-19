type StructuredDataProps = {
  data: Record<string, unknown>
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

type WebsiteStructuredDataProps = {
  name: string
  description: string
  url: string
}

export function WebsiteStructuredData({ name, description, url }: WebsiteStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    description,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/tim-kiem?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return <StructuredData data={data} />
}

type BlogPostStructuredDataProps = {
  title: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  authorName: string
  imageUrl?: string
}

export function BlogPostStructuredData({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName,
  imageUrl,
}: BlogPostStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
      },
    }),
  }

  return <StructuredData data={data} />
}

type BreadcrumbStructuredDataProps = {
  items: Array<{
    name: string
    url: string
  }>
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <StructuredData data={data} />
}
