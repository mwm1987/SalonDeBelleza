// src/components/admin/Calendar.tsx
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
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

interface UnavailableTime {
  id: string;
  type: 'date' | 'time' | 'month' | 'week';
  date?: string;
  time?: string;
  month?: string;
  week?: string;
  year?: string;
  createdAt: Date;
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

const Calendar = () => {
  const { toast } = useToast();
  
  // Estados para el calendario
  const [calendarCurrentDate, setCalendarCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [showDayActions, setShowDayActions] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Estados para disponibilidad
  const [unavailableTimes, setUnavailableTimes] = useState<UnavailableTime[]>([]);
  const [availabilityData, setAvailabilityData] = useState<any>({date: '', month: '', week: ''});
  const [clearAvailabilityData, setClearAvailabilityData] = useState<any>({month: '', week: ''});
  const [showClearAvailability, setShowClearAvailability] = useState(false);
  
  // Estados para citas y configuración
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Nombres de meses y días
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Cargar datos desde Firestore
  useEffect(() => {
    setIsLoading(true);
    
    // Cargar citas
    const unsubAppointments = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const appointmentsData = snapshot.docs.map((doc) => {
        const raw = doc.data();
        return { id: doc.id, ...raw } as Appointment;
      });
      setAppointments(appointmentsData);
    });

    // Cargar tiempos no disponibles
    const unsubUnavailable = onSnapshot(collection(db, "unavailableTimes"), (snap) => {
      const unavailableData = snap.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as UnavailableTime[];
      setUnavailableTimes(unavailableData);
    });

    // Cargar configuración de negocio
    const unsubSettings = onSnapshot(doc(db, "settings", "business"), (docSnap) => {
      if (docSnap.exists()) {
        setBusinessSettings(docSnap.data());
      }
    });

    return () => {
      unsubAppointments();
      unsubUnavailable();
      unsubSettings();
    };
  }, []);

  // Generar datos del calendario cuando cambia la fecha actual, citas o tiempos no disponibles
  useEffect(() => {
    generateCalendarData();
  }, [calendarCurrentDate, appointments, unavailableTimes]);

  // Generar slots de tiempo cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots(selectedDate);
    }
  }, [selectedDate, appointments, unavailableTimes]);

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

  // Generar datos del calendario
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
      const dayAppointments = appointments.filter(app => toLocalYYYYMMDD(app.date) === dateString);

      // Calcular semana del mes (1–5)
      const weekOfMonth = Math.ceil(day / 7);

      // Verificar si es un día no disponible
      const isUnavailable = unavailableTimes.some(time =>
        (time.type === 'date' && time.date === dateString) ||

        // Mes completo
        (time.type === 'month' &&
          time.month === String(month + 1).padStart(2, '0') &&
          time.year === String(year)) ||

        // Semana del mes
        (time.type === 'week' &&
          time.week === String(weekOfMonth) &&
          time.month === String(month + 1).padStart(2, '0') &&
          time.year === String(year))
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
    setIsLoading(false);
  };

  // Generar slots de tiempo para una fecha específica
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

      // Verificar si el día pertenece a un mes o semana bloqueada
      const year = jsDate.getFullYear();
      const month = String(jsDate.getMonth() + 1).padStart(2, '0');
      const weekOfMonth = String(Math.ceil(d / 7));

      const isDayUnavailable = unavailableTimes.some(time =>
        (time.type === 'date' && time.date === date) ||
        (time.type === 'month' && time.month === month && time.year === String(year)) ||
        (time.type === 'week' && time.week === weekOfMonth && time.month === month && time.year === String(year))
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

  // Navegar entre meses
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

  // Manejar clic en un día
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowDayActions(true);
    generateTimeSlots(date);
  };

  // Manejar clic en un slot de tiempo
  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time);
  };

  // Agregar tiempo no disponible
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
        newUnavailableTime = { 
          type: "month", 
          month: availabilityData.month, 
          year: String(year), 
          createdAt: new Date() 
        };
      } else if (availabilityData.week) {
        newUnavailableTime = { 
          type: "week", 
          week: availabilityData.week, 
          month, 
          year: String(year), 
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

  // Eliminar tiempo no disponible
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

  // Alternar disponibilidad de un día completo
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

  // Alternar disponibilidad de un horario específico
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

  return (
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
                  unavailableTimes.some(t => t.type === "date" && t.date === selectedDate)
                    ? "default"
                    : "outline"
                }
              >
                {unavailableTimes.some(t => t.type === "date" && t.date === selectedDate)
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
  );
};

export default Calendar;