import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReportDetailContent } from './components/ReportDetailContent';

export const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <ReportDetailContent
      reportId={id}
      showBackToFeed={true}
      onDeleteSuccess={() => navigate('/feed', { replace: true })}
    />
  );
};
