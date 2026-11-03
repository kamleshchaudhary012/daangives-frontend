import React from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-outfit">
      <Header />
      <main className="flex-grow">
        <div className="animate-page-enter">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
