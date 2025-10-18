// src/components/admin/Clients.tsx
import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Download, Phone, Calendar, X, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Client {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  countryCode: string;
  appointmentCount: number;
  totalPaid: number;
  uid?: string;
  fcmTokens?: string[];
  notificationsEnabled?: boolean;
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

interface ClientsProps {
  appointments: Appointment[];
}

const Clients = ({ appointments }: ClientsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados para gestión de clientes
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [filterClientName, setFilterClientName] = useState('');
  const [filterClientEmail, setFilterClientEmail] = useState('');
  const [showClientHistory, setShowClientHistory] = useState(false);
  const [clientHistory, setClientHistory] = useState<Appointment[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationImage, setNotificationImage] = useState<File | null>(null);
  const [showMassNotificationForm, setShowMassNotificationForm] = useState(false);
  const [massNotificationTitle, setMassNotificationTitle] = useState('');
  const [massNotificationMessage, setMassNotificationMessage] = useState('');
  const [massNotificationImage, setMassNotificationImage] = useState<File | null>(null);
  const [isSendingMassNotification, setIsSendingMassNotification] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [refreshingTokens, setRefreshingTokens] = useState<string | null>(null);

  // Cargar clientes cuando las citas cambian
  useEffect(() => {
    if (appointments.length > 0) {
      loadClients();
    }
  }, [appointments]);

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

  // Función para obtener el UID del usuario por email
  const getUserIdByEmail = async (email: string): Promise<string | null> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };

  // Función para obtener tokens FCM de un usuario
  const getUserFcmTokens = async (userId: string): Promise<string[]> => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const fcmTokensRef = collection(userDocRef, 'fcmTokens');
      const tokensSnapshot = await getDocs(fcmTokensRef);
      
      return tokensSnapshot.docs.map(doc => doc.data().token);
    } catch (error) {
      console.error('Error getting FCM tokens:', error);
      return [];
    }
  };

  // Función para verificar si un usuario tiene notificaciones habilitadas
  const checkNotificationPermissions = async (userId: string): Promise<boolean> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() && userDoc.data()?.notificationsEnabled !== false;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  };

  // Función para actualizar tokens de un cliente específico
  const refreshClientTokens = async (clientId: string): Promise<Client | null> => {
    try {
      const clientIndex = clients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) return null;
      
      const client = clients[clientIndex];
      if (!client.uid) return client;
      
      // Obtener tokens actualizados
      const updatedTokens = await getUserFcmTokens(client.uid);
      
      // Verificar permisos de notificación
      const notificationsEnabled = await checkNotificationPermissions(client.uid);
      
      // Actualizar cliente
      const updatedClient = {
        ...client,
        fcmTokens: updatedTokens,
        notificationsEnabled
      };
      
      // Actualizar lista de clientes
      const updatedClients = [...clients];
      updatedClients[clientIndex] = updatedClient;
      setClients(updatedClients);
      
      // Si estamos filtrando, actualizar también la lista filtrada
      if (filterClientName || filterClientEmail) {
        const filtered = updatedClients.filter(client => {
          const fullName = `${client.name} ${client.lastname}`.toLowerCase();
          return (
            (!filterClientName || fullName.includes(filterClientName.toLowerCase())) &&
            (!filterClientEmail || client.email.toLowerCase().includes(filterClientEmail.toLowerCase()))
          );
        });
        setFilteredClients(filtered);
      } else {
        setFilteredClients(updatedClients);
      }
      
      toast({
        title: "Tokens actualizados",
        description: `Se actualizaron los tokens para ${client.name} ${client.lastname}`,
      });
      
      return updatedClient;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los tokens del cliente",
        variant: "destructive",
      });
      return null;
    }
  };

const loadClients = async () => {
  try {
    // Obtener todos los usuarios de la colección 'users'
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersMap = new Map();
    
    // Procesar cada usuario
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const email = userData.email;
      
      if (email) {
        // Obtener tokens FCM y permisos de notificación
        let fcmTokens: string[] = [];
        let notificationsEnabled = userData.notificationsEnabled !== false;
        
        try {
          fcmTokens = await getUserFcmTokens(userDoc.id);
        } catch (error) {
          console.error('Error getting FCM tokens for user', userDoc.id, error);
        }
        
        // Calcular información de citas para este usuario
        const userAppointments = appointments.filter(appointment => 
          appointment.personalData?.email === email
        );
        
        const totalPaid = userAppointments
          .filter(a => a.paymentStatus === 'paid' || a.paymentStatus === 'completed')
          .reduce((sum, a) => sum + 
            (a.treatments?.reduce((tSum: number, t: any) => tSum + (t.price || 0), 0) || 0), 0);
        
        usersMap.set(email, {
          id: email,
          uid: userDoc.id,
          fcmTokens,
          notificationsEnabled,
          name: userData.name || '',
          lastname: userData.lastname || '',
          email: email,
          phone: userData.phone || '',
          countryCode: userData.countryCode || '+54',
          appointmentCount: userAppointments.length,
          totalPaid
        });
      }
    }
    
    const clientsList = Array.from(usersMap.values());
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
  
  const loadClientHistory = (clientEmail: string) => {
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

  const handleViewClientHistory = (client: Client) => {
    setSelectedClient(client);
    loadClientHistory(client.email);
    setShowClientHistory(true);
  };
const handleSendNotification = async (client: Client) => {
  console.log("handleSendNotification llamado para el cliente:", client.id);
  
  if (!client.uid) {
    console.log("Cliente no tiene UID");
    toast({
      title: "Error",
      description: "Este cliente no tiene una cuenta registrada",
      variant: "destructive",
    });
    return;
  }
  
  // Actualizar tokens antes de enviar notificación
  setRefreshingTokens(client.id);
  console.log("Actualizando tokens para el cliente:", client.id);
  
  const updatedClient = await refreshClientTokens(client.id);
  setRefreshingTokens(null);
  
  if (!updatedClient) {
    console.log("No se pudo actualizar el cliente");
    toast({
      title: "Error",
      description: "No se pudieron actualizar los tokens del cliente",
      variant: "destructive",
    });
    return;
  }
  
  // MODIFICACIÓN: Permitir abrir el formulario incluso sin tokens, pero mostrar advertencia
  if (!updatedClient.fcmTokens || updatedClient.fcmTokens.length === 0) {
    console.log("Cliente no tiene tokens FCM - Mostrando advertencia");
    toast({
      title: "Advertencia",
      description: "Este cliente no tiene dispositivos registrados para recibir notificaciones. La notificación no llegará hasta que el cliente active las notificaciones en la app.",
      variant: "default",
    });
    // NO return aquí - permitimos continuar
  }
  
  if (!updatedClient.notificationsEnabled) {
    console.log("Cliente tiene notificaciones deshabilitadas - Mostrando advertencia");
    toast({
      title: "Advertencia",
      description: "Este cliente tiene las notificaciones deshabilitadas. La notificación no llegará hasta que el cliente active las notificaciones.",
      variant: "default",
    });
    // NO return aquí - permitimos continuar
  }
  
  console.log("Abriendo formulario de notificación");
  setSelectedClient(updatedClient);
  setNotificationTitle('');
  setNotificationMessage('');
  setNotificationImage(null);
  setShowNotificationForm(true);
};
const sendNotification = async () => {
  try {
    if (!selectedClient || !notificationTitle || !notificationMessage || !selectedClient.uid) {
      toast({
        title: "Error",
        description: "Por favor completa el título, mensaje y verifica que el cliente tenga una cuenta",
        variant: "destructive",
      });
      return;
    }
    
    // MODIFICACIÓN: Verificar si hay tokens antes de enviar
    if (!selectedClient.fcmTokens || selectedClient.fcmTokens.length === 0) {
      toast({
        title: "Advertencia",
        description: "Este cliente no tiene dispositivos registrados. La notificación se guardará pero no se enviará hasta que el cliente active las notificaciones.",
        variant: "default",
      });
    }
    
    setIsSendingNotification(true);
    
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
    await addDoc(collection(db, 'notifications'), {
      title: notificationTitle,
      clientId: selectedClient.uid,
      clientEmail: selectedClient.email,
      clientName: `${selectedClient.name} ${selectedClient.lastname}`,
      message: notificationMessage,
      imageUrl,
      status: 'pending',
      createdAt: serverTimestamp(),
      createdBy: user?.id,
      type: 'admin_message',
      fcmTokens: selectedClient.fcmTokens || [] // Asegurar que siempre sea un array
    });
    
    toast({
      title: "Notificación programada",
      description: `Notificación programada para ${selectedClient.name} ${selectedClient.lastname}. Se enviará pronto.`,
    });
        setShowNotificationForm(false);

    // Resetear campos pero mantener el formulario abierto
    setNotificationTitle('');
    setNotificationMessage('');
    setNotificationImage(null);
  } catch (error: any) {
    console.error('Error sending notification:', error);
    
    let errorMessage = "Error al enviar la notificación";
    
    if (error.code) {
      switch (error.code) {
        case 'messaging/invalid-argument':
          errorMessage = "La configuración de notificaciones no es válida";
          break;
        case 'messaging/server-unavailable':
          errorMessage = "El servicio de notificaciones no está disponible temporalmente";
          break;
        default:
          errorMessage = `Error al enviar la notificación: ${error.message}`;
      }
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsSendingNotification(false);
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
      
      // Obtener todos los usuarios con tokens FCM y notificaciones habilitadas
      const usersWithTokens: {id: string, fcmTokens: string[]}[] = [];
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      for (const userDoc of usersSnapshot.docs) {
        // Verificar si tiene notificaciones habilitadas
        const userData = userDoc.data();
        if (userData.notificationsEnabled === false) continue;
        
        const tokensSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'fcmTokens'));
        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
        
        if (tokens.length > 0) {
          usersWithTokens.push({
            id: userDoc.id,
            fcmTokens: tokens
          });
        }
      }
      
      // Crear documento en la colección massNotifications
      await addDoc(collection(db, 'massNotifications'), {
        title: massNotificationTitle || 'Notificación importante',
        message: massNotificationMessage,
        imageUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: user?.id,
        targetUsers: usersWithTokens.map(user => user.id),
        totalRecipients: usersWithTokens.length
      });
      
      toast({
        title: "Notificación masiva programada",
        description: `Notificación masiva programada para ${usersWithTokens.length} usuarios. Se enviará pronto.`,
      });
      
      // Cerrar el formulario y limpiar campos
      setShowMassNotificationForm(false);
      setMassNotificationTitle('');
      setMassNotificationMessage('');
      setMassNotificationImage(null);
    } catch (error: any) {
      console.error('Error sending mass notification:', error);
      toast({
        title: "Error",
        description: "Error al enviar la notificación masiva: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingMassNotification(false);
    }
  };

  return (
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
          <Button
            variant="outline"
            onClick={loadClients}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
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
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => {
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
                      <div className="flex flex-col gap-1">
                        {client.uid ? (
                          <>
                            <Badge 
                              variant={client.fcmTokens && client.fcmTokens.length > 0 ? "default" : "secondary"}
                              className={client.fcmTokens && client.fcmTokens.length > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                            >
                              {client.fcmTokens && client.fcmTokens.length > 0 ? 
                                `${client.fcmTokens.length} dispositivo(s)` : 
                                "Sin dispositivos"}
                            </Badge>
                            <Badge 
                              variant={client.notificationsEnabled ? "default" : "secondary"}
                              className={client.notificationsEnabled ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}
                            >
                              {client.notificationsEnabled ? "Notificaciones ON" : "Notificaciones OFF"}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                            Sin cuenta
                          </Badge>
                        )}
                      </div>
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
                          disabled={!client.uid || refreshingTokens === client.id}
                          title={!client.uid ? "Cliente sin cuenta - No se pueden enviar notificaciones" : "Enviar notificación"}
                        >
                          {refreshingTokens === client.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refreshClientTokens(client.id)}
                          disabled={!client.uid || refreshingTokens === client.id}
                          title="Actualizar tokens"
                        >
                          {refreshingTokens === client.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
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
                <TableCell colSpan={8} className="text-center py-4">
                  No hay clientes disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Historial de cliente */}
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
      
      {/* Formulario de notificación */}
{/* Formulario de notificación */}
{showNotificationForm && selectedClient && (
  <Card className="mt-6">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Enviar Notificación a {selectedClient.name} {selectedClient.lastname}</CardTitle>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setShowNotificationForm(false);
          setNotificationTitle('');
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
      
      {/* Estado de notificaciones - NUEVA SECCIÓN */}
      <div className="space-y-2">
        <Label>Estado de notificaciones</Label>
        <div className={`p-2 rounded-md ${
          selectedClient.fcmTokens && selectedClient.fcmTokens.length > 0 
            ? "bg-green-100 text-green-800" 
            : "bg-yellow-100 text-yellow-800"
        }`}>
          <p className="text-sm">
            {selectedClient.fcmTokens && selectedClient.fcmTokens.length > 0 
              ? `✅ ${selectedClient.fcmTokens.length} dispositivo(s) recibirán esta notificación`
              : "⚠️ El cliente no tiene dispositivos registrados. La notificación se guardará pero no se enviará hasta que active las notificaciones en la app."
            }
          </p>
          {selectedClient.notificationsEnabled === false && (
            <p className="text-sm mt-1">
              🔕 El cliente tiene las notificaciones deshabilitadas
            </p>
          )}
        </div>
      </div>
      
      {/* Campo para el título de la notificación */}
      <div className="space-y-2">
        <Label htmlFor="notification-title">Título *</Label>
        <Input
          id="notification-title"
          value={notificationTitle}
          onChange={(e) => setNotificationTitle(e.target.value)}
          placeholder="Título de la notificación"
        />
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
              <X className="h-4 w-4" />
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
            setNotificationTitle('');
            setNotificationMessage('');
            setNotificationImage(null);
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={sendNotification}
          disabled={isSendingNotification || !notificationTitle || !notificationMessage}
        >
          {isSendingNotification ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Notificación'
          )}
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
                    <X className="h-4 w-4" />
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
                disabled={isSendingMassNotification || !massNotificationMessage}
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
    </div>
  );
};

export default Clients;