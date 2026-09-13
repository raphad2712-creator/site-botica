const paths = {
  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
  "arrow-left": "M19 12H5m6-6-6 6 6 6",
  "arrow-down": "M12 5v14m-6-6 6 6 6-6",
  "arrow-up-right": "M6 18 18 6M6 6h12v12",
  check: "m5 12 4 4L19 6",
  search: "M21 21l-5-5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z",
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
  lock: "M6 10h12v11H6ZM8 10V6a4 4 0 0 1 8 0v4",
  shield: "m12 3 8 3v5c0 5-4 8-8 10-4-2-8-5-8-10V6Zm-4 9 3 3 5-5",
  leaf: "M20 4C12 3 5 6 5 12a6 6 0 0 0 6 6c6 0 9-7 9-14ZM4 21l11-11",
  heart: "M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z",
  document: "M14 3H5v18h14V8Zm0 0v5h5M8 12h8m-8 4h6",
  headset: "M5 11a7 7 0 0 1 14 0v5M3 12h4v6H3Zm14 0h4v6h-4Zm0 7c-1 1-3 2-5 2",
  play: "m8 4 12 8-12 8Z",
  pause: "M8 5v14M16 5v14",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
};

export function Icon({ name, className = "" }: { name: keyof typeof paths; className?: string }) {
  return <svg className={`ui-icon ${className}`.trim()} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
