import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Public Pages
import HomePage from '../pages/public/HomePage';
import NgoDirectoryPage from '../pages/public/NgoDirectoryPage';
import NgoPublicProfilePage from '../pages/public/NgoPublicProfilePage';
import CampaignDirectoryPage from '../pages/public/CampaignDirectoryPage';
import NeedRequestDetailsPage from '../pages/public/NeedRequestDetailsPage';
import CampaignTrackingPage from '../pages/public/CampaignTrackingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import VerificationConfirmationPage from '../pages/public/VerificationConfirmationPage';
import CsrLandingPage from '../pages/public/CsrLandingPage';

// Donor Pages
import DonorDashboardPage from '../pages/donor/DonorDashboardPage';
import DonorProfilePage from '../pages/donor/DonorProfilePage';
import MyTicketsPage from '../pages/donor/MyTicketsPage';
import CreateTicketPage from '../pages/donor/CreateTicketPage';
import TicketDetailPage from '../pages/donor/TicketDetailPage';

// Hidden Admin Login Page
import AdminLoginPage from '../pages/admin/AdminLoginPage';

import PageLoadingFallback from '../components/common/PageLoadingFallback';

// Eager Public Onboarding Page
import NgoRegistrationPage from '../pages/ngo/NgoRegistrationPage';

// Lazy Loaded NGO Pages (Step 14)
const NgoRegistrationFlowPage = React.lazy(() => import('../pages/ngo/NgoRegistrationFlowPage'));
const NgoDashboardPage = React.lazy(() => import('../pages/ngo/NgoDashboardPage'));
const NgoNeedManagementPage = React.lazy(() => import('../pages/ngo/NgoNeedManagementPage'));
const NgoReportsPage = React.lazy(() => import('../pages/ngo/NgoReportsPage'));
const NgoTicketsPage = React.lazy(() => import('../pages/ngo/NgoTicketsPage'));
const CreateNgoTicketPage = React.lazy(() => import('../pages/ngo/CreateNgoTicketPage'));
const NgoTicketDetailPage = React.lazy(() => import('../pages/ngo/NgoTicketDetailPage'));
const NgoAnalyticsPage = React.lazy(() => import('../pages/ngo/NgoAnalyticsPage'));
const NgoProfilePage = React.lazy(() => import('../pages/ngo/NgoProfilePage'));

// Lazy Loaded Village Projects Pages (Phase 7.2)
const MyProjectsPage = React.lazy(() => import('../pages/ngo/MyProjectsPage'));
const CreateProjectPage = React.lazy(() => import('../pages/ngo/CreateProjectPage'));
const ProjectDetailPage = React.lazy(() => import('../pages/ngo/ProjectDetailPage'));
const EditProjectPage = React.lazy(() => import('../pages/ngo/EditProjectPage'));

// Lazy Loaded Admin Pages (Step 14)
const AdminDashboardPage = React.lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminNgoVerificationPage = React.lazy(() => import('../pages/admin/AdminNgoVerificationPage'));
const AdminProjectVerificationPage = React.lazy(() => import('../pages/admin/AdminProjectVerificationPage'));
const AdminCampaignModerationPage = React.lazy(() => import('../pages/admin/AdminCampaignModerationPage'));
const AdminDonationMonitoringPage = React.lazy(() => import('../pages/admin/AdminDonationMonitoringPage'));
const AdminComplaintsPage = React.lazy(() => import('../pages/admin/AdminComplaintsPage'));
const AdminTicketDetailPage = React.lazy(() => import('../pages/admin/AdminTicketDetailPage'));
const AdminAnalyticsDashboardPage = React.lazy(() => import('../pages/admin/AdminAnalyticsDashboardPage'));

// Lazy Loaded Company CSR Pages (Step 14)
const CompanyDashboardPage = React.lazy(() => import('../pages/company/CompanyDashboardPage'));
const CompanyProfilePage = React.lazy(() => import('../pages/company/CompanyProfilePage'));
const CompanyPreferencesPage = React.lazy(() => import('../pages/company/CompanyPreferencesPage'));
const CompanyMarketplacePage = React.lazy(() => import('../pages/company/CompanyMarketplacePage'));
const CompanyRequirementDetailPage = React.lazy(() => import('../pages/company/CompanyRequirementDetailPage'));
const CompanyRequestsPage = React.lazy(() => import('../pages/company/CompanyRequestsPage'));
const CompanyPartnershipsPage = React.lazy(() => import('../pages/company/CompanyPartnershipsPage'));
const CompanyPartnershipDetailPage = React.lazy(() => import('../pages/company/CompanyPartnershipDetailPage'));
const CompanyTicketsPage = React.lazy(() => import('../pages/company/CompanyTicketsPage'));
const CreateCompanyTicketPage = React.lazy(() => import('../pages/company/CreateCompanyTicketPage'));
const CompanyTicketDetailPage = React.lazy(() => import('../pages/company/CompanyTicketDetailPage'));
const CompanyAnalyticsPage = React.lazy(() => import('../pages/company/CompanyAnalyticsPage'));

// Lazy Loaded NGO CSR Pages (Step 14)
const NgoCsrDashboardPage = React.lazy(() => import('../pages/ngo/csr/NgoCsrDashboardPage'));
const NgoCsrRequirementsPage = React.lazy(() => import('../pages/ngo/csr/NgoCsrRequirementsPage'));
const NgoCsrRequirementBuilderPage = React.lazy(() => import('../pages/ngo/csr/NgoCsrRequirementBuilderPage'));
const NgoCsrRequestsPage = React.lazy(() => import('../pages/ngo/csr/NgoCsrRequestsPage'));
const NgoCsrPartnershipsPage = React.lazy(() => import('../pages/ngo/csr/NgoCsrPartnershipsPage'));

// Lazy Loaded Admin CSR Pages (Step 14)
const AdminCsrCompaniesPage = React.lazy(() => import('../pages/admin/csr/AdminCsrCompaniesPage'));
const AdminCsrRequirementsPage = React.lazy(() => import('../pages/admin/csr/AdminCsrRequirementsPage'));
const AdminCsrOversightPage = React.lazy(() => import('../pages/admin/csr/AdminCsrOversightPage'));

import ResetPasswordConfirmPage from '../pages/public/ResetPasswordConfirmPage';
import TermsPage from '../pages/public/TermsPage';
import PrivacyPage from '../pages/public/PrivacyPage';

import NotFoundPage from '../pages/public/NotFoundPage';

export default function AppRoutes() {
  return (
    <React.Suspense fallback={<PageLoadingFallback />}>
      <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<HomePage />} />
      <Route path="/ngos" element={<NgoDirectoryPage />} />
      <Route path="/ngos/:id" element={<NgoPublicProfilePage />} />
      <Route path="/campaigns" element={<CampaignDirectoryPage />} />
      <Route path="/campaigns/:slug/tracking" element={<CampaignTrackingPage />} />
      <Route path="/campaigns/:id" element={<NeedRequestDetailsPage />} />
      <Route path="/needs/:id" element={<NeedRequestDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPasswordConfirmPage />} />
      <Route path="/verification-confirmation" element={<VerificationConfirmationPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/csr" element={<CsrLandingPage />} />

      {/* DONOR ROUTES (Deactivated retail donation routes safely redirect) */}
      <Route path="/donor/dashboard" element={<ProtectedRoute allowedRole="DONOR"><DonorDashboardPage /></ProtectedRoute>} />
      <Route path="/donor/profile" element={<ProtectedRoute allowedRole="DONOR"><DonorProfilePage /></ProtectedRoute>} />
      <Route path="/donor/donations" element={<Navigate to="/" replace />} />
      <Route path="/donor/donations/*" element={<Navigate to="/" replace />} />
      <Route path="/donor/donations/money/*" element={<Navigate to="/" replace />} />
      <Route path="/donor/donations/money/step-1" element={<Navigate to="/" replace />} />
      <Route path="/donor/donations/money/step-2" element={<Navigate to="/" replace />} />
      <Route path="/donor/donations/money/step-3" element={<Navigate to="/" replace />} />
      <Route path="/donor/donations/money/step-4" element={<Navigate to="/" replace />} />
      <Route path="/donor/tracking" element={<Navigate to="/" replace />} />
      <Route path="/donor/tracking/:id" element={<Navigate to="/" replace />} />
      <Route path="/donor/receipts" element={<Navigate to="/" replace />} />
      <Route path="/donor/notifications" element={<Navigate to="/donor/tickets" replace />} />
      <Route path="/donor/tickets" element={<ProtectedRoute allowedRole="DONOR"><MyTicketsPage /></ProtectedRoute>} />
      <Route path="/donor/tickets/new" element={<ProtectedRoute allowedRole="DONOR"><CreateTicketPage /></ProtectedRoute>} />
      <Route path="/donor/tickets/:id" element={<ProtectedRoute allowedRole="DONOR"><TicketDetailPage /></ProtectedRoute>} />
      <Route path="/donor/analytics" element={<Navigate to="/" replace />} />

      {/* NGO ROUTES (Registration is public onboarding; operational routes protected for NGO role) */}
      <Route path="/ngo/registration" element={<NgoRegistrationPage />} />
      <Route path="/ngo/registration-flow" element={<ProtectedRoute allowedRole="NGO"><NgoRegistrationFlowPage /></ProtectedRoute>} />
      <Route path="/ngo/dashboard" element={<ProtectedRoute allowedRole="NGO"><NgoDashboardPage /></ProtectedRoute>} />
      <Route path="/ngo/profile" element={<ProtectedRoute allowedRole="NGO"><NgoProfilePage /></ProtectedRoute>} />
      <Route path="/ngo/projects" element={<ProtectedRoute allowedRole="NGO"><MyProjectsPage /></ProtectedRoute>} />
      <Route path="/ngo/projects/new" element={<ProtectedRoute allowedRole="NGO"><CreateProjectPage /></ProtectedRoute>} />
      <Route path="/ngo/projects/:id" element={<ProtectedRoute allowedRoles={['NGO', 'ADMIN']}><ProjectDetailPage /></ProtectedRoute>} />
      <Route path="/ngo/projects/:id/edit" element={<ProtectedRoute allowedRole="NGO"><EditProjectPage /></ProtectedRoute>} />
      <Route path="/ngo/needs" element={<ProtectedRoute allowedRole="NGO"><NgoNeedManagementPage /></ProtectedRoute>} />
      <Route path="/ngo/reports" element={<ProtectedRoute allowedRole="NGO"><NgoReportsPage /></ProtectedRoute>} />
      <Route path="/ngo/tickets" element={<ProtectedRoute allowedRole="NGO"><NgoTicketsPage /></ProtectedRoute>} />
      <Route path="/ngo/tickets/new" element={<ProtectedRoute allowedRole="NGO"><CreateNgoTicketPage /></ProtectedRoute>} />
      <Route path="/ngo/tickets/:id" element={<ProtectedRoute allowedRole="NGO"><NgoTicketDetailPage /></ProtectedRoute>} />
      <Route path="/ngo/analytics" element={<ProtectedRoute allowedRole="NGO"><NgoAnalyticsPage /></ProtectedRoute>} />

      {/* COMPANY ROUTES (Protected for COMPANY role) */}
      <Route path="/company/dashboard" element={<ProtectedRoute allowedRole="COMPANY"><CompanyDashboardPage /></ProtectedRoute>} />
      <Route path="/company/profile" element={<ProtectedRoute allowedRole="COMPANY"><CompanyProfilePage /></ProtectedRoute>} />
      <Route path="/company/preferences" element={<ProtectedRoute allowedRole="COMPANY"><CompanyPreferencesPage /></ProtectedRoute>} />
      <Route path="/company/marketplace" element={<ProtectedRoute allowedRole="COMPANY"><CompanyMarketplacePage /></ProtectedRoute>} />
      <Route path="/company/requirements/:id" element={<ProtectedRoute allowedRole="COMPANY"><CompanyRequirementDetailPage /></ProtectedRoute>} />
      <Route path="/company/requests" element={<ProtectedRoute allowedRole="COMPANY"><CompanyRequestsPage /></ProtectedRoute>} />
      <Route path="/company/partnerships" element={<ProtectedRoute allowedRole="COMPANY"><CompanyPartnershipsPage /></ProtectedRoute>} />
      <Route path="/company/partnerships/:id" element={<ProtectedRoute allowedRole="COMPANY"><CompanyPartnershipDetailPage /></ProtectedRoute>} />
      <Route path="/company/tickets" element={<ProtectedRoute allowedRole="COMPANY"><CompanyTicketsPage /></ProtectedRoute>} />
      <Route path="/company/tickets/new" element={<ProtectedRoute allowedRole="COMPANY"><CreateCompanyTicketPage /></ProtectedRoute>} />
      <Route path="/company/tickets/:id" element={<ProtectedRoute allowedRole="COMPANY"><CompanyTicketDetailPage /></ProtectedRoute>} />
      <Route path="/company/analytics" element={<ProtectedRoute allowedRole="COMPANY"><CompanyAnalyticsPage /></ProtectedRoute>} />

      {/* NGO CSR ROUTES (Protected for NGO role) */}
      <Route path="/ngo/csr/dashboard" element={<ProtectedRoute allowedRole="NGO"><NgoCsrDashboardPage /></ProtectedRoute>} />
      <Route path="/ngo/csr/requirements" element={<ProtectedRoute allowedRole="NGO"><NgoCsrRequirementsPage /></ProtectedRoute>} />
      <Route path="/ngo/csr/requirements/new" element={<ProtectedRoute allowedRole="NGO"><NgoCsrRequirementBuilderPage /></ProtectedRoute>} />
      <Route path="/ngo/csr/requirements/:id/edit" element={<ProtectedRoute allowedRole="NGO"><NgoCsrRequirementBuilderPage /></ProtectedRoute>} />
      <Route path="/ngo/csr/requests" element={<ProtectedRoute allowedRole="NGO"><NgoCsrRequestsPage /></ProtectedRoute>} />
      <Route path="/ngo/csr/partnerships" element={<ProtectedRoute allowedRole="NGO"><NgoCsrPartnershipsPage /></ProtectedRoute>} />
      <Route path="/ngo/csr/partnerships/:id" element={<ProtectedRoute allowedRole="NGO"><NgoCsrPartnershipsPage /></ProtectedRoute>} />

      {/* ADMIN ROUTES (Protected for ADMIN role) */}
      <Route path="/admin" element={<ProtectedRoute allowedRole="ADMIN"><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/ngos" element={<ProtectedRoute allowedRole="ADMIN"><AdminNgoVerificationPage /></ProtectedRoute>} />
      <Route path="/admin/ngos/:id" element={<ProtectedRoute allowedRole="ADMIN"><AdminNgoVerificationPage /></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute allowedRole="ADMIN"><AdminProjectVerificationPage /></ProtectedRoute>} />
      <Route path="/admin/projects/:id" element={<ProtectedRoute allowedRole="ADMIN"><AdminProjectVerificationPage /></ProtectedRoute>} />
      <Route path="/admin/campaigns" element={<ProtectedRoute allowedRole="ADMIN"><AdminCampaignModerationPage /></ProtectedRoute>} />
      <Route path="/admin/donations" element={<ProtectedRoute allowedRole="ADMIN"><AdminDonationMonitoringPage /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute allowedRole="ADMIN"><AdminComplaintsPage /></ProtectedRoute>} />
      <Route path="/admin/complaints/:id" element={<ProtectedRoute allowedRole="ADMIN"><AdminTicketDetailPage /></ProtectedRoute>} />
      <Route path="/admin/tickets" element={<ProtectedRoute allowedRole="ADMIN"><Navigate to="/admin/complaints" replace /></ProtectedRoute>} />
      <Route path="/admin/tickets/:id" element={<ProtectedRoute allowedRole="ADMIN"><AdminTicketDetailPage /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRole="ADMIN"><Navigate to="/admin/analytics" replace /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="ADMIN"><AdminAnalyticsDashboardPage /></ProtectedRoute>} />

      {/* ADMIN CSR ROUTES (Protected for ADMIN role) */}
      <Route path="/admin/csr" element={<ProtectedRoute allowedRole="ADMIN"><Navigate to="/admin/csr/oversight" replace /></ProtectedRoute>} />
      <Route path="/admin/csr/oversight" element={<ProtectedRoute allowedRole="ADMIN"><AdminCsrOversightPage /></ProtectedRoute>} />
      <Route path="/admin/csr/companies" element={<ProtectedRoute allowedRole="ADMIN"><AdminCsrCompaniesPage /></ProtectedRoute>} />
      <Route path="/admin/csr/companies/:id" element={<ProtectedRoute allowedRole="ADMIN"><AdminCsrCompaniesPage /></ProtectedRoute>} />
      <Route path="/admin/csr/requirements" element={<ProtectedRoute allowedRole="ADMIN"><AdminCsrRequirementsPage /></ProtectedRoute>} />
      <Route path="/admin/csr/requirements/:id" element={<ProtectedRoute allowedRole="ADMIN"><AdminCsrRequirementsPage /></ProtectedRoute>} />
      <Route path="/admin/csr/partnerships" element={<ProtectedRoute allowedRole="ADMIN"><AdminCsrOversightPage /></ProtectedRoute>} />
      <Route path="/admin/csr/audit-history" element={<ProtectedRoute allowedRole="ADMIN"><AdminCsrOversightPage /></ProtectedRoute>} />
      <Route path="/admin/csr/analytics" element={<ProtectedRoute allowedRole="ADMIN"><AdminCsrOversightPage /></ProtectedRoute>} />

      {/* CATCH-ALL 404 ROUTE */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </React.Suspense>
);
}
