import './globals.css';
export const metadata = {
  title: 'Tech Wizardry CRM',
  description: 'Next.js app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
