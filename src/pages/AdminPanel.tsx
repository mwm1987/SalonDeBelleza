import { db, auth, storage } from '@/lib/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar,
  Clock,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Scissors,
  Droplet,
  Flower2 as Spa,
  Sparkles,
  Check,
  Image,
  Bell,
  Tag,
  Star,
  Calendar as CalendarIcon,
  Megaphone,
  Crown,
  CreditCard,
  Phone,
  Download,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getBusinessSettings, getUnavailableTimes, addUnavailableTime, deleteUnavailableTime, deleteUnavailableTimesByFilter } from '@/lib/firestore-setup';
// Add this interface
interface VipSubscription {
  id: string;
  userId: string;
  membershipId: string;
  membershipName: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string | number;
  validUntil: string;
  imageUrl: string;
  tag: string;
}

interface VipMembership {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  duration: string;
  active: boolean;
  recommended: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'event';
  startDate: string;
  endDate: string;
  active: boolean;
  imageUrl: string;
}

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

interface Treatment {
  id: string;
  name: string;
  zone?: string;
  price: number;
  duration: number;
  description?: string;
  image?: string;
  imageFile?: File;
  imagePreview?: string;
}

interface FeaturedService {
  id: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  image: string;
  popular?: boolean;
  category: 'facial' | 'hair' | 'body';
  icon: string;
}

interface Client {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  countryCode: string;
  appointmentCount: number;
  totalPaid: number;
}

interface CalendarDay {
  date: string;
  type: 'available' | 'unavailable' | 'partial' | 'today';
  appointmentCount: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: Appointment;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
  active: boolean;
}

interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
}



interface UserData {
  name?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  city?: string;
  photoURL?: string;
  displayName?: string;
  createdAt?: string;
  notifications?: boolean;
}


const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados para gestión de turnos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditAppointmentForm, setShowEditAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'pending' | 'paid' | 'cancelled' | 'completed'>('pending');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  
  // Estados para tratamientos
  const [treatments, setTreatments] = useState<any[]>([]);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [currentTreatment, setCurrentTreatment] = useState<any>(null);
  
  // Estados para clientes
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [filterClientName, setFilterClientName] = useState('');
  const [filterClientEmail, setFilterClientEmail] = useState('');
  const [showClientHistory, setShowClientHistory] = useState(false);
  const [clientHistory, setClientHistory] = useState<Appointment[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationImage, setNotificationImage] = useState<File | null>(null);
  
  // Estados para disponibilidad
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [unavailableTimes, setUnavailableTimes] = useState<any[]>([]);
  const [availabilityData, setAvailabilityData] = useState<any>({date: '', month: '', week: ''});
  const [clearAvailabilityData, setClearAvailabilityData] = useState<any>({month: '', week: ''});
  const [showClearAvailability, setShowClearAvailability] = useState(false);
  
  // Estados para promociones
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [newPromotion, setNewPromotion] = useState<Promotion>({
    id: '',
    title: '',
    description: '',
    discount: '',
    validUntil: '',
    imageUrl: '',
    tag: ''
  });
  const [promotionImage, setPromotionImage] = useState<File | null>(null);
  const [isSavingPromotion, setIsSavingPromotion] = useState(false);
  
  // Estados para notificaciones masivas
  const [showMassNotificationForm, setShowMassNotificationForm] = useState(false);
  const [massNotificationTitle, setMassNotificationTitle] = useState('');
  const [massNotificationMessage, setMassNotificationMessage] = useState('');
  const [massNotificationImage, setMassNotificationImage] = useState<File | null>(null);
  const [isSendingMassNotification, setIsSendingMassNotification] = useState(false);
  // Estados para membresías VIP
  const [vipMemberships, setVipMemberships] = useState<VipMembership[]>([]);
  const [showVipMembershipForm, setShowVipMembershipForm] = useState(false);
  const [newMembership, setNewMembership] = useState<VipMembership>({
    id: '',
    name: '',
    price: 0,
    description: '',
    features: [],
    duration: '',
    active: true,
    recommended: false
  });
  const [newFeature, setNewFeature] = useState('');
  // Add this state
const [vipSubscriptions, setVipSubscriptions] = useState<VipSubscription[]>([]);
const [filteredSubscriptions, setFilteredSubscriptions] = useState<VipSubscription[]>([]);
const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  // Estados para anuncios
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementImage, setAnnouncementImage] = useState<File | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState<Announcement>({
    id: '',
    title: '',
    content: '',
    type: 'info',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    active: true,
    imageUrl: ''
  });
  
  // Estados para servicios destacados
  const [featuredServices, setFeaturedServices] = useState<FeaturedService[]>([]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<FeaturedService | null>(null);
  const [newService, setNewService] = useState<Omit<FeaturedService, 'id'>>({
    title: '', 
    description: '', 
    price: '', 
    duration: '', 
    image: '', 
    category: 'facial', 
    icon: 'Sparkles', 
    popular: false
  });
  

  // Estados para calendario
  const [calendarCurrentDate, setCalendarCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [showDayActions, setShowDayActions] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Estado para controlar la carga inicial
  const [isLoading, setIsLoading] = useState(true);
  
const [products, setProducts] = useState<Product[]>([]);
const [showProductForm, setShowProductForm] = useState(false);
const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
const [productImage, setProductImage] = useState<File | null>(null);
const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
  name: '',
  description: '',
  price: 0,
  imageUrl: '',
  stock: 0,
  category: '',
  active: true
});

const [orders, setOrders] = useState<Order[]>([]);
const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
const [filterOrderStatus, setFilterOrderStatus] = useState('all');


// Agrega este listener para productos
useEffect(() => {
  const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
    setProducts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[]);
  });
  
  const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
    const ordersData = snap.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Order[];
    
    setOrders(ordersData);
    setFilteredOrders(ordersData);
  });
  
  return () => {
    unsubProducts();
    unsubOrders();
  };
}, []);

// Agrega esta función para manejar productos
const handleAddProduct = async () => {
  try {
    let imageUrl = newProduct.imageUrl;
    
    // Subir imagen si existe
    if (productImage) {
      imageUrl = await uploadImage(productImage, 'products');
    }
    
    const productData = {
      ...newProduct,
      imageUrl
    };
    
    if (currentProduct) {
      // Actualizar producto existente
      const productRef = doc(db, 'products', currentProduct.id);
      await updateDoc(productRef, productData);
      
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente",
      });
    } else {
      // Agregar nuevo producto
      const productRef = collection(db, 'products');
      await addDoc(productRef, productData);
      
      toast({
        title: "Producto agregado",
        description: "El producto ha sido agregado exitosamente",
      });
    }
    
    // Limpiar formulario
    setShowProductForm(false);
    setCurrentProduct(null);
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      stock: 0,
      category: '',
      active: true
    });
    setProductImage(null);
  } catch (error) {
    console.error('Error saving product:', error);
    toast({
      title: "Error",
      description: "Error al guardar el producto",
      variant: "destructive",
    });
  }
};

// Agrega esta función para actualizar el estado de una orden
const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
    
    // Actualizar estado local
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
    
    toast({
      title: "Orden actualizada",
      description: `El estado de la orden ha sido actualizado a ${status}`,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    toast({
      title: "Error",
      description: "Error al actualizar la orden",
      variant: "destructive",
    });
  }
};

// Filtra órdenes cuando cambia el filtro
useEffect(() => {
  if (filterOrderStatus === 'all') {
    setFilteredOrders(orders);
  } else {
    setFilteredOrders(orders.filter(order => order.status === filterOrderStatus));
  }
}, [orders, filterOrderStatus]);

  // Función para subir imágenes
  const uploadImage = async (file: File, path: string): Promise<string> => {
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const deleteOrder = async (orderId: string) => {
  try {
    if (confirm('¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.')) {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
      
      toast({
        title: "Orden eliminada",
        description: "La orden ha sido eliminada exitosamente",
      });
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    toast({
      title: "Error",
      description: "Error al eliminar la orden",
      variant: "destructive",
    });
  }
};
// Add this useEffect to load VIP subscriptions
useEffect(() => {
  const loadVipSubscriptions  = async (): Promise<void> => {
    try {
      const subscriptionsRef = collection(db, 'vipSubscriptions');
      const q = query(subscriptionsRef);
      const querySnapshot = await getDocs(q);
      
      const subscriptionsData: VipSubscription[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        // Get user info
        let userName = 'Usuario desconocido';
        let userEmail = 'Email no disponible';
        
        if (data.userId) {
          const userDoc = await getDoc(doc(db, 'users', data.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            userName = `${userData.name || ''} ${userData.lastname || ''}`.trim() || 'Usuario';
            userEmail = userData.email || 'Email no disponible';
          }
        }
        
        subscriptionsData.push({
          id: docSnapshot.id,
          userId: data.userId,
          membershipId: data.membershipId,
          membershipName: data.membershipName,
          userName,
          userEmail,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          paymentStatus: data.paymentStatus
        });
      }
      
      setVipSubscriptions(subscriptionsData);
      setFilteredSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error loading VIP subscriptions:', error);
    }
  };
  
  loadVipSubscriptions();
}, []);

// Add this function to filter subscriptions
useEffect(() => {
  if (subscriptionFilter === 'all') {
    setFilteredSubscriptions(vipSubscriptions);
  } else {
    setFilteredSubscriptions(vipSubscriptions.filter(sub => sub.status === subscriptionFilter));
  }
}, [vipSubscriptions, subscriptionFilter]);

  // ------------------- LISTENERS EN TIEMPO REAL -------------------
  useEffect(() => {
    setIsLoading(true);

    // Turnos (con normalización incluida)
    const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
    const unsubAppointments = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map((doc) => {
        const raw = doc.data();
        const appointmentData: any = { id: doc.id, ...raw };

        // ✅ Normalizar fecha a "YYYY-MM-DD" local
        appointmentData.date = toLocalYYYYMMDD(appointmentData.date);

        // ✅ Asegurar treatments como array
        if (appointmentData.treatments && !Array.isArray(appointmentData.treatments)) {
          appointmentData.treatments = [appointmentData.treatments];
        }

        // ✅ Default paymentStatus
        if (!appointmentData.paymentStatus) {
          appointmentData.paymentStatus = "pending";
        }

        // ✅ Convertir createdAt a objeto Date
        if (appointmentData.createdAt && typeof appointmentData.createdAt.toDate === 'function') {
          appointmentData.createdAt = appointmentData.createdAt.toDate();
        } else if (!appointmentData.createdAt) {
          appointmentData.createdAt = new Date();
        }

        return appointmentData;
      });

      setAppointments(appointmentsData);
      setFilteredAppointments(appointmentsData);
      setIsLoading(false);
    });

    // Tiempos no disponibles
    const unsubUnavailable = onSnapshot(collection(db, "unavailableTimes"), (snap) => {
      setUnavailableTimes(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Tratamientos
    const unsubTreatments = onSnapshot(collection(db, "treatments"), (snap) => {
      setTreatments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Promociones
    const unsubPromotions = onSnapshot(collection(db, "promotions"), (snap) => {
      setPromotions(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Promotion[]
      );
    });

    // Membresías VIP
    const unsubVip = onSnapshot(collection(db, "vipMemberships"), (snap) => {
      setVipMemberships(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as VipMembership[]
      );
    });

    // Anuncios
    const unsubAnnouncements = onSnapshot(collection(db, "announcements"), (snap) => {
      setAnnouncements(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Announcement[]
      );
    });

    // Servicios destacados
    const unsubServices = onSnapshot(collection(db, "featuredServices"), (snap) => {
      setFeaturedServices(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FeaturedService[]
      );
    });

    // Configuración negocio
    const unsubSettings = onSnapshot(doc(db, "settings", "business"), (docSnap) => {
      if (docSnap.exists()) {
        setBusinessSettings(docSnap.data());
      }
    });

    // Cleanup
    return () => {
      unsubAppointments();
      unsubUnavailable();
      unsubTreatments();
      unsubPromotions();
      unsubVip();
      unsubAnnouncements();
      unsubServices();
      unsubSettings();
    };
  }, []);
  
  // Cargar clientes cuando las citas cambian
  useEffect(() => {
    if (appointments.length > 0) {
      loadClients();
    }
  }, [appointments]);
  
  // Filtrar citas basado en criterios de filtro
  useEffect(() => {
    if (appointments.length > 0) {
      let filtered = [...appointments];
      
      // Filtrar por fecha si filterDate está establecido
      if (filterDate) {
        filtered = filtered.filter(appointment => appointment.date === filterDate);
      }
      
      // Filtrar por nombre o apellido si filterName está establecido
      if (filterName) {
        const searchTerm = filterName.toLowerCase();
        filtered = filtered.filter(appointment => {
          const fullName = `${appointment.personalData?.name || ''} ${appointment.personalData?.lastname || ''}`.toLowerCase();
          return fullName.includes(searchTerm);
        });
      }
      
      setFilteredAppointments(filtered);
    } else {
      setFilteredAppointments([]);
    }
  }, [appointments, filterDate, filterName, filterStatus]);
  
  // Filtrar clientes cuando filterClientName cambia
  useEffect(() => {
    if (clients.length > 0) {
      if (filterClientName || filterClientEmail) {
        const filtered = clients.filter(client => {
          const fullName = `${client.name} ${client.lastname}`.toLowerCase();
          return (
            (!filterClientName || fullName.includes(filterClientName.toLowerCase())) &&
            (!filterClientEmail || client.email.toLowerCase().includes(filterClientEmail.toLowerCase()))
          );
        });
        setFilteredClients(filtered);
      } else {
        setFilteredClients(clients);
      }
    }
  }, [clients, filterClientName, filterClientEmail]);
  
  // Generar datos del calendario cuando cambia la fecha actual, citas o tiempos no disponibles
  useEffect(() => {
    generateCalendarData();
  }, [calendarCurrentDate, appointments, unavailableTimes]);
  
  // Generar slots de tiempo cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate) {
      const loadTimeSlots = async () => {
        await generateTimeSlots(selectedDate);
      };
      loadTimeSlots();
    }
  }, [selectedDate, appointments, unavailableTimes]);


  /* ---------- Helpers: normalización y logs ---------- */
  const toLocalYYYYMMDD = (input: any): string => {
    if (input === undefined || input === null || input === '') return '';

    // Si ya es string tipo "YYYY-MM-DD" (o "YYYY-MM-DDTHH:MM..."), toma los primeros 10 chars
    if (typeof input === 'string') {
      const maybeDate = input.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) return maybeDate;
      const d = new Date(input);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      return '';
    }

    // Firestore Timestamp
    if (typeof input === 'object' && typeof input.toDate === 'function') {
      const d: Date = input.toDate();
     const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);

    return localDate.toISOString().split('T')[0]; // YYYY-MM-DD correcto en local
    }

    // JS Date
    if (input instanceof Date) {
      const d = input;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // Fallback
    const s = String(input);
    return s.slice(0, 10);
  };

  /* ---------- Modificación de loadAppointments: normalizar la fecha al cargar ---------- */
  const loadAppointments = async () => {
    try {
      const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const appointmentsData: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        const raw = doc.data();
        const appointmentData: any = { id: doc.id, ...raw };

        // Normalizar la fecha a "YYYY-MM-DD" local
        appointmentData.date = toLocalYYYYMMDD(appointmentData.date);

        // Asegurar treatments como array y paymentStatus
        if (appointmentData.treatments && !Array.isArray(appointmentData.treatments)) {
          appointmentData.treatments = [appointmentData.treatments];
        }
        if (!appointmentData.paymentStatus) {
          appointmentData.paymentStatus = 'pending';
        }

        appointmentsData.push(appointmentData);
      });

      // logs de depuración (verifica tipos/valores)
      console.log('Sample appointments loaded (date raw -> normalized):', querySnapshot.docs.slice(0,5).map(d => {
        const r = d.data();
        return { id: d.id, rawDate: r.date, normalized: toLocalYYYYMMDD(r.date), typeOfRaw: typeof r.date };
      }));

      setAppointments(appointmentsData);
      setFilteredAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Error al cargar los turnos",
        variant: "destructive",
      });
    }
  };

  const loadClients = async () => {
    try {
      // Obtener todos los clientes únicos de las citas
      const clientsMap = new Map();
      
      appointments.forEach(appointment => {
        const { personalData } = appointment;
        if (personalData && personalData.email) {
          const clientId = personalData.email;
          
          if (!clientsMap.has(clientId)) {
            clientsMap.set(clientId, {
              id: clientId,
              name: personalData.name || '',
              lastname: personalData.lastname || '',
              email: personalData.email || '',
              phone: personalData.phone || '',
              countryCode: personalData.countryCode || '+54',
              appointmentCount: 1,
              totalPaid: appointment.paymentStatus === 'paid' || appointment.paymentStatus === 'completed' ? 
                appointment.treatments.reduce((sum: number, t: any) => sum + (t.price || 0), 0) : 0
            });
          } else {
            const client = clientsMap.get(clientId);
            client.appointmentCount += 1;
            if (appointment.paymentStatus === 'paid' || appointment.paymentStatus === 'completed') {
              client.totalPaid += appointment.treatments.reduce((sum: number, t: any) => sum + (t.price || 0), 0);
            }
          }
        }
      });
      
      const clientsList = Array.from(clientsMap.values());
      setClients(clientsList);
      setFilteredClients(clientsList);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error",
        description: "Error al cargar los clientes",
        variant: "destructive",
      });
    }
  };
  
  const loadClientHistory = async (clientEmail: string) => {
    try {
      // Filtrar las citas por el email del cliente
      const clientAppointments = appointments.filter(appointment => 
        appointment.personalData?.email === clientEmail
      );
      
      setClientHistory(clientAppointments);
    } catch (error) {
      console.error('Error loading client history:', error);
      toast({
        title: "Error",
        description: "Error al cargar el historial del cliente",
        variant: "destructive",
      });
    }
  };
  
  const loadTreatments = async () => {
    try {
      const q = query(collection(db, 'treatments'));
      const querySnapshot = await getDocs(q);
      const treatmentsData: any[] = [];
      querySnapshot.forEach((doc) => {
        treatmentsData.push({ id: doc.id, ...doc.data() });
      });
      setTreatments(treatmentsData);
    } catch (error) {
      console.error('Error loading treatments:', error);
      toast({
        title: "Error",
        description: "Error al cargar los tratamientos",
        variant: "destructive",
      });
    }
  };
  
  const loadPromotions = async () => {
    try {
      const q = query(collection(db, 'promotions'));
      const querySnapshot = await getDocs(q);
      const promotionsData: Promotion[] = [];
      querySnapshot.forEach((doc) => {
        promotionsData.push({ id: doc.id, ...doc.data() } as Promotion);
      });
      setPromotions(promotionsData);
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast({
        title: "Error",
        description: "Error al cargar las promociones",
        variant: "destructive",
      });
    }
  };
  
  const loadVipMemberships = async () => {
    try {
      const q = query(collection(db, 'vipMemberships'));
      const querySnapshot = await getDocs(q);
      const membershipsData: VipMembership[] = [];
      querySnapshot.forEach((doc) => {
        membershipsData.push({ id: doc.id, ...doc.data() } as VipMembership);
      });
      setVipMemberships(membershipsData);
    } catch (error) {
      console.error('Error loading VIP memberships:', error);
      toast({
        title: "Error",
        description: "Error al cargar las membresías VIP",
        variant: "destructive",
      });
    }
  };
  
  const loadUnavailableTimes = async () => {
    try {
      const unavailableTimesData = await getUnavailableTimes();
      setUnavailableTimes(unavailableTimesData);
    } catch (error) {
      console.error('Error loading unavailable times:', error);
      toast({
        title: "Error",
        description: "Error al cargar los tiempos no disponibles",
        variant: "destructive",
      });
    }
  };
  
  const loadAnnouncements = async () => {
    try {
      const q = query(collection(db, 'announcements'));
      const querySnapshot = await getDocs(q);
      const announcementsData: Announcement[] = [];
      querySnapshot.forEach((doc) => {
        announcementsData.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast({
        title: "Error",
        description: "Error al cargar los anuncios",
        variant: "destructive",
      });
    }
  };
  
  const loadFeaturedServices = async () => {
    try {
      const q = query(collection(db, 'featuredServices'));
      const querySnapshot = await getDocs(q);
      const servicesData: FeaturedService[] = [];
      querySnapshot.forEach((doc) => {
        servicesData.push({ id: doc.id, ...doc.data() } as FeaturedService);
      });
      setFeaturedServices(servicesData);
    } catch (error) {
      console.error('Error loading featured services:', error);
      toast({
        title: "Error",
        description: "Error al cargar los servicios destacados",
        variant: "destructive",
      });
    }
  };
  
  const loadBusinessSettings = async () => {
    try {
      const settings = await getBusinessSettings();
      setBusinessSettings(settings);
    } catch (error) {
      console.error('Error loading business settings:', error);
      toast({
        title: "Error",
        description: "Error al cargar la configuración del negocio",
        variant: "destructive",
      });
    }
  };
  
  // Funciones para gestionar citas
  const handleEditAppointment = (appointment: Appointment) : void => {
    // Establecer la cita a editar
    setEditingAppointment(appointment);
    
    // Poblar los campos del formulario de edición con los datos de la cita
    setEditDate(appointment.date || '');
    setEditTime(appointment.time || '');
    setEditNotes(appointment.notes || '');
    setEditPaymentStatus(appointment.paymentStatus || 'pending');
    setEditPaymentMethod(appointment.paymentMethod || '');
    setEditClientPhone(appointment.personalData?.phone || '');
    setEditClientEmail(appointment.personalData?.email || '');
    
    // Mostrar el formulario de edición
    setShowEditAppointmentForm(true);
  };
  
  const saveEditedAppointment = async (): Promise<void> => {
    try {
      if (!editingAppointment) return;
      
      // Actualizar la cita en Firestore
      const appointmentRef = doc(db, 'appointments', editingAppointment.id);
      
      // Crear datos actualizados de la cita
      const updatedAppointment = {
        ...editingAppointment,
        date: editDate,
        time: editTime,
        notes: editNotes,
        paymentStatus: editPaymentStatus,
        paymentMethod: editPaymentMethod,
        personalData: {
          ...editingAppointment.personalData,
          phone: editClientPhone,
          email: editClientEmail
        }
      };
      
      // Actualizar en Firestore
      await updateDoc(appointmentRef, updatedAppointment);
      
      // Actualizar estado local
      const updatedAppointments = appointments.map(appointment => 
        appointment.id === editingAppointment.id ? updatedAppointment : appointment
      );
      setAppointments(updatedAppointments);
      
      // Cerrar el formulario de edición
      setShowEditAppointmentForm(false);
      setEditingAppointment(null);
      
      // Mostrar mensaje de éxito
      toast({
        title: "Turno actualizado",
        description: "El turno ha sido actualizado exitosamente",
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el turno",
        variant: "destructive",
      });
    }
  };
  
  const cancelAppointment = async (appointmentId: string): Promise<void> => {
    try {
      // Actualizar la cita en Firestore
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { status: 'cancelled' });
      
      // Actualizar estado local - Asegurando que el status sea del tipo correcto
      const updatedAppointments = appointments.map(appointment =>
        appointment.id === appointmentId ? { 
          ...appointment, 
          status: 'cancelled' as const  // Usamos 'as const' para asegurar el tipo literal
        } : appointment
      );
      setAppointments(updatedAppointments);
      
      // Enviar notificación al cliente
      const appointment = appointments.find(a => a.id === appointmentId);
      if (appointment) {
        toast({
          title: "Turno cancelado",
          description: `Turno cancelado exitosamente. Notificación enviada a ${appointment.personalData?.email}`,
        });
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Error al cancelar el turno",
        variant: "destructive",
      });
    }
  };
  
  // Funciones para gestionar clientes
  const handleViewClientHistory = (client: Client) => {
    setSelectedClient(client);
    loadClientHistory(client.email);
    setShowClientHistory(true);
  };
  
  const handleSendNotification = (client: Client) => {
    setSelectedClient(client);
    setShowNotificationForm(true);
  };
  
  // Función para exportar clientes a CSV
  const exportClientsToCSV = (clientsToExport: Client[]) => {
    if (clientsToExport.length === 0) {
      toast({
        title: "Error",
        description: "No hay clientes para exportar",
        variant: "destructive",
      });
      return;
    }
    
    // Crear encabezados CSV
    const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Citas', 'Total Pagado'];
    
    // Crear filas de datos
    const rows = clientsToExport.map(client => [
      client.name,
      client.lastname,
      client.email,
      `${client.countryCode}${client.phone}`,
      client.appointmentCount || 0,
      client.totalPaid || 0
    ]);
    
    // Combinar encabezados y filas
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Éxito",
      description: `${clientsToExport.length} clientes exportados a CSV`,
    });
  };
  
  const sendNotification = async () => {
    try {
      if (!selectedClient || !notificationMessage) {
        toast({
          title: "Error",
          description: "Por favor completa el mensaje",
          variant: "destructive",
        });
        return;
      }
      
      // Preparar datos para la notificación
      let imageUrl = null;
      
      // Si hay una imagen, subirla a Firebase Storage
      if (notificationImage && user) {
        const timestamp = Date.now();
        const imageName = `users/${user.id}/notifications/${timestamp}_${notificationImage.name}`;
        const storageRef = ref(storage, imageName);
        await uploadBytes(storageRef, notificationImage);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Crear documento en la colección notifications
      // Esta notificación será procesada por la Cloud Function processNotifications
      await addDoc(collection(db, 'notifications'), {
        clientId: selectedClient.id,
        message: notificationMessage,
        imageUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: user?.id,
        type: 'admin_message'
      });
      
      toast({
        title: "Notificación enviada",
        description: `Notificación enviada exitosamente a ${selectedClient.name} ${selectedClient.lastname}`,
      });
      
      // Cerrar el formulario
      setShowNotificationForm(false);
      setNotificationMessage('');
      setNotificationImage(null);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Error al enviar la notificación",
        variant: "destructive",
      });
    }
  };
  
  const sendMassNotification = async () => {
    try {
      if (!massNotificationMessage) {
        toast({
          title: "Error",
          description: "Por favor completa el mensaje",
          variant: "destructive",
        });
        return;
      }
      
      setIsSendingMassNotification(true);
      
      // Si hay una imagen, subirla a Firebase Storage
      let imageUrl = null;
      if (massNotificationImage && user) {
        const timestamp = Date.now();
        const imageName = `users/${user.id}/notifications/mass_${timestamp}_${massNotificationImage.name}`;
        const storageRef = ref(storage, imageName);
        await uploadBytes(storageRef, massNotificationImage);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Crear documento en la colección massNotifications
      // Esta notificación será procesada por la Cloud Function processMassNotifications
      await addDoc(collection(db, 'massNotifications'), {
        title: massNotificationTitle || 'Notificación importante',
        message: massNotificationMessage,
        imageUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: user?.id
      });
      
      toast({
        title: "Notificación masiva enviada",
        description: "La notificación masiva ha sido creada y será enviada a todos los usuarios",
      });
      
      // Cerrar el formulario y limpiar campos
      setShowMassNotificationForm(false);
      setMassNotificationTitle('');
      setMassNotificationMessage('');
      setMassNotificationImage(null);
    } catch (error) {
      console.error('Error sending mass notification:', error);
      toast({
        title: "Error",
        description: "Error al enviar la notificación masiva",
        variant: "destructive",
      });
    } finally {
      setIsSendingMassNotification(false);
    }
  };
  
  // Funciones para gestionar disponibilidad
  const handleAddUnavailableTime = async (date?: string, time?: string) => {
    try {
      let newUnavailableTime: any;

      const year = calendarCurrentDate.getFullYear();
      const month = String(calendarCurrentDate.getMonth() + 1).padStart(2, '0');

      if (date && time) {
        // ✅ SOLO cancela esa hora en esa fecha
        newUnavailableTime = { type: "time", date, time, createdAt: new Date() };
      } else if (date) {
        // Cancela todo el día
        newUnavailableTime = { type: "date", date, createdAt: new Date() };
      } else if (availabilityData.month) {
        // ❌ Antes no se guardaba el año
        newUnavailableTime = { 
          type: "month", 
          month: availabilityData.month, 
          year, 
          createdAt: new Date() 
        };
      } else if (availabilityData.week) {
        // ❌ Antes no se guardaba el mes ni el año
        newUnavailableTime = { 
          type: "week", 
          week: availabilityData.week, 
          month, 
          year, 
          createdAt: new Date() 
        };
      } else {
        toast({
          title: "Error",
          description: "Por favor selecciona una fecha, hora, mes o semana",
          variant: "destructive",
        });
        return;
      }

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, "unavailableTimes"), newUnavailableTime);

      // Actualizar estado local
      setUnavailableTimes(prev => [...prev, { id: docRef.id, ...newUnavailableTime }]);

      // Refrescar slots de la fecha actual
      if (date) {
        await generateTimeSlots(date);
      }

      toast({
        title: "Disponibilidad actualizada",
        description: time
          ? `El horario ${time} del ${date} fue marcado como no disponible`
          : `Se marcó como no disponible`,
      });
    } catch (error) {
      console.error("Error adding unavailable time:", error);
      toast({
        title: "Error",
        description: "Error al actualizar la disponibilidad",
        variant: "destructive",
      });
    }
  };

  // 👉 Eliminar tiempo no disponible
  const handleDeleteUnavailableTime = async (id: string) => {
    try {
      await deleteDoc(doc(db, "unavailableTimes", id));

      // ✅ Actualizar estado local
      setUnavailableTimes(prev => prev.filter(time => time.id !== id));

      if (selectedDate) {
        generateTimeSlots(selectedDate);
      }

      toast({
        title: "Disponibilidad actualizada",
        description: "El tiempo no disponible ha sido eliminado",
      });
    } catch (error) {
      console.error("Error deleting unavailable time:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el tiempo no disponible",
        variant: "destructive",
      });
    }
  };

  // 👉 Alternar disponibilidad de un día completo
  const toggleDayAvailability = async () => {
    if (!selectedDate) return;

    const dayUnavailable = unavailableTimes.find(
      time => time.type === "date" && time.date === selectedDate
    );

    if (dayUnavailable) {
      // habilitar de nuevo
      await handleDeleteUnavailableTime(dayUnavailable.id);
    } else {
      // deshabilitar
      await handleAddUnavailableTime(selectedDate);
    }
  };

  // 👉 Alternar disponibilidad de un horario específico
  const toggleTimeAvailability = async () => {
    if (!selectedDate || !selectedTime) return;

    const timeUnavailable = unavailableTimes.find(
      time => time.type === "time" && time.date === selectedDate && time.time === selectedTime
    );

    if (timeUnavailable) {
      await handleDeleteUnavailableTime(timeUnavailable.id);
    } else {
      await handleAddUnavailableTime(selectedDate, selectedTime);
    }

    setSelectedTime(null);
  };
  
  const handleClearAvailabilityByMonth = async () => {
    try {
      if (clearAvailabilityData.month) {
        // Confirmar con el usuario
        if (confirm(`¿Estás seguro de que deseas eliminar todos los tiempos no disponibles para el mes ${clearAvailabilityData.month}?`)) {
          // Eliminar tiempos no disponibles por mes
          await deleteUnavailableTimesByFilter({ type: 'month', month: clearAvailabilityData.month });
          
          // Recargar tiempos no disponibles
          loadUnavailableTimes();
          
          // Limpiar entrada
          setClearAvailabilityData({ month: '', week: '' });
          
          toast({
            title: "Disponibilidad actualizada",
            description: "Los tiempos no disponibles para el mes han sido eliminados",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Por favor selecciona un mes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error clearing availability by month:', error);
      toast({
        title: "Error",
        description: "Error al limpiar la disponibilidad por mes",
        variant: "destructive",
      });
    }
  };
  
  const handleClearAvailabilityByWeek = async () => {
    try {
      if (clearAvailabilityData.week) {
        // Confirmar con el usuario
        if (confirm(`¿Estás seguro de que deseas eliminar todos los tiempos no disponibles para la semana ${clearAvailabilityData.week}?`)) {
          // Eliminar tiempos no disponibles por semana
          await deleteUnavailableTimesByFilter({ type: 'week', week: clearAvailabilityData.week });
          
          // Recargar tiempos no disponibles
          loadUnavailableTimes();
          
          // Limpiar entrada
          setClearAvailabilityData({ month: '', week: '' });
          
          toast({
            title: "Disponibilidad actualizada",
            description: "Los tiempos no disponibles para la semana han sido eliminados",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Por favor selecciona una semana",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error clearing availability by week:', error);
      toast({
        title: "Error",
        description: "Error al limpiar la disponibilidad por semana",
        variant: "destructive",
      });
    }
  };
  
  // Funciones para gestionar promociones
 const handleAddPromotion = async () => {
  try {
    setIsSavingPromotion(true);
    
    if (!newPromotion.title || !newPromotion.description || !newPromotion.discount || !newPromotion.validUntil) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    
    let imageUrl = newPromotion.imageUrl;
    
    // Upload image if exists
    if (promotionImage) {
      toast({
        title: "Subiendo imagen",
        description: "Por favor espera...",
      });
      imageUrl = await uploadImage(promotionImage, 'promotions');
    }
    
    // Prepare promotion data
    const promotionData = {
      title: newPromotion.title,
      description: newPromotion.description,
      discount: newPromotion.discount,
      validUntil: newPromotion.validUntil,
      imageUrl: imageUrl,
      tag: newPromotion.tag
    };
    
    if (newPromotion.id) {
      // Update existing promotion
      const promotionRef = doc(db, 'promotions', newPromotion.id);
      await updateDoc(promotionRef, promotionData);
      
      // Update local state
      setPromotions(promotions.map(p => 
        p.id === newPromotion.id ? { ...newPromotion, imageUrl } : p
      ));
      
      toast({
        title: "Promoción actualizada",
        description: "La promoción ha sido actualizada exitosamente",
      });
    } else {
      // Add new promotion
      const promotionRef = collection(db, 'promotions');
      const docRef = await addDoc(promotionRef, promotionData);
      
      // Update local state
      const promotionWithId = { ...newPromotion, id: docRef.id, imageUrl };
      setPromotions([...promotions, promotionWithId]);
      
      toast({
        title: "Promoción agregada",
        description: "La promoción ha sido agregada exitosamente",
      });
    }
    
    // Close form and clear data
    setShowPromotionForm(false);
    setNewPromotion({
      id: '',
      title: '',
      description: '',
      discount: '',
      validUntil: '',
      imageUrl: '',
      tag: ''
    });
    setPromotionImage(null);
    
  } catch (error) {
    console.error('Error saving promotion:', error);
    toast({
      title: "Error",
      description: "Error al guardar la promoción",
      variant: "destructive",
    });
  } finally {
    setIsSavingPromotion(false);
  }
};
  
  // Funciones para gestionar membresías VIP
  const handleAddFeature = () => {
    if (!newFeature.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una característica",
        variant: "destructive",
      });
      return;
    }
    setNewMembership({
      ...newMembership,
      features: [...newMembership.features, newFeature.trim()]
    });
    setNewFeature('');
  };
  
  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...newMembership.features];
    updatedFeatures.splice(index, 1);
    setNewMembership({
      ...newMembership,
      features: updatedFeatures
    });
  };
  
  const handleAddVipMembership = async () => {
    try {
      if (!newMembership.name || !newMembership.price || !newMembership.description || !newMembership.duration || newMembership.features.length === 0) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        });
        return;
      }
      
      // Agregar membresía VIP a Firestore
      const membershipRef = collection(db, 'vipMemberships');
      const docRef = await addDoc(membershipRef, newMembership);
      
      // Actualizar estado local
      const membershipWithId = { ...newMembership, id: docRef.id };
      setVipMemberships([...vipMemberships, membershipWithId]);
      
      // Cerrar formulario y limpiar datos
      setShowVipMembershipForm(false);
      setNewMembership({
        id: '',
        name: '',
        price: 0,
        description: '',
        features: [],
        duration: '',
        active: true,
        recommended: false
      });
      
      toast({
        title: "Membresía VIP agregada",
        description: "La membresía VIP ha sido agregada exitosamente",
      });
    } catch (error) {
      console.error('Error adding VIP membership:', error);
      toast({
        title: "Error",
        description: "Error al agregar la membresía VIP",
        variant: "destructive",
      });
    }
  };
  
  // Funciones para gestionar anuncios
  const handleAddAnnouncement = async () => {
    try {
      if (!newAnnouncement.title || !newAnnouncement.content || !newAnnouncement.startDate || !newAnnouncement.endDate) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        });
        return;
      }
      
      let imageUrl = '';
      
      // Subir imagen si existe
      if (announcementImage) {
        imageUrl = await uploadImage(announcementImage, 'announcements');
      }
      
      // Agregar anuncio a Firestore
      const announcementRef = collection(db, 'announcements');
      const docRef = await addDoc(announcementRef, {
        ...newAnnouncement,
        imageUrl
      });
      
      // Actualizar estado local
      const announcementWithId = { ...newAnnouncement, id: docRef.id, imageUrl };
      setAnnouncements([...announcements, announcementWithId]);
      
      // Cerrar formulario y limpiar datos
      setShowAnnouncementForm(false);
      setNewAnnouncement({
        id: '',
        title: '',
        content: '',
        type: 'info',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        active: true,
        imageUrl: ''
      });
      setAnnouncementImage(null);
      
      toast({
        title: "Anuncio agregado",
        description: "El anuncio ha sido agregado exitosamente",
      });
    } catch (error) {
      console.error('Error adding announcement:', error);
      toast({
        title: "Error",
        description: "Error al agregar el anuncio",
        variant: "destructive",
      });
    }
  };
  
  // Función para eliminar un tratamiento
  const handleDeleteTreatment = async (treatmentId: string) => {
    try {
      // Eliminar tratamiento de Firestore
      const treatmentRef = doc(db, 'treatments', treatmentId);
      await deleteDoc(treatmentRef);
      
      // Actualizar estado local
      setTreatments(treatments.filter(treatment => treatment.id !== treatmentId));
      
      toast({
        title: "Tratamiento eliminado",
        description: "El tratamiento ha sido eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error deleting treatment:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el tratamiento",
        variant: "destructive",
      });
    }
  };

  // Funciones para gestionar servicios destacados
  const handleAddService = async () => {
    try {
      if (!newService.title || !newService.description || !newService.price || !newService.duration || !newService.category) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        });
        return;
      }
      
      // Agregar servicio destacado a Firestore
      const serviceRef = collection(db, 'featuredServices');
      const docRef = await addDoc(serviceRef, newService);
      
      // Actualizar estado local
      const serviceWithId = { id: docRef.id, ...newService };
      setFeaturedServices([...featuredServices, serviceWithId]);
      
      // Cerrar formulario y limpiar datos
      setIsAddingService(false);
      setNewService({
        title: '', 
        description: '', 
        price: '', 
        duration: '', 
        image: '', 
        category: 'facial', 
        icon: 'Sparkles', 
        popular: false
      });
      
      toast({
        title: "Servicio destacado agregado",
        description: "El servicio destacado ha sido agregado exitosamente",
      });
    } catch (error) {
      console.error('Error adding featured service:', error);
      toast({
        title: "Error",
        description: "Error al agregar el servicio destacado",
        variant: "destructive",
      });
    }
  };
  
  const handleEditService = (service: FeaturedService) => {
    setEditingService(service);
    setNewService(service);
    setIsAddingService(true);
  };
  
  const handleUpdateService = async () => {
    try {
      if (!editingService || !newService.title || !newService.description || !newService.price || !newService.duration || !newService.category) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        });
        return;
      }
      
      // Actualizar servicio destacado en Firestore
      const serviceRef = doc(db, 'featuredServices', editingService.id);
      await updateDoc(serviceRef, newService);
      
      // Actualizar estado local
      const updatedServices = featuredServices.map(service => 
        service.id === editingService.id ? { ...service, ...newService } : service
      );
      setFeaturedServices(updatedServices);
      
      // Cerrar formulario y limpiar datos
      setIsAddingService(false);
      setEditingService(null);
      setNewService({
        title: '', 
        description: '', 
        price: '', 
        duration: '', 
        image: '', 
        category: 'facial', 
        icon: 'Sparkles', 
        popular: false
      });
      
      toast({
        title: "Servicio destacado actualizado",
        description: "El servicio destacado ha sido actualizado exitosamente",
      });
    } catch (error) {
      console.error('Error updating featured service:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el servicio destacado",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteService = async (serviceId: string) => {
    try {
      // Eliminar servicio destacado de Firestore
      const serviceRef = doc(db, 'featuredServices', serviceId);
      await deleteDoc(serviceRef);
      
      // Actualizar estado local
      setFeaturedServices(featuredServices.filter(service => service.id !== serviceId));
      
      toast({
        title: "Servicio destacado eliminado",
        description: "El servicio destacado ha sido eliminado exitosamente",
      });
    } catch (error) {
      console.error('Error deleting featured service:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el servicio destacado",
        variant: "destructive",
      });
    }
  };
  
  
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
  
  // Funciones para el calendario
  const generateCalendarData = () => {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days: CalendarDay[] = [];
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: '',
        type: 'available',
        appointmentCount: 0
      });
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAppointments = appointments.filter(app => app.date === dateString);

      // Calcular semana del mes (1–5)
      const weekOfMonth = Math.ceil(day / 7);

      // Verificar si es un día no disponible
      const isUnavailable = unavailableTimes.some(time =>
        (time.type === 'date' && time.date === dateString) ||

        // Mes completo
        (time.type === 'month' &&
          time.month === String(month + 1).padStart(2, '0') &&
          time.year === year) ||

        // Semana del mes
        (time.type === 'week' &&
          time.week === String(weekOfMonth) &&
          time.month === String(month + 1).padStart(2, '0') &&
          time.year === year)
      );

      let type: 'available' | 'unavailable' | 'partial' | 'today' = 'available';

      if (dateString === todayFormatted) {
        type = 'today';
      } else if (isUnavailable) {
        type = 'unavailable';
      } else if (dayAppointments.length > 0) {
        type = 'partial';
      }

      days.push({
        date: dateString,
        type,
        appointmentCount: dayAppointments.length
      });
    }

    setCalendarDays(days);
  };

  const generateTimeSlots = async (date: string) => {
    // Parsear manualmente para evitar UTC
    const [y, m, d] = date.split("-").map(Number);
    const jsDate = new Date(y, m - 1, d);
    const dayOfWeek = jsDate.getDay();

    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayName = days[dayOfWeek];

    // Obtener horarios laborales por defecto
    const businessHours = {
      start: '08:00',
      end: '20:00',
      slotDuration: 30 // minutos
    };

    if (businessSettings && businessSettings.calendarioLaboral) {
      const dayConfig = businessSettings.calendarioLaboral[dayName];
      if (dayConfig && !dayConfig.habilitado) {
        setTimeSlots([]);
        return;
      }
    }

    try {
      // Consultar citas de esa fecha
      const appointmentsRef = collection(db, 'appointments');
      const q = query(appointmentsRef, where('date', '==', date));
      const querySnapshot = await getDocs(q);

      const busyIntervals: { start: number; end: number; appointment: Appointment }[] = [];

      querySnapshot.forEach((doc) => {
        const appointmentData = doc.data() as Appointment;
        if (appointmentData.time) {
          const totalDuration = appointmentData.treatments.reduce(
            (sum: number, t: any) => sum + (t.duration || 0), 0
          );

          const [hours, minutes] = appointmentData.time.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + totalDuration;

          busyIntervals.push({
            start: startMinutes,
            end: endMinutes,
            appointment: { ...appointmentData, id: doc.id } as Appointment
          });
        }
      });

      // 📌 Nuevo: Verificar si el día pertenece a un mes o semana bloqueada
      const year = jsDate.getFullYear();
      const month = String(jsDate.getMonth() + 1).padStart(2, '0');
      const weekOfMonth = String(Math.ceil(d / 7));

      const isDayUnavailable = unavailableTimes.some(time =>
        (time.type === 'date' && time.date === date) ||
        (time.type === 'month' && time.month === month && time.year === year) ||
        (time.type === 'week' && time.week === weekOfMonth && time.month === month && time.year === year)
      );

      // Generar slots de tiempo
      const slots: TimeSlot[] = [];
      const startTime = new Date(`1970-01-01T${businessHours.start}:00`);
      const endTime = new Date(`1970-01-01T${businessHours.end}:00`);

      let currentTime = new Date(startTime);

      while (currentTime < endTime) {
        const timeString = currentTime.toTimeString().substr(0, 5);
        const [currentHours, currentMinutes] = timeString.split(':').map(Number);
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

        const busyInterval = busyIntervals.find(interval =>
          currentTimeInMinutes >= interval.start &&
          currentTimeInMinutes < interval.end
        );

        const isTimeUnavailable = unavailableTimes.some(time =>
          time.type === 'time' && time.date === date && time.time === timeString
        );

        slots.push({
          time: timeString,
          available: !busyInterval && !isTimeUnavailable && !isDayUnavailable,
          appointment: busyInterval?.appointment
        });

        currentTime.setMinutes(currentTime.getMinutes() + businessHours.slotDuration);
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Error al generar slots de tiempo:', error);
      setTimeSlots([]);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowDayActions(true);
    generateTimeSlots(date);
  };

  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Renderizar el componente
  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-3xl font-bold">Panel de Administración</CardTitle>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="appointments">
              <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 mb-8">
                <TabsTrigger value="appointments" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Turnos
                </TabsTrigger>
                <TabsTrigger value="clients" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clientes
                </TabsTrigger>
                <TabsTrigger value="treatments" className="flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Tratamientos
                </TabsTrigger>
                <TabsTrigger value="promotions" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Promociones
                </TabsTrigger>
                <TabsTrigger value="announcements" className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Anuncios
                </TabsTrigger>
                <TabsTrigger value="vip" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Club VIP
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Calendario
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-2">
     <Package className="h-4 w-4" />
  Productos
</TabsTrigger>
                <TabsTrigger value="cash" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Caja
                </TabsTrigger>
              </TabsList>
              
              {/* Pestaña de Turnos (Mejorada) */}
              <TabsContent value="appointments">
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="w-full md:w-1/3">
                      <Label htmlFor="filter-date">Filtrar por Fecha</Label>
                      <Input
                        id="filter-date"
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="w-full md:w-1/3">
                      <Label htmlFor="filter-name">Filtrar por Nombre</Label>
                      <Input
                        id="filter-name"
                        type="text"
                        placeholder="Nombre del cliente"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="w-full md:w-1/3">
                      <Label htmlFor="filter-status">Filtrar por Estado</Label>
                      <Select
                        value={filterStatus}
                        onValueChange={(value) => setFilterStatus(value)}
                      >
                        <SelectTrigger id="filter-status" className="mt-1">
                          <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterDate('');
                        setFilterName('');
                        setFilterStatus('all');
                      }}
                      className="mt-1"
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Hora</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tratamientos</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Pago</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppointments.length > 0 ? (
                          filteredAppointments
                            .filter(appointment => 
                              filterStatus === 'all' || appointment.status === filterStatus
                            )
                            .map((appointment) => {
                              const total = appointment.treatments.reduce((sum: number, t: any) => sum + (t.price || 0), 0);
                              
                              return (
                                <TableRow key={appointment.id}>
                                  <TableCell>{appointment.date}</TableCell>
                                  <TableCell>{appointment.time}</TableCell>
                                  <TableCell>
                                    <div className="font-medium">
                                      {appointment.personalData?.name} {appointment.personalData?.lastname}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {appointment.personalData?.email}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {appointment.personalData?.countryCode} {appointment.personalData?.phone}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="max-w-xs">
                                      {appointment.treatments.map((treatment: any, index: number) => (
                                        <div key={index} className="text-sm mb-1">
                                          {treatment.name}
                                          {treatment.zone && ` (${treatment.zone})`}
                                          {treatment.price && ` - $${treatment.price}`}
                                        </div>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    ${total}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={appointment.status}
                                      onValueChange={async (value: any) => {
                                        try {
                                          const updatedAppointments = appointments.map(app => 
                                            app.id === appointment.id ? { ...app, status: value } : app
                                          );
                                          setAppointments(updatedAppointments);
                                          
                                          // Actualizar en Firestore
                                          const appointmentRef = doc(db, 'appointments', appointment.id);
                                          await updateDoc(appointmentRef, { status: value });
                                          
                                          toast({
                                            title: "Estado actualizado",
                                            description: "El estado del turno ha sido actualizado",
                                          });
                                        } catch (error) {
                                          console.error('Error updating appointment status:', error);
                                          toast({
                                            title: "Error",
                                            description: "Error al actualizar el estado del turno",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Estado" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="confirmed">Confirmado</SelectItem>
                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                        <SelectItem value="completed">Completado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={appointment.paymentStatus}
                                      onValueChange={async (value: any) => {
                                        try {
                                          const updatedAppointments = appointments.map(app => 
                                            app.id === appointment.id ? { ...app, paymentStatus: value } : app
                                          );
                                          setAppointments(updatedAppointments);
                                          
                                          // Actualizar en Firestore
                                          const appointmentRef = doc(db, 'appointments', appointment.id);
                                          await updateDoc(appointmentRef, { paymentStatus: value });
                                          
                                          toast({
                                            title: "Estado de pago actualizado",
                                            description: "El estado de pago del turno ha sido actualizado",
                                          });
                                        } catch (error) {
                                          console.error('Error updating payment status:', error);
                                          toast({
                                            title: "Error",
                                            description: "Error al actualizar el estado de pago del turno",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Pago" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="paid">Pagado</SelectItem>
                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditAppointment(appointment)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => cancelAppointment(appointment.id)}
                                        disabled={appointment.status === 'cancelled'}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  </TableRow>
                              );
                            })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-4">
                              No hay turnos disponibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Formulario de edición de turno (mejorado) */}
                {showEditAppointmentForm && editingAppointment && (
                  <Card className="mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Editar Turno</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEditAppointmentForm(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-date">Fecha</Label>
                          <Input
                            id="edit-date"
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-time">Hora</Label>
                          <Input
                            id="edit-time"
                            type="time"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-payment-status">Estado de Pago</Label>
                          <Select
                            value={editPaymentStatus}
                            onValueChange={(value: 'pending' | 'paid' | 'cancelled' | 'completed') => setEditPaymentStatus(value)}
                          >
                            <SelectTrigger id="edit-payment-status">
                              <SelectValue placeholder="Estado de pago" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="paid">Pagado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                              <SelectItem value="completed">Completado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-payment-method">Método de Pago</Label>
                          <Select
                            value={editPaymentMethod}
                            onValueChange={(value: string) => setEditPaymentMethod(value)}
                          >
                            <SelectTrigger id="edit-payment-method">
                              <SelectValue placeholder="Método de pago" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mercadopago">MercadoPago</SelectItem>
                              <SelectItem value="efectivo">Efectivo</SelectItem>
                              <SelectItem value="transferencia">Transferencia</SelectItem>
                              <SelectItem value="tarjeta">Tarjeta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-client-phone">Teléfono</Label>
                          <Input
                            id="edit-client-phone"
                            value={editClientPhone}
                            onChange={(e) => setEditClientPhone(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-client-email">Email</Label>
                          <Input
                            id="edit-client-email"
                            type="email"
                            value={editClientEmail}
                            onChange={(e) => setEditClientEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-notes">Notas</Label>
                        <Textarea
                          id="edit-notes"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={3}
                          placeholder="Notas adicionales sobre el turno..."
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowEditAppointmentForm(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={saveEditedAppointment}>
                          Guardar Cambios
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Pestaña de Clientes (Mejorada) */}
              <TabsContent value="clients">
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Gestión de Clientes</h3>
                      <p className="text-sm text-gray-600">Administra los clientes registrados en tu centro</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowMassNotificationForm(true)}
                        className="flex items-center gap-2"
                      >
                        <Bell className="h-4 w-4" />
                        Notificación Masiva
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportClientsToCSV(clients)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Exportar a CSV
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="w-full md:w-1/3">
                      <Label htmlFor="filter-client-name">Filtrar por Nombre</Label>
                      <Input
                        id="filter-client-name"
                        type="text"
                        placeholder="Nombre del cliente"
                        value={filterClientName}
                        onChange={(e) => setFilterClientName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="w-full md:w-1/3">
                      <Label htmlFor="filter-client-email">Filtrar por Email</Label>
                      <Input
                        id="filter-client-email"
                        type="email"
                        placeholder="Email del cliente"
                        value={filterClientEmail}
                        onChange={(e) => setFilterClientEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterClientName('');
                        setFilterClientEmail('');
                      }}
                      className="mt-1"
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Turnos</TableHead>
                          <TableHead>Total Pagado</TableHead>
                          <TableHead>Última Visita</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.length > 0 ? (
                          filteredClients
                            .filter(client => 
                              (!filterClientName || 
                                `${client.name} ${client.lastname}`.toLowerCase().includes(filterClientName.toLowerCase())) &&
                              (!filterClientEmail || 
                                client.email.toLowerCase().includes(filterClientEmail.toLowerCase()))
                            )
                            .map((client) => {
                              // Calcular última visita
                              const clientAppointments = appointments.filter(a => 
                                a.personalData?.email === client.email
                              );
                              const lastAppointment = clientAppointments.length > 0 
                                ? clientAppointments.sort((a, b) => 
                                    new Date(b.date).getTime() - new Date(a.date).getTime()
                                  )[0] 
                                : null;
                              
                              return (
                                <TableRow key={client.id}>
                                  <TableCell className="font-medium">
                                    {client.name} {client.lastname}
                                  </TableCell>
                                  <TableCell>{client.email}</TableCell>
                                  <TableCell>{client.countryCode} {client.phone}</TableCell>
                                  <TableCell>{client.appointmentCount || 0}</TableCell>
                                  <TableCell>${client.totalPaid || 0}</TableCell>
                                  <TableCell>
                                    {lastAppointment ? `${lastAppointment.date} ${lastAppointment.time}` : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewClientHistory(client)}
                                      >
                                        <Calendar className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSendNotification(client)}
                                      >
                                        <Bell className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // Función para contactar al cliente
                                          window.open(`https://wa.me/${client.countryCode.replace('+', '')}${client.phone}`, '_blank');
                                        }}
                                      >
                                        <Phone className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              No hay clientes disponibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Historial de cliente (mejorado) */}
                {showClientHistory && selectedClient && (
                  <Card className="mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Historial de {selectedClient.name} {selectedClient.lastname}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClientHistory(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500">Total de Turnos</div>
                          <div className="text-2xl font-bold">{clientHistory.length}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500">Total Gastado</div>
                          <div className="text-2xl font-bold">
                            $
                            {
                              clientHistory
                                .filter(a => a.paymentStatus === 'paid' || a.paymentStatus === 'completed')
                                .reduce((sum, a) => sum + 
                                  (a.treatments?.reduce((tSum: number, t: any) => tSum + (t.price || 0), 0) || 0), 0)
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Hora</TableHead>
                              <TableHead>Tratamientos</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Pago</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {clientHistory.length > 0 ? (
                              clientHistory.map((appointment) => {
                                const total = appointment.treatments.reduce((sum: number, t: any) => sum + (t.price || 0), 0);
                                
                                return (
                                  <TableRow key={appointment.id}>
                                    <TableCell>{appointment.date}</TableCell>
                                    <TableCell>{appointment.time}</TableCell>
                                    <TableCell>
                                      <div className="max-w-xs">
                                        {appointment.treatments.map((treatment: any, index: number) => (
                                          <div key={index} className="text-sm mb-1">
                                            {treatment.name}
                                            {treatment.zone && ` (${treatment.zone})`}
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>${total}</TableCell>
                                    <TableCell>
                                      {appointment.status === 'pending' && <Badge variant="outline">Pendiente</Badge>}
                                      {appointment.status === 'confirmed' && <Badge className="bg-blue-100 text-blue-800">Confirmado</Badge>}
                                      {appointment.status === 'cancelled' && <Badge variant="destructive">Cancelado</Badge>}
                                      {appointment.status === 'completed' && <Badge className="bg-green-100 text-green-800">Completado</Badge>}
                                    </TableCell>
                                    <TableCell>
                                      {appointment.paymentStatus === 'pending' && <Badge variant="outline">Pendiente</Badge>}
                                      {appointment.paymentStatus === 'paid' && <Badge className="bg-green-100 text-green-800">Pagado</Badge>}
                                      {appointment.paymentStatus === 'cancelled' && <Badge variant="destructive">Cancelado</Badge>}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-4">
                                  No hay historial disponible
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Formulario de notificación (mejorado) */}
                {showNotificationForm && selectedClient && (
                  <Card className="mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Enviar Notificación a {selectedClient.name} {selectedClient.lastname}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNotificationForm(false);
                          setNotificationMessage('');
                          setNotificationImage(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={selectedClient.email} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>Teléfono</Label>
                          <Input value={`${selectedClient.countryCode} ${selectedClient.phone}`} disabled />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notification-message">Mensaje *</Label>
                        <Textarea
                          id="notification-message"
                          value={notificationMessage}
                          onChange={(e) => setNotificationMessage(e.target.value)}
                          rows={4}
                          placeholder="Escribe tu mensaje aquí..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notification-image">Imagen (opcional)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="notification-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setNotificationImage(e.target.files[0]);
                              }
                            }}
                            className="flex-1"
                          />
                          {notificationImage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNotificationImage(null)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {notificationImage && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Imagen seleccionada: {notificationImage.name}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowNotificationForm(false);
                            setNotificationMessage('');
                            setNotificationImage(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={sendNotification}>
                          Enviar Notificación
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Formulario de notificación masiva */}
                {showMassNotificationForm && (
                  <Card className="mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Enviar Notificación Masiva</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowMassNotificationForm(false);
                          setMassNotificationTitle('');
                          setMassNotificationMessage('');
                          setMassNotificationImage(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mass-notification-title">Título</Label>
                        <Input
                          id="mass-notification-title"
                          value={massNotificationTitle}
                          onChange={(e) => setMassNotificationTitle(e.target.value)}
                          placeholder="Título de la notificación (opcional)"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="mass-notification-message">Mensaje *</Label>
                        <Textarea
                          id="mass-notification-message"
                          value={massNotificationMessage}
                          onChange={(e) => setMassNotificationMessage(e.target.value)}
                          rows={4}
                          placeholder="Escribe tu mensaje aquí..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="mass-notification-image">Imagen (opcional)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="mass-notification-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setMassNotificationImage(e.target.files[0]);
                              }
                            }}
                            className="flex-1"
                          />
                          {massNotificationImage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setMassNotificationImage(null)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {massNotificationImage && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Imagen seleccionada: {massNotificationImage.name}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-800">Importante</h4>
                            <p className="text-sm text-amber-700 mt-1">
                              Esta notificación será enviada a todos los usuarios que tengan habilitadas las notificaciones.
                              Utiliza esta función con responsabilidad.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowMassNotificationForm(false);
                            setMassNotificationTitle('');
                            setMassNotificationMessage('');
                            setMassNotificationImage(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={sendMassNotification}
                          disabled={isSendingMassNotification}
                        >
                          {isSendingMassNotification ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            'Enviar a Todos'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Pestaña de Tratamientos (Mejorada) */}
              <TabsContent value="treatments">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Gestión de Tratamientos</h3>
                      <p className="text-sm text-gray-600">Administra los tratamientos disponibles en tu centro</p>
                    </div>
                    <Button
                      onClick={() => {
                        setCurrentTreatment(null);
                        setShowTreatmentForm(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Tratamiento
                    </Button>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imagen</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Zona</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {treatments.length > 0 ? (
                          treatments.map((treatment) => (
                            <TableRow key={treatment.id}>
                              <TableCell>
                                {treatment.image ? (
                                  <div className="w-12 h-12 rounded-md overflow-hidden">
                                    <img 
                                      src={treatment.image} 
                                      alt={treatment.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center">
                                    <Image className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{treatment.name}</TableCell>
                              <TableCell>{treatment.zone || '-'}</TableCell>
                              <TableCell>${treatment.price}</TableCell>
                              <TableCell>{treatment.duration} min</TableCell>
                              <TableCell>
                                <div className="max-w-xs truncate" title={treatment.description}>
                                  {treatment.description}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setCurrentTreatment(treatment);
                                      setShowTreatmentForm(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm('¿Estás seguro de que deseas eliminar este tratamiento?')) {
                                        handleDeleteTreatment(treatment.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No hay tratamientos disponibles
                            </TableCell>
                            </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Formulario de tratamiento (mejorado) */}
                {showTreatmentForm && (
                  <Card className="mt-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>
                        {currentTreatment ? 'Editar Tratamiento' : 'Agregar Tratamiento'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowTreatmentForm(false);
                          setCurrentTreatment(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="treatment-name">Nombre *</Label>
                          <Input
                            id="treatment-name"
                            value={currentTreatment?.name || ''}
                            onChange={(e) => {
                              if (currentTreatment) {
                                setCurrentTreatment({
                                  ...currentTreatment,
                                  name: e.target.value
                                });
                              } else {
                                setCurrentTreatment({
                                  id: '',
                                  name: e.target.value,
                                  price: 0,
                                  duration: 0,
                                  description: '',
                                  zone: '',
                                  image: ''
                                });
                              }
                            }}
                            placeholder="Nombre del tratamiento"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="treatment-zone">Zona</Label>
                          <Input
                            id="treatment-zone"
                            value={currentTreatment?.zone || ''}
                            onChange={(e) => {
                              if (currentTreatment) {
                                setCurrentTreatment({
                                  ...currentTreatment,
                                  zone: e.target.value
                                });
                              }
                            }}
                            placeholder="Zona del cuerpo (opcional)"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="treatment-price">Precio *</Label>
                          <Input
                            id="treatment-price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={currentTreatment?.price || ''}
                            onChange={(e) => {
                              if (currentTreatment) {
                                setCurrentTreatment({
                                  ...currentTreatment,
                                  price: parseFloat(e.target.value) || 0
                                });
                              }
                            }}
                            placeholder="Precio del tratamiento"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="treatment-duration">Duración (minutos) *</Label>
                          <Input
                            id="treatment-duration"
                            type="number"
                            min="0"
                            value={currentTreatment?.duration || ''}
                            onChange={(e) => {
                              if (currentTreatment) {
                                setCurrentTreatment({
                                  ...currentTreatment,
                                  duration: parseInt(e.target.value) || 0
                                });
                              }
                            }}
               placeholder="Duración en minutos"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="treatment-description">Descripción</Label>
                        <Textarea
                          id="treatment-description"
                          value={currentTreatment?.description || ''}
                          onChange={(e) => {
                            if (currentTreatment) {
                              setCurrentTreatment({
                                ...currentTreatment,
                                description: e.target.value
                              });
                            }
                          }}
                          rows={3}
                          placeholder="Descripción del tratamiento (opcional)"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="treatment-image">Imagen</Label>
                        <div className="flex items-center gap-4">
                          {currentTreatment?.image && (
                            <div className="relative w-24 h-24 rounded-md overflow-hidden">
                              <img 
                                src={currentTreatment.image} 
                                alt="Imagen del tratamiento" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <Input
                            id="treatment-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  // Esto solo es para la vista previa, no para subir
                                  if (currentTreatment && typeof reader.result === 'string') {
                                    setCurrentTreatment({
                                      ...currentTreatment,
                                      imageFile: file, // Guardar el archivo para subirlo después
                                      imagePreview: reader.result // Vista previa
                                    });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {currentTreatment?.imagePreview && !currentTreatment.image && (
                            <div className="relative w-24 h-24 rounded-md overflow-hidden">
                              <img 
                                src={currentTreatment.imagePreview} 
                                alt="Vista previa" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowTreatmentForm(false);
                            setCurrentTreatment(null);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              if (!currentTreatment?.name || !currentTreatment?.price || !currentTreatment?.duration) {
                                toast({
                                  title: "Error",
                                  description: "Por favor completa los campos requeridos",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              // Crear una copia del tratamiento sin los campos temporales
                              const treatmentToSave = { ...currentTreatment };
                              delete treatmentToSave.imageFile;
                              delete treatmentToSave.imagePreview;
                              
                              // Subir imagen si existe
                              if (currentTreatment.imageFile) {
                                try {
                                  const imageUrl = await uploadImage(currentTreatment.imageFile, 'treatments');
                                  treatmentToSave.image = imageUrl;
                                } catch (imageError) {
                                  console.error('Error uploading image:', imageError);
                                  toast({
                                    title: "Error",
                                    description: "Error al subir la imagen, pero continuaremos guardando el tratamiento",
                                    variant: "destructive",
                                  });
                                }
                              }
                              
                              if (currentTreatment.id) {
                                // Actualizar tratamiento existente
                                const treatmentRef = doc(db, 'treatments', currentTreatment.id);
                                await updateDoc(treatmentRef, treatmentToSave);
                                
                                // Actualizar estado local
                                const updatedTreatments = treatments.map(treatment => 
                                  treatment.id === currentTreatment.id ? { ...treatmentToSave, id: currentTreatment.id } : treatment
                                );
                                setTreatments(updatedTreatments);
                                
                                toast({
                                  title: "Tratamiento actualizado",
                                  description: "El tratamiento ha sido actualizado exitosamente",
                                });
                              } else {
                                // Agregar nuevo tratamiento
                                const treatmentRef = collection(db, 'treatments');
                                const docRef = await addDoc(treatmentRef, treatmentToSave);
                                
                                // Actualizar estado local
                                const newTreatment = { ...treatmentToSave, id: docRef.id };
                                setTreatments([...treatments, newTreatment]);
                                
                                toast({
                                  title: "Tratamiento agregado",
                                  description: "El tratamiento ha sido agregado exitosamente",
                                });
                              }
                              
                              // Cerrar formulario
                              setShowTreatmentForm(false);
                              setCurrentTreatment(null);
                            } catch (error) {
                              console.error('Error saving treatment:', error);
                              toast({
                                title: "Error",
                                description: "Error al guardar el tratamiento",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          {currentTreatment?.id ? 'Actualizar' : 'Agregar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Pestaña de Promociones */}
              <TabsContent value="promotions">
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowPromotionForm(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Promoción
                    </Button>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Descuento</TableHead>
                          <TableHead>Válido Hasta</TableHead>
                          <TableHead>Imagen</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {promotions.length > 0 ? (
                          promotions.map((promotion) => (
                            <TableRow key={promotion.id}>
                              <TableCell>{promotion.title}</TableCell>
                              <TableCell>{promotion.description}</TableCell>
                              <TableCell>{promotion.discount}</TableCell>
                              <TableCell>{promotion.validUntil}</TableCell>
                              <TableCell>
                                {promotion.imageUrl && (
                                  <div className="w-16 h-16 rounded-md overflow-hidden">
                                    <img 
                                      src={promotion.imageUrl} 
                                      alt={promotion.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setNewPromotion({...promotion});
                                      setShowPromotionForm(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (confirm('¿Estás seguro de que deseas eliminar esta promoción?')) {
                                        try {
                                          // Eliminar promoción de Firestore
                                          const promotionRef = doc(db, 'promotions', promotion.id);
                                          await deleteDoc(promotionRef);
                                          
                                          // Actualizar estado local
                                          setPromotions(promotions.filter(p => p.id !== promotion.id));
                                          
                                          toast({
                                            title: "Promoción eliminada",
                                            description: "La promoción ha sido eliminada exitosamente",
                                          });
                                        } catch (error) {
                                          console.error('Error deleting promotion:', error);
                                          toast({
                                            title: "Error",
                                            description: "Error al eliminar la promoción",
                                            variant: "destructive",
                                          });
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No hay promociones disponibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Formulario de promoción */}
                {showPromotionForm && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>{newPromotion.id ? 'Editar Promoción' : 'Agregar Promoción'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="promotion-title">Título</Label>
                          <Input
                            id="promotion-title"
                            value={newPromotion.title}
                            onChange={(e) => setNewPromotion({ ...newPromotion, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="promotion-discount">Descuento</Label>
                          <Input
                            id="promotion-discount"
                            value={newPromotion.discount}
                            onChange={(e) => setNewPromotion({ ...newPromotion, discount: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="promotion-valid-until">Válido Hasta</Label>
                          <Input
                            id="promotion-valid-until"
                            type="date"
                            value={newPromotion.validUntil}
                            onChange={(e) => setNewPromotion({ ...newPromotion, validUntil: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="promotion-tag">Etiqueta</Label>
                          <Input
                            id="promotion-tag"
                            value={newPromotion.tag}
                            onChange={(e) => setNewPromotion({ ...newPromotion, tag: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="promotion-description">Descripción</Label>
                        <Textarea
                          id="promotion-description"
                          value={newPromotion.description}
                          onChange={(e) => setNewPromotion({ ...newPromotion, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="promotion-image">Imagen de Promoción</Label>
                        <Input
                          id="promotion-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPromotionImage(e.target.files[0]);
                            }
                          }}
                        />
                        {promotionImage && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Imagen seleccionada: {promotionImage.name}
                            </p>
                          </div>
                        )}
                        {newPromotion.imageUrl && !promotionImage && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Imagen actual: <a href={newPromotion.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Ver imagen</a>
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowPromotionForm(false);
                            if (!newPromotion.id) {
                              setNewPromotion({
                                id: '',
                                title: '',
                                description: '',
                                discount: '',
                                validUntil: '',
                                imageUrl: '',
                                tag: ''
                              });
                            }
                            setPromotionImage(null);
                          }}
                        >
                          Cancelar
                        </Button>
<Button onClick={handleAddPromotion} disabled={isSavingPromotion}>
  {isSavingPromotion ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      Guardando...
    </>
  ) : (
    newPromotion.id ? 'Actualizar' : 'Agregar'
  )}
</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Pestaña de Anuncios */}
              <TabsContent value="announcements">
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowAnnouncementForm(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Anuncio
                    </Button>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Fecha Inicio</TableHead>
                          <TableHead>Fecha Fin</TableHead>
                          <TableHead>Imagen</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {announcements.length > 0 ? (
                          announcements.map((announcement) => (
                            <TableRow key={announcement.id}>
                              <TableCell>{announcement.title}</TableCell>
                              <TableCell>
                                <Badge 
                                  className={
                                    announcement.type === 'info' ? 'bg-blue-100 text-blue-800' :
                                    announcement.type === 'warning' ? 'bg-amber-100 text-amber-800' :
                                    announcement.type === 'success' ? 'bg-green-100 text-green-800' :
                                    'bg-purple-100 text-purple-800'
                                  }
                                >
                                  {announcement.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{announcement.startDate}</TableCell>
                              <TableCell>{announcement.endDate}</TableCell>
                              <TableCell>
                                {announcement.imageUrl && (
                                  <div className="w-16 h-16 rounded-md overflow-hidden">
                                    <img 
                                      src={announcement.imageUrl} 
                                      alt={announcement.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {announcement.active ? (
                                  <Badge className="bg-green-100 text-green-800">Activo</Badge>
                                ) : (
                                  <Badge variant="outline">Inactivo</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setNewAnnouncement(announcement);
                                      setShowAnnouncementForm(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (confirm('¿Estás seguro de que deseas eliminar este anuncio?')) {
                                        try {
                                          // Eliminar anuncio de Firestore
                                          const announcementRef = doc(db, 'announcements', announcement.id);
                                          await deleteDoc(announcementRef);
                                          
                                          // Actualizar estado local
                                          setAnnouncements(announcements.filter(a => a.id !== announcement.id));
                                          
                                          toast({
                                            title: "Anuncio eliminado",
                                            description: "El anuncio ha sido eliminado exitosamente",
                                          });
                                        } catch (error) {
                                          console.error('Error deleting announcement:', error);
                                          toast({
                                            title: "Error",
                                            description: "Error al eliminar el anuncio",
                                            variant: "destructive",
                                          });
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-4">
                                No hay anuncios disponibles
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  {/* Formulario de anuncio */}
                  {showAnnouncementForm && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>{newAnnouncement.id ? 'Editar Anuncio' : 'Agregar Anuncio'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="announcement-title">Título</Label>
                            <Input
                              id="announcement-title"
                              value={newAnnouncement.title}
                              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="announcement-type">Tipo</Label>
                            <Select
                              value={newAnnouncement.type}
                              onValueChange={(value: 'info' | 'warning' | 'success' | 'event') => setNewAnnouncement({ ...newAnnouncement, type: value })}
                            >
                              <SelectTrigger id="announcement-type">
                                <SelectValue placeholder="Tipo de anuncio" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="info">Información</SelectItem>
                                <SelectItem value="warning">Advertencia</SelectItem>
                                <SelectItem value="success">Éxito</SelectItem>
                                <SelectItem value="event">Evento</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="announcement-content">Contenido</Label>
                          <Textarea
                            id="announcement-content"
                            value={newAnnouncement.content}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="announcement-start-date">Fecha de Inicio</Label>
                            <Input
                              id="announcement-start-date"
                              type="date"
                              value={newAnnouncement.startDate}
                              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, startDate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="announcement-end-date">Fecha de Fin</Label>
                            <Input
                              id="announcement-end-date"
                              type="date"
                              value={newAnnouncement.endDate}
                              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, endDate: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="announcement-image">Imagen de Anuncio</Label>
                          <Input
                            id="announcement-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setAnnouncementImage(e.target.files[0]);
                              }
                            }}
                          />
                          {announcementImage && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                Imagen seleccionada: {announcementImage.name}
                              </p>
                            </div>
                          )}
                          {newAnnouncement.imageUrl && !announcementImage && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                Imagen actual: <a href={newAnnouncement.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Ver imagen</a>
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="announcement-active"
                            checked={newAnnouncement.active}
                            onCheckedChange={(checked) => setNewAnnouncement({ ...newAnnouncement, active: checked === true })}
                          />
                          <Label htmlFor="announcement-active">Anuncio activo</Label>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAnnouncementForm(false);
                              if (!newAnnouncement.id) {
                                setNewAnnouncement({
                                  id: '',
                                  title: '',
                                  content: '',
                                  type: 'info',
                                  startDate: new Date().toISOString().split('T')[0],
                                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                  active: true,
                                  imageUrl: ''
                                });
                              }
                              setAnnouncementImage(null);
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={handleAddAnnouncement}>
                            {newAnnouncement.id ? 'Actualizar' : 'Agregar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                {/* Pestaña de Club VIP */}
                <TabsContent value="vip">
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <Button
                        onClick={() => setShowVipMembershipForm(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar Membresía
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {vipMemberships.length > 0 ? (
                        vipMemberships.map((membership) => (
                          <Card key={membership.id} className={`overflow-hidden ${membership.active ? '' : 'opacity-70'}`}>
                            <CardHeader className={`${membership.recommended ? 'bg-amber-100' : 'bg-gray-100'} pb-4`}>
                              <div className="flex justify-between items-start">
                                <CardTitle>{membership.name}</CardTitle>
                                {membership.recommended && (
                                  <Badge className="bg-amber-500">Recomendado</Badge>
                                )}
                              </div>
                              <p className="text-2xl font-bold">${membership.price}</p>
                              <p className="text-sm text-gray-600">{membership.duration}</p>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <p className="text-sm text-gray-600 mb-4">{membership.description}</p>
                              <ul className="space-y-2">
                                {membership.features.map((feature, index) => (
                                  <li key={index} className="flex items-start">
                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setNewMembership(membership);
                                  setShowVipMembershipForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (confirm('¿Estás seguro de que deseas eliminar esta membresía?')) {
                                    try {
                                      // Eliminar membresía de Firestore
                                      const membershipRef = doc(db, 'vipMemberships', membership.id);
                                      await deleteDoc(membershipRef);
                                      
                                      // Actualizar estado local
                                      setVipMemberships(vipMemberships.filter(m => m.id !== membership.id));
                                      
                                      toast({
                                        title: "Membresía eliminada",
                                        description: "La membresía VIP ha sido eliminada exitosamente",
                                      });
                                    } catch (error) {
                                      console.error('Error deleting VIP membership:', error);
                                      toast({
                                        title: "Error",
                                        description: "Error al eliminar la membresía VIP",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </CardFooter>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-8">
                          <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No hay membresías VIP disponibles</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Formulario de membresía VIP */}
                  {showVipMembershipForm && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>{newMembership.id ? 'Editar Membresía VIP' : 'Agregar Membresía VIP'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="membership-name">Nombre</Label>
                            <Input
                              id="membership-name"
                              value={newMembership.name}
                              onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="membership-price">Precio</Label>
                            <Input
                              id="membership-price"
                              type="number"
                              value={newMembership.price}
                              onChange={(e) => setNewMembership({ ...newMembership, price: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="membership-description">Descripción</Label>
                          <Textarea
                            id="membership-description"
                            value={newMembership.description}
                            onChange={(e) => setNewMembership({ ...newMembership, description: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="membership-duration">Duración</Label>
                          <Input
                            id="membership-duration"
                            value={newMembership.duration}
                            onChange={(e) => setNewMembership({ ...newMembership, duration: e.target.value })}
                            placeholder="Ej: 1 mes, 3 meses, 1 año"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Características</Label>
                          <div className="flex space-x-2 mb-2">
                            <Input
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              placeholder="Nueva característica"
                            />
                            <Button onClick={handleAddFeature}>Agregar</Button>
                          </div>
                          <div className="space-y-2">
                            {newMembership.features.map((feature, index) => (
                              <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <span>{feature}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFeature(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="membership-active"
                            checked={newMembership.active}
                            onCheckedChange={(checked) => setNewMembership({ ...newMembership, active: checked === true })}
                          />
                          <Label htmlFor="membership-active">Membresía activa</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="membership-recommended"
                            checked={newMembership.recommended}
                            onCheckedChange={(checked) => setNewMembership({ ...newMembership, recommended: checked === true })}
                          />
                          <Label htmlFor="membership-recommended">Marcar como recomendada</Label>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowVipMembershipForm(false);
                              if (!newMembership.id) {
                                setNewMembership({
                                  id: '',
                                  name: '',
                                  price: 0,
                                  description: '',
                                  features: [],
                                  duration: '',
                                  active: true,
                                  recommended: false
                                });
                              }
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={handleAddVipMembership}>
                            {newMembership.id ? 'Actualizar' : 'Agregar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>{/* Pestaña de Club VIP */}
<TabsContent value="vip">
  <div className="space-y-6">
    <div className="flex justify-end">
      <Button
        onClick={() => setShowVipMembershipForm(true)}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Agregar Membresía
      </Button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vipMemberships.length > 0 ? (
        vipMemberships.map((membership) => (
          <Card key={membership.id} className={`overflow-hidden ${membership.active ? '' : 'opacity-70'}`}>
            <CardHeader className={`${membership.recommended ? 'bg-amber-100' : 'bg-gray-100'} pb-4`}>
              <div className="flex justify-between items-start">
                <CardTitle>{membership.name}</CardTitle>
                {membership.recommended && (
                  <Badge className="bg-amber-500">Recomendado</Badge>
                )}
              </div>
              <p className="text-2xl font-bold">${membership.price}</p>
              <p className="text-sm text-gray-600">{membership.duration}</p>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600 mb-4">{membership.description}</p>
              <ul className="space-y-2">
                {membership.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewMembership(membership);
                  setShowVipMembershipForm(true);
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (confirm('¿Estás seguro de que deseas eliminar esta membresía?')) {
                    try {
                      // Eliminar membresía de Firestore
                      const membershipRef = doc(db, 'vipMemberships', membership.id);
                      await deleteDoc(membershipRef);
                      
                      // Actualizar estado local
                      setVipMemberships(vipMemberships.filter(m => m.id !== membership.id));
                      
                      toast({
                        title: "Membresía eliminada",
                        description: "La membresía VIP ha sido eliminada exitosamente",
                      });
                    } catch (error) {
                      console.error('Error deleting VIP membership:', error);
                      toast({
                        title: "Error",
                        description: "Error al eliminar la membresía VIP",
                        variant: "destructive",
                      });
                    }
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <div className="col-span-full text-center py-8">
          <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay membresías VIP disponibles</p>
        </div>
      )}
    </div>

    {/* VIP Subscriptions Section */}
    <div className="mt-12">
      <h3 className="text-xl font-bold mb-4">Suscripciones VIP Activas</h3>
      
      <div className="flex items-center mb-4">
        <Label className="mr-2">Filtrar por estado:</Label>
        <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Membresía</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length > 0 ? (
              filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{subscription.userName}</TableCell>
                  <TableCell>{subscription.userEmail}</TableCell>
                  <TableCell>{subscription.membershipName}</TableCell>
                  <TableCell>{new Date(subscription.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(subscription.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        subscription.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : subscription.status === 'expired'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {subscription.status === 'active' ? 'Activa' : 
                       subscription.status === 'expired' ? 'Expirada' : 'Cancelada'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        subscription.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : subscription.paymentStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {subscription.paymentStatus === 'paid' ? 'Pagado' : 
                       subscription.paymentStatus === 'pending' ? 'Pendiente' : 'Fallido'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No hay suscripciones VIP
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
  
  {/* Formulario de membresía VIP */}
  {showVipMembershipForm && (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{newMembership.id ? 'Editar Membresía VIP' : 'Agregar Membresía VIP'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="membership-name">Nombre</Label>
            <Input
              id="membership-name"
              value={newMembership.name}
              onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="membership-price">Precio</Label>
            <Input
              id="membership-price"
              type="number"
              value={newMembership.price}
              onChange={(e) => setNewMembership({ ...newMembership, price: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="membership-description">Descripción</Label>
          <Textarea
            id="membership-description"
            value={newMembership.description}
            onChange={(e) => setNewMembership({ ...newMembership, description: e.target.value })}
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="membership-duration">Duración</Label>
          <Input
            id="membership-duration"
            value={newMembership.duration}
            onChange={(e) => setNewMembership({ ...newMembership, duration: e.target.value })}
            placeholder="Ej: 1 mes, 3 meses, 1 año"
          />
        </div>
        <div className="space-y-2">
          <Label>Características</Label>
          <div className="flex space-x-2 mb-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Nueva característica"
            />
            <Button onClick={handleAddFeature}>Agregar</Button>
          </div>
          <div className="space-y-2">
            {newMembership.features.map((feature, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span>{feature}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFeature(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="membership-active"
            checked={newMembership.active}
            onCheckedChange={(checked) => setNewMembership({ ...newMembership, active: checked === true })}
          />
          <Label htmlFor="membership-active">Membresía activa</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="membership-recommended"
            checked={newMembership.recommended}
            onCheckedChange={(checked) => setNewMembership({ ...newMembership, recommended: checked === true })}
          />
          <Label htmlFor="membership-recommended">Marcar como recomendada</Label>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowVipMembershipForm(false);
              if (!newMembership.id) {
                setNewMembership({
                  id: '',
                  name: '',
                  price: 0,
                  description: '',
                  features: [],
                  duration: '',
                  active: true,
                  recommended: false
                });
              }
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleAddVipMembership}>
            {newMembership.id ? 'Actualizar' : 'Agregar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )}
</TabsContent>

                
                
                {/* Pestaña de Calendario */}
                <TabsContent value="calendar">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Calendario de Turnos</h2>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateMonth('prev')}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCalendarCurrentDate(new Date())}
                        >
                          Hoy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateMonth('next')}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-center text-xl font-semibold mb-4">
                      {monthNames[calendarCurrentDate.getMonth()]} {calendarCurrentDate.getFullYear()}
                    </div>

                    {/* Nombres de los días */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {dayNames.map(day => (
                        <div key={day} className="text-center font-medium text-sm py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Días del calendario */}
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, index) => (
                        <div
                          key={index}
                          className={`h-16 rounded-md flex flex-col items-center justify-center cursor-pointer text-sm
                            ${day.date ? 'hover:bg-gray-100' : ''}
                            ${day.type === 'today' ? 'bg-blue-100 border border-blue-300' : ''}
                            ${day.type === 'unavailable' ? 'bg-red-100 text-red-500' : ''}
                            ${day.type === 'partial' ? 'bg-yellow-100' : ''}
                            ${day.date === selectedDate ? 'ring-2 ring-blue-500' : ''}
                          `}
                          onClick={() => day.date && handleDayClick(day.date)}
                        >
                          {day.date && (
                            <>
                              <div>{day.date.split('-')[2]}</div>
                              {day.appointmentCount > 0 && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Acciones para el día seleccionado */}
                    {showDayActions && selectedDate && (
                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle>Acciones para el {selectedDate}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex space-x-4">
                            <Button
                              onClick={toggleDayAvailability}
                              variant={
                                unavailableTimes.some(t => t.type === 'date' && t.date === selectedDate)
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {unavailableTimes.some(t => t.type === 'date' && t.date === selectedDate)
                                ? 'Día Deshabilitado'
                                : 'Deshabilitar Día'}
                            </Button>

                            <Button
                              onClick={() => {
                                setAvailabilityData({ ...availabilityData, date: selectedDate });
                                handleAddUnavailableTime(selectedDate, selectedTime);
                              }}
                              variant="outline"
                            >
                              Agregar a Tiempos No Disponibles
                            </Button>
                          </div>

                          <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-4">
                              Horarios para el {selectedDate}
                            </h3>

                            {timeSlots.length === 0 ? (
                              <div className="text-center py-4 text-gray-500">
                                No hay horarios disponibles para este día
                              </div>
                            ) : (
                              <div className="grid grid-cols-4 gap-2">
                                {timeSlots.map((slot, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded-md text-center cursor-pointer ${
                                      slot.available
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                        : 'bg-red-100 text-red-800'
                                    } ${selectedTime === slot.time ? 'ring-2 ring-blue-500' : ''}`}
                                    onClick={() => handleTimeSlotClick(slot.time)}
                                  >
                                    <div className="font-medium">{slot.time}</div>
                                    <div className="text-xs">
                                      {slot.available ? 'Disponible' : 'No Disponible'}
                                    </div>
                                    {slot.appointment && (
                                      <div className="text-xs mt-1 truncate">
                                        {slot.appointment.personalData.name}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {selectedTime && (
                            <div className="mt-4 flex space-x-2">
                              <Button
                                onClick={toggleTimeAvailability}
                                variant={
                                  unavailableTimes.some(
                                    t =>
                                      t.type === 'time' &&
                                      t.date === selectedDate &&
                                      t.time === selectedTime
                                  )
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {unavailableTimes.some(
                                  t =>
                                    t.type === 'time' &&
                                    t.date === selectedDate &&
                                    t.time === selectedTime
                                )
                                  ? 'Habilitar Hora'
                                  : 'Deshabilitar Hora'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedTime(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Gestión de disponibilidad (mes/semana) */}
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Gestión de Disponibilidad</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="availability-month">Deshabilitar Mes</Label>
                            <Select
                              value={availabilityData.month || ''}
                              onValueChange={(value) =>
                                setAvailabilityData({ ...availabilityData, month: value })
                              }
                            >
                              <SelectTrigger id="availability-month">
                                <SelectValue placeholder="Seleccionar mes" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="01">Enero</SelectItem>
                                <SelectItem value="02">Febrero</SelectItem>
                                <SelectItem value="03">Marzo</SelectItem>
                                <SelectItem value="04">Abril</SelectItem>
                                <SelectItem value="05">Mayo</SelectItem>
                                <SelectItem value="06">Junio</SelectItem>
                                <SelectItem value="07">Julio</SelectItem>
                                <SelectItem value="08">Agosto</SelectItem>
                                <SelectItem value="09">Septiembre</SelectItem>
                                <SelectItem value="10">Octubre</SelectItem>
                                <SelectItem value="11">Noviembre</SelectItem>
                                <SelectItem value="12">Diciembre</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => handleAddUnavailableTime()}
                              className="w-full mt-2"
                            >
                              Deshabilitar Mes
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="availability-week">Deshabilitar Semana</Label>
                            <Select
                              value={availabilityData.week || ''}
                              onValueChange={(value) =>
                                setAvailabilityData({ ...availabilityData, week: value })
                              }
                            >
                              <SelectTrigger id="availability-week">
                                <SelectValue placeholder="Seleccionar semana" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Primera semana</SelectItem>
                                <SelectItem value="2">Segunda semana</SelectItem>
                                <SelectItem value="3">Tercera semana</SelectItem>
                                <SelectItem value="4">Cuarta semana</SelectItem>
                                <SelectItem value="5">Quinta semana</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => handleAddUnavailableTime()}
                              className="w-full mt-2"
                            >
                              Deshabilitar Semana
                            </Button>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-4">Tiempos No Disponibles</h3>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Tipo</TableHead>
                                  <TableHead>Valor</TableHead>
                                  <TableHead>Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {unavailableTimes.length > 0 ? (
                                  unavailableTimes.map((time) => (
                                    <TableRow key={time.id}>
                                      <TableCell>
                                        {time.type === 'date' && 'Fecha'}
                                        {time.type === 'month' && 'Mes'}
                                        {time.type === 'week' && 'Semana'}
                                        {time.type === 'time' && 'Hora'}
                                      </TableCell>
                                      <TableCell>
                                        {time.type === 'date' && time.date}
                                        {time.type === 'month' && (
                                          time.month === '01' ? 'Enero' :
                                          time.month === '02' ? 'Febrero' :
                                          time.month === '03' ? 'Marzo' :
                                          time.month === '04' ? 'Abril' :
                                          time.month === '05' ? 'Mayo' :
                                          time.month === '06' ? 'Junio' :
                                          time.month === '07' ? 'Julio' :
                                          time.month === '08' ? 'Agosto' :
                                          time.month === '09' ? 'Septiembre' :
                                          time.month === '10' ? 'Octubre' :
                                          time.month === '11' ? 'Noviembre' :
                                          time.month === '12' ? 'Diciembre' : ''
                                        )}
                                        {time.type === 'week' && `Semana ${time.week}`}
                                        {time.type === 'time' && `${time.date} ${time.time}`}
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeleteUnavailableTime(time.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center py-4">
                                      No hay tiempos no disponibles
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="products">
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold">Gestión de Productos</h3>
        <p className="text-sm text-gray-600">Administra los productos de tu tienda</p>
      </div>
      <Button
        onClick={() => {
          setCurrentProduct(null);
          setShowProductForm(true);
        }}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Agregar Producto
      </Button>
    </div>
    
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imagen</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length > 0 ? (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  {product.active ? (
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  ) : (
                    <Badge variant="outline">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentProduct(product);
                        setNewProduct({
                          name: product.name,
                          description: product.description,
                          price: product.price,
                          imageUrl: product.imageUrl,
                          stock: product.stock,
                          category: product.category,
                          active: product.active
                        });
                        setShowProductForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                          try {
                            const productRef = doc(db, 'products', product.id);
                            await deleteDoc(productRef);
                            
                            toast({
                              title: "Producto eliminado",
                              description: "El producto ha sido eliminado exitosamente",
                            });
                          } catch (error) {
                            console.error('Error deleting product:', error);
                            toast({
                              title: "Error",
                              description: "Error al eliminar el producto",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                No hay productos disponibles
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    
    {/* Formulario de producto */}
    {showProductForm && (
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {currentProduct ? 'Editar Producto' : 'Agregar Producto'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowProductForm(false);
              setCurrentProduct(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nombre *</Label>
              <Input
                id="product-name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Nombre del producto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-price">Precio *</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                placeholder="Precio del producto"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-stock">Stock *</Label>
              <Input
                id="product-stock"
                type="number"
                min="0"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                placeholder="Cantidad en stock"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category">Categoría *</Label>
              <Input
                id="product-category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                placeholder="Categoría del producto"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="product-description">Descripción</Label>
            <Textarea
              id="product-description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              rows={3}
              placeholder="Descripción del producto"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="product-image">Imagen del Producto</Label>
            <Input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setProductImage(e.target.files[0]);
                }
              }}
            />
            {productImage && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Imagen seleccionada: {productImage.name}
                </p>
              </div>
            )}
            {newProduct.imageUrl && !productImage && (
              <div className="mt-2">
                <img 
                  src={newProduct.imageUrl} 
                  alt="Vista previa" 
                  className="w-32 h-32 object-cover rounded"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="product-active"
              checked={newProduct.active}
              onCheckedChange={(checked) => setNewProduct({ ...newProduct, active: checked === true })}
            />
            <Label htmlFor="product-active">Producto activo</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowProductForm(false);
                setCurrentProduct(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddProduct}>
              {currentProduct ? 'Actualizar' : 'Agregar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )}
    
    {/* Gestión de Órdenes */}
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Órdenes</h3>
          <p className="text-sm text-gray-600">Administra las órdenes de tus clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-order-status">Filtrar por estado:</Label>
          <Select
            value={filterOrderStatus}
            onValueChange={setFilterOrderStatus}
          >
            <SelectTrigger id="filter-order-status" className="w-32">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>{order.userId || 'Cliente no registrado'}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm mb-1">
                          {item.name} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>${order.total}</TableCell>
                  <TableCell>
                    {order.createdAt instanceof Date 
                      ? order.createdAt.toLocaleDateString() 
                      : new Date().toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value: Order['status']) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="paid">Pagado</SelectItem>
                        <SelectItem value="shipped">Enviado</SelectItem>
                        <SelectItem value="delivered">Entregado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Aquí podrías implementar la funcionalidad para ver detalles de la orden
                        console.log('Ver detalles de orden:', order);
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </TableCell>
                  <TableCell>
  <div className="flex space-x-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        // Aquí podrías implementar la funcionalidad para ver detalles de la orden
        console.log('Ver detalles de orden:', order);
      }}
    >
      Ver Detalles
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => deleteOrder(order.id)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No hay órdenes disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</TabsContent>

                {/* Pestaña de Caja */}
                <TabsContent value="cash">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Resumen Mensual (Servicios)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between">
                            <span>Total Turnos Realizados:</span>
                            <span className="font-medium">{appointments.filter(a => a.status === 'completed').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Ingresos Servicios:</span>
                            <span className="font-medium">$
                              {appointments
                                .filter(a => a.paymentStatus === 'paid' || a.paymentStatus === 'completed')
                                .reduce((sum, a) => sum + 
                                  (a.treatments?.reduce((tSum, t) => tSum + (t.price || 0), 0) || 0), 0)
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Turnos Pendientes:</span>
                            <span className="font-medium">{appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Pendiente Servicios:</span>
                            <span className="font-medium">$
                              {appointments
                                .filter(a => a.paymentStatus === 'pending')
                                .reduce((sum, a) => sum + (a.treatments?.reduce((tSum, t) => tSum + (t.price || 0), 0) || 0), 0)
                              }
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Resumen Mensual (Productos)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between">
                            <span>Total Órdenes Pagadas:</span>
                            <span className="font-medium">
                              {orders.filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered').length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Ingresos Productos:</span>
                            <span className="font-medium">$
                              {orders
                                .filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered')
                                .reduce((sum, o) => sum + (o.total || 0), 0)
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Órdenes Pendientes:</span>
                            <span className="font-medium">{orders.filter(o => o.status === 'pending').length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Pendiente Productos:</span>
                            <span className="font-medium">$
                              {orders
                                .filter(o => o.status === 'pending')
                                .reduce((sum, o) => sum + (o.total || 0), 0)
                              }
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Estimación de Cierre de Caja Total</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Reservados (Servicios):</span>
                          <span className="font-medium">{appointments.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Órdenes (Productos):</span>
                          <span className="font-medium">{orders.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimación Total Servicios:</span>
                          <span className="font-medium">$
                            {appointments.reduce((sum, a) => sum + (a.treatments?.reduce((tSum, t) => tSum + (t.price || 0), 0) || 0), 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimación Total Productos:</span>
                          <span className="font-medium">$
                            {orders.reduce((sum, o) => sum + (o.total || 0), 0)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-4">
                          <span>Estimación Total General:</span>
                          <span>$
                            {appointments.reduce((sum, a) => sum + (a.treatments?.reduce((tSum, t) => tSum + (t.price || 0), 0) || 0), 0) +
                             orders.reduce((sum, o) => sum + (o.total || 0), 0)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Movimientos Recientes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Estado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...appointments.slice(0, 5), ...orders.slice(0, 5)]
                                .sort((a, b) => {
                                  // Asegurar que createdAt sea un objeto Date para la comparación
                                  const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
                                  const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
                                  return dateB.getTime() - dateA.getTime();
                                })
                                .slice(0, 10)
                                .map((item: any) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      {item.createdAt instanceof Date 
                                        ? item.createdAt.toLocaleDateString() 
                                        : new Date().toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                      {item.treatments ? 'Servicio' : 'Producto'}
                                    </TableCell>
                                    <TableCell>
                                      {item.treatments
                                        ? `Servicio: ${item.personalData?.name} ${item.personalData?.lastname}`
                                        : `Productos: ${item.items.length} items`
                                      }
                                    </TableCell>
                                    <TableCell>
                                      $
                                      {item.treatments
                                        ? item.treatments.reduce((sum: number, t: any) => sum + (t.price || 0), 0)
                                        : item.total
                                      }
                                    </TableCell>
                                    <TableCell>
                                      {item.paymentStatus ? (
                                        <Badge className={
                                          item.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                          item.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }>
                                          {item.paymentStatus}
                                        </Badge>
                                      ) : (
                                        <Badge className={
                                          item.status === 'paid' || item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }>
                                          {item.status}
                                        </Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  
  export default AdminPanel;
  