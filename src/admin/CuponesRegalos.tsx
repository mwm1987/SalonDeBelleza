// src/components/admin/CuponesRegalos.tsx
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Gift, Plus, Edit, Trash2, CalendarIcon, Tag, Crown, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Cupon {
  id: string;
  codigo: string;
  tipo: 'producto' | 'tratamiento' | 'general';
  descuentoTipo: 'porcentaje' | 'monto';
  descuentoValor: number;
  minCompra?: number;
  maxDescuento?: number;
  validoDesde: string;
  validoHasta: string;
  limiteUsos: number;
  usos: number;
  descripcion: string;
  activo: boolean;
  soloVip: boolean;
  precio: number;
  motivo: string;
  ocasionesEspeciales: string[];
  creadoEn: Date;
}

const CuponesRegalos = () => {
  const { toast } = useToast();
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCupon, setEditingCupon] = useState<Cupon | null>(null);
  const [filter, setFilter] = useState('todos');

  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'general' as 'producto' | 'tratamiento' | 'general',
    descuentoTipo: 'porcentaje' as 'porcentaje' | 'monto',
    descuentoValor: 0,
    minCompra: 0,
    maxDescuento: 0,
    validoDesde: new Date().toISOString().split('T')[0],
    validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    limiteUsos: 100,
    descripcion: '',
    activo: true,
    soloVip: false,
    precio: 0,
    motivo: '',
    ocasionesEspeciales: [] as string[]
  });

  const ocasionesOptions = [
    'Cumpleaños',
    'Aniversario',
    'Navidad',
    'Día de la Madre',
    'Día del Padre',
    'San Valentín',
    'Regalo General'
  ];

  // Cargar cupones desde Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'coupons'),
      orderBy('creadoEn', 'desc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const cuponesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Cupon[];
      setCupones(cuponesData);
    });

    return () => unsub();
  }, []);

  const generarCodigo = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerarCodigo = () => {
    setFormData({
      ...formData,
      codigo: generarCodigo()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const cuponData = {
        ...formData,
        usos: 0,
        creadoEn: new Date()
      };

      if (editingCupon) {
        await updateDoc(doc(db, 'coupons', editingCupon.id), cuponData);
        toast({
          title: "Cupón actualizado",
          description: "El cupón ha sido actualizado exitosamente",
        });
      } else {
        await addDoc(collection(db, 'coupons'), cuponData);
        toast({
          title: "Cupón creado",
          description: "El cupón ha sido creado exitosamente",
        });
      }

      setShowForm(false);
      setEditingCupon(null);
      setFormData({
        codigo: '',
        tipo: 'general',
        descuentoTipo: 'porcentaje',
        descuentoValor: 0,
        minCompra: 0,
        maxDescuento: 0,
        validoDesde: new Date().toISOString().split('T')[0],
        validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        limiteUsos: 100,
        descripcion: '',
        activo: true,
        soloVip: false,
        precio: 0,
        motivo: '',
        ocasionesEspeciales: []
      });
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast({
        title: "Error",
        description: "Error al guardar el cupón",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (cupon: Cupon) => {
    setEditingCupon(cupon);
    setFormData({
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      descuentoTipo: cupon.descuentoTipo,
      descuentoValor: cupon.descuentoValor,
      minCompra: cupon.minCompra || 0,
      maxDescuento: cupon.maxDescuento || 0,
      validoDesde: cupon.validoDesde,
      validoHasta: cupon.validoHasta,
      limiteUsos: cupon.limiteUsos,
      descripcion: cupon.descripcion,
      activo: cupon.activo,
      soloVip: cupon.soloVip,
      precio: cupon.precio,
      motivo: cupon.motivo,
      ocasionesEspeciales: cupon.ocasionesEspeciales || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cupón?')) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        toast({
          title: "Cupón eliminado",
          description: "El cupón ha sido eliminado exitosamente",
        });
      } catch (error) {
        console.error('Error deleting coupon:', error);
        toast({
          title: "Error",
          description: "Error al eliminar el cupón",
          variant: "destructive",
        });
      }
    }
  };

  const filteredCoupons = cupones.filter(cupon => {
    if (filter === 'todos') return true;
    if (filter === 'activos') return cupon.activo;
    if (filter === 'inactivos') return !cupon.activo;
    if (filter === 'vip') return cupon.soloVip;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Cupones y Regalos</h2>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Cupón
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Label>Filtrar por:</Label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="inactivos">Inactivos</SelectItem>
            <SelectItem value="vip">Solo VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cupones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Válido hasta</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((cupon) => (
                <TableRow key={cupon.id}>
                  <TableCell className="font-mono">{cupon.codigo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {cupon.tipo === 'producto' ? 'Producto' : 
                       cupon.tipo === 'tratamiento' ? 'Tratamiento' : 'General'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cupon.descuentoTipo === 'porcentaje' 
                      ? `${cupon.descuentoValor}%`
                      : `$${cupon.descuentoValor}`}
                  </TableCell>
                  <TableCell>
                    {new Date(cupon.validoHasta).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    {cupon.usos} / {cupon.limiteUsos}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cupon.activo ? "default" : "secondary"}>
                      {cupon.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {cupon.soloVip && (
                      <Crown className="h-4 w-4 text-amber-500 ml-2 inline" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(cupon)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(cupon.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código del Cupón *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="Código único"
                      required
                    />
                    <Button type="button" onClick={handleGenerarCodigo} variant="outline">
                      Generar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Cupón *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: 'producto' | 'tratamiento' | 'general') => 
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="producto">Productos</SelectItem>
                      <SelectItem value="tratamiento">Tratamientos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descuentoTipo">Tipo de Descuento *</Label>
                  <Select
                    value={formData.descuentoTipo}
                    onValueChange={(value: 'porcentaje' | 'monto') => 
                      setFormData({ ...formData, descuentoTipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje</SelectItem>
                      <SelectItem value="monto">Monto Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descuentoValor">
                    {formData.descuentoTipo === 'porcentaje' ? 'Porcentaje de Descuento *' : 'Monto de Descuento *'}
                  </Label>
                  <Input
                    id="descuentoValor"
                    type="number"
                    value={formData.descuentoValor}
                    onChange={(e) => setFormData({ ...formData, descuentoValor: Number(e.target.value) })}
                    required
                    min="0"
                    max={formData.descuentoTipo === 'porcentaje' ? '100' : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minCompra">Mínimo de Compra (opcional)</Label>
                  <Input
                    id="minCompra"
                    type="number"
                    value={formData.minCompra}
                    onChange={(e) => setFormData({ ...formData, minCompra: Number(e.target.value) })}
                    min="0"
                  />
                </div>

                {formData.descuentoTipo === 'porcentaje' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDescuento">Máximo Descuento (opcional)</Label>
                    <Input
                      id="maxDescuento"
                      type="number"
                      value={formData.maxDescuento}
                      onChange={(e) => setFormData({ ...formData, maxDescuento: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validoDesde">Válido desde *</Label>
                  <Input
                    id="validoDesde"
                    type="date"
                    value={formData.validoDesde}
                    onChange={(e) => setFormData({ ...formData, validoDesde: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validoHasta">Válido hasta *</Label>
                  <Input
                    id="validoHasta"
                    type="date"
                    value={formData.validoHasta}
                    onChange={(e) => setFormData({ ...formData, validoHasta: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limiteUsos">Límite de Usos *</Label>
                  <Input
                    id="limiteUsos"
                    type="number"
                    value={formData.limiteUsos}
                    onChange={(e) => setFormData({ ...formData, limiteUsos: Number(e.target.value) })}
                    required
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio">Precio del Cupón ($)</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ocasiones Especiales</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {ocasionesOptions.map((ocasion) => (
                    <div key={ocasion} className="flex items-center space-x-2">
                      <Checkbox
                        id={ocasion}
                        checked={formData.ocasionesEspeciales.includes(ocasion)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              ocasionesEspeciales: [...formData.ocasionesEspeciales, ocasion]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              ocasionesEspeciales: formData.ocasionesEspeciales.filter(o => o !== ocasion)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={ocasion} className="text-sm font-normal">
                        {ocasion}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo (opcional)</Label>
                <Input
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ej: Regalo de cumpleaños"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe los beneficios de este cupón"
                  required
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked === true })}
                  />
                  <Label htmlFor="activo">Cupón activo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="soloVip"
                    checked={formData.soloVip}
                    onCheckedChange={(checked) => setFormData({ ...formData, soloVip: checked === true })}
                  />
                  <Label htmlFor="soloVip">Solo para miembros VIP</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCupon(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCupon ? 'Actualizar' : 'Crear'} Cupón
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CuponesRegalos;