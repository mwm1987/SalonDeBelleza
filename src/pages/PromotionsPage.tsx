import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Gift, Tag, Calendar, ArrowRight, Sparkles, Star, Megaphone } from 'lucide-react';
import { getPromotions, getAnnouncements } from '@/lib/firestore-setup';
import { Skeleton } from '@/components/ui/skeleton';

interface PromotionCardProps {
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  imageUrl: string;
  tag?: string;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ 
  title, 
  description, 
  discount, 
  validUntil, 
  imageUrl,
  tag 
}) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="relative">
          <div className="h-48 overflow-hidden">
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
            />
          </div>
          
          {tag && (
            <Badge 
              className="absolute top-3 right-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white font-bold py-1 px-3 shadow-lg"
            >
              {tag}
            </Badge>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <h3 className="text-2xl font-bold text-white">{discount}</h3>
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center">
            <Gift className="w-5 h-5 mr-2 text-emerald-600" />
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 flex items-center">
            <Calendar className="w-4 h-4 mr-1 text-emerald-500" />
            Válido hasta: {validUntil}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-gray-700 mb-4">{description}</p>
          <Button 
            className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            Reservar Ahora
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface AnnouncementCardProps {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'event';
  startDate: string;
  endDate: string;
  imageUrl: string;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ 
  title, 
  content, 
  type,
  startDate, 
  endDate, 
  imageUrl
}) => {
  const getTypeColor = () => {
    switch (type) {
      case 'warning': return 'from-amber-500 to-orange-600';
      case 'success': return 'from-green-500 to-emerald-600';
      case 'event': return 'from-purple-500 to-pink-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  const getTypeText = () => {
    switch (type) {
      case 'warning': return 'AVISO';
      case 'success': return 'ÉXITO';
      case 'event': return 'EVENTO';
      default: return 'INFORMACIÓN';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="relative">
          <div className="h-48 overflow-hidden">
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
            />
          </div>
          
          <Badge 
            className={`absolute top-3 right-3 bg-gradient-to-r ${getTypeColor()} text-white font-bold py-1 px-3 shadow-lg`}
          >
            {getTypeText()}
          </Badge>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center">
            <Megaphone className="w-5 h-5 mr-2 text-blue-600" />
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 flex items-center">
            <Calendar className="w-4 h-4 mr-1 text-blue-500" />
            Válido: {startDate} - {endDate}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-gray-700 mb-4">{content}</p>
          <Button 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            Leer Más
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  
  // Cargar promociones desde Firestore
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        setLoadingPromotions(true);
        const promotionsData = await getPromotions();
        
        if (promotionsData && promotionsData.length > 0) {
          setPromotions(promotionsData);
        } else {
          console.log('No se encontraron promociones en Firestore');
          setPromotions([]);
        }
      } catch (error) {
        console.error('Error al cargar promociones:', error);
      } finally {
        setLoadingPromotions(false);
      }
    };
    
    loadPromotions();
  }, []);

  // Cargar anuncios desde Firestore
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setLoadingAnnouncements(true);
        const announcementsData = await getAnnouncements();
        
        if (announcementsData && announcementsData.length > 0) {
          setAnnouncements(announcementsData);
        } else {
          console.log('No se encontraron anuncios en Firestore');
          setAnnouncements([]);
        }
      } catch (error) {
        console.error('Error al cargar anuncios:', error);
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    
    loadAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-24">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block p-3 rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 mb-6">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-800">Promociones Especiales</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre nuestras ofertas exclusivas y aprovecha descuentos increíbles en nuestros servicios premium.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {loadingPromotions ? (
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="w-full">
                <Card className="overflow-hidden border-0 shadow-lg">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-10 w-full mt-4" />
                  </CardContent>
                </Card>
              </div>
            ))
          ) : promotions.length > 0 ? (
            promotions.map((promo, index) => (
              <motion.div
                key={promo.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <PromotionCard {...promo} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-4 text-center py-10">
              <p className="text-gray-500">No hay promociones disponibles en este momento.</p>
            </div>
          )}
        </div>
        
        {/* Sección de Anuncios */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="inline-block p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 mb-6">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 text-gray-800">Anuncios Importantes</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mantente informado sobre nuestras novedades, eventos y avisos importantes.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loadingAnnouncements ? (
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="w-full">
                <Card className="overflow-hidden border-0 shadow-lg">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-10 w-full mt-4" />
                  </CardContent>
                </Card>
              </div>
            ))
          ) : announcements.length > 0 ? (
            announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <AnnouncementCard {...announcement} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-4 text-center py-10">
              <p className="text-gray-500">No hay anuncios disponibles en este momento.</p>
            </div>
          )}
        </div>
        
        <motion.div 
          className="mt-16 text-center bg-white p-8 rounded-2xl shadow-xl border border-green-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 text-yellow-400 fill-yellow-400 mx-1" />
            ))}
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">¿Quieres más beneficios exclusivos?</h2>
          <p className="text-gray-600 mb-6">Únete a nuestro programa VIP y obtén descuentos permanentes y promociones especiales.</p>
          <Button 
            className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => window.location.href = '/vip'}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Conocer Programa VIP
          </Button>
        </motion.div>
      </div>
    </div>
  );
}