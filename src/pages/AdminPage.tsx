import React from 'react';
import { AdminDashboard } from '../components/admin/AdminDashboard';

interface AdminPageProps {
  onNavigateToGame: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateToGame }) => {
  return <AdminDashboard onNavigateToGame={onNavigateToGame} />;
};
