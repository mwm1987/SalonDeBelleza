import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Instagram, 
  Facebook,
  Send,
  Heart,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ContactData {
  phone: string;
  email: string;
  address: string;
  schedule: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
}

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadContactData();
  }, []);

  const loadContactData = async () => {
    try {
      const docRef = doc(db, 'settings', 'contact');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setContactData(docSnap.data() as ContactData);
      } else {
        // Datos por defecto en caso de que no exista el documento
        setContactData({
          phone: "+54 9 297 461-1699",
          email: "salon.sdbellza@gmail.com",
          address: "Calle Williams 1332, Sarmiento, Chubut",
          schedule: "Lun-Vie: 9:00-20:00, Sáb: 9:00-14:00",
          instagram: "@sdbestetica",
          facebook: "Secretos de Belleza",
          whatsapp: "+54 9 297 461-1699"
        });
      }
    } catch (error) {
      console.error('Error loading contact data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de contacto",
        variant: "destructive"
      });
      
      // Datos por defecto en caso de error
      setContactData({
        phone: "+54 9 297 461-1699",
        email: "salon.sdbellza@gmail.com",
        address: "Calle Williams 1332, Sarmiento, Chubut",
        schedule: "Lun-Vie: 9:00-20:00, Sáb: 9:00-14:00",
        instagram: "@sdbestetica",
        facebook: "Secretos de Belleza",
        whatsapp: "+54 9 297 461-1699"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulación de envío de formulario
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Mensaje enviado",
        description: "Nos pondremos en contacto contigo pronto",
        variant: "default"
      });
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600">Cargando información de contacto...</p>
        </div>
      </div>
    );
  }

  const contactInfo = [
    {
      icon: Phone,
      title: "Teléfono",
      value: contactData?.phone || "+54 9 297 461-1699",
      action: `tel:${contactData?.phone?.replace(/\s/g, '') || '+5492974611699'}`,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Mail,
      title: "Email",
      value: contactData?.email || "salon.sdbellza@gmail.com",
      action: `mailto:${contactData?.email || 'salon.sdbellza@gmail.com'}`,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: MapPin,
      title: "Dirección",
      value: contactData?.address || "Calle Williams 1332, Sarmiento, Chubut",
      action: `https://maps.google.com/?q=${encodeURIComponent(contactData?.address || "Calle Williams 1332, Sarmiento, Chubut")}`,
      gradient: "from-red-500 to-orange-500"
    },
    {
      icon: Clock,
      title: "Horario",
      value: contactData?.schedule || "Lun-Vie: 9:00-20:00, Sáb: 9:00-14:00",
      action: "",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  const socialLinks = [
    {
      icon: Instagram,
      title: "Instagram",
      handle: contactData?.instagram || "@sdbestetica",
      url: `https://instagram.com/${contactData?.instagram?.replace('@', '') || 'sdbestetica'}`,
      gradient: "from-pink-500 via-purple-500 to-indigo-600"
    },
    {
      icon: Facebook,
      title: "Facebook",
      handle: contactData?.facebook || "Secretos de Belleza",
      url: "https://facebook.com/secretosdebelleza",
      gradient: "from-blue-600 to-indigo-700"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      handle: contactData?.whatsapp || "+54 9 297 461-1699",
      url: `https://wa.me/${contactData?.whatsapp?.replace(/\s/g, '').replace('+', '') || '5492974611699'}`,
      gradient: "from-green-500 to-emerald-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-purple-50 relative overflow-hidden">
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-rose-400/20 via-purple-400/15 to-pink-400/20 rounded-full -translate-x-48 -translate-y-48 blur-3xl animate-pulse"></div>
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-tl from-blue-400/15 via-indigo-400/10 to-purple-400/15 rounded-full translate-x-40 blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-emerald-400/20 via-teal-400/15 to-green-400/20 rounded-full translate-x-48 translate-y-48 blur-3xl animate-pulse delay-2000"></div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                animate={{ 
                  boxShadow: [
                    "0 0 0 0 rgba(244, 63, 94, 0.4)",
                    "0 0 0 15px rgba(244, 63, 94, 0.1)",
                    "0 0 0 25px rgba(244, 63, 94, 0)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 3 }}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Heart className="w-10 h-10 text-white" />
              </motion.div>
            </div>
            <motion.h1 
              className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent mb-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
            >
              Contáctanos
            </motion.h1>
            <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Estamos aquí para ayudarte. Reserva tu cita o envíanos tu consulta
            </p>
          </motion.div>

          {/* Formulario de contacto - Centrado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600"></div>
              
              <CardContent className="p-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center justify-center">
                  <Send className="w-8 h-8 text-purple-600 mr-3" />
                  Envíanos un Mensaje
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre completo *
                      </label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Tu nombre"
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="tu@email.com"
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Tu número de teléfono"
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mensaje *
                    </label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      placeholder="¿En qué podemos ayudarte?"
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 min-h-[120px]"
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-pulse">Enviando...</span>
                        </>
                      ) : (
                        "Enviar mensaje"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Información de contacto */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-600 mr-3" />
                Información de Contacto
              </h3>
              <p className="text-lg text-gray-600">
                Estamos aquí para atenderte
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 * index }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} text-white mr-4`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">{item.title}</h4>
                  </div>
                  <p className="text-gray-600 mb-4">{item.value}</p>
                  {item.action && (
                    <a 
                      href={item.action}
                      target={item.title === "Dirección" ? "_blank" : undefined}
                      rel="noreferrer"
                      className="text-purple-600 hover:text-purple-800 font-medium inline-flex items-center"
                    >
                      {item.title === "Teléfono" && "Llamar ahora"}
                      {item.title === "Email" && "Enviar email"}
                      {item.title === "Dirección" && "Ver en mapa"}
                    </a>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-4 mt-6">
                {socialLinks.map((social, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open(social.url, '_blank')}
                    className={`p-3 rounded-2xl bg-gradient-to-br ${social.gradient} text-white shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    <social.icon className="w-6 h-6" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}