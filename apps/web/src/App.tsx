import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './app/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Customer pages
import CustomerLayout from './components/layout/CustomerLayout';
import DashboardPage from './pages/customer/DashboardPage';
import BookRidePage from './pages/customer/BookRidePage';
import BookingConfirmPage from './pages/customer/BookingConfirmPage';
import ActiveRidePage from './pages/customer/ActiveRidePage';
import BookingHistoryPage from './pages/customer/BookingHistoryPage';
import BookingDetailPage from './pages/customer/BookingDetailPage';
import ProfilePage from './pages/customer/ProfilePage';

// Driver pages
import DriverLayout from './components/layout/DriverLayout';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverRidePage from './pages/driver/DriverRidePage';
import DriverEarningsPage from './pages/driver/DriverEarningsPage';
import DriverHistoryPage from './pages/driver/DriverHistoryPage';

// Admin pages
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDriversPage from './pages/admin/AdminDriversPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Customer */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="book" element={<BookRidePage />} />
          <Route path="confirm/:bookingId" element={<BookingConfirmPage />} />
          <Route path="ride/:bookingId" element={<ActiveRidePage />} />
          <Route path="history" element={<BookingHistoryPage />} />
          <Route path="booking/:bookingId" element={<BookingDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Driver */}
        <Route path="/driver" element={
          <ProtectedRoute allowedRoles={['DRIVER']}>
            <DriverLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DriverDashboard />} />
          <Route path="ride/:bookingId" element={<DriverRidePage />} />
          <Route path="earnings" element={<DriverEarningsPage />} />
          <Route path="history" element={<DriverHistoryPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="drivers" element={<AdminDriversPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
