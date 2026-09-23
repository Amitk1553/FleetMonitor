import "./globals.css";
import NavBar from "../components/NavBar";

export const metadata = {
  title: "Fleet Monitor — Device Fleet Dashboard",
  description:
    "Real-time monitoring dashboard for a fleet of simulated IoT devices. Track heartbeats, online/offline status, and fleet health at a glance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="page-wrapper">
          <NavBar />
          <main className="page-content">{children}</main>
        </div>
      </body>
    </html>
  );
}

