import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeModeProvider } from './providers/ThemeModeProvider';
import { AuthProvider } from './providers/AuthProvider';
import { AppRoutes } from '../routes';

export const App = () => {
  return (
    <BrowserRouter>
      <ThemeModeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  );
};

export default App;
