import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeModeProvider } from './providers/ThemeModeProvider';
import { AuthProvider } from './providers/AuthProvider';
import { AppRoutes } from '../routes';

export const App = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeModeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  );
};

export default App;
