import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Appointments from './Appointments';
import Clients from './Clients';
import Treatments from './Treatments';
import Promotions from './Promotions';
import Announcements from './Announcements';
import Vip from './Vip';
import Calendar from './Calendar';
import Products from './Products';
import Cash from './Cash';
import ContactAdmin from './ContactAdmin';
import CuponesRegalos from './CuponesRegalos'; // Importar el nuevo componente
import { 
  Calendar as CalendarIcon,
  Users,
  Scissors,
  Tag,
  Megaphone,
  Crown,
  CreditCard,
  Package,
  LogOut,
  TrendingUp,
  Activity,
  DollarSign,
  Contact,
  Gift // Nuevo icono para cupones
} from 'lucide-react';

interface Appointment {
  id: string;
  userId?: string | null;
  personalData: {
    name: string;
    lastname: string;
    email: string;
    phone: string;
    countryCode: string;
  };
  treatments: any[];
  date: string;
  time: string;
  notes: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'cancelled' | 'completed';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados principales
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('appointments');

  // Helper para normalizar fechas
  const toLocalYYYYMMDD = (input: any): string => {
    if (input === undefined || input === null || input === '') return '';

    if (typeof input === 'string') {
      const maybeDate = input.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) return maybeDate;
      const d = new Date(input);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      return '';
    }

    if (typeof input === 'object' && typeof input.toDate === 'function') {
      const d: Date = input.toDate();
      const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return localDate.toISOString().split('T')[0];
    }

    if (input instanceof Date) {
      const d = input;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const s = String(input);
    return s.slice(0, 10);
  };

  // Cargar citas desde Firestore
  useEffect(() => {
    setIsLoading(true);
    
    const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
    const unsubAppointments = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map((doc) => {
        const raw = doc.data();
        const appointmentData: any = { id: doc.id, ...raw };

        // Normalizar fecha
        appointmentData.date = toLocalYYYYMMDD(appointmentData.date);

        // Asegurar treatments como array
        if (appointmentData.treatments && !Array.isArray(appointmentData.treatments)) {
          appointmentData.treatments = [appointmentData.treatments];
        }

        // Default paymentStatus
        if (!appointmentData.paymentStatus) {
          appointmentData.paymentStatus = "pending";
        }

        // Convertir createdAt a objeto Date
        if (appointmentData.createdAt && typeof appointmentData.createdAt.toDate === 'function') {
          appointmentData.createdAt = appointmentData.createdAt.toDate();
        } else if (!appointmentData.createdAt) {
          appointmentData.createdAt = new Date();
        }

        return appointmentData;
      });

      setAppointments(appointmentsData);
      setIsLoading(false);
    });

    return () => {
      unsubAppointments();
    };
  }, []);

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  // Función para forzar recarga de appointments
  const handleAppointmentUpdate = () => {
    // No es necesario hacer nada porque la suscripción en tiempo real actualizará automáticamente
  };

  // Estadísticas rápidas
  const todayAppointments = appointments.filter(apt => 
    apt.date === new Date().toISOString().split('T')[0]
  ).length;

  const pendingAppointments = appointments.filter(apt => 
    apt.status === 'pending'
  ).length;

  const completedToday = appointments.filter(apt => 
    apt.date === new Date().toISOString().split('T')[0] && apt.status === 'completed'
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Panel de Administración
                </h1>
                <p className="text-indigo-100 mt-1">
                  Gestiona tu spa de forma inteligente
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-indigo-100 text-sm">Bienvenido,</p>
                <p className="text-white font-semibold">{user?.email}</p>
              </div>
              <Button 
                variant="secondary" 
                onClick={handleLogout}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Turnos Hoy</p>
                  <p className="text-3xl font-bold">{todayAppointments}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <CalendarIcon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Pendientes</p>
                  <p className="text-3xl font-bold">{pendingAppointments}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completados Hoy</p>
                  <p className="text-3xl font-bold">{completedToday}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel principal */}
        <Card className="shadow-2xl border-0 bg-white">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-24">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                  <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-600 animate-spin" style={{animationDelay: '-0.15s'}}></div>
                </div>
                <p className="text-gray-600 mt-4 font-medium">Cargando datos...</p>
              </div>
            ) : (
              <Tabs 
                defaultValue="appointments" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
                  <TabsList className="bg-white border-0 h-auto p-0 w-full justify-start">
                    <div className="flex flex-wrap gap-2 p-6">
                      <TabsTrigger 
                        value="appointments" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Turnos
                        {pendingAppointments > 0 && (
                          <Badge className="ml-2 bg-red-500 text-white text-xs px-2 py-0">
                            {pendingAppointments}
                          </Badge>
                        )}
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="clients" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Clientes
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="treatments" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <Scissors className="h-4 w-4 mr-2" />
                        Tratamientos
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="promotions" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        Promociones
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="announcements" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transitionall duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <Megaphone className="h-4 w-4 mr-2" />
                        Anuncios
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="vip" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Club VIP
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="cupones" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Cupones
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="calendar" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Calendario
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="products" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Productos
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="cash" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Caja
                      </TabsTrigger>
                      
                      <TabsTrigger 
                        value="contact" 
                        className="bg-gray-100 text-gray-700 data-[state=active]:bg-indigo-600 data-[state=active]:text-white border border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 transition-all duration-200 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <Contact className="h-4 w-4 mr-2" />
                        Contacto
                      </TabsTrigger>
                    </div>
                  </TabsList>
                </div>
                
                <div className="p-6">
                  {activeTab === "appointments" && (
                    <TabsContent value="appointments" className="mt-0">
                      <Appointments 
                        appointments={appointments} 
                        onAppointmentUpdate={handleAppointmentUpdate}
                      />
                    </TabsContent>
                  )}
                  
                  {activeTab === "clients" && (
                    <TabsContent value="clients" className="mt-0">
                      <Clients appointments={appointments} />
                    </TabsContent>
                  )}
                  
                  {activeTab === "treatments" && (
                    <TabsContent value="treatments" className="mt-0">
                      <Treatments />
                    </TabsContent>
                  )}
                  
                  {activeTab === "promotions" && (
                    <TabsContent value="promotions" className="mt-0">
                      <Promotions />
                    </TabsContent>
                  )}
                  
                  {activeTab === "announcements" && (
                    <TabsContent value="announcements" className="mt-0">
                      <Announcements />
                    </TabsContent>
                  )}
                  
                  {activeTab === "vip" && (
                    <TabsContent value="vip" className="mt-0">
                      <Vip />
                    </TabsContent>
                  )}
                  
                  {activeTab === "cupones" && (
                    <TabsContent value="cupones" className="mt-0">
                      <CuponesRegalos />
                    </TabsContent>
                  )}
                  
                  {activeTab === "calendar" && (
                    <TabsContent value="calendar" className="mt-0">
                      <Calendar />
                    </TabsContent>
                  )}
                  
                  {activeTab === "products" && (
                    <TabsContent value="products" className="mt-0">
                      <Products />
                    </TabsContent>
                  )}
                  
                  {activeTab === "cash" && (
                    <TabsContent value="cash" className="mt-0">
                      <Cash />
                    </TabsContent>
                  )}
                  
                  {activeTab === "contact" && (
                    <TabsContent value="contact" className="mt-0">
                      <ContactAdmin />
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;