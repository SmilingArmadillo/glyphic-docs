import type { HomeLayoutProps } from 'fumadocs-ui/home-layout'

export const baseOptions: HomeLayoutProps = {
  nav: {
    enabled: false,
    title: (
      <>
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
      </>
    ),
  },
  githubUrl: undefined,
  links: [],
}
