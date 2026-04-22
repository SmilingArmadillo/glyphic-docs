import type { HomeLayoutProps } from 'fumadocs-ui/home-layout'

export const baseOptions: HomeLayoutProps = {
  nav: {
    enabled: false,
    title: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 90" width="139" height="22" aria-label="Glyphic">
        <g transform="translate(-93.55 -63.46) scale(0.2308)">
          <path fill="none" stroke="#5B4FE9" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" d="M 440 340 L 640 340 L 720 420 L 720 520 L 640 600 L 540 600 L 540 520 L 620 520"/>
          <circle cx="440" cy="340" r="22" fill="#5B4FE9"/>
          <circle cx="640" cy="340" r="22" fill="#5B4FE9"/>
          <circle cx="720" cy="420" r="22" fill="#5B4FE9"/>
          <circle cx="720" cy="520" r="22" fill="#5B4FE9"/>
          <circle cx="640" cy="600" r="22" fill="#5B4FE9"/>
          <circle cx="540" cy="600" r="22" fill="#5B4FE9"/>
          <circle cx="540" cy="520" r="22" fill="#5B4FE9"/>
          <circle cx="620" cy="520" r="22" fill="#5B4FE9"/>
        </g>
        <text x="92" y="70" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="88">
          <tspan fill="#111111">glyphic</tspan><tspan fill="#5B4FE9">.cc</tspan>
        </text>
      </svg>
    ),
  },
  githubUrl: undefined,
  links: [],
}
