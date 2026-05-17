/** Bar shape + center FAB from design (408×121). Tab icons/labels are rendered in React Native. */
export const TAB_BAR_BACKGROUND_SVG = `<svg width="408" height="121" viewBox="0 0 408 121" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_tabbar)">
<path d="M371.342 28C379.99 28 387 36.2204 387 46.3607V79.6393C387 89.7797 379.99 98 371.342 98H36.6578C28.0102 98 21 89.7797 21 79.6393V46.3607C21 36.2203 28.0102 28 36.6578 28H162.96C168.381 28 172.649 32.4027 174.157 37.6099C178.261 51.787 190.473 60.5 204.5 60.5C218.522 60.5 230.048 51.7929 233.919 37.6243C235.348 32.395 239.619 28 245.04 28H371.342Z" fill="#4A4A4A"/>
</g>
<g filter="url(#filter1_dd_tabbar)">
<path d="M176 28C176 12.536 188.536 0 204 0C219.464 0 232 12.536 232 28C232 43.464 219.464 56 204 56C188.536 56 176 43.464 176 28Z" fill="url(#paint0_linear_tabbar)" shape-rendering="crispEdges"/>
<path d="M204 1C218.912 1 231 13.0883 231 28C231 42.9117 218.912 55 204 55C189.088 55 177 42.9117 177 28C177 13.0883 189.088 1 204 1Z" stroke="#FFE1B0" stroke-width="2" shape-rendering="crispEdges"/>
<path d="M204 22V34M198 28H210" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
</g>
<defs>
<filter id="filter0_d_tabbar" x="0" y="9" width="408" height="112" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="2"/>
<feGaussianBlur stdDeviation="10.5"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_tabbar"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_tabbar" result="shape"/>
</filter>
<filter id="filter1_dd_tabbar" x="156" y="0" width="96" height="96" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="6" operator="erode" in="SourceAlpha" result="effect1_dropShadow_tabbar"/>
<feOffset dy="8"/>
<feGaussianBlur stdDeviation="5"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_tabbar"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="5" operator="erode" in="SourceAlpha" result="effect2_dropShadow_tabbar"/>
<feOffset dy="20"/>
<feGaussianBlur stdDeviation="12.5"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_tabbar" result="effect2_dropShadow_tabbar"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_tabbar" result="shape"/>
</filter>
<linearGradient id="paint0_linear_tabbar" x1="204" y1="0" x2="204" y2="56" gradientUnits="userSpaceOnUse">
<stop stop-color="#E0A84A"/>
<stop offset="1" stop-color="#F2C572"/>
</linearGradient>
</defs>
</svg>`;

export const TAB_BAR_DESIGN_WIDTH = 408;
export const TAB_BAR_DESIGN_HEIGHT = 121;
