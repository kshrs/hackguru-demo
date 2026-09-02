import './globals.css';

export const metadata = {
  title: 'Upcoming College Events in India 2026 | HackGURU',
  description: 'Explore national hackathons, technical symposiums, research conferences, workshops, and sports tournaments across top engineering colleges in India.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/ace_files/favicon.ico" />
        <link rel="stylesheet" href="/ace_files/d1a789d8a46a3258.css" />
        <link rel="stylesheet" href="/ace_files/d43ab978ac5b76ce.css" />
        <link rel="stylesheet" href="/ace_files/94b0cb283dfdd691.css" />
        <link rel="stylesheet" href="/ace_files/4d4a4e14ce20d9b1.css" />
        <link rel="stylesheet" href="/ace_files/08af00365f28f9cd.css" />
        <link rel="stylesheet" href="/ace_files/926772d8edc72738.css" />
        <link rel="stylesheet" href="/ace_files/3596ea57e4181a10.css" />
        <link rel="stylesheet" href="/ace_files/4cc5c5de65d91273.css" />
        <link rel="stylesheet" href="/ace_files/163f657a16afbe5e.css" />
        <link rel="stylesheet" href="/ace_files/b1f76dbc0508c0aa.css" />
        <link rel="stylesheet" href="/ace_files/1e64dd35b167e07f.css" />
        <link rel="stylesheet" href="/ace_files/718c77f6018717b3.css" />
        <link rel="stylesheet" href="/ace_files/6dc9ae7f8fa1fb63.css" />
        <link rel="stylesheet" href="/ace_files/76cd8a905729ef53.css" />
        <link rel="stylesheet" href="/ace_files/d6450c64d0c8c8cb.css" />
        <link rel="stylesheet" href="/ace_files/c7fc87604f13aa75.css" />
        <link rel="stylesheet" href="/ace_files/f457c697e6b3cb17.css" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="toastContainer" className="ace-toast-container"></div>
        {children}
      </body>
    </html>
  );
}
