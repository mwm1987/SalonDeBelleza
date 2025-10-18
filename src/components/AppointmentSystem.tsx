import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, messaging, getToken, onMessage, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar, Clock, User, Phone, Mail, CreditCard, LogOut, Tag, Gift, Crown, Check, X, Megaphone, Sparkles, Scissors, Droplet, Plus, Edit, Trash2, Save } from 'lucide-react';
import PromoAnnounceCarousel, { Promotion, Announcement } from '../pages/PromoAnnounceCarousel';
import { Checkbox } from '@/components/ui/checkbox';
import { onSnapshot } from "firebase/firestore";



const AppointmentSystem = () => {
  const { user, signOut } = useAuth();
  console.log('AppointmentSystem rendered, user:', user);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data states
  const [personalData, setPersonalData] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    countryCode: '+54'
  });
  
  const [treatmentData, setTreatmentData] = useState({
    treatmentType: '',
    zone: ''
  });
  
  const [selectedTreatments, setSelectedTreatments] = useState<any[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  
  const [treatments, setTreatments] = useState<any[]>([]);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [unavailableTimes, setUnavailableTimes] = useState<any[]>([]);
  const [isLoadingTreatments, setIsLoadingTreatments] = useState(true);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  
  // Estados para promociones y anuncios

const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Suscripción en tiempo real a promociones
    const unsubPromotions = onSnapshot(collection(db, "promotions"), (snapshot) => {
      setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion)));
    });

    // Suscripción en tiempo real a anuncios
    const unsubAnnouncements = onSnapshot(collection(db, "announcements"), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
 });
 return () => {
      unsubPromotions();
      unsubAnnouncements();
    };
  }, []);
  // ------------------- LISTENERS EN TIEMPO REAL -------------------
  useEffect(() => {
    // Tratamientos en vivo
    const unsubTreatments = onSnapshot(collection(db, "treatments"), (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTreatments(data);
      setIsLoadingTreatments(false);
    });

    // Horarios no disponibles en vivo
    const unsubUnavailable = onSnapshot(collection(db, "unavailableTimes"), (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUnavailableTimes(data);
    });

    // Configuración del negocio en vivo
    const unsubSettings = onSnapshot(doc(db, "settings", "business"), (docSnap) => {
      if (docSnap.exists()) {
        setBusinessSettings(docSnap.data());
      }
    });

    // Promociones en vivo
    const unsubPromotions = onSnapshot(collection(db, "promotions"), (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Promotion));
      setPromotions(data);
    });

    // Anuncios en vivo
    const unsubAnnouncements = onSnapshot(collection(db, "announcements"), (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Announcement));
      // Filtrar solo anuncios activos
      const activeAnnouncements = data.filter(announcement => announcement.active);
      setAnnouncements(activeAnnouncements);
    });

    return () => {
      unsubTreatments();
      unsubUnavailable();
      unsubSettings();
      unsubPromotions();
      unsubAnnouncements();
    };
  }, []);

  // Load user data if authenticated
  useEffect(() => {
    if (user) {
      try {
        setPersonalData({
          name: user.displayName ? user.displayName.split(' ')[0] : '',
          lastname: user.displayName ? user.displayName.split(' ')[1] || '' : '',
          email: user.email || '',
          phone: user.phoneNumber || '',
          countryCode: '+54'
        });
      } catch (error) {
        console.error('Error setting user data:', error);
      }
    }
  }, [user]);
  
  // Initialize Firebase Messaging
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && user) {
      // Request permission for notifications
      Notification.requestPermission().then(async permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          try {
            // Get FCM token
            const fcmToken = await getToken(messaging, { vapidKey: 'AIzaSyD8i5Birp1dhkiflPd5-QJs5pAKrBZfI4A' });
            console.log('FCM Token:', fcmToken);
            
            // Store FCM token in Firestore under user's document
            if (fcmToken) {
              const userDocRef = doc(db, 'users', user.id);
              const fcmTokensRef = collection(userDocRef, 'fcmTokens');
              
              // Add token with device info
              await addDoc(fcmTokensRef, {
                token: fcmToken,
                device: navigator.userAgent,
                createdAt: serverTimestamp()
              });
              
              console.log('FCM token stored in Firestore');
            }
          } catch (error) {
            console.error('Error storing FCM token:', error);
          }
        }
      });
      
      // Handle incoming messages
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // In a real implementation, you would display the notification
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [user]);
  
  // Update available dates when data changes
  useEffect(() => {
    if (businessSettings) {
      const available = getAvailableDates();
      setAvailableDates(available);
    }
  }, [unavailableTimes, businessSettings]);
  
  // Update available time slots when date or selected treatments change
  useEffect(() => {
    if (date && businessSettings) {
      setIsLoadingTimes(true);
      const loadAvailableTimes = async () => {
        try {
          const available = await getAvailableTimeSlots(date);
          console.log('Horarios disponibles para', date, ':', available);
          setAvailableTimes(available);
        } catch (error) {
          console.error('Error al cargar horarios disponibles:', error);
          setAvailableTimes([]);
        } finally {
          setIsLoadingTimes(false);
        }
      };
      loadAvailableTimes();
    } else {
      setAvailableTimes([]);
    }
  }, [date, unavailableTimes, businessSettings, selectedTreatments]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate personal data
      if (!personalData.name || !personalData.lastname || !personalData.email || !personalData.phone) {
        alert('Por favor completa todos los campos personales');
        return;
      }
    } else if (currentStep === 2) {
      // Validate treatment selection
      if (selectedTreatments.length === 0) {
        alert('Por favor selecciona al menos un tratamiento');
        return;
      }
    } else if (currentStep === 3) {
      // Validate date and time
      if (!date || !time) {
        alert('Por favor selecciona una fecha y hora');
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };
  
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const addTreatment = () => {
    if (!treatmentData.treatmentType) {
      alert('Por favor selecciona un tipo de tratamiento');
      return;
    }
    
    const selectedTreatment = treatments.find(t => t.id === treatmentData.treatmentType);
    
    if (!selectedTreatment) {
      alert('Tratamiento no encontrado');
      return;
    }
    
    const newTreatment = {
      id: Date.now(),
      treatmentId: selectedTreatment.id || '',
      name: selectedTreatment.name || '',
      zone: treatmentData.zone || '',
      price: selectedTreatment.price || 0,
      duration: selectedTreatment.duration || 0
    };
    
    setSelectedTreatments([...selectedTreatments, newTreatment]);
    
    // Reset treatment selection
    setTreatmentData({
      treatmentType: '',
      zone: ''
    });
  };
  
  const removeTreatment = (id: number) => {
    setSelectedTreatments(selectedTreatments.filter(t => t.id !== id));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }
    
    if (!paymentMethod) {
      alert('Por favor selecciona un método de pago');
      return;
    }
    
    try {
      // Validate required fields
      if (!date || !time || !paymentMethod) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }
      
      // Verificación final de disponibilidad - Corregido para usar el índice existente
      const finalCheck = query(
        collection(db, 'appointments'),
        where('date', '==', date),
        where('time', '==', time),
        where('status', 'not-in', ['cancelled', 'completed'])
      );
      
      const finalSnapshot = await getDocs(finalCheck);
      if (!finalSnapshot.empty) {
        alert('Este horario ya fue reservado. Por favor selecciona otro.');
        return;
      }
      
      // Save appointment to Firestore
      const appointmentData = {
        userId: user?.id || null,
        personalData: {
          name: personalData.name || '',
          lastname: personalData.lastname || '',
          email: personalData.email || '',
          phone: personalData.phone || '',
          countryCode: personalData.countryCode || '+54'
        },
        treatments: selectedTreatments || [],
        date: date || '',
        time: time || '',
        notes: notes || '',
        paymentMethod: paymentMethod || '',
        paymentStatus: 'pending', // Default payment status
        status: 'pending',
        createdAt: new Date()
      };
      
      // Guardar la cita y obtener el ID
      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
      const appointmentId = docRef.id;
      
      // Notificar al administrador sobre la nueva cita
      await notifyAdmin();
      
      // Si el método de pago es MercadoPago, redirigir al usuario a la página de pago
      if (paymentMethod === 'mercadopago') {
        try {
          // Importar la función de creación de pago
          const { createAppointmentPayment } = await import('../lib/mercadopago');
          
          // Crear preferencia de pago
          const paymentResponse = await createAppointmentPayment(
            appointmentId,
            selectedTreatments,
            {
              name: personalData.name || '',
              lastname: personalData.lastname || '',
              email: personalData.email || '',
              phone: personalData.phone || '',
              countryCode: personalData.countryCode || '+54'
            }
          );
          
          // Redirigir a MercadoPago
          if (paymentResponse.init_point) {
            console.log('Redirigiendo a MercadoPago:', paymentResponse.init_point);
            window.location.href = paymentResponse.init_point;
            return; // Importante: detener la ejecución aquí para evitar resetear el formulario
          } else {
            console.error('Error: No se recibió una URL válida de MercadoPago');
            alert('Error al procesar el pago: No se recibió una URL válida de MercadoPago');
          }
        } catch (paymentError) {
          console.error('Error al procesar el pago:', paymentError);
          alert('Error al procesar el pago. El turno fue reservado pero deberás completar el pago más tarde.');
        }
      }
      
      // Solo mostrar este mensaje y resetear el formulario si no se redirigió a MercadoPago
      alert('Turno reservado exitosamente!');
      
      // Si no se redirigió a MercadoPago, notificar al administrador
      if (paymentMethod !== 'mercadopago') {
        await notifyAdmin();
      }
      // Reset form
      setCurrentStep(1);
      setSelectedTreatments([]);
      setDate('');
      setTime('');
      setNotes('');
      setTermsAccepted(false);
      setPaymentMethod('');
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Error al reservar el turno. Por favor intenta nuevamente.');
    }
  };
  
  // Función auxiliar para convertir tiempo a minutos
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Generate time slots based on business settings
  const generateTimeSlots = () => {
    if (!businessSettings) return [];
    
    const slots: string[] = [];
    const [startHour, startMinute] = businessSettings.businessHours.from.split(':').map(Number);
    const [endHour, endMinute] = businessSettings.businessHours.to.split(':').map(Number);
    const slotDuration = businessSettings.slotDuration || 30;
    
    // Create dates for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentTime = new Date(today);
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    let endTime = new Date(today);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // Handle overnight business hours (e.g., 20:00 to 02:00)
    if (endTime < currentTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    // Generate time slots
    while (currentTime <= endTime) {
      const hours = currentTime.getHours().toString().padStart(2, '0');
      const minutes = currentTime.getMinutes().toString().padStart(2, '0');
      slots.push(`${hours}:${minutes}`);
      
      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }
    
    return slots;
  };
  
  // Get available dates that are not restricted by admin settings
  const getAvailableDates = () => {
    if (!unavailableTimes || !businessSettings) return [];

    const today = new Date();
    const maxDate = new Date();
    // Add 30 days in advance (based on business settings or default)
    maxDate.setDate(today.getDate() + (businessSettings.advanceBookingDays || 30));
    const availableDates: string[] = [];

    // Generate dates from today to maxDate
    for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      let isAvailable = true;

      // Revisar restricciones guardadas en unavailableTimes
      for (const unavailable of unavailableTimes) {
        // Día completo
        if ((unavailable.type === 'day' || unavailable.type === 'date') && unavailable.date === dateStr) {
          isAvailable = false;
          break;
        }

        // Mes completo
        if (unavailable.type === 'month') {
          const blockedMonth = parseInt(unavailable.month, 10);
          if (d.getMonth() + 1 === blockedMonth) {
            isAvailable = false;
            break;
          }
        }

        // Semana completa (ya lo tenías)
        if (unavailable.type === 'week' && isDateInWeek(d, unavailable.week)) {
          isAvailable = false;
          break;
        }
      }

      // Bloqueos por días no laborables definidos en businessSettings
      if (isAvailable && businessSettings.nonWorkingDays) {
        const dayOfWeek = d.getDay(); // 0 = Domingo, 1 = Lunes, etc.
        if (businessSettings.nonWorkingDays.includes(dayOfWeek)) {
          isAvailable = false;
        }
      }

      if (isAvailable) {
        availableDates.push(dateStr);
      }
    }

    return availableDates;
  };
  
  // Get available time slots for a specific date, considering restrictions and existing appointments
  const getAvailableTimeSlots = async (selectedDate: string) => {
    if (!businessSettings || !unavailableTimes) return [];

    const timeSlots = generateTimeSlots();
    const availableSlots: string[] = [];

    const [y, m, d] = selectedDate.split("-").map(Number);
    const jsDate = new Date(y, m - 1, d);

    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const weekOfMonth = String(Math.ceil(d / 7));

    // Unavailable horas específicas
    const unavailableTimeSlots = unavailableTimes.filter(
      time => time.type === 'time' && time.date === selectedDate
    );

    // Unavailable rangos horarios
    const unavailableRanges = unavailableTimes.filter(
      time => time.type === 'range' && time.date === selectedDate
    );

    // Día completo bloqueado
    const isDayBlocked = unavailableTimes.some(time =>
      (time.type === 'date' && time.date === selectedDate) ||
      (time.type === 'month' && time.month === month && time.year === year) ||
      (time.type === 'week' && time.week === weekOfMonth && time.month === month && time.year === year)
    );

    if (isDayBlocked) {
      return [];
    }

    try {
      // Consultar citas existentes para esta fecha
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('date', '==', selectedDate),
        where('status', 'not-in', ['cancelled', 'completed'])
      );

      const querySnapshot = await getDocs(q);
      const appointments: { time: string; duration: number }[] = [];

      querySnapshot.forEach((doc) => {
        const appointmentData = doc.data();
        if (appointmentData.time && appointmentData.treatments) {
          const totalDuration = appointmentData.treatments.reduce(
            (sum: number, treatment: any) => sum + (treatment.duration || 0), 0
          );
          appointments.push({ time: appointmentData.time, duration: totalDuration });
        }
      });

      const selectedTreatmentsDuration = selectedTreatments.reduce(
        (sum, treatment) => sum + (treatment.duration || 0), 0
      );

      for (const slot of timeSlots) {
        let isAvailable = true;

        // Bloqueos por hora exacta
        for (const unavailable of unavailableTimeSlots) {
          if (unavailable.time === slot) {
            isAvailable = false;
            break;
          }
        }

        // Bloqueos por rango
        if (isAvailable) {
          for (const range of unavailableRanges) {
            const slotTime = new Date(`2000-01-01T${slot}:00`);
            const rangeStart = new Date(`2000-01-01T${range.startTime}:00`);
            const rangeEnd = new Date(`2000-01-01T${range.endTime}:00`);

            if (slotTime >= rangeStart && slotTime < rangeEnd) {
              isAvailable = false;
              break;
            }
          }
        }

        // Superposición con citas existentes
        if (isAvailable) {
          const slotMinutes = timeToMinutes(slot);

          for (const appointment of appointments) {
            const appointmentMinutes = timeToMinutes(appointment.time);
            const appointmentEnd = appointmentMinutes + appointment.duration;

            if (slotMinutes >= appointmentMinutes && slotMinutes < appointmentEnd) {
              isAvailable = false;
              break;
            }

            if (selectedTreatmentsDuration > 0) {
              const newAppointmentEnd = slotMinutes + selectedTreatmentsDuration;
              if (newAppointmentEnd > appointmentMinutes && slotMinutes < appointmentEnd) {
                isAvailable = false;
                break;
              }
            }
          }
        }

        // Verificar que no pase el horario de cierre
        if (isAvailable && selectedTreatmentsDuration > 0) {
          const [endHour, endMinute] = businessSettings.businessHours.to.split(':').map(Number);
          const closingMinutes = endHour * 60 + endMinute;
          const slotMinutes = timeToMinutes(slot);

          if (slotMinutes + selectedTreatmentsDuration > closingMinutes) {
            isAvailable = false;
          }
        }

        if (isAvailable) {
          availableSlots.push(slot);
        }
      }

      return availableSlots;
    } catch (error) {
      console.error('Error al verificar citas existentes:', error);
      return timeSlots;
    }
  };
  
  // Helper function to check if a date falls within a specific week
  const isDateInWeek = (date: Date, weekString: string) => {
    // Parse week string like "2024-W30"
    const year = parseInt(weekString.split('-W')[0]);
    const weekNumber = parseInt(weekString.split('-W')[1]);
    
    // Calculate the start date of the week (Monday)
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = firstDayOfYear.getDay() === 0 ? 6 : firstDayOfYear.getDay() - 1;
    const firstWeekStart = new Date(firstDayOfYear);
    firstWeekStart.setDate(firstDayOfYear.getDate() - daysOffset);
    
    // Calculate the Monday of the target week
    const weekStart = new Date(firstWeekStart);
    weekStart.setDate(firstWeekStart.getDate() + (weekNumber - 1) * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return date >= weekStart && date <= weekEnd;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Treatment types from Firestore - versión corregida
  const treatmentTypes = treatments.length > 0 ? treatments.map(treatment => ({
    value: treatment.id || treatment.docId, // Algunas bases de datos usan docId en lugar de id
    label: treatment.name || treatment.nombre // Algunas bases de datos usan nombre en lugar de name
  })).filter(t => t.value && t.label) : [];

  // Después de crear una cita exitosamente, notificar al admin
const notifyAdmin = async () => {
  try {
    // Obtener el ID del administrador desde la configuración del negocio
    // Si no está configurado, usar un valor predeterminado
    const adminUserId = businessSettings?.adminUserId || 'admin-user-id';
    
    // Obtener información del primer tratamiento seleccionado
    const firstTreatment = selectedTreatments.length > 0 ? selectedTreatments[0] : null;
    const treatmentNames = selectedTreatments.map(t => t.name).join(', ');
    
    // Crear una notificación en la colección 'notifications'
    // Esta será procesada automáticamente por la Cloud Function 'processNotifications'
    await addDoc(collection(db, 'notifications'), {
      clientId: adminUserId,
      message: `Nueva cita reservada por ${personalData.name} ${personalData.lastname} para el ${date} a las ${time} - Tratamiento(s): ${treatmentNames || 'No especificado'}`,
      status: 'pending',
      createdAt: serverTimestamp(),
      type: 'appointment',
      appointmentData: {
        clientName: `${personalData.name} ${personalData.lastname}`,
        clientEmail: personalData.email,
        clientPhone: personalData.phone,
        date,
        time,
        treatmentId: firstTreatment?.treatmentId,
        treatmentName: treatmentNames
      }
    });
    
    console.log('Notificación de nueva cita enviada al administrador');
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
};

// Esta función se llamará después de crear la cita en handleSubmit
  // Zones for different treatments - versión mejorada
  const getTreatmentZones = (treatmentId: string) => {
    const selectedTreatment = treatments.find(t => 
      t.id === treatmentId || t.docId === treatmentId
    );
    
    // Si el tratamiento tiene zonas definidas, usarlas
    if (selectedTreatment && selectedTreatment.zones) {
      return selectedTreatment.zones.map((zone: string, index: number) => ({
        value: `zona-${index + 1}`,
        label: zone
      }));
    }
    
    // Zonas por defecto como fallback
    return [
      { value: 'zona-1', label: 'Zona 1' },
      { value: 'zona-2', label: 'Zona 2' },
      { value: 'zona-3', label: 'Zona 3' }
    ];
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Client view - Appointment booking form */}
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={async () => {
                try {
                  await signOut();
                  window.location.href = '/auth';
                } catch (error) {
                  console.error('Error signing out:', error);
                  alert('Error al cerrar sesión');
                }
              }}
              className="hover:underline flex items-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Salir
            </button>
          </div>
          
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Sistema de Turnos</CardTitle>
              <p className="text-center text-gray-600">Secretos De Belleza</p>
            </CardHeader>
            <CardContent>
              {/* Step indicator */}
              <div className="flex justify-center mb-8">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep === step ? 'bg-blue-600 text-white' : 
                      currentStep > step ? 'bg-green-600 text-white' : 'bg-gray-200'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`w-16 h-1 ${currentStep > step ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Step 1: Personal Data */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-center">Datos Personales</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="name"
                          value={personalData.name}
                          onChange={(e) => setPersonalData({...personalData, name: e.target.value})}
                          className="pl-10"
                          placeholder="Tu nombre"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname">Apellido</Label>
                      <Input
                        id="lastname"
                        value={personalData.lastname}
                        onChange={(e) => setPersonalData({...personalData, lastname: e.target.value})}
                        placeholder="Tu apellido"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={personalData.email}
                          onChange={(e) => setPersonalData({...personalData, email: e.target.value})}
                          className="pl-10"
                          placeholder="tu@email.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={personalData.countryCode} 
                          onValueChange={(value) => setPersonalData({...personalData, countryCode: value})}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+54">+54 (Argentina)</SelectItem>
                            <SelectItem value="+591">+591 (Bolivia)</SelectItem>
                            <SelectItem value="+55">+55 (Brasil)</SelectItem>
                            <SelectItem value="+57">+57 (Colombia)</SelectItem>
                            <SelectItem value="+593">+593 (Ecuador)</SelectItem>
                            <SelectItem value='+595'>+595 (Paraguay)</SelectItem>
                            <SelectItem value='+51'>+51 (Perú)</SelectItem>
                            <SelectItem value='+598'>+598 (Uruguay)</SelectItem>
                            <SelectItem value='+58'>+58 (Venezuela)</SelectItem>
                            <SelectItem value='+56'>+56 (Chile)</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            value={personalData.phone}
                            onChange={(e) => setPersonalData({...personalData, phone: e.target.value})}
                            className="pl-10"
                            placeholder="Número de teléfono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleNextStep}>Siguiente</Button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Treatment Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-center">Selecciona tu Tratamiento</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="treatment-type">Tipo de Tratamiento</Label>
                      <Select 
                        value={treatmentData.treatmentType} 
                        onValueChange={(value) => setTreatmentData({...treatmentData, treatmentType: value, zone: ''})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tratamiento" />
                        </SelectTrigger>
                        <SelectContent>
                          {treatmentTypes.length > 0 ? (
                            treatmentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>
                              {isLoadingTreatments ? 'Cargando tratamientos...' : 'No hay tratamientos disponibles'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {treatmentData.treatmentType && (
                      <div className="space-y-2">
                        <Label htmlFor="treatment-zone">Zona</Label>
                        <Select 
                          value={treatmentData.zone} 
                          onValueChange={(value) => setTreatmentData({...treatmentData, zone: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione la zona" />
                          </SelectTrigger>
                          <SelectContent>
                            {getTreatmentZones(treatmentData.treatmentType).map((zone) => (
                              <SelectItem key={zone.value} value={zone.value}>
                                {zone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Tratamientos seleccionados:</h3>
                    {selectedTreatments.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTreatments.map((treatment) => (
                          <div key={treatment.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span>{treatment.name}{treatment.zone && ` - ${treatment.zone}`}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeTreatment(treatment.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No hay tratamientos seleccionados</p>
                    )}
                    <Button 
                      onClick={addTreatment} 
                      className="mt-4"
                      disabled={!treatmentData.treatmentType}
                    >
                      Agregar Tratamiento
                    </Button>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevStep}>Anterior</Button>
                    <Button onClick={handleNextStep}>Siguiente</Button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Date and Time Selection */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-center">Selecciona Fecha y Hora</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="date"
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value.slice(0,10))}
                          className="pl-10"
                          min={availableDates.length > 0 ? availableDates[0] : undefined}
                          max={availableDates.length > 0 ? availableDates[availableDates.length - 1] : undefined}
                        />
                      </div>
                      {availableDates.length === 0 && (
                        <p className="text-sm text-red-500">No hay fechas disponibles para reservar</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Horario {isLoadingTimes && <span className="text-sm text-gray-500">(Cargando...)</span>}</Label>
                      {date ? (
                        availableTimes.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {availableTimes.map((slot) => (
                              <Button
                                key={slot}
                                variant={time === slot ? "default" : "outline"}
                                onClick={() => setTime(slot)}
                                className="h-10"
                              >
                                {slot}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-red-500">No hay horarios disponibles para esta fecha</p>
                        )
                      ) : (
                        <p className="text-sm text-gray-500">Selecciona una fecha primero</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="notes">Notas adicionales</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Información adicional sobre tu cita..."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevStep}>Anterior</Button>
                    <Button onClick={handleNextStep} disabled={!date || !time}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 4: Summary and Confirmation */}
              {currentStep === 4 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-xl font-semibold text-center">Resumen y Confirmación</h2>
                  
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium">Datos Personales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div><span className="font-medium">Nombre:</span> {personalData.name} {personalData.lastname}</div>
                      <div><span className="font-medium">Email:</span> {personalData.email}</div>
                      <div><span className="font-medium">Teléfono:</span> {personalData.countryCode} {personalData.phone}</div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium">Tratamientos</h3>
                    {selectedTreatments.map((treatment, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{treatment.name}{treatment.zone && ` - ${treatment.zone}`}</span>
                        <span>${treatment.price}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${selectedTreatments.reduce((sum, t) => sum + (t.price || 0), 0)}</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium">Fecha and Hora</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div><span className="font-medium">Fecha:</span> {new Date(date).toLocaleDateString('es-ES')}</div>
                      <div><span className="font-medium">Hora:</span> {time}</div>
                    </div>
                    {notes && (
                      <div><span className="font-medium">Notas:</span> {notes}</div>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium">Método de Pago</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        type="button"
                        variant={paymentMethod === 'mercadopago' ? "default" : "outline"}
                        onClick={() => setPaymentMethod('mercadopago')}
                        className="flex flex-col items-center justify-center h-24"
                      >
                        <CreditCard className="h-6 w-6 mb-2" />
                        MercadoPago
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    />
                    <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      He leído y acepto los términos y condiciones
                    </Label>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevStep}>Anterior</Button>
                    <Button type="submit">Confirmar Turno</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
          
          {/* Carrusel de Promociones y Anuncios */}
           <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <PromoAnnounceCarousel
        promotions={promotions}
        announcements={announcements}
        autoPlay={true}
        autoPlayInterval={6000}
      />
    </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentSystem;