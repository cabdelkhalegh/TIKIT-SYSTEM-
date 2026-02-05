export const metadata = {
  title: 'TIKIT - Ticketing System',
  description: 'Modern ticketing platform for event management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
