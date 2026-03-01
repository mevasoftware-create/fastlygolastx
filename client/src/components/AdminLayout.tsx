import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { AdminTopNav } from './AdminTopNav';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePage?: string;
  onPageChange?: (page: string) => void;
}

export function AdminLayout({ children, activePage = 'dashboard', onPageChange }: AdminLayoutProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(activePage);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Top Navigation Bar */}
      <AdminTopNav activePage={currentPage} onPageChange={handlePageChange} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
