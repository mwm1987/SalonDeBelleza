// src/components/admin/Vip.tsx
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc,
  query,
  getDocs
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Crown, Edit, Trash2, Plus, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const Vip = () => {
  const { toast } = useToast();
  
  // Estados para gestión de membresías VIP
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
  
  // Estados para suscripciones VIP
  const [vipSubscriptions, setVipSubscriptions] = useState<VipSubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<VipSubscription[]>([]);
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar membresías VIP desde Firestore
  useEffect(() => {
    const unsubVip = onSnapshot(collection(db, 'vipMemberships'), (snapshot) => {
      const membershipsData = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as VipMembership[];
      
      setVipMemberships(membershipsData);
    });

    return () => {
      unsubVip();
    };
  }, []);

  // Cargar suscripciones VIP desde Firestore
  useEffect(() => {
    const loadVipSubscriptions = async () => {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading VIP subscriptions:', error);
        setIsLoading(false);
      }
    };
    
    loadVipSubscriptions();
  }, []);

  // Filtrar suscripciones cuando cambia el filtro
  useEffect(() => {
    if (subscriptionFilter === 'all') {
      setFilteredSubscriptions(vipSubscriptions);
    } else {
      setFilteredSubscriptions(vipSubscriptions.filter(sub => sub.status === subscriptionFilter));
    }
  }, [vipSubscriptions, subscriptionFilter]);

  // Función para agregar característica a la membresía
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

  // Función para eliminar característica de la membresía
  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...newMembership.features];
    updatedFeatures.splice(index, 1);
    setNewMembership({
      ...newMembership,
      features: updatedFeatures
    });
  };

  // Función para guardar membresía VIP (crear o actualizar)
  const saveVipMembership = async () => {
    try {
      if (!newMembership.name || !newMembership.price || !newMembership.description || !newMembership.duration || newMembership.features.length === 0) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        });
        return;
      }
      
      // Preparar datos para Firestore (excluir el ID)
      const { id, ...membershipData } = newMembership;
      
      if (newMembership.id) {
        // Actualizar membresía existente
        const membershipRef = doc(db, 'vipMemberships', newMembership.id);
        await updateDoc(membershipRef, membershipData);
        
        // Actualizar estado local
        setVipMemberships(vipMemberships.map(m => 
          m.id === newMembership.id ? newMembership : m
        ));
        
        toast({
          title: "Membresía actualizada",
          description: "La membresía VIP ha sido actualizada exitosamente",
        });
      } else {
        // Agregar nueva membresía
        const membershipRef = collection(db, 'vipMemberships');
        const docRef = await addDoc(membershipRef, membershipData);
        
        // Actualizar estado local
        const membershipWithId = { ...newMembership, id: docRef.id };
        setVipMemberships([...vipMemberships, membershipWithId]);
        
        toast({
          title: "Membresía agregada",
          description: "La membresía VIP ha sido agregada exitosamente",
        });
      }
      
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
    } catch (error) {
      console.error('Error saving VIP membership:', error);
      toast({
        title: "Error",
        description: "Error al guardar la membresía VIP",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar una membresía VIP
  const deleteVipMembership = async (membershipId: string) => {
    try {
      if (confirm('¿Estás seguro de que deseas eliminar esta membresía?')) {
        const membershipRef = doc(db, 'vipMemberships', membershipId);
        await deleteDoc(membershipRef);
        
        toast({
          title: "Membresía eliminada",
          description: "La membresía VIP ha sido eliminada exitosamente",
        });
      }
    } catch (error) {
      console.error('Error deleting VIP membership:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la membresía VIP",
        variant: "destructive",
      });
    }
  };

  // Función para editar una membresía VIP
  const editVipMembership = (membership: VipMembership) => {
    setNewMembership(membership);
    setShowVipMembershipForm(true);
  };

  // Función para iniciar la creación de una nueva membresía VIP
  const startNewVipMembership = () => {
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
    setShowVipMembershipForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Sección de Membresías VIP */}
      <div className="flex justify-end">
        <Button
          onClick={startNewVipMembership}
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
                  onClick={() => editVipMembership(membership)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteVipMembership(membership.id)}
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

      {/* Sección de Suscripciones VIP */}
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
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
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
        )}
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
                <Label htmlFor="membership-name">Nombre *</Label>
                <Input
                  id="membership-name"
                  value={newMembership.name}
                  onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })}
                  placeholder="Nombre de la membresía"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membership-price">Precio *</Label>
                <Input
                  id="membership-price"
                  type="number"
                  value={newMembership.price}
                  onChange={(e) => setNewMembership({ ...newMembership, price: Number(e.target.value) })}
                  placeholder="Precio de la membresía"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="membership-description">Descripción *</Label>
              <Textarea
                id="membership-description"
                value={newMembership.description}
                onChange={(e) => setNewMembership({ ...newMembership, description: e.target.value })}
                rows={2}
                placeholder="Descripción de la membresía"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="membership-duration">Duración *</Label>
              <Input
                id="membership-duration"
                value={newMembership.duration}
                onChange={(e) => setNewMembership({ ...newMembership, duration: e.target.value })}
                placeholder="Ej: 1 mes, 3 meses, 1 año"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Características *</Label>
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
              <Button onClick={saveVipMembership}>
                {newMembership.id ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Vip;