import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { motion } from 'framer-motion';
import { Sparkles, Clock, Calendar, Star, ArrowRight, Scissors, Brush, Flower2 as Spa, Droplet, Zap } from 'lucide-react';

interface Treatment {
  id: string;
  name: string;
  zone?: string;
  price: number;
  duration: number;
  description?: string;
  image?: string;
}

interface ServiceCardProps {
  title: string;
  description: string;
  price: string;
  duration: string;
  image: string;
  popular?: boolean;
  icon: React.ReactNode;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  title, 
  description, 
  price, 
  duration, 
  image, 
  popular, 
  icon 
}) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden">
        {popular && (
          <Badge 
            className="absolute top-4 right-4 z-10 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white font-bold py-1 px-3 shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-1" /> Popular
          </Badge>
        )}
        
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <div className="p-2 rounded-full bg-white/90 shadow-lg">
              {icon}
            </div>
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>{duration}</span>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-gray-600">{description}</p>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center border-t pt-4">
          <div className="font-bold text-lg text-emerald-700">{price}</div>
          <Button 
            className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            onClick={() => window.location.href = '/appointment'}
          >
            Reservar <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const ServiceCategory: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ 
  title, 
  icon, 
  children 
}) => {
  return (
    <div className="mb-16">
      <div className="flex items-center mb-8">
        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white mr-4">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {children}
      </div>
    </div>
  );
};

export default function FeaturedServicesPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cargar tratamientos desde Firestore
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const treatmentsCollection = collection(db, 'treatments');
        const treatmentsSnapshot = await getDocs(treatmentsCollection);
        const treatmentsList = treatmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Treatment[];
        
        setTreatments(treatmentsList);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar tratamientos:', error);
        setLoading(false);
      }
    };
    
    fetchTreatments();
  }, []);
  
  // Agrupar tratamientos por zona
  const facialTreatments = treatments.filter(treatment => 
    treatment.zone?.toLowerCase().includes('facial') || 
    treatment.zone?.toLowerCase().includes('cara') ||
    treatment.zone?.toLowerCase().includes('rostro')
  );
  
  const hairTreatments = treatments.filter(treatment => 
    treatment.zone?.toLowerCase().includes('cabello') || 
    treatment.zone?.toLowerCase().includes('pelo') ||
    treatment.zone?.toLowerCase().includes('capilar')
  );
  
  const bodyTreatments = treatments.filter(treatment => 
    treatment.zone?.toLowerCase().includes('cuerpo') || 
    treatment.zone?.toLowerCase().includes('corporal') ||
    !treatment.zone?.toLowerCase().includes('facial') && 
    !treatment.zone?.toLowerCase().includes('cara') &&
    !treatment.zone?.toLowerCase().includes('rostro') &&
    !treatment.zone?.toLowerCase().includes('cabello') &&
    !treatment.zone?.toLowerCase().includes('pelo') &&
    !treatment.zone?.toLowerCase().includes('capilar')
  );
  
  // Convertir tratamientos a formato de servicios para mostrar
  const mapTreatmentToService = (treatment: Treatment, icon: React.ReactNode) => ({
    title: treatment.name,
    description: treatment.description || 'Sin descripción disponible',
    price: `$${treatment.price.toLocaleString()}`,
    duration: `${treatment.duration} minutos`,
    image: treatment.image || '/images/services/default.jpg',
    popular: false,
    icon: icon
  });
  
  const facialServices = facialTreatments.map(treatment => 
    mapTreatmentToService(treatment, <Droplet className="w-5 h-5 text-emerald-600" />)
  );
  
  const hairServices = hairTreatments.map(treatment => 
    mapTreatmentToService(treatment, <Scissors className="w-5 h-5 text-emerald-600" />)
  );
  
  const bodyServices = bodyTreatments.map(treatment => 
    mapTreatmentToService(treatment, <Spa className="w-5 h-5 text-emerald-600" />)
  );
  
  // No se utilizan servicios de respaldo
  
  // Mostrar solo servicios disponibles
  const displayFacialServices = facialServices;
  const displayHairServices = hairServices;
  const displayBodyServices = bodyServices;

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
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-800">Servicios Destacados</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre nuestra selección de tratamientos premium diseñados para realzar tu belleza natural
          </p>
        </motion.div>
        
        {/* Services Sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <>
              {displayFacialServices.length > 0 && (
                <ServiceCategory title="Tratamientos Faciales" icon={<Droplet className="w-6 h-6 text-white" />}>
                  {displayFacialServices.map((service, index) => (
                    <motion.div
                      key={`facial-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <ServiceCard {...service} />
                    </motion.div>
                  ))}
                </ServiceCategory>
              )}
              
              {displayHairServices.length > 0 && (
                <ServiceCategory title="Servicios Capilares" icon={<Scissors className="w-6 h-6 text-white" />}>
                  {displayHairServices.map((service, index) => (
                    <motion.div
                      key={`hair-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                    >
                      <ServiceCard {...service} />
                    </motion.div>
                  ))}
                </ServiceCategory>
              )}
              
              {displayBodyServices.length > 0 && (
                <ServiceCategory title="Tratamientos Corporales" icon={<Spa className="w-6 h-6 text-white" />}>
                  {displayBodyServices.map((service, index) => (
                    <motion.div
                      key={`body-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.7 }}
                    >
                      <ServiceCard {...service} />
                    </motion.div>
                  ))}
                </ServiceCategory>
              )}
            </>
          )}
        </motion.div>
        
        {/* Call to Action */}
        <motion.div 
          className="mt-16 text-center bg-white p-8 rounded-2xl shadow-xl border border-green-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex justify-center mb-4">
            <Zap className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">¿Listo para transformar tu imagen?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Agenda tu cita hoy mismo y déjanos ayudarte a lucir tu mejor versión.
            Nuestros especialistas están listos para atenderte con los tratamientos más avanzados.
          </p>
          
          <Button 
            className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold py-6 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-lg"
            onClick={() => window.location.href = '/appointment'}
          >
            Reservar Cita <Calendar className="w-5 h-5 ml-2" />
          </Button>
          
          <div className="flex justify-center mt-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 text-yellow-400 fill-yellow-400 mx-1" />
            ))}
            <span className="ml-2 text-gray-600 font-medium">4.9/5 basado en 230 reseñas</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}