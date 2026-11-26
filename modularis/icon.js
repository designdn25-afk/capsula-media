const paths = {
 layers:'<path d="m2.5 7 9.5-5 9.5 5-9.5 5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
 layoutSide:'<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M9 4v16M5 8h1m-1 4h1"/>',
 layoutTop:'<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M3 13h18M6 16.5h5"/>',
 compare:'<rect x="2.5" y="4" width="7.5" height="16" rx="1.1"/><rect x="14" y="4" width="7.5" height="16" rx="1.1"/>',
 whatsapp:'<path d="M20.8 11.7a8.8 8.8 0 0 1-13.1 7.7L3 20.8l1.3-4.6a8.8 8.8 0 1 1 16.5-4.5Z"/><path d="M8.3 7.4c.3-.4.7-.4 1-.1l1 2c.1.3-.2.7-.7 1.2.6 1.3 1.6 2.4 3.3 3.1.5-.6.8-1.2 1.2-1.1l1.9.9c.4.2.4.7.2 1.2-.3.8-1.1 1.3-2 1.2-3-.4-6.6-3.4-7.1-6.5-.1-.8.5-1.6 1.2-1.9Z" fill="currentColor" stroke="none"/>',
 palette:'<path d="M12 3a9 9 0 1 0 .2 18c2.1 0 2.6-1.6 1.6-2.8-1.3-1.5-.4-3.3 1.6-3.3h1.5c2.9 0 4.4-1.7 4.1-4.2A9 9 0 0 0 12 3Z"/><circle cx="7.3" cy="11" r=".9"/><circle cx="10.1" cy="7.7" r=".9"/><circle cx="14.4" cy="7.7" r=".9"/><circle cx="17.3" cy="10.8" r=".9"/>',
 file:'<path d="M6 2.5h8l4.5 4.5v14.5H6zM14 2.5v5h4.5M9 12h6m-6 4h6"/>',

 brand:'<path d="M2 25V12L14 4l12 8v13M8 24V15l6-4 6 4v9M14 11v13"/>',
 cube:'<path d="m12 3 8.5 5v9l-8.5 5-8.5-5V8zM3.5 8l8.5 5 8.5-5M12 13v9M8 5.5l8.5 5"/>',
 tune:'<path d="M3 7h6m5 0h7M3 17h10m5 0h3"/><circle cx="11.5" cy="7" r="2.5"/><circle cx="15.5" cy="17" r="2.5"/>',
 plan:'<path d="M3 3h18v18H3zM3 12h5m4 0h9M12 3v4m0 5v9"/>',
 ruler:'<path d="m3 15 12-12 6 6L9 21zM12 6l2 2M9 9l2 2M6 12l2 2"/>',
 expand:'<path d="M8 3H3v5m13-5h5v5m0 8v5h-5M3 16v5h5"/>',
 shrink:'<path d="M3 8h5V3m13 5h-5V3m5 13h-5v5M3 16h5v5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
 orbit:'<ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-25 12 12)"/><path d="M12 3c-2.7 0-4.8 4-4.8 9s2.1 9 4.8 9 4.8-4 4.8-9-2.1-9-4.8-9Z"/>',
 webcam:'<path d="M2 7h4l2-3h8l2 3h4v13H2z"/><circle cx="12" cy="13" r="3.5"/>',
 reset:'<path d="M3 4v6h6M3.5 10A8.5 8.5 0 1 1 5 17"/>',
 quote:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8m-8 4h5"/>',
 share:'<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="5" r="2.5"/><circle cx="17" cy="19" r="2.5"/><path d="m8.5 10.5 6-4m-6 7 6 4"/>',
 link:'<path d="m9 15 6-6m-5-3 2-2a5 5 0 0 1 7 7l-2 2m-3 5-2 2a5 5 0 0 1-7-7l2-2"/>',
 more:'<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
 home:'<path d="m3 11 9-7 9 7v9H3zM10 20v-6h4v6"/>',side:'<path d="M3 8.5 21 6v14H3zm0 1 18-2m-5 9h2"/>',
 front:'<path d="m3 9 18-3v14H3zM6 13h5v7m3-7h4v3h-4z"/>',back:'<path d="M3 6 21 9v11H3zm3 6h5v4H6zm8 1h4v3h-4z"/>',
 top:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M6 8h12M6 11h12M6 14h12"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>', check:'<path d="m5 12 4 4L19 6"/>'
};
export function icon(name,size=20) {
  return `<svg width="${size}" height="${size}" viewBox="${name==='brand'?'0 0 28 28':'0 0 24 24'}" fill="none" stroke="currentColor" stroke-width="${name==='brand'?'2.2':'1.6'}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]??''}</svg>`;
}
