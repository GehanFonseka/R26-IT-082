import "./Icon.css";

const paths = {
  activity: <><path d="M3 12h4l2.2-6 4.2 12L16 10h5" /><path d="M3 4v16" /></>,
  alert: <><path d="M10.3 4.4 2.9 17a1.6 1.6 0 0 0 1.4 2.4h15.4a1.6 1.6 0 0 0 1.4-2.4L13.7 4.4a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 16h.01" /></>,
  arrowDown: <path d="m6 9 6 6 6-6" />,
  arrowLeft: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /><path d="M10 12v2h4v-2" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 9h18" /><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" /></>,
  camera: <><path d="M4 8.5a2 2 0 0 1 2-2h2l1.2-2h5.6l1.2 2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z" /><circle cx="12" cy="12.5" r="3" /></>,
  chart: <><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19H2" /></>,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 20h16" /></>,
  edit: <><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5a2.8 2.8 0 0 0-4-4L4 16.5Z" /><path d="m13.5 6 4 4" /></>,
  growth: <><path d="M4 18 10 12l4 4 7-9" /><path d="M16 7h5v5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
  mic: <><rect x="8" y="3" width="8" height="12" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>,
  micOff: <><path d="M5 5 19 19" /><path d="M15.5 15.5A6.8 6.8 0 0 1 5 11M19 11a7 7 0 0 1-.5 2.6M12 18v3M9 21h6" /><path d="M8 8V7a4 4 0 0 1 7.7-1.5M16 11V7a4 4 0 0 0-.1-.9" /></>,
  lightbulb: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8.4 14.5A6 6 0 1 1 15.6 14c-.8.6-1.4 1.4-1.6 2.5h-4c-.2-.8-.7-1.5-1.6-2Z" /></>,
  logout: <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" /><path d="M14 16l4-4-4-4" /><path d="M8 12h10" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  message: <><path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-3.8A3 3 0 0 1 3 15V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v8Z" /><path d="M8 9h8M8 13h5" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4" /></>,
  person: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.7-4L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14.7 4L20 15" /><path d="M20 20v-5h-5" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
  settings: <><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.2a2 2 0 0 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A2 2 0 0 0 3.7 12a2 2 0 0 0-1.7-2v-.1a2 2 0 0 1 2.8-2.8l.1.1A2 2 0 0 0 8.3 5.8v-.2a2 2 0 0 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1A2 2 0 0 0 19.8 13a2 2 0 0 1-.4 2Z" /></>,
  shield: <><path d="M12 21s8-3.7 8-10.1V5l-8-3-8 3v5.9C4 17.3 12 21 12 21Z" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></>,
  spark: <><path d="m12 3-1.2 5.8L5 10l5.8 1.2L12 17l1.2-5.8L19 10l-5.8-1.2L12 3Z" /><path d="m19 16-.6 2.4L16 19l2.4.6L19 22l.6-2.4L22 19l-2.4-.6L19 16Z" /></>,
  trendDown: <><path d="M4 6.5 10 13l4-4 6 6" /><path d="M15 15h5v-5" /></>,
  trendUp: <><path d="M4 17.5 10 11l4 4 6-6" /><path d="M15 9h5v5" /></>,
  tune: <><path d="M4 6h16" /><circle cx="9" cy="6" r="2" /><path d="M4 12h16" /><circle cx="15" cy="12" r="2" /><path d="M4 18h16" /><circle cx="11" cy="18" r="2" /></>,
  userPlus: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M19 9v6M16 12h6" /></>,
  users: <><path d="M16 20a6 6 0 0 0-12 0" /><circle cx="10" cy="8" r="3" /><path d="M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4" /></>,
};

function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.info}
    </svg>
  );
}

export default Icon;
