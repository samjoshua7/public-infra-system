import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleGuard } from './guards/RoleGuard';
import { ApprovalGuard } from './guards/ApprovalGuard';

import { FeedPage } from '../features/feed/FeedPage';
import { LoginPage } from '../features/auth/LoginPage';
import { SignupPage } from '../features/auth/SignupPage';
import { WaitingApprovalPage } from '../features/auth/WaitingApprovalPage';
import { ReportSubmissionPage } from '../features/reportSubmission/ReportSubmissionPage';
import { ReportDetailPage } from '../features/reportDetail/ReportDetailPage';
import { OfficialDashboardPage } from '../features/officialDashboard/OfficialDashboardPage';
import { AdminUsersPage } from '../features/admin/AdminUsersPage';

export const AppRoutes = () => {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/waiting-approval" element={<WaitingApprovalPage />} />
        <Route
          path="/report/new"
          element={
            <ProtectedRoute>
              <ApprovalGuard>
                <ReportSubmissionPage />
              </ApprovalGuard>
            </ProtectedRoute>
          }
        />
        <Route path="/report/:id" element={<ReportDetailPage />} />
        <Route
          path="/dashboard"
          element={
            <RoleGuard allowedRoles={['GOVERNMENT_OFFICIAL', 'ADMIN']}>
              <OfficialDashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </RoleGuard>
          }
        />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </AppShell>
  );
};
