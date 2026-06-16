import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { NewNegotiationPage } from './pages/NewNegotiationPage';
import { NegotiationDeckPage } from './pages/NegotiationDeckPage';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <RequireAuth><DashboardPage /></RequireAuth>
        } />
        <Route path="/settings/kb" element={
          <RequireAuth><KnowledgeBasePage /></RequireAuth>
        } />
        <Route path="/negotiations/new" element={
          <RequireAuth><NewNegotiationPage /></RequireAuth>
        } />
        <Route path="/negotiations/:deckId" element={
          <RequireAuth><NegotiationDeckPage /></RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}
