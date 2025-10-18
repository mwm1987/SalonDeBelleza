import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Navigation, 
  Instagram, 
  Facebook, 
  MessageCircle,
  LogOut,
  Sparkles,
  Star,
  Gift,
  Settings,
  Heart,
  Crown,
  Zap,
  Phone,
  Mail,
  Award,
  Users,
  Scissors,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Ticket // Added Ticket icon for the new component
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Mock data and interfaces
interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

interface FeaturedService {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: string;
  onClick: () => void;
  gradient?: string;
  size?: 'small' | 'medium' | 'large';
}

import { getPromotions, getAnnouncements } from '@/lib/firestore-setup';

function MenuItem({ icon, title, description, badge, onClick, gradient, size = 'medium' }: MenuItemProps) {
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1',
    large: 'col-span-2'
  };

  const paddingClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-6'
  };

  const iconSizes = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className={`relative ${sizeClasses[size]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={`cursor-pointer border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden ${gradient || 'bg-white'} relative group`}
        onClick={onClick}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-8 -translate-x-8 group-hover:scale-125 transition-transform duration-500"></div>
        
        <CardContent className={`${paddingClasses[size]} text-center space-y-4 relative z-10`}>
          <motion.div 
            className={`mx-auto ${iconSizes[size]} bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:bg-white/30 transition-all duration-300`}
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {icon}
          </motion.div>
          <div className="space-y-2">
            <h3 className="font-bold text-white text-lg tracking-wide group-hover:scale-105 transition-transform duration-300">
              {title}
            </h3>
            {description && (
              <p className="text-white/90 text-sm font-medium leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {badge && (
            <Badge 
              variant="secondary" 
              className="bg-white/25 text-white border-white/40 font-semibold backdrop-blur-sm shadow-lg animate-pulse"
            >
              {badge}
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MenuScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Nuevos estados para verificar VIP
  const [isVip, setIsVip] = useState(false);
  const [vipSubscription, setVipSubscription] = useState<any>(null);
  const [loadingVip, setLoadingVip] = useState(true);


  // Estados para el carrusel mejorado
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [currentSlide, setCurrentSlide] = useState({ announcements: 0, promotions: 0, services: 0 });
  
  const [activeCarousel, setActiveCarousel] = useState(0);
  const carousels = ['announcements', 'promotions', 'services'];
  const carouselTitles = ['Anuncios', 'Promociones', 'Servicios Destacados'];
  const carouselIcons = [<Megaphone className="w-6 h-6" />, <Gift className="w-6 h-6" />, <Scissors className="w-6 h-6" />];
  const carouselGradients = [
    'from-emerald-500 via-teal-500 to-cyan-600',
    'from-pink-500 via-rose-500 to-red-600',
    'from-blue-500 via-indigo-500 to-purple-600'
  ];

  // Verificar si el usuario es VIP
  useEffect(() => {
    const checkVipStatus = async () => {
      if (!user) {
        setLoadingVip(false);
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
        if (!querySnapshot.empty) {
          setIsVip(true);
          const subscriptionData = querySnapshot.docs[0].data();
          setVipSubscription({
            ...subscriptionData,
            id: querySnapshot.docs[0].id
          });
        }
      } catch (error) {
        console.error('Error checking VIP status:', error);
        toast({
          title: "Error",
          description: "No se pudo verificar tu estado VIP",
          variant: "destructive",
        });
      } finally {
        setLoadingVip(false);
      }
    };

    checkVipStatus();
  }, [user, toast]);

  // Auto-play del carrusel principal
  useEffect(() => {
    if (!isAutoPlay) return;
    
    const interval = setInterval(() => {
      setActiveCarousel((prev) => (prev + 1) % carousels.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [isAutoPlay]);
  
  // Función para cambiar carrusel
  const changeCarousel = (direction: 'next' | 'prev') => {
    setActiveCarousel((prev) => {
      if (direction === 'next') {
        return (prev + 1) % carousels.length;
      } else {
        return prev === 0 ? carousels.length - 1 : prev - 1;
      }
    });
  };



  const handleMenuAction = (action: string) => {
    switch(action) {
      case 'appointments':
        navigate('/appointment');
        break;
      case 'my-appointments':
        navigate('/my-appointments');
        break;
      case 'promotions':
        navigate('/promotions');
        break;
      case 'vip-program':
        // Si es VIP, ir al cupón, sino al programa VIP
        if (isVip) {
          navigate('/vip-coupon');
        } else {
          navigate('/vip-program');
        }
        break;
      case 'coupons-gifts':
        navigate('/coupons-gifts'); // New route for coupons and gifts
        break;
      case 'featured-services':
        navigate('/featured-services');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'navigation':
        navigate('/location');
        break;
      case 'contacto':
        navigate('/contacto');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'instagram':
        window.open('https://www.instagram.com/sdbestetica', '_blank', 'noopener,noreferrer');
        break;
      case 'facebook':
        window.open('https://www.facebook.com/100007545277891', '_blank', 'noopener,noreferrer');
        break;
      case 'whatsapp':
        window.open('https://wa.me/5492974611699', '_blank', 'noopener,noreferrer');
        break;
      default:
        console.log(`Menu action: ${action}`);
    }
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo mejorados */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-green-400/20 rounded-full -translate-x-48 -translate-y-48 blur-3xl animate-pulse"></div>
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-tl from-pink-400/15 via-rose-400/10 to-red-400/15 rounded-full translate-x-40 blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-400/20 via-indigo-400/15 to-purple-400/20 rounded-full translate-x-48 translate-y-48 blur-3xl animate-pulse delay-2000"></div>
      <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-gradient-to-br from-cyan-400/15 via-teal-400/10 to-emerald-400/15 rounded-full -translate-x-36 blur-3xl animate-pulse delay-3000"></div>
      
      {/* Header mejorado con barra de menú superior */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0 z-20 shadow-xl">
        <div className="max-w-md mx-auto p-4">
          {/* Barra de menú superior */}

          
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  boxShadow: [
                    "0 0 0 0 rgba(16, 185, 129, 0.4)",
                    "0 0 0 8px rgba(16, 185, 129, 0.1)",
                    "0 0 0 16px rgba(16, 185, 129, 0)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="rounded-full"
              >
                <Avatar className="w-16 h-16 border-4 border-gradient-to-r from-emerald-400 to-teal-600 shadow-2xl">
                  <AvatarImage src={user?.photoURL || "/images/Avatar.jpg"} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-lg font-bold">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <motion.div 
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full border-3 border-white shadow-2xl"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              ></motion.div>
            </div>
            <div className="flex-1">
              <motion.h2 
                className="font-bold text-xl text-gray-900 mb-1 bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ¡Hola, {user?.displayName || user?.email?.split('@')[0] || 'Bella'}! ✨
              </motion.h2>
              <p className="text-sm text-gray-600 font-medium">
                {user?.email || 'usuario@example.com'}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              {isVip && (
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/vip-coupon')}
                  className="cursor-pointer bg-gradient-to-r from-yellow-400 to-amber-500 p-2 rounded-full shadow-lg"
                  title="Ver mis beneficios VIP"
                >
                  <Crown className="w-5 h-5 text-white" />
                </motion.div>
              )}
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.div
                    key={star}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, delay: star * 0.1 }}
                  >
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-6 space-y-8 relative z-10">
        {/* Welcome Section mejorado */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center py-8"
        >
          <motion.div 
            className="w-28 h-28 mx-auto bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden"
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(16, 185, 129, 0.4)",
                "0 0 0 15px rgba(16, 185, 129, 0.1)",
                "0 0 0 25px rgba(16, 185, 129, 0)"
              ]
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <Sparkles className="w-16 h-16 text-white relative z-10" />
          </motion.div>
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent mb-3"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
          >
            Secretos de Belleza
          </motion.h1>
          <p className="text-gray-600 font-medium text-lg">Tu santuario de belleza y bienestar 💅</p>
        </motion.div>



        {/* Main Menu Grid mejorado */}
        <motion.div 
          className="grid grid-cols-2 gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, staggerChildren: 0.1 }}
        >
          <MenuItem
            icon={<Calendar className="w-8 h-8" />}
            title="Reservar Turno"
            description="Agenda tu momento perfecto"
            gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
            onClick={() => handleMenuAction('appointments')}
          />
          
          <MenuItem
            icon={<Clock className="w-8 h-8" />}
            title="Mis Turnos"
            description="Próximas citas"
            badge="2 próximos"
            gradient="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700"
            onClick={() => handleMenuAction('my-appointments')}
          />
          
          <MenuItem
            icon={<Gift className="w-8 h-8" />}
            title="Promociones Especiales"
            description="Ofertas exclusivas para ti"
            badge="¡30% OFF!"
            gradient="bg-gradient-to-br from-pink-500 via-rose-500 to-red-600"
            onClick={() => handleMenuAction('promotions')}
          />
          
          {/* Mostrar ítem VIP solo si el usuario es VIP */}
          {isVip ? (
            <MenuItem
              icon={<Crown className="w-8 h-8" />}
              title="Club VIP"
              description="Beneficios exclusivos"
              badge="¡VIP!"
              gradient="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600"
              onClick={() => handleMenuAction('vip-program')}
            />
          ) : (
            <MenuItem
              icon={<Crown className="w-8 h-8" />}
              title="Unirse al VIP"
              description="Beneficios exclusivos"
              gradient="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600"
              onClick={() => handleMenuAction('vip-program')}
            />
          )}

          {/* New Menu Item for Coupons and Gifts */}
          <MenuItem
            icon={<Ticket className="w-8 h-8" />}
            title="Cupones y Regalos"
            description="Descuentos y regalos exclusivos"
            gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-600"
            onClick={() => handleMenuAction('coupons-gifts')}
            size="large"
          />
        </motion.div>

        {/* Location & Contact mejorado */}
        <motion.div 
          className="space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Ubicación y Contacto
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <MenuItem
              icon={<Navigation className="w-7 h-7" />}
              title="Cómo Llegar"
              description="Navegación GPS"
              gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              onClick={() => handleMenuAction('navigation')}
            />
            
            <MenuItem
              icon={<Phone className="w-7 h-7" />}
              title="Contacto"
              description="Llámanos ahora"
              gradient="bg-gradient-to-br from-green-500 to-emerald-600"
              onClick={() => handleMenuAction('contacto')}
            />
          </div>
        </motion.div>

        {/* Social Media mejorado */}
        <motion.div 
          className="space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-pink-700 to-purple-700 bg-clip-text text-transparent">
              Síguenos y Conéctate
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MenuItem
              icon={<Instagram className="w-6 h-6" />}
              title="Instagram"
              description="@sdbestetica"
              gradient="bg-gradient-to-br from-pink-500 via-rose-500 to-red-600"
              onClick={() => handleMenuAction('instagram')}
              size="small"
            />
            
            <MenuItem
              icon={<Facebook className="w-6 h-6" />}
              title="Facebook"
              description="Síguenos"
              gradient="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600"
              onClick={() => handleMenuAction('facebook')}
              size="small"
            />
            
            <MenuItem
              icon={<MessageCircle className="w-6 h-6" />}
              title="WhatsApp"
              description="Chat directo"
              gradient="bg-gradient-to-br from-green-500 to-emerald-600"
              onClick={() => handleMenuAction('whatsapp')}
              size="small"
            />
          </div>
        </motion.div>

        {/* Settings & Logout mejorado */}
        <motion.div 
          className="grid grid-cols-2 gap-5 pt-8 border-t border-emerald-200/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
        >
          <MenuItem
            icon={<Settings className="w-7 h-7" />}
            title="Mi Perfil"
            description="Personaliza tu perfil"
            gradient="bg-gradient-to-br from-gray-500 to-slate-600"
            onClick={() => handleMenuAction('profile')}
          />
          
          <MenuItem
            icon={<LogOut className="w-7 h-7" />}
            title="Cerrar Sesión"
            description="Hasta pronto"
            gradient="bg-gradient-to-br from-red-500 to-pink-600"
            onClick={handleLogout}
          />
        </motion.div>

        {/* Admin Access mejorado - solo visible para administradores */}
        {(user?.email === 'kawazulu.intel05@gmail.com' || user?.email === 'marvifig@gmail.com' || user?.email === 'kawazulu.intel01@gmail.com') && (
          <motion.div 
            className="pt-6 border-t border-emerald-200/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
          >
            <MenuItem
              icon={<Award className="w-8 h-8" />}
              title="Panel Administrativo"
              description="Gestión completa del salón"
              gradient="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600"
              onClick={() => handleMenuAction('admin')}
              size="large"
            />
          </motion.div>
        )}

        {/* Footer mejorado */}
        <motion.div 
          className="text-center py-10 text-sm text-gray-500 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <div className="flex items-center justify-center space-y-4 flex-col">
            <div className="flex items-center justify-center space-x-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Heart className="w-5 h-5 text-emerald-500 fill-current" />
              </motion.div>
              <p className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                © 2024 Secretos de Belleza
              </p>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
              >
                <Heart className="w-5 h-5 text-emerald-500 fill-current" />
              </motion.div>
            </div>
            <p className="text-emerald-600 font-medium text-base">Tu belleza, nuestra pasión 💕</p>
            <div className="flex items-center justify-center space-x-2 pt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3, 
                    delay: star * 0.2 
                  }}
                >
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </motion.div>
              ))}
            </div>
            <div className="pt-4 text-xs text-gray-400">
              <p>Calle Williams 1332, Sarmiento, Chubut</p>
              <p>📞 +54 9 297 461-1699</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}