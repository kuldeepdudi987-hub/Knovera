import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { WalletProvider } from './context/WalletContext.jsx';
import Navbar from './components/Navbar.jsx';
import BuyCoinsModal from './components/BuyCoinsModal.jsx';
import ReceiptModal from './components/ReceiptModal.jsx';
import LandingPage from './pages/LandingPage.jsx';
import StudentPortal from './pages/StudentPortal.jsx';
import TeacherPortal from './pages/TeacherPortal.jsx';
import ClassroomPage from './pages/ClassroomPage.jsx';
import WalletLedgerPage from './pages/WalletLedgerPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { useAuth } from './context/AuthContext.jsx';

function MainApp() {
  const { isLoggedIn, role } = useAuth();

  const [activePage, setActivePage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (['login', 'student', 'teacher', 'classroom', 'ledger'].includes(hash)) {
      return hash;
    }
    return 'landing';
  });

  const [selectedSessionId, setSelectedSessionId] = useState('session-demo-live-1');

  // Automatic redirect to login page when signed out from a protected portal
  useEffect(() => {
    if (!isLoggedIn && ['student', 'teacher', 'classroom', 'ledger'].includes(activePage)) {
      setActivePage('login');
    }
  }, [isLoggedIn, activePage]);

  // Sync active page with hash
  useEffect(() => {
    window.location.hash = activePage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  // Listen to hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['landing', 'login', 'student', 'teacher', 'classroom', 'ledger'].includes(hash)) {
        setActivePage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Pages */}
      <main className="flex-1">
        {activePage === 'login' && <LoginPage setActivePage={setActivePage} />}
        {activePage === 'landing' && <LandingPage setActivePage={setActivePage} />}
        {activePage === 'student' && (
          <StudentPortal
            setActivePage={setActivePage}
            setSelectedSessionId={setSelectedSessionId}
          />
        )}
        {activePage === 'teacher' && (
          <TeacherPortal
            setActivePage={setActivePage}
            setSelectedSessionId={setSelectedSessionId}
          />
        )}
        {activePage === 'classroom' && (
          <ClassroomPage
            sessionId={selectedSessionId}
            setActivePage={setActivePage}
          />
        )}
        {activePage === 'ledger' && <WalletLedgerPage />}
      </main>

      {/* Global Payment and Receipt Modals */}
      <BuyCoinsModal />
      <ReceiptModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <MainApp />
          <Analytics />
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
