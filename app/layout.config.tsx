import type { HomeLayoutProps } from 'fumadocs-ui/home-layout'

const isDev = process.env.NODE_ENV === 'development'
const appRoot = isDev ? '' : 'https://glyphic.cc'

export const baseOptions: HomeLayoutProps = {
  nav: {
    enabled: false,
    title: (
      <a href={`${appRoot}/`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/glyphic-header-light.svg"
          alt="Glyphic"
          height={22}
          className="dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/glyphic-header-dark.svg"
          alt="Glyphic"
          height={22}
          className="hidden dark:block"
        />
      </a>
    ),
  },
  githubUrl: undefined,
  links: [],
}
