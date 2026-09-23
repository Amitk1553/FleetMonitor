import "./globals.css";

export const metadata = {
  title: "Fleet Monitor — Device Fleet Dashboard",
  description:
    "Real-time monitoring dashboard for a fleet of simulated IoT devices. Track heartbeats, online/offline status, and fleet health at a glance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
