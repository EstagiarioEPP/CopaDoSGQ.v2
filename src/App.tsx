/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRouter } from './router';
import { GamePage } from './pages/GamePage';
import { AdminPage } from './pages/AdminPage';
import { TestModeConfig } from './types';

export default function App() {
  const { route, navigate } = useRouter();
  const [testMode, setTestMode] = useState<TestModeConfig | null>(null);

  if (route === 'admin') {
    return (
      <AdminPage
        onNavigateToGame={() => {
          setTestMode(null);
          navigate('game');
        }}
        onStartTestGame={(config) => {
          setTestMode(config);
          navigate('game');
        }}
      />
    );
  }

  return (
    <GamePage
      testMode={testMode}
      onExitTestMode={() => {
        setTestMode(null);
        navigate('admin');
      }}
    />
  );
}
