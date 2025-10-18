import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar'; // Tu sidebar vertical
import SplashScreen from './pages/SplashScreen';
import AuthScreen from './pages/AuthScreen';
import MenuScreen from './pages/MenuScreen';
import AdminPanel from './admin/AdminPanel';
import AppointmentPage from './pages/AppointmentPage';
import MyAppointments from './pages/MyAppointments';
import PaymentCallback from './pages/PaymentCallback';
import PromotionsPage from './pages/PromotionsPage';
import VipProgramPage from './pages/VipProgramPage';
import VipCouponPage from './pages/VipCouponPage';
import CuponesYRegalosPage from './pages/CuponesYRegalosPage';      
import FeaturedServicesPage from './pages/FeaturedServicesPage';
import TratamientosEsteticos from './pages/TratamientosEsteticos';
import Location from './pages/location';
import { useAuth } from './hooks/useAuth';
import Contacto from './pages/contacto';
import ProfilePage from './pages/ProfilePage';
import Settings from "./pages/Settings";
import Productos from "./pages/Productos";

import { initializeFirestore } from './lib/firestore-setup';
import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient();

// Layout component que incluye el sidebar
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  
  // Páginas donde NO queremos mostrar el sidebar
  const hideSidebarPages = ['/auth', '/payment-callback'];
  const shouldShowSidebar = user && !hideSidebarPages.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowSidebar && <Navbar />}
      
      {/* Contenido principal con margen dinámico */}
      <main className={`transition-all duration-700 ease-out min-h-screen ${
        shouldShowSidebar 
          ? 'lg:ml-80 ml-0'
          : 'ml-0'
      }`}>
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}



async function checkVersion() {
  try {
    const res = await fetch('/version.json', { cache: 'no-cache' });
    const serverVersion = await res.json();
    const localVersion = localStorage.getItem('app_version');

    if (localVersion && localVersion !== serverVersion.version.toString()) {
      console.log('Nueva versión detectada. Recargando...');
      localStorage.setItem('app_version', serverVersion.version);
      window.location.reload();
    } else {
      localStorage.setItem('app_version', serverVersion.version);
    }
  } catch (err) {
    console.error('No se pudo verificar la versión', err);
  }
}

// Llamar al inicio
checkVersion();

function AppContent() {
  const { user, loading } = useAuth();
  const [firestoreInitialized, setFirestoreInitialized] = useState(false);

  useEffect(() => {
    const initFirestore = async () => {
      await initializeFirestore();
      setFirestoreInitialized(true);
    };
    
    initFirestore();
  }, []);

  if (loading || !firestoreInitialized) {
    return <SplashScreen />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          user 
            ? ((user.email === 'kawazulu.intel05@gmail.com' || user.email === 'kawazulu.intel01@gmail.com' || user.email === 'marvifig@gmail.com') 
                ? <AdminPanel /> 
                : <MenuScreen />) 
            : <Navigate to="/auth" replace />
        } />
        <Route path="/auth" element={!user ? <AuthScreen /> : <Navigate to="/" replace />} />
        <Route path="/menu" element={user ? <MenuScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/admin" element={(user?.email === 'kawazulu.intel05@gmail.com' || user?.email === 'kawazulu.intel01@gmail.com' || user?.email === 'marvifig@gmail.com') ? <AdminPanel /> : <Navigate to="/auth" replace />} />
        <Route path="/appointment" element={user ? <AppointmentPage /> : <Navigate to="/auth" replace />} />
        <Route path="/my-appointments" element={user ? <MyAppointments /> : <Navigate to="/auth" replace />} />
        <Route path="/payment-callback" element={<PaymentCallback />} />
        <Route path="/promotions" element={user ? <PromotionsPage /> : <Navigate to="/auth" replace />} />
        <Route path="/vip-program" element={user ? <VipProgramPage /> : <Navigate to="/auth" replace />} />
        <Route path="/vip-coupon" element={user ? <VipCouponPage /> : <Navigate to="/auth" replace />} />
         <Route path="/coupons-gifts" element={user ? <CuponesYRegalosPage /> : <Navigate to="/auth" replace />} />
        <Route path="/contacto" element={user ? <Contacto /> : <Navigate to="/auth" replace />} />
        <Route path="/featured-services" element={user ? <FeaturedServicesPage /> : <Navigate to="/auth" replace />} />
        <Route path="/location" element={user ? <Location /> : <Navigate to="/auth" replace />} />
        <Route path="/tratamientos" element={user ? <TratamientosEsteticos /> : <Navigate to="/auth" replace />} />
        <Route path="/productos" element={user ? <Productos /> : <Navigate to="/auth" replace />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/auth" replace />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/auth" replace />} />
        
        {/* Ruta por defecto para manejar rutas no definidas */}
        <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
      </Routes>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;