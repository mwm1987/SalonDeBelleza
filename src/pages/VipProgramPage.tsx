import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Crown, Check, Star, Gift, Sparkles, Award, Gem, Clock, Calendar, Percent, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface VipSubscription {
  id: string;
  userId: string;
  membershipId: string;
  membershipName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

interface MembershipTierProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
  color: string;
  icon: React.ReactNode;
  duration?: string;
  id: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon, title, description, color }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
        <CardHeader className="pb-2">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
            {icon}
          </div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function VipProgramPage() {
  const [benefits] = useState<BenefitCardProps[]>([
    {
      icon: <Percent className="w-6 h-6 text-white" />,
      title: "Descuentos Exclusivos",
      description: "Accede a descuentos permanentes en todos nuestros servicios y productos.",
      color: "bg-gradient-to-br from-green-500 to-teal-600"
    },
    {
      icon: <Calendar className="w-6 h-6 text-white" />,
      title: "Reservas Prioritarias",
      description: "Obtén acceso prioritario a la agenda y disponibilidad exclusiva.",
      color: "bg-gradient-to-br from-emerald-500 to-green-600"
    },
    {
      icon: <Gift className="w-6 h-6 text-white" />,
      title: "Regalos Sorpresa",
      description: "Recibe regalos y tratamientos sorpresa en fechas especiales.",
      color: "bg-gradient-to-br from-teal-500 to-emerald-600"
    },
    {
      icon: <Clock className="w-6 h-6 text-white" />,
      title: "Sesiones Extendidas",
      description: "Disfruta de tiempo adicional en tus tratamientos sin costo extra.",
      color: "bg-gradient-to-br from-green-600 to-teal-700"
    }
  ]);

  const [memberships, setMemberships] = useState<MembershipTierProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Helper function to calculate end date based on duration
  const calculateEndDate = (duration: string) => {
    const now = new Date();
    if (duration?.includes('mes')) {
      const months = parseInt(duration.match(/\d+/)?.[0] || '1');
      now.setMonth(now.getMonth() + months);
    } else if (duration?.includes('año')) {
      const years = parseInt(duration.match(/\d+/)?.[0] || '1');
      now.setFullYear(now.getFullYear() + years);
    }
    return now.toISOString();
  };

// ... código existente ...

const handleSelectMembership = async (membership: MembershipTierProps) => {
  if (!user) {
    toast({
      title: "Error",
      description: "Debes iniciar sesión para unirte al programa VIP",
      variant: "destructive",
    });
    return;
  }

  setIsProcessingPayment(true);
  
  try {
    // Importar la función de creación de pago para membresía
    const { createMembershipPayment } = await import('@/lib/mercadopago');
    
    // Crear preferencia de pago
    const paymentResponse = await createMembershipPayment(
      membership.id,
      membership,
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
    setIsProcessingPayment(false);
  }
};


  // Function to get icon based on membership name
  const getIconForMembership = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('básico') || lowerName.includes('basico')) {
      return <Star className="w-8 h-8 text-white" />;
    } else if (lowerName.includes('premium')) {
      return <Crown className="w-8 h-8 text-white" />;
    } else if (lowerName.includes('élite') || lowerName.includes('elite')) {
      return <Gem className="w-8 h-8 text-white" />;
    }
    return <Award className="w-8 h-8 text-white" />;
  };
  
  // Componente para mostrar las tarjetas de membresía
  const MembershipTier: React.FC<MembershipTierProps & { onSelect: (membership: MembershipTierProps) => void }> = ({ 
    name, 
    price, 
    description, 
    features, 
    recommended, 
    color,
    icon,
    id,
    duration,
    onSelect
  }) => {
    return (
      <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="h-full"
      >
        <Card className={`border-0 shadow-xl h-full relative ${recommended ? 'ring-2 ring-green-500 ring-offset-4' : ''}`}>
          {recommended && (
            <Badge 
              className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white font-bold py-1 px-4 shadow-lg"
            >
              Recomendado
            </Badge>
          )}
          
          <CardHeader className={`${color} text-white text-center rounded-t-lg`}>
            <div className="flex justify-center mb-2">
              {icon}
            </div>
            <CardTitle className="text-2xl font-bold">{name}</CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold">{price}</span>
              {price !== 'Gratis' && <span className="text-sm opacity-80">/mes</span>}
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <p className="text-gray-600 text-center mb-6">{description}</p>
            
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button 
              onClick={() => onSelect({id, name, price, description, features, recommended, color, icon, duration})}
              disabled={isProcessingPayment}
              className="w-full mt-8 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isProcessingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                'Seleccionar Plan'
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };
  
  // Cargar membresías VIP desde Firestore
  useEffect(() => {
    const loadVipMemberships = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'vipMemberships'));
        const querySnapshot = await getDocs(q);
        const membershipsData: MembershipTierProps[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          membershipsData.push({
            id: doc.id,
            name: data.name,
            price: data.price,
            description: data.description,
            features: data.features || [],
            recommended: data.recommended || false,
            color: data.color || data.colorClass || "bg-gradient-to-r from-gray-500 to-gray-600",
            icon: getIconForMembership(data.name),
            duration: data.duration || '1 mes'
          });
        });
        
        if (membershipsData.length > 0) {
          setMemberships(membershipsData);
        } else {
          // Datos de ejemplo si no hay membresías en Firestore
          setMemberships([
            {
              id: '1',
              name: "Básico",
              price: "Gratis",
              description: "Perfecto para clientes ocasionales",
              features: [
                "Reserva de turnos online",
                "Notificaciones de promociones",
                "Historial de servicios",
                "5% de descuento en tu cumpleaños"
              ],
              color: "bg-gradient-to-r from-gray-500 to-gray-600",
              icon: <Star className="w-8 h-8 text-white" />,
              duration: '1 mes'
            },
            {
              id: '2',
              name: "Premium",
              price: "$1,500",
              description: "Ideal para clientes frecuentes",
              features: [
                "Todo lo del plan Básico",
                "10% de descuento permanente",
                "Acceso prioritario a turnos",
                "1 tratamiento gratis al mes",
                "Productos de cortesía"
              ],
              recommended: true,
              color: "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600",
              icon: <Crown className="w-8 h-8 text-white" />,
              duration: '1 mes'
            },
            {
              id: '3',
              name: "Élite",
              price: "$2,800",
              description: "La experiencia VIP completa",
              features: [
                "Todo lo del plan Premium",
                "20% de descuento permanente",
                "Reserva prioritaria garantizada",
                "2 tratamientos gratis al mes",
                "Productos premium de regalo",
                "Sesiones extendidas sin costo",
                "Atención personalizada 24/7"
              ],
              color: "bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700",
              icon: <Gem className="w-8 h-8 text-white" />,
              duration: '1 mes'
            }
          ]);
        }
      } catch (error) {
        console.error('Error al cargar membresías VIP:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadVipMemberships();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-24">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block p-3 rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 mb-6">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-800">Programa VIP</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Eleva tu experiencia de belleza con beneficios exclusivos, atención personalizada y descuentos permanentes.
          </p>
        </motion.div>
        
        {/* Benefits Section */}
        <motion.div 
          className="mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 flex items-center justify-center">
            <Award className="w-6 h-6 mr-2 text-emerald-600" />
            Beneficios Exclusivos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <BenefitCard {...benefit} />
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Membership Tiers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 flex items-center justify-center">
            <Sparkles className="w-6 h-6 mr-2 text-emerald-600" />
            Elige tu Membresía
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="h-full">
                  <Card className="border-0 shadow-xl h-full relative">
                    <CardHeader className="bg-gray-200 text-center rounded-t-lg">
                      <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
                      <Skeleton className="h-6 w-1/2 mx-auto" />
                      <Skeleton className="h-8 w-1/3 mx-auto mt-2" />
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Skeleton className="h-4 w-3/4 mx-auto mb-6" />
                      <div className="space-y-3">
                        {Array(4).fill(0).map((_, i) => (
                          <div key={i} className="flex items-start">
                            <Skeleton className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ))}
                      </div>
                      <Skeleton className="h-10 w-full mt-8" />
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : memberships.length > 0 ? (
              memberships.map((membership, index) => (
                <motion.div
                  key={membership.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  <MembershipTier {...membership} onSelect={handleSelectMembership} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">No hay membresías VIP disponibles en este momento.</p>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Testimonials */}
        <motion.div 
          className="mt-20 text-center bg-white p-8 rounded-2xl shadow-xl border border-green-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex justify-center mb-4">
            <Heart className="w-8 h-8 text-emerald-500 fill-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Lo que dicen nuestros miembros VIP</h2>
          
          <div className="max-w-3xl mx-auto italic text-gray-600 text-lg">
            "Desde que me uní al programa VIP, mi experiencia ha sido completamente transformada. 
            Los beneficios exclusivos y la atención personalizada hacen que cada visita sea especial."
          </div>
          
          <div className="mt-6 font-semibold text-emerald-700">María Fernández</div>
          <div className="text-sm text-gray-500">Miembro Premium desde hace 6 meses</div>
          
          <div className="flex justify-center mt-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400 mx-1" />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}