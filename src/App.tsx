/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from './router';
import { GamePage } from './pages/GamePage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  const { route, navigate } = useRouter();

  if (route === 'admin') {
    return <AdminPage onNavigateToGame={() => navigate('game')} />;
  }

  return <GamePage onNavigateToAdmin={() => navigate('admin')} />;
}
