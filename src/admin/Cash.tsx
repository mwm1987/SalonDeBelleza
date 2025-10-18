// src/components/admin/Cash.tsx
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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

const Cash = () => {
  // Estados para citas y órdenes
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos desde Firestore
  useEffect(() => {
    setIsLoading(true);
    
    // Cargar citas
    const unsubAppointments = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const appointmentsData = snapshot.docs.map((doc) => {
        const raw = doc.data();
        const appointmentData: any = { id: doc.id, ...raw };
        
        // Convertir createdAt a objeto Date si es necesario
        if (appointmentData.createdAt && typeof appointmentData.createdAt.toDate === 'function') {
          appointmentData.createdAt = appointmentData.createdAt.toDate();
        } else if (!appointmentData.createdAt) {
          appointmentData.createdAt = new Date();
        }
        
        return appointmentData;
      });
      setAppointments(appointmentsData);
    });

    // Cargar órdenes
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => {
        const raw = doc.data();
        const orderData: any = { id: doc.id, ...raw };
        
        // Convertir createdAt a objeto Date si es necesario
        if (orderData.createdAt && typeof orderData.createdAt.toDate === 'function') {
          orderData.createdAt = orderData.createdAt.toDate();
        } else if (!orderData.createdAt) {
          orderData.createdAt = new Date();
        }
        
        return orderData;
      });
      setOrders(ordersData);
      setIsLoading(false);
    });

    return () => {
      unsubAppointments();
      unsubOrders();
    };
  }, []);

  // Cálculos para los resúmenes
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const paidAppointments = appointments.filter(a => a.paymentStatus === 'paid' || a.paymentStatus === 'completed');
  const pendingAppointments = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const pendingPaymentAppointments = appointments.filter(a => a.paymentStatus === 'pending');

  const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered');
  const pendingOrders = orders.filter(o => o.status === 'pending');

  const totalServiceRevenue = paidAppointments.reduce((sum, a) => 
    sum + (a.treatments?.reduce((tSum: number, t: any) => tSum + (t.price || 0), 0) || 0), 0);
  
  const pendingServiceRevenue = pendingPaymentAppointments.reduce((sum, a) => 
    sum + (a.treatments?.reduce((tSum: number, t: any) => tSum + (t.price || 0), 0) || 0), 0);
  
  const totalProductRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingProductRevenue = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const estimatedTotalServiceRevenue = appointments.reduce((sum, a) => 
    sum + (a.treatments?.reduce((tSum: number, t: any) => tSum + (t.price || 0), 0) || 0), 0);
  
  const estimatedTotalProductRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const estimatedTotalRevenue = estimatedTotalServiceRevenue + estimatedTotalProductRevenue;

  // Movimientos recientes (combinando appointments y orders)
  const recentMovements = [...appointments, ...orders]
    .sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumen Mensual (Servicios) */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen Mensual (Servicios)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Total Turnos Realizados:</span>
              <span className="font-medium">{completedAppointments.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Ingresos Servicios:</span>
              <span className="font-medium">${totalServiceRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Turnos Pendientes:</span>
              <span className="font-medium">{pendingAppointments.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Pendiente Servicios:</span>
              <span className="font-medium">${pendingServiceRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Resumen Mensual (Productos) */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen Mensual (Productos)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Total Órdenes Pagadas:</span>
              <span className="font-medium">{paidOrders.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Ingresos Productos:</span>
              <span className="font-medium">${totalProductRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Órdenes Pendientes:</span>
              <span className="font-medium">{pendingOrders.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Pendiente Productos:</span>
              <span className="font-medium">${pendingProductRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Estimación de Cierre de Caja Total */}
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
            <span className="font-medium">${estimatedTotalServiceRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Estimación Total Productos:</span>
            <span className="font-medium">${estimatedTotalProductRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-4">
            <span>Estimación Total General:</span>
            <span>${estimatedTotalRevenue.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Movimientos Recientes */}
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
                {recentMovements.length > 0 ? (
                  recentMovements.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.createdAt instanceof Date 
                          ? item.createdAt.toLocaleDateString() 
                          : new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {item.treatments ? 'Servicio' : 'Producto'}
                      </TableCell>
                      <TableCell>
                        {item.treatments
                          ? `Servicio: ${item.personalData?.name} ${item.personalData?.lastname}`
                          : `Productos: ${item.items?.length || 0} items`
                        }
                      </TableCell>
                      <TableCell>
                        $
                        {item.treatments
                          ? item.treatments.reduce((sum: number, t: any) => sum + (t.price || 0), 0).toFixed(2)
                          : item.total?.toFixed(2) || '0.00'
                        }
                      </TableCell>
                      <TableCell>
                        {item.paymentStatus ? (
                          <Badge className={
                            item.paymentStatus === 'paid' || item.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No hay movimientos recientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cash;