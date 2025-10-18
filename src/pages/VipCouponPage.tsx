import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Crown, Calendar, Gift, Percent, Clock, Check, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

interface VipSubscription {
  id: string;
  membershipId: string;
  membershipName: string;
  startDate: string;
  endDate: string;
  benefits: string[];
}

export default function VipCouponPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<VipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState<string>('');
  const couponRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVipSubscription = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const subscriptionsRef = collection(db, 'vipSubscriptions');
        const q = query(
          subscriptionsRef, 
          where('userId', '==', user.id),
          where('status', '==', 'active')
        );
        
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          toast({
            title: "No eres miembro VIP",
            description: "Únete al programa VIP para acceder a estos beneficios",
          });
          navigate('/vip-program');
          return;
        }
        
        // Get the first active subscription
        const subscriptionData = querySnapshot.docs[0].data() as VipSubscription;
        setSubscription({
          ...subscriptionData,
          id: querySnapshot.docs[0].id
        });

        // Generar código único para el cupón
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        const userCode = user.id.substring(0, 4).toUpperCase();
        const generatedCode = `VIP-${userCode}-${timestamp}-${randomStr}`.toUpperCase();
        setCouponCode(generatedCode);
      } catch (error) {
        console.error('Error loading VIP subscription:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información de tu membresía VIP",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadVipSubscription();
  }, [user, navigate, toast]);

  const handleDownloadCoupon = async () => {
    if (!couponRef.current) {
      toast({
        title: "Error",
        description: "No se pudo generar el cupón. Intenta recargando la página.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Mostrar mensaje de procesamiento
      toast({
        title: "Generando cupón",
        description: "Estamos preparando tu cupón VIP...",
      });
      
      // Forzar un reflow para asegurar que todos los elementos estén renderizados
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Crear canvas con html2canvas
      const canvas = await html2canvas(couponRef.current, {
        scale: 2, // Mayor resolución
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Asegurar que los estilos se apliquen correctamente en el clon
          const clonedElement = clonedDoc.getElementById('vip-coupon');
          if (clonedElement) {
            clonedElement.style.width = '100%';
            clonedElement.style.height = 'auto';
          }
        }
      });
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.download = `cupon-vip-${couponCode}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // Simular clic para descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Mostrar mensaje de éxito
      toast({
        title: "¡Cupón descargado!",
        description: "Tu cupón VIP ha sido guardado correctamente",
      });
    } catch (error) {
      console.error('Error al generar el cupón:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el cupón. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No tienes una membresía VIP activa</h1>
          <Button onClick={() => navigate('/vip-program')}>
            Unirse al programa VIP
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/menu')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Menú
        </Button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Tu Membresía VIP
          </h1>
          
          <div ref={couponRef} id="vip-coupon" className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-amber-400">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-6 px-8 text-center relative">
              {/* Elementos decorativos */}
              <div className="absolute top-2 right-2 opacity-20">
                <Crown className="w-12 h-12" />
              </div>
              <div className="absolute bottom-2 left-2 opacity-20">
                <Crown className="w-8 h-8" />
              </div>
              
              <Crown className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">{subscription.membershipName}</h2>
              <p className="text-amber-100">Miembro Exclusivo</p>
              
              {/* Código del cupón */}
              <div className="mt-4 bg-amber-600/20 p-2 rounded-lg border border-amber-400/30">
                <p className="text-sm font-mono font-bold">{couponCode}</p>
              </div>
            </div>
            
            <CardContent className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <Calendar className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Fecha de inicio</p>
                  <p className="font-semibold">{new Date(subscription.startDate).toLocaleDateString()}</p>
                </div>
                
                <div className="text-center">
                  <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Válido hasta</p>
                  <p className="font-semibold">{new Date(subscription.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Gift className="w-6 h-6 mr-2 text-amber-600" />
                  Beneficios Incluidos
                </h3>
                
                <ul className="space-y-3">
                  {subscription.benefits && subscription.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                  {/* Beneficios por defecto si no hay en la suscripción */}
                  {(!subscription.benefits || subscription.benefits.length === 0) && (
                    <>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>20% de descuento permanente</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Acceso prioritario a turnos</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>1 tratamiento gratis al mes</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Productos de cortesía</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Atención personalizada</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              
              {/* QR Code con información del usuario */}
              <div className="flex justify-center items-center space-x-6 mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="bg-white p-2 rounded border">
                  <QRCodeSVG 
                    value={`VIP:${user?.id}:${couponCode}`}
                    size={80}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-sm text-amber-700 max-w-xs">
                  <p className="font-semibold">Código QR de verificación</p>
                  <p>Escanea este código para validar tu membresía VIP</p>
                </div>
              </div>
              
              <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                  Presenta este cupón al llegar al salón para disfrutar de tus beneficios VIP
                </p>
              </div>
            </CardContent>
          </div>
          
          <div className="mt-6 text-center">
            <Button onClick={handleDownloadCoupon} className="bg-amber-500 hover:bg-amber-600">
              <Download className="w-4 h-4 mr-2" />
              Descargar Cupón
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}