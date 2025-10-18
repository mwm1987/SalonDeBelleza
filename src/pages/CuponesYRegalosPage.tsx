// src/pages/CuponesYRegalosPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Gift, Crown, Tag, Calendar, UserCheck, ShoppingCart, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
}

interface UserCupon {
  id: string;
  userId: string;
  cuponId: string;
  codigo: string;
  compradoEn: Date;
  utilizado: boolean;
  utilizadoEn?: Date;
  destinatario?: string;
  mensaje?: string;
}

const CuponesYRegalosPage = () => {
  const { user, isVip } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [misCupones, setMisCupones] = useState<UserCupon[]>([]);
  const [activeTab, setActiveTab] = useState('disponibles');
  const [loading, setLoading] = useState(true);
  const [comprandoCupon, setComprandoCupon] = useState<string | null>(null);

  useEffect(() => {
    const loadCupones = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'coupons'),
          where('activo', '==', true),
          where('validoHasta', '>=', new Date().toISOString().split('T')[0]),
          orderBy('validoHasta', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const cuponesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Cupon[];

        // Filtrar cupones VIP si el usuario no es VIP
        const cuponesFiltrados = isVip 
          ? cuponesData 
          : cuponesData.filter(cupon => !cupon.soloVip);

        setCupones(cuponesFiltrados);
      } catch (error) {
        console.error('Error loading coupons:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los cupones",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const loadMisCupones = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'userCoupons'),
          where('userId', '==', user.id),
          orderBy('compradoEn', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const misCuponesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserCupon[];

        setMisCupones(misCuponesData);
      } catch (error) {
        console.error('Error loading user coupons:', error);
      }
    };

    loadCupones();
    loadMisCupones();
  }, [user, isVip, toast]);

  const handleComprarCupon = async (cupon: Cupon) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para comprar cupones",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setComprandoCupon(cupon.id);

    try {
      // Importar la función de pago
      const { createCouponPayment } = await import('@/lib/mercadopago');
      
      // Crear preferencia de pago
      const paymentResponse = await createCouponPayment(
        cupon.id,
        cupon,
        {
          name: user.displayName?.split(' ')[0] || '',
          lastname: user.displayName?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          phone: user.phoneNumber || '',
          countryCode: '+54'
        }
      );

      // Redirigir a MercadoPago
      window.location.href = paymentResponse.init_point;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar el pago",
        variant: "destructive",
      });
    } finally {
      setComprandoCupon(null);
    }
  };

  const handleRegalarCupon = (cupon: Cupon) => {
    // Navegar a página de regalo con el ID del cupón
    navigate(`/regalar-cupon/${cupon.id}`);
  };

  const CuponCard = ({ cupon }: { cupon: Cupon }) => (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className={`pb-3 ${cupon.soloVip ? 'bg-amber-50' : 'bg-blue-50'}`}>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{cupon.motivo || 'Cupón de Descuento'}</CardTitle>
            {cupon.soloVip && (
              <Badge className="bg-amber-500 flex items-center">
                <Crown className="h-3 w-3 mr-1" /> VIP
              </Badge>
            )}
          </div>
          <div className="text-2xl font-bold text-primary">
            {cupon.descuentoTipo === 'porcentaje' 
              ? `${cupon.descuentoValor}% OFF`
              : `$${cupon.descuentoValor} OFF`}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600 mb-4">{cupon.descripcion}</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Válido hasta:</span>
              <span className="font-medium">
                {new Date(cupon.validoHasta).toLocaleDateString('es-ES')}
              </span>
            </div>
            
            {cupon.minCompra > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Mín. compra:</span>
                <span className="font-medium">${cupon.minCompra}</span>
              </div>
            )}
            
            {cupon.descuentoTipo === 'porcentaje' && cupon.maxDescuento > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Máx. descuento:</span>
                <span className="font-medium">${cupon.maxDescuento}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-500">Precio:</span>
              <span className="font-medium text-green-600">
                {cupon.precio > 0 ? `$${cupon.precio}` : 'Gratis'}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full"
            onClick={() => handleComprarCupon(cupon)}
            disabled={comprandoCupon === cupon.id}
          >
            {comprandoCupon === cupon.id ? (
              <>Procesando...</>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                {cupon.precio > 0 ? `Comprar por $${cupon.precio}` : 'Obtener Gratis'}
              </>
            )}
          </Button>
          
          {cupon.precio > 0 && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleRegalarCupon(cupon)}
            >
              <Heart className="h-4 w-4 mr-2" />
              Regalar a alguien
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-block p-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 mb-4">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Cupones y Regalos</h1>
          <p className="text-lg text-gray-600">
            Descubre descuentos especiales y regala momentos de belleza
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="disponibles">Cupones Disponibles</TabsTrigger>
            <TabsTrigger value="mis-cupones">Mis Cupones</TabsTrigger>
          </TabsList>

          <TabsContent value="disponibles">
            {cupones.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay cupones disponibles</h3>
                <p className="text-gray-500">Vuelve pronto para descubrir nuevas ofertas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cupones.map((cupon) => (
                  <CuponCard key={cupon.id} cupon={cupon} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mis-cupones">
            {!user ? (
              <div className="text-center py-12">
                <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Inicia sesión</h3>
                <p className="text-gray-500 mb-4">Para ver tus cupones, necesitas iniciar sesión</p>
                <Button onClick={() => navigate('/auth')}>Iniciar Sesión</Button>
              </div>
            ) : misCupones.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No tienes cupones</h3>
                <p className="text-gray-500">Compra o recibe cupones para verlos aquí</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {misCupones.map((userCupon) => {
                  const cupon = cupones.find(c => c.id === userCupon.cuponId);
                  if (!cupon) return null;

                  return (
                    <Card key={userCupon.id} className="overflow-hidden">
                      <CardHeader className={`pb-3 ${userCupon.utilizado ? 'bg-gray-100' : 'bg-green-50'}`}>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{cupon.motivo || 'Cupón de Descuento'}</CardTitle>
                          <Badge variant={userCupon.utilizado ? "secondary" : "default"}>
                            {userCupon.utilizado ? 'Utilizado' : 'Disponible'}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {cupon.descuentoTipo === 'porcentaje' 
                            ? `${cupon.descuentoValor}% OFF`
                            : `$${cupon.descuentoValor} OFF`}
                        </div>
                        <div className="font-mono text-sm">{userCupon.codigo}</div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600 mb-4">{cupon.descripcion}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Válido hasta:</span>
                            <span className="font-medium">
                              {new Date(cupon.validoHasta).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                          
                          {userCupon.destinatario && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Para:</span>
                              <span className="font-medium">{userCupon.destinatario}</span>
                            </div>
                          )}
                          
                          {userCupon.mensaje && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm italic">"{userCupon.mensaje}"</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      {!userCupon.utilizado && (
                        <CardFooter>
                          <Button className="w-full" onClick={() => {
                            // Copiar código al portapapeles
                            navigator.clipboard.writeText(userCupon.codigo);
                            toast({
                              title: "Código copiado",
                              description: "El código del cupón se ha copiado al portapapeles",
                            });
                          }}>
                            Copiar Código
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CuponesYRegalosPage;