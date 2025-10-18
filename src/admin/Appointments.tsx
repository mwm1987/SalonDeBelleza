// src/components/admin/Appointments.tsx
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface AppointmentsProps {
  appointments: Appointment[];
  onAppointmentUpdate: () => void;
}

const Appointments = ({ appointments, onAppointmentUpdate }: AppointmentsProps) => {
  const { toast } = useToast();
  
  // Estados para gestión de turnos
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

  // Filtrar citas basado en criterios de filtro
  const filteredAppointments = appointments.filter(appointment => {
    const matchesDate = filterDate ? appointment.date === filterDate : true;
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    
    let matchesName = true;
    if (filterName) {
      const searchTerm = filterName.toLowerCase();
      const fullName = `${appointment.personalData?.name || ''} ${appointment.personalData?.lastname || ''}`.toLowerCase();
      matchesName = fullName.includes(searchTerm);
    }
    
    return matchesDate && matchesStatus && matchesName;
  });

  // Funciones para gestionar citas
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setEditDate(appointment.date || '');
    setEditTime(appointment.time || '');
    setEditNotes(appointment.notes || '');
    setEditPaymentStatus(appointment.paymentStatus || 'pending');
    setEditPaymentMethod(appointment.paymentMethod || '');
    setEditClientPhone(appointment.personalData?.phone || '');
    setEditClientEmail(appointment.personalData?.email || '');
    setShowEditAppointmentForm(true);
  };

  const saveEditedAppointment = async () => {
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
      
      // Notificar al componente padre para que actualice el estado
      onAppointmentUpdate();
      
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

  const cancelAppointment = async (appointmentId: string) => {
    try {
      // Actualizar la cita en Firestore
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { status: 'cancelled' });
      
      // Notificar al componente padre para que actualice el estado
      onAppointmentUpdate();
      
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

  const updateAppointmentStatus = async (appointmentId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { status });
      
      // Notificar al componente padre para que actualice el estado
      onAppointmentUpdate();
      
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
  };

  const updatePaymentStatus = async (appointmentId: string, paymentStatus: 'pending' | 'paid' | 'cancelled' | 'completed') => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, { paymentStatus });
      
      // Notificar al componente padre para que actualice el estado
      onAppointmentUpdate();
      
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
  };

  return (
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
              filteredAppointments.map((appointment) => {
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
                        onValueChange={(value: any) => updateAppointmentStatus(appointment.id, value)}
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
                        onValueChange={(value: any) => updatePaymentStatus(appointment.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Pago" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
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
      
      {/* Formulario de edición de turno */}
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
    </div>
  );
};

export default Appointments;