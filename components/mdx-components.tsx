import defaultMdxComponents from 'fumadocs-ui/mdx'

function rewriteHref(href: string): string {
  if (process.env.NODE_ENV === 'development') {
    // Strip the glyphic.cc origin so links become root-relative.
    // The browser is always on the Vite proxy origin (whatever port it runs on),
    // so /app, /pricing etc. resolve correctly without hardcoding a port.
    return href.replace(/^https:\/\/glyphic\.cc/, '')
  }
  return href
}

const a = ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const resolved = href ? rewriteHref(href) : href
  return <a href={resolved} {...props}>{children}</a>
}

export const mdxComponents = {
  ...defaultMdxComponents,
  a,
}
