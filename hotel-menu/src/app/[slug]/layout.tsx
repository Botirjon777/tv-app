// Applies the saved theme to <html> before first paint so the guest room pages
// (dark by default) don't flash light before React hydrates. Scoped to /[slug]/*
// so the admin/POS tools stay light. The useTheme hook keeps it in sync after.
const themeScript = `(function(){try{var t=localStorage.getItem('hotel-menu-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function HotelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </>
  );
}
