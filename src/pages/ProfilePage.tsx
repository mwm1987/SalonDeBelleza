import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, storage, auth } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  Settings,
  Save,
  Shield,
  Bell,
  Calendar,
  Upload,
  Camera,
  Image,
  MapPin,
  Building,
  Check,
  Edit3,
  Heart,
  Star,
  Sparkles,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  // El toast ahora se importa directamente de sonner
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [userData, setUserData] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    countryCode: '+54',
    address: '',
    city: '',
    notifications: true,
    photoURL: ''
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        // Intentar obtener datos del usuario desde Firestore
        const userDocRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          // Si existe el documento, usar esos datos
          console.log('Documento de usuario encontrado en Firestore');
          const data = userDoc.data();
          setUserData({
            name: data.name || user.displayName?.split(' ')[0] || '',
            lastname: data.lastname || user.displayName?.split(' ')[1] || '',
            email: data.email || user.email || '',
            phone: data.phone || user.phoneNumber || '',
            countryCode: data.countryCode || '+54',
            address: data.address || '',
            city: data.city || '',
            notifications: data.notifications !== undefined ? data.notifications : true,
            photoURL: data.photoURL || user.photoURL || ''
          });
          
          // Si hay una foto de perfil, establecerla como vista previa
          if (data.photoURL) {
            setImagePreview(data.photoURL);
          } else if (user.photoURL) {
            setImagePreview(user.photoURL);
          }
        } else {
          // Si no existe, crear documento en Firestore con datos del auth
          console.log('Documento de usuario NO encontrado en Firestore. Creando uno nuevo...');
          const newUserData = {
            name: user.displayName ? user.displayName.split(' ')[0] : '',
            lastname: user.displayName ? user.displayName.split(' ')[1] || '' : '',
            email: user.email || '',
            phone: user.phoneNumber || '',
            countryCode: '+54',
            address: '',
            city: '',
            notifications: true,
            photoURL: user.photoURL || '',
            createdAt: new Date().toISOString(),
            displayName: user.displayName || ''
          };
          
          try {
            // Crear el documento en Firestore
            await setDoc(userDocRef, newUserData);
            console.log('Documento de usuario creado exitosamente en Firestore');
            
            // Establecer los datos en el estado
            setUserData(newUserData);
            
            // Si hay una foto de perfil en auth, establecerla como vista previa
            if (user.photoURL) {
              setImagePreview(user.photoURL);
            }
            
            toast.success('Perfil creado', {
              description: 'Hemos creado tu perfil. Por favor completa tus datos.',
              duration: 5000,
            });
          } catch (createError) {
            console.error('Error al crear documento de usuario:', createError);
            // Si falla la creación, usar datos del auth de todos modos
            setUserData({
              name: user.displayName ? user.displayName.split(' ')[0] : '',
              lastname: user.displayName ? user.displayName.split(' ')[1] || '' : '',
              email: user.email || '',
              phone: user.phoneNumber || '',
              countryCode: '+54',
              address: '',
              city: '',
              notifications: true,
              photoURL: user.photoURL || ''
            });
            
            // Si hay una foto de perfil en auth, establecerla como vista previa
            if (user.photoURL) {
              setImagePreview(user.photoURL);
            }
            
            toast.error('Error', {
              description: 'No se pudo crear tu perfil. Intenta nuevamente.',
              duration: 5000,
            });
          }
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        toast.error('Error', {
          description: 'No se pudieron cargar tus datos. Intenta nuevamente.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setUserData({
      ...userData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Crear una URL para la vista previa de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
// Función mejorada para subir imágenes con mejor manejo de errores y metadatos
// Función mejorada para subir imágenes con mejor manejo de errores
const handleImageUpload = async () => {
  if (!user || !profileImage) return;
  
  try {
    setIsUploading(true);
    console.log('Starting image upload...');
    
    // Limpiar el nombre del archivo para evitar caracteres problemáticos
    const cleanFileName = profileImage.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const imageName = `profile-images/${user.id}/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, imageName);
    
    console.log('Uploading to:', imageName);
    
    // Simplificar metadatos - solo contentType
    const metadata = {
      contentType: profileImage.type || 'image/jpeg'
    };
    
    console.log('Uploading with metadata:', metadata);
    
    // Subir sin metadatos personalizados
    const snapshot = await uploadBytes(storageRef, profileImage, metadata);
    console.log('Upload successful, snapshot:', snapshot);
    
    const photoURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', photoURL);
    
    // Update user profile
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL });
    }
    
    // Update Firestore
    const userDocRef = doc(db, 'users', user.id);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      await updateDoc(userDocRef, { photoURL });
    } else {
      await setDoc(userDocRef, { 
        photoURL,
        name: userData.name,
        lastname: userData.lastname,
        email: userData.email,
        phone: userData.phone,
        countryCode: userData.countryCode,
        address: userData.address,
        city: userData.city,
        notifications: userData.notifications,
        createdAt: new Date().toISOString()
      });
    }
    
    // Update local state
    setUserData(prev => ({ ...prev, photoURL }));
    setImagePreview(photoURL);
    
    if (refreshUser) {
      await refreshUser();
    }
    
    toast.success('¡Foto actualizada!');
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
  } catch (error) {
    console.error('Error uploading image:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Manejo específico de errores
    if (error.code === 'storage/unauthorized') {
      toast.error('Sin autorización', {
        description: 'No tienes permisos para subir imágenes. Por favor, inicia sesión nuevamente.',
      });
    } else if (error.code === 'storage/canceled') {
      toast.error('Carga cancelada', {
        description: 'La subida de la imagen fue cancelada.',
      });
    } else if (error.code === 'storage/invalid-checksum') {
      toast.error('Archivo corrupto', {
        description: 'El archivo parece estar corrupto. Intenta con otra imagen.',
      });
    } else if (error.code === 'storage/retry-limit-exceeded') {
      toast.error('Error de conexión', {
        description: 'Se excedió el límite de reintentos. Verifica tu conexión a internet.',
      });
    } else if (error.code === 'storage/invalid-url') {
      toast.error('Error de configuración', {
        description: 'Hay un problema con la configuración del almacenamiento.',
      });
    } else if (error.code === 'storage/unknown' || error.code === 412) {
      toast.error('Error al subir', {
        description: 'No se pudo subir la imagen. Intenta con un archivo más pequeño (máx. 10MB) y en formato JPG o PNG.',
      });
    } else {
      toast.error('Error', {
        description: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
      });
    }
  } finally {
    setIsUploading(false);
  }
};
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      console.log('Guardando perfil...', userData);
      
      // Actualizar en Firebase Auth primero
      if (auth.currentUser) {
        const displayName = `${userData.name} ${userData.lastname}`.trim();
        console.log('Actualizando perfil en Auth:', { displayName, photoURL: userData.photoURL });
        await updateProfile(auth.currentUser, {
          displayName: displayName,
          photoURL: userData.photoURL
        });
        console.log('Perfil actualizado en Auth');
      }
      
      // Verificar si existe el documento en Firestore
      const userDocRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Actualizar documento existente
        console.log('Actualizando documento existente en Firestore:', userData);
        await updateDoc(userDocRef, userData);
        console.log('Documento actualizado correctamente en Firestore');
      } else {
        // Crear nuevo documento si no existe
        console.log('Documento no encontrado. Creando nuevo documento en Firestore...');
        await setDoc(userDocRef, {
          ...userData,
          id: user.id,
          displayName: user.displayName || '',
          phoneNumber: user.phoneNumber || '',
          createdAt: new Date().toISOString()
        });
        console.log('Nuevo documento creado correctamente en Firestore');
      }
      
      // Refrescar el usuario para que los cambios se reflejen inmediatamente en todos los componentes
      if (refreshUser) {
        console.log('Refrescando datos del usuario...');
        await refreshUser();
        console.log('Datos del usuario refrescados');
      }
      
      toast.success('¡Perfil guardado!', {
        description: 'Tus cambios han sido guardados exitosamente.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      toast.error('Error', {
        description: 'No se pudo guardar tu perfil. Intenta nuevamente.',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
      console.log('Estado de guardado restablecido');
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-200 border-t-pink-600 mx-auto"></div>
            <Heart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-pink-600 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Cargando tu perfil...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/auth';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <motion.div 
          className="relative container mx-auto px-4 text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-pink-200/50">
            <Sparkles className="h-5 w-5 text-pink-600" />
            <span className="text-pink-700 font-medium">Tu Espacio Personal</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Mi Perfil
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Personaliza tu experiencia y mantén tu información actualizada ✨
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Tabs defaultValue="personal" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/70 backdrop-blur-sm border-2 border-pink-100/50 rounded-2xl p-2 h-auto">
              <TabsTrigger 
                value="personal" 
                className="text-sm md:text-base py-3 px-6 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
              >
                <User className="w-4 h-4 mr-2" />
                Datos Personales
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="text-sm md:text-base py-3 px-6 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-300"
              >
                <Shield className="w-4 h-4 mr-2" />
                Seguridad
              </TabsTrigger>
            </TabsList>

            {/* Pestaña de Datos Personales */}
            <TabsContent value="personal" className="space-y-6">
              {/* Tarjeta de Foto de Perfil */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-pink-100/50 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 pb-6">
                    <CardTitle className="flex items-center text-xl">
                      <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl mr-3">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      Foto de Perfil
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center space-y-6">
                      <div className="relative group">
                        <Avatar className="w-40 h-40 border-4 border-white shadow-2xl ring-4 ring-pink-100">
                          {imagePreview ? (
                            <AvatarImage src={imagePreview} alt="Foto de perfil" className="object-cover" />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 text-white text-3xl font-bold">
                              {userData.name.charAt(0)}{userData.lastname.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full flex items-center justify-center">
                          <Edit3 className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
                        <Label htmlFor="profile-image" className="cursor-pointer w-full">
                          <div className="flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-pink-300 rounded-2xl hover:border-pink-500 hover:bg-pink-50/50 transition-all duration-300 group">
                            <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                              <Image className="w-5 h-5 text-pink-600" />
                            </div>
                            <span className="font-medium text-gray-700 group-hover:text-pink-600 transition-colors">
                              Seleccionar nueva imagen
                            </span>
                          </div>
                          <input 
                            id="profile-image" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageChange}
                            ref={fileInputRef}
                          />
                        </Label>
                        
                        {profileImage && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full"
                          >
                            <Button 
                              onClick={handleImageUpload} 
                              disabled={isUploading}
                              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                            >
                              {isUploading ? (
                                <>
                                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                  Subiendo imagen...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Guardar Foto
                                </>
                              )}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Tarjeta de Información Personal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-100/50 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 pb-6">
                    <CardTitle className="flex items-center text-xl">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl mr-3">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Nombre */}
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Star className="w-4 h-4 mr-1 text-pink-500" />
                          Nombre
                        </Label>
                        <div className="relative group">
                          <User className="absolute left-4 top-4 h-4 w-4 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                          <Input
                            id="name"
                            name="name"
                            value={userData.name}
                            onChange={handleInputChange}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                            placeholder="Tu nombre"
                          />
                        </div>
                      </div>
                      
                      {/* Apellido */}
                      <div className="space-y-3">
                        <Label htmlFor="lastname" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Star className="w-4 h-4 mr-1 text-purple-500" />
                          Apellido
                        </Label>
                        <Input
                          id="lastname"
                          name="lastname"
                          value={userData.lastname}
                          onChange={handleInputChange}
                          className="h-12 border-2 border-gray-200 focus:border-purple-400 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                          placeholder="Tu apellido"
                        />
                      </div>
                      
                      {/* Email */}
                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Mail className="w-4 h-4 mr-1 text-indigo-500" />
                          Email
                        </Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-4 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={userData.email}
                            onChange={handleInputChange}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-indigo-400 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                            placeholder="tu@email.com"
                            disabled={!!user.email}
                          />
                          {!!user.email && (
                            <div className="absolute right-4 top-4">
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Teléfono */}
                      <div className="space-y-3">
                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Phone className="w-4 h-4 mr-1 text-green-500" />
                          Teléfono
                        </Label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-4 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
                          <div className="flex">
                            <Input
                              id="countryCode"
                              name="countryCode"
                              value={userData.countryCode}
                              onChange={handleInputChange}
                              className="pl-12 w-20 h-12 border-2 border-gray-200 focus:border-green-400 rounded-l-xl bg-white/70 backdrop-blur-sm transition-all duration-300"
                            />
                            <Input
                              id="phone"
                              name="phone"
                              value={userData.phone}
                              onChange={handleInputChange}
                              className="h-12 border-2 border-gray-200 border-l-0 focus:border-green-400 rounded-r-xl bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                              placeholder="Tu número de teléfono"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Dirección */}
                      <div className="space-y-3">
                        <Label htmlFor="address" className="text-sm font-semibold text-gray-700 flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-red-500" />
                          Dirección
                        </Label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-4 h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                          <Input
                            id="address"
                            name="address"
                            value={userData.address}
                            onChange={handleInputChange}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-red-400 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                            placeholder="Tu dirección"
                          />
                        </div>
                      </div>
                      
                      {/* Ciudad */}
                      <div className="space-y-3">
                        <Label htmlFor="city" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Building className="w-4 h-4 mr-1 text-blue-500" />
                          Ciudad
                        </Label>
                        <div className="relative group">
                          <Building className="absolute left-4 top-4 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                          <Input
                            id="city"
                            name="city"
                            value={userData.city}
                            onChange={handleInputChange}
                            className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                            placeholder="Tu ciudad"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Notificaciones */}
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-200/50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="notifications"
                          name="notifications"
                          checked={userData.notifications}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-pink-600 border-2 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                        />
                        <Bell className="h-5 w-5 text-pink-600" />
                        <Label htmlFor="notifications" className="font-medium text-gray-700 cursor-pointer">
                          Recibir notificaciones sobre promociones y turnos
                        </Label>
                      </div>
                    </div>
                    
                    {/* Botón Guardar */}
                    <div className="pt-6 flex justify-center">
                      <Button 
                        onClick={handleSaveProfile} 
                        disabled={isSaving}
                        className="px-8 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 min-w-[200px]"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Guardar Cambios
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Pestaña de Seguridad */}
            <TabsContent value="security">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-indigo-100/50 shadow-xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 pb-6">
                    <CardTitle className="flex items-center text-xl">
                      <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl mr-3">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      Seguridad de la Cuenta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    {/* Contraseña Actual */}
                    <div className="space-y-3">
                      <Label htmlFor="current-password" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Lock className="w-4 h-4 mr-1 text-gray-600" />
                        Contraseña Actual
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-4 h-4 w-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        <Input
                          id="current-password"
                          type={showPasswords.current ? "text" : "password"}
                          className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-gray-400 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                          placeholder="Ingresa tu contraseña actual"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Nueva Contraseña */}
                    <div className="space-y-3">
                      <Label htmlFor="new-password" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Lock className="w-4 h-4 mr-1 text-green-600" />
                        Nueva Contraseña
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-4 h-4 w-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                        <Input
                          id="new-password"
                          type={showPasswords.new ? "text" : "password"}
                          className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-green-400 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                          placeholder="Ingresa tu nueva contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-4 top-4 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Confirmar Contraseña */}
                    <div className="space-y-3">
                      <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Lock className="w-4 h-4 mr-1 text-blue-600" />
                        Confirmar Contraseña
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-4 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                          id="confirm-password"
                          type={showPasswords.confirm ? "text" : "password"}
                          className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/70 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                          placeholder="Confirma tu nueva contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-4 top-4 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Información de Seguridad */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200/50">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-blue-600" />
                        Consejos de Seguridad
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                          Usa al menos 8 caracteres con mayúsculas, minúsculas y números
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                          Evita usar información personal como fechas de nacimiento
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                          No compartas tu contraseña con nadie
                        </li>
                      </ul>
                    </div>
                    
                    {/* Botón Actualizar */}
                    <div className="pt-6 flex justify-center">
                      <Button className="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 min-w-[200px]">
                        <Shield className="w-5 h-5 mr-2" />
                        Actualizar Contraseña
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;