import defaultMdxComponents from 'fumadocs-ui/mdx'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://glyphic.cc'

function rewriteHref(href: string): string {
  return href.replace(/^https:\/\/glyphic\.cc/, APP_URL)
}

const a = ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const resolved = href ? rewriteHref(href) : href
  return <a href={resolved} {...props}>{children}</a>
}

export const mdxComponents = {
  ...defaultMdxComponents,
  a,
}
