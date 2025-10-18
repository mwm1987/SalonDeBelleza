import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Tag, Calendar, Megaphone, Star, Gift, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string | number;
  validUntil: string;
  imageUrl: string;
  tag: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'event';
  startDate: string;
  endDate: string;
  active: boolean;
  imageUrl: string;
}

export interface CarouselProps {
  promotions?: Promotion[];
  announcements?: Announcement[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

// Componente individual para cada carrusel
const IndividualCarousel: React.FC<{
  items: (Promotion | Announcement)[];
  type: 'promotion' | 'announcement';
  autoPlay?: boolean;
  autoPlayInterval?: number;
}> = ({ items, type, autoPlay = false, autoPlayInterval = 4000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, items.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  if (items.length === 0) {
    return (
      <div className="relative h-80 bg-gray-50 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          {type === 'promotion' ? <Gift className="w-12 h-12 mx-auto mb-2" /> : <Megaphone className="w-12 h-12 mx-auto mb-2" />}
          <p>No hay {type === 'promotion' ? 'promociones' : 'anuncios'}</p>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  if (!currentItem) {
    return (
      <div className="relative h-80 bg-gray-50 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p>Error: Elemento no encontrado</p>
        </div>
      </div>
    );
  }

  const isPromotion = type === 'promotion';

  return (
    <div className="relative h-80 rounded-xl overflow-hidden shadow-lg group">
      <div className="relative h-full w-full">
        {/* Slide actual */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          isPromotion 
            ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800' 
            : currentItem && 'type' in currentItem
              ? currentItem.type === 'warning' 
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : currentItem.type === 'success'
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : currentItem.type === 'event'
                ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              : 'bg-gradient-to-br from-gray-500 to-slate-600'
        }`}>
          
          {/* Imagen de fondo si existe */}
          {currentItem.imageUrl && (
            <div className="absolute inset-0">
              <img 
                src={currentItem.imageUrl} 
                alt={currentItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          )}

          {/* Decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full border border-white/20 opacity-30"></div>
            <div className="absolute bottom-6 left-6 w-20 h-20 rounded-full border border-white/20 opacity-20"></div>
            <div className="absolute top-1/3 left-1/4 w-12 h-12 rounded-full border border-white/10 opacity-40"></div>
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-5" 
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='5' cy='5' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                 }}>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                {isPromotion ? <Tag className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  {isPromotion 
                    ? (currentItem as Promotion).tag || 'PROMOCIÓN'
                    : currentItem && 'type' in currentItem 
                      ? currentItem.type.toUpperCase()
                      : 'ANUNCIO'
                  }
                </span>
              </div>
              
              {isPromotion && (
                <div className="text-right">
                  <div className="text-3xl font-black leading-none">
                    {(currentItem as Promotion).discount}
                  </div>
                  <div className="text-xs opacity-80">DESCUENTO</div>
                </div>
              )}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <h3 className="text-2xl font-bold leading-tight">
                {currentItem.title}
              </h3>
              <p className="text-white/90 leading-relaxed">
                {isPromotion 
                  ? (currentItem as Promotion).description
                  : (currentItem as Announcement).content
                }
              </p>
            </div>

            {/* Footer */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {isPromotion 
                    ? `Válido hasta: ${(currentItem as Promotion).validUntil}`
                    : `${(currentItem as Announcement).startDate} - ${(currentItem as Announcement).endDate}`
                  }
                </span>
              </div>
              
<button 
  onClick={() => window.location.href = '/promotions'}
  className="w-full py-2 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors duration-300 text-white font-medium"
>
  {isPromotion ? 'Ver Oferta' : 'Leer Más'}
</button>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 opacity-0 group-hover:opacity-100 z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 opacity-0 group-hover:opacity-100 z-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots indicator */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentIndex === index 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente principal del carrusel contenedor
const PromoAnnounceCarousel: React.FC<CarouselProps> = ({
  promotions: propPromotions = [],
  announcements: propAnnouncements = [],
  autoPlay = true,
  autoPlayInterval = 5000
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Usar las promociones pasadas como props o cargarlas desde Firebase
  useEffect(() => {
    if (propPromotions && propPromotions.length > 0) {
      setPromotions(propPromotions);
      setLoading(false);
    } else {
      // Suscripción a promociones en tiempo real si no se proporcionan como props
      const unsubscribe = onSnapshot(collection(db, "promotions"), (snapshot) => {
        const promotionsData: Promotion[] = [];
        snapshot.forEach((doc) => {
          promotionsData.push({ id: doc.id, ...doc.data() } as Promotion);
        });
        setPromotions(promotionsData);
        setLoading(false);
      }, (error) => {
        console.error("Error cargando promociones:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [propPromotions]);

  // Usar los anuncios pasados como props o cargarlos desde Firebase
  useEffect(() => {
    if (propAnnouncements && propAnnouncements.length > 0) {
      setAnnouncements(propAnnouncements);
      setLoading(false);
    } else {
      // Suscripción a anuncios en tiempo real si no se proporcionan como props
      const unsubscribe = onSnapshot(collection(db, "announcements"), (snapshot) => {
        const announcementsData: Announcement[] = [];
        snapshot.forEach((doc) => {
          announcementsData.push({ id: doc.id, ...doc.data() } as Announcement);
        });
        setAnnouncements(announcementsData);
        setLoading(false);
      }, (error) => {
        console.error("Error cargando anuncios:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [propAnnouncements]);

  const slides = [
    { 
      id: 1, 
      title: "Anuncios",
      subtitle: "Mantente informado"
    },
    { 
      id: 2, 
      title: "Promociones",
      subtitle: "Las mejores ofertas para ti"
    }
  ];

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval * 2);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setActiveSlide(index);
  };

  const nextMainSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevMainSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando promociones y anuncios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header del carrusel principal */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {slides[activeSlide].title}
        </h1>
        <p className="text-gray-600">
          {slides[activeSlide].subtitle}
        </p>
      </div>

      {/* Carrusel principal contenedor */}
      <div className="relative bg-white rounded-2xl shadow-xl p-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        {/* Contenido del slide - Anuncios arriba, Promociones abajo */}
        <div className="relative">
          <div className="flex flex-col gap-8">
            {/* Sección de Anuncios */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-green-600" />
                Anuncios Activos
              </h2>
              <IndividualCarousel 
                items={announcements.filter(a => a.active)} 
                type="announcement"
                autoPlay={true}
                autoPlayInterval={4500}
              />
            </div>
            
            {/* Sección de Promociones */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600" />
                Promociones Destacadas
              </h2>
              <IndividualCarousel 
                items={promotions} 
                type="promotion"
                autoPlay={true}
                autoPlayInterval={4000}
              />
            </div>
          </div>
        </div>

        {/* Navigation arrows del carrusel principal */}
        <button
          onClick={prevMainSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-lg hover:shadow-xl rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all duration-300 z-30"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextMainSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-lg hover:shadow-xl rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all duration-300 z-30"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Indicadores del carrusel principal */}
      <div className="flex justify-center gap-3 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeSlide === index 
                ? 'bg-blue-600 w-8' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PromoAnnounceCarousel;