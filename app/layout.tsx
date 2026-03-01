import './globals.css';
export const metadata = {
  title: 'Tech Wizardry CRM',
  description: 'Next.js app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* API base for production; set NEXT_PUBLIC_API_BASE_URL to inject */}
        {process.env.NEXT_PUBLIC_API_BASE_URL ? (
          <meta name="api-base" content={process.env.NEXT_PUBLIC_API_BASE_URL} />
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
