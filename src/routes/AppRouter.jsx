import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';
import LoginPage from '../pages/login/LoginPage';
import InicioPage from '../pages/inicio/InicioPage';
import PersonalPage from '../pages/personal/PersonalPage';
import TurnosPage from '../pages/turnos/TurnosPage';
import ServiciosPage from '../pages/servicios/ServiciosPage';
import IncidenciasPage from '../pages/incidencias/IncidenciasPage';
import DashboardBIPage from '../pages/dashboard-bi/DashboardBIPage';
import MonitorMulticriterioPage from '../pages/monitor-multicriterio/MonitorMulticriterioPage';
import ReportesPage from '../pages/reportes/ReportesPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/"                          element={<InicioPage />} />
            <Route path="/personal"                  element={<PersonalPage />} />
            <Route path="/turnos"                    element={<TurnosPage />} />
            <Route path="/servicios"                 element={<ServiciosPage />} />
            <Route path="/incidencias"               element={<IncidenciasPage />} />
            <Route path="/dashboard-bi"              element={<DashboardBIPage />} />
            <Route path="/monitor-multicriterio"     element={<MonitorMulticriterioPage />} />
            <Route path="/reportes"                  element={<ReportesPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
