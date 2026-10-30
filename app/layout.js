import Navbar from '../components/Navbar';
import './globals.css';

export const metadata = {
  title: 'LeadFlow CRM',
  description: 'Track leads from first contact to won, with a simple pipeline.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
