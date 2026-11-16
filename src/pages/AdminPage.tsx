import React from 'react';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { TestModeConfig } from '../types';

interface AdminPageProps {
  onNavigateToGame: () => void;
  onStartTestGame: (config: TestModeConfig) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onNavigateToGame,
  onStartTestGame,
}) => {
  return (
    <AdminDashboard
      onNavigateToGame={onNavigateToGame}
      onStartTestGame={onStartTestGame}
    />
  );
};
