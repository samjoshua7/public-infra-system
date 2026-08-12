import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from './guards/ProtectedRoute';

import { FeedPage } from '../features/feed/FeedPage';
import { LoginPage } from '../features/auth/LoginPage';
import { SignupPage } from '../features/auth/SignupPage';
import { ReportSubmissionPage } from '../features/reportSubmission/ReportSubmissionPage';
import { ReportDetailPage } from '../features/reportDetail/ReportDetailPage';

export const AppRoutes = () => {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/report/new"
          element={
            <ProtectedRoute>
              <ReportSubmissionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/report/:id" element={<ReportDetailPage />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </AppShell>
  );
};
