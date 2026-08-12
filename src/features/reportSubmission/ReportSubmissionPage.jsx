import React, { useState, useEffect } from 'react';
import { Box, Stepper, Step, StepLabel, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import { uploadReportPhoto, createIssueReport } from './api';
import { analyzeReportPhoto } from '../../lib/aiClient';
import { compressImage } from '../../lib/imageCompression';
import { PhotoCaptureStep } from './components/PhotoCaptureStep';
import { AutoFillReviewStep } from './components/AutoFillReviewStep';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';

const steps = ['Capture Photo & Location', 'Review Details & Publish'];

export const ReportSubmissionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coords, error: geoError, loading: geoLoading, getCoordinates } = useGeolocation();

  const [activeStep, setActiveStep] = useState(0);

  // Form State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('pothole');

  // Opt-in AI State (disabled by default per EXECUTION_PLAN_03.md)
  const [aiFillUpEnabled, setAiFillUpEnabled] = useState(false);

  // Status State
  const [compressing, setCompressing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Trigger GPS acquisition on page load
  useEffect(() => {
    getCoordinates().catch((err) => {
      console.warn('Geolocation capture warning:', err.message);
    });
  }, [getCoordinates]);

  const handlePhotoSelected = async (file) => {
    setFormError(null);
    setCompressing(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 1600, quality: 0.72 });
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error('Image compression error:', err);
      setFormError('Could not process that image. Please try a different photo.');
    } finally {
      setCompressing(false);
    }
  };

  const handleProceed = async () => {
    if (!photoFile) return;
    if (!coords) {
      setFormError('Location coordinates are required to submit a report.');
      return;
    }

    setFormError(null);

    if (aiFillUpEnabled) {
      setAnalyzing(true);
      try {
        const aiData = await analyzeReportPhoto(photoFile);
        if (aiData.title) setTitle(aiData.title);
        if (aiData.description) setDescription(aiData.description);
        if (aiData.category) setCategory(aiData.category);
        setAiSuccess(true);
      } catch (aiErr) {
        console.warn('AI analysis fallback:', aiErr.message);
        setAiSuccess(false);
      } finally {
        setAnalyzing(false);
        setActiveStep(1);
      }
    } else {
      // Manual path: no AI call made at all
      setAiSuccess(false);
      setActiveStep(1);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!coords) {
      setFormError('Geolocation permission is required to post a public report.');
      return;
    }
    if (!photoFile) {
      setFormError('Photo is missing. Please go back and select a photo.');
      return;
    }

    setSubmitting(true);

    try {
      const photoUrl = await uploadReportPhoto(photoFile, user?.id || 'anon');

      const newReport = await createIssueReport({
        photoUrl,
        title,
        description,
        category,
        latitude: coords.latitude,
        longitude: coords.longitude,
        reporterId: user.id,
      });

      navigate(`/report/${newReport.report_id}`);
    } catch (err) {
      console.error('Submission error:', err);
      setFormError(err.message || 'Failed to publish report. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <ErrorAlert message={formError} />

        {activeStep === 0 ? (
          <PhotoCaptureStep
            photoFile={photoFile}
            photoPreview={photoPreview}
            onPhotoSelected={handlePhotoSelected}
            onProceed={handleProceed}
            analyzing={analyzing || compressing}
            geoCoords={coords}
            geoError={geoError}
            geoLoading={geoLoading}
            onRetryGeo={getCoordinates}
            aiFillUpEnabled={aiFillUpEnabled}
            onToggleAiFillUp={setAiFillUpEnabled}
          />
        ) : (
          <AutoFillReviewStep
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            category={category}
            setCategory={setCategory}
            photoPreview={photoPreview}
            aiSuccess={aiSuccess}
            aiFillUpEnabled={aiFillUpEnabled}
            onSubmit={handleSubmitReport}
            onBack={() => setActiveStep(0)}
            submitting={submitting}
          />
        )}
      </Paper>
    </Box>
  );
};
