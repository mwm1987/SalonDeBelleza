import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { createAppointmentPayment } from '../lib/mercadopago';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CreditCard,
  Sparkles,
  MapPin,
  Heart,
  CheckCircle,
  AlertCircle,
  CalendarPlus,
  Star,
  Gift,
  Crown,
  Scissors
} from 'lucide-react';
import { motion } from 'framer-motion';


// Definir la interfaz para el tipo de cita
interface Appointment {
  id: string;
  date: string;
  time: string;
  personalData?: {
    name: string;
    lastname: string;
    email: string;
    phone: string;
    countryCode: string;
  };
  treatments?: Array<{
    name: string;
    zone?: string;
    price?: number;
  }> | {
    name: string;
    zone?: string;
    price?: number;
  };
  treatmentData?: {
    treatmentType: string;
    zone: string;
  };
  notes?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
}

const MyAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) {
        setLoading(false);
        setError('Debes iniciar sesión para ver tus turnos');
        return;
      }

      try {
        setLoading(true);
        // Query appointments where the client email matches the current user's email
        const q = query(
          collection(db, 'appointments'),
          where('personalData.email', '==', user.email)
        );

        const querySnapshot = await getDocs(q);
        const appointmentsData: Appointment[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];

        // Sort appointments by date and time
        appointmentsData.sort((a: Appointment, b: Appointment) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

        setAppointments(appointmentsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Error al cargar tus turnos. Por favor, intenta nuevamente.');
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  // Format date to display in a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Get appointment status based on date and time and payment status
  const getAppointmentStatus = (appointment: Appointment): { 
    status: string, 
    color: string, 
    bgGradient: string,
    icon: React.ReactNode 
  } => {
    const { date, time, paymentStatus } = appointment;
    const appointmentDate = new Date(`${date}T${time}`);
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    // Si el pago está pendiente, mostrar estado de pago pendiente
    if (paymentStatus === 'pending') {
      return { 
        status: 'Pago Pendiente', 
        color: 'text-yellow-700',
        bgGradient: 'bg-gradient-to-r from-yellow-100 to-amber-100',
        icon: <CreditCard className="w-4 h-4" />
      };
    } else if (paymentStatus === 'failed') {
      return { 
        status: 'Pago Fallido', 
        color: 'text-red-700',
        bgGradient: 'bg-gradient-to-r from-red-100 to-rose-100',
        icon: <AlertCircle className="w-4 h-4" />
      };
    } else if (appointmentDate < now) {
      return { 
        status: 'Completado', 
        color: 'text-emerald-700',
        bgGradient: 'bg-gradient-to-r from-emerald-100 to-green-100',
        icon: <CheckCircle className="w-4 h-4" />
      };
    } else if (hoursDiff <= 24) {
      return { 
        status: '¡Mañana!', 
        color: 'text-orange-700',
        bgGradient: 'bg-gradient-to-r from-orange-100 to-yellow-100',
        icon: <AlertCircle className="w-4 h-4" />
      };
    } else {
      return { 
        status: 'Confirmado', 
        color: 'text-blue-700',
        bgGradient: 'bg-gradient-to-r from-blue-100 to-indigo-100',
        icon: <Calendar className="w-4 h-4" />
      };
    };
  };
  
  // Función para procesar el pago de una cita
  const handlePayment = async (appointment: Appointment) => {
    try {
      // Crear preferencia de pago
      const paymentResponse = await createAppointmentPayment(
        appointment.id,
        Array.isArray(appointment.treatments) ? appointment.treatments : [appointment.treatments],
        {
          name: appointment.personalData?.name || '',
          lastname: appointment.personalData?.lastname || '',
          email: appointment.personalData?.email || '',
          phone: appointment.personalData?.phone || '',
          countryCode: appointment.personalData?.countryCode || '+54'
        }
      );
      
      // Redirigir a MercadoPago
      if (paymentResponse.init_point) {
        console.log('Redirigiendo a MercadoPago:', paymentResponse.init_point);
        window.location.href = paymentResponse.init_point;
      } else {
        console.error('Error: No se recibió una URL válida de MercadoPago');
        alert('Error al procesar el pago: No se recibió una URL válida de MercadoPago');
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Error al procesar el pago. Por favor intenta nuevamente.');
    }
  };

  const getServiceIcon = (treatmentName: string) => {
    const name = treatmentName?.toLowerCase() || '';
    if (name.includes('facial') || name.includes('limpieza')) return <Sparkles className="w-5 h-5" />;
    if (name.includes('corte') || name.includes('pelo')) return <Scissors className="w-5 h-5" />;
    if (name.includes('masaje')) return <Heart className="w-5 h-5" />;
    return <Star className="w-5 h-5" />;
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full -translate-x-48 -translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-teal-200/20 to-green-200/20 rounded-full translate-x-48 translate-y-48 blur-3xl"></div>
      
      
      
      <div className="container mx-auto px-6 py-12 relative z-10">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(236, 72, 153, 0.3)",
                "0 0 0 15px rgba(236, 72, 153, 0)",
              ]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Calendar className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Mis Turnos
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Gestiona tus citas de belleza 💅✨
          </p>
        </motion.div>

        {loading ? (
          <motion.div 
            className="flex flex-col justify-center items-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-pink-500 absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Cargando tus citas...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <p className="text-red-600 font-medium text-lg mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Iniciar Sesión
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : appointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mx-auto"
          >
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 p-8 text-center text-white">
                <motion.div 
                  className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-4"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <CalendarPlus className="w-10 h-10" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">¡Tu primera cita te espera!</h3>
                <p className="text-white/90 text-lg">No tienes turnos reservados aún</p>
              </div>
              <CardContent className="pt-8 pb-8 text-center">
                <p className="text-gray-600 mb-6 text-lg">
                  Reserva tu momento de belleza y relajación
                </p>
                <Button 
                  onClick={() => window.location.href = '/appointment'}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <CalendarPlus className="w-5 h-5 mr-2" />
                  Reservar mi primer turno
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {appointments.map((appointment: Appointment, index) => {
              const { status, color, bgGradient, icon } = getAppointmentStatus(appointment);
              const treatmentName = appointment.treatments ? 
                (Array.isArray(appointment.treatments) ? 
                  appointment.treatments[0]?.name || 'Turno'
                : appointment.treatments.name || 'Turno')
              : appointment.treatmentData?.treatmentType || 'Turno';

              return (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-md">
                    {/* Header with gradient */}
                    <CardHeader className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white p-6 relative overflow-hidden">
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform duration-500"></div>
                      
                      <CardTitle className="flex justify-between items-start relative z-10">
                        <div className="flex items-center space-x-3">
                          <motion.div 
                            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                            whileHover={{ rotate: 15, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {getServiceIcon(treatmentName)}
                          </motion.div>
                          <div>
                            <h3 className="text-lg font-bold leading-tight">
                              {treatmentName}
                            </h3>
                            {appointment.treatments && Array.isArray(appointment.treatments) && 
                             appointment.treatments.length > 1 && (
                              <p className="text-white/80 text-sm">
                                +{appointment.treatments.length - 1} tratamiento{appointment.treatments.length > 2 ? 's' : ''} más
                              </p>
                            )}
                            {(appointment.treatments && !Array.isArray(appointment.treatments) && appointment.treatments.zone) ||
                             (appointment.treatmentData?.zone) && (
                              <p className="text-white/80 text-sm">
                                {appointment.treatments && !Array.isArray(appointment.treatments) 
                                  ? appointment.treatments.zone 
                                  : appointment.treatmentData?.zone}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={`${bgGradient} ${color} border-0 font-semibold px-3 py-1 flex items-center space-x-1 shadow-lg`}>
                          {icon}
                          <span>{status}</span>
                        </Badge>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-6 space-y-5">
                      {/* Date and Time */}
                      <div className="grid grid-cols-1 gap-4">
                        <motion.div 
                          className="flex items-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Fecha</p>
                            <p className="text-gray-900 font-bold">{formatDate(appointment.date)}</p>
                          </div>
                        </motion.div>

                        <motion.div 
                          className="flex items-center p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Hora</p>
                            <p className="text-gray-900 font-bold">{appointment.time}</p>
                          </div>
                        </motion.div>
                      </div>

                      {/* Personal Information */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <h4 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                          <Crown className="w-5 h-5 text-pink-500" />
                          <span>Información del Cliente</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center space-x-3 p-3 hover:bg-pink-50 rounded-lg transition-colors">
                            <User className="w-5 h-5 text-pink-600" />
                            <span className="text-gray-700 font-medium">
                              {appointment.personalData?.name} {appointment.personalData?.lastname}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-3 hover:bg-purple-50 rounded-lg transition-colors">
                            <Phone className="w-5 h-5 text-purple-600" />
                            <span className="text-gray-700 font-medium">
                              {appointment.personalData?.countryCode} {appointment.personalData?.phone}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-3 p-3 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Mail className="w-5 h-5 text-indigo-600" />
                            <span className="text-gray-700 font-medium text-sm">
                              {appointment.personalData?.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Information */}
                      {appointment.paymentMethod && (
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 font-medium">Método de pago</p>
                              <p className="text-gray-900 font-bold">{appointment.paymentMethod}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {appointment.notes && (
                        <div className="pt-4 border-t border-gray-100">
                          <motion.div 
                            className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200"
                            whileHover={{ scale: 1.02 }}
                          >
                            <h5 className="text-sm font-bold text-gray-800 mb-2 flex items-center space-x-2">
                              <Gift className="w-4 h-4 text-orange-500" />
                              <span>Notas especiales</span>
                            </h5>
                            <p className="text-gray-700 text-sm leading-relaxed">{appointment.notes}</p>
                          </motion.div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-gray-100">
                        <Button 
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          onClick={() => window.location.href = '/appointment'}
                        >
                          <CalendarPlus className="w-5 h-5 mr-2" />
                          Reservar otra cita
                        </Button>
                      </div>
                      
                      {/* Payment Method and Status */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              MercadoPago
                            </span>
                          </div>
                          
                          {/* Mostrar botón de pago si el estado es pendiente */}
                          {appointment.paymentStatus === 'pending' && appointment.paymentMethod === 'mercadopago' && (
                            <Button 
                              onClick={() => handlePayment(appointment)}
                              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pagar Ahora
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Footer CTA */}
        {appointments.length > 0 && (
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="max-w-2xl mx-auto">
              <Card className="border-0 shadow-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white overflow-hidden">
                <CardContent className="p-8 text-center relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                  
                  <motion.div 
                    className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 relative z-10"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  >
                    <Heart className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3 relative z-10">¡Reserva tu próxima sesión de belleza!</h3>
                  <p className="text-white/90 mb-6 text-lg relative z-10">
                    Continúa cuidando tu belleza con nuestros tratamientos premium
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/appointment'}
                    className="bg-white text-pink-600 hover:bg-pink-50 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative z-10"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Reservar nuevo turno
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;