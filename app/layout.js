import './globals.css'

export const metadata = {
  title: 'TIKIT System',
  description: 'TIKIT Application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
