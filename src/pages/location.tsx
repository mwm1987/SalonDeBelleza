import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook,
  MessageCircle,
  Car,
  Bus,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Wifi,
  CreditCard,
  Star,
  ArrowLeft,
  Share2,
  Bookmark,
  Users,
  PersonStanding
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useToast } from '@/hooks/use-toast';

export default function Location() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  
  // Datos de la estética
  const businessInfo = {
    name: "Secretos de Belleza",
    address: "Calle Williams 1332, Sarmiento, Chubut",
    coordinates: {
      lat: -45.57921983424248,
      lng: -69.05991375446321
    },
    phone: "+54 9 297 461-1699",
    email: "secretosdebelleza@gmail.com",
    instagram: "@sdbestetica",
    facebook: "Secretos de Belleza",
    whatsapp: "+54 9 297 461-1699"
  };

  const businessHours = [
    { day: "Lunes", hours: "9:00 - 18:00", isOpen: true },
    { day: "Martes", hours: "9:00 - 18:00", isOpen: true },
    { day: "Miércoles", hours: "9:00 - 18:00", isOpen: true },
    { day: "Jueves", hours: "9:00 - 18:00", isOpen: true },
    { day: "Viernes", hours: "9:00 - 18:00", isOpen: true },
    { day: "Sábado", hours: "9:00 - 15:00", isOpen: true },
    { day: "Domingo", hours: "10:00 - 18:00", isOpen: true },
  ];

  const amenities = [
    { icon: <Wifi className="w-5 h-5" />, label: "WiFi Gratuito" },
    { icon: <CreditCard className="w-5 h-5" />, label: "Tarjetas de Crédito" },
    { icon: <Users className="w-5 h-5" />, label: "Acceso para Todos" },
    { icon: <Car className="w-5 h-5" />, label: "Estacionamiento" },
    { icon: <Calendar className="w-5 h-5" />, label: "Reserva Online" },
  ];

  // Función para copiar al portapapeles
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({
        title: "Copiado",
        description: `${type} copiado al portapapeles`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Función para abrir Google Maps
  const openGoogleMaps = () => {
    const gmmIntentUri = `geo:0,0?q=${businessInfo.coordinates.lat},${businessInfo.coordinates.lng}(${encodeURIComponent(businessInfo.name + ' - ' + businessInfo.address)})`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${businessInfo.coordinates.lat},${businessInfo.coordinates.lng}`;
    
    // Intentar abrir en la app de Google Maps primero, si no funciona usar la web
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = gmmIntentUri;
      // Fallback para web después de un delay
      setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 1000);
    } else {
      window.open(webUrl, '_blank');
    }
  };

  // Función para abrir Waze
  const openWaze = () => {
    const wazeUrl = `https://waze.com/ul?ll=${businessInfo.coordinates.lat},${businessInfo.coordinates.lng}&navigate=yes`;
    window.open(wazeUrl, '_blank');
  };

  // Función para obtener el día actual
  const getCurrentDay = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
  };

  const currentDay = getCurrentDay();

  return (
    <>
    
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-green-400/20 rounded-full -translate-x-48 -translate-y-48 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-400/20 via-indigo-400/15 to-purple-400/20 rounded-full translate-x-48 translate-y-48 blur-3xl animate-pulse delay-2000"></div>

        <div className="container mx-auto px-4 py-8 lg:ml-80 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
                className="hover:bg-emerald-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Nuestra Ubicación
                </h1>
                <p className="text-gray-600">Encuentranos fácilmente</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Mapa y Navegación */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Mapa Principal */}
              <Card className="shadow-xl border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
                  <CardTitle className="flex items-center space-x-3">
                    <MapPin className="w-6 h-6" />
                    <span>Ubicación en el Mapa</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative">
                    {/* Embed de Google Maps */}
                    <iframe
                      src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2578.1654839927366!2d${businessInfo.coordinates.lng}!3d${businessInfo.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDM0JzQ1LjIiUyA2OcKwMDMnMzUuNyJX!5e0!3m2!1ses!2sar!4v1624451234567!5m2!1ses!2sar`}
                      width="100%"
                      height="400"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full"
                    ></iframe>
                    
                    {/* Overlay con información */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <Card className="bg-white/95 backdrop-blur-md border-0 shadow-xl">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-lg text-gray-800">{businessInfo.name}</h3>
                              <p className="text-gray-600 text-sm">{businessInfo.address}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="icon"
                                onClick={() => copyToClipboard(businessInfo.address, "Dirección")}
                                className="bg-emerald-500 hover:bg-emerald-600"
                              >
                                {copied === "Dirección" ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                onClick={openGoogleMaps}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Botones de Navegación */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card 
                    className="cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
                    onClick={openGoogleMaps}
                  >
                    <CardContent className="p-6 text-center">
                      <Navigation className="w-12 h-12 mx-auto mb-3" />
                      <h3 className="font-bold text-lg mb-2">Google Maps</h3>
                      <p className="text-sm opacity-90">Navegar con GPS</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card 
                    className="cursor-pointer bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
                    onClick={openWaze}
                  >
                    <CardContent className="p-6 text-center">
                      <Car className="w-12 h-12 mx-auto mb-3" />
                      <h3 className="font-bold text-lg mb-2">Waze</h3>
                      <p className="text-sm opacity-90">Ruta más rápida</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="cursor-pointer bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <Share2 className="w-12 h-12 mx-auto mb-3" />
                      <h3 className="font-bold text-lg mb-2">Compartir</h3>
                      <p className="text-sm opacity-90">Envía la ubicación</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Formas de Llegar */}
              <Card className="shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Bus className="w-6 h-6 text-emerald-600" />
                    <span>Formas de Llegar</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                      <Car className="w-8 h-8 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-gray-800">En Auto</h4>
                        <p className="text-sm text-gray-600">5 min desde el centro</p>
                      </div>
                    </div>
                    
                    
                    <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl">
                      <PersonStanding className="w-8 h-8 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-gray-800">Caminando</h4>
                        <p className="text-sm text-gray-600">15 min desde el centro</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
}