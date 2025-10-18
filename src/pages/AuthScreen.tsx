import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { db, messaging, getToken } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc,getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

import { 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  Sparkles, 
  ArrowLeft,
  Heart,
  Crown,
  Shield,
  Star,
  Lock,
  User,
  Globe,
  MessageCircle,
  CheckCircle,
  Zap,
  Trash2,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Definir tipo para el evento del Service Worker
interface ServiceWorkerStateChangeEvent extends Event {
  target: (EventTarget & { state?: string }) | null;
}

export default function AuthScreen() {
  const navigate = useNavigate();
  console.log('AuthScreen rendered');
  const [authType, setAuthType] = useState<'email' | 'phone'>('email');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showOTP, setShowOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+54');
  const [otpValue, setOtpValue] = useState('');
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const { user, signIn, signUp, sendOTP, verifyOTP, resetPassword, signInWithGoogle, deleteAccount } = useAuth();
  const { toast } = useToast();

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Verificar si el Service Worker está listo
  useEffect(() => {
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            console.log('Service Worker está activo y listo');
            setIsServiceWorkerReady(true);
            return;
          }
        } catch (error) {
          console.error('Error checking service worker:', error);
        }
        
        // Intentar registrar el Service Worker si no está registrado
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registrado:', registration);
          
          // Esperar a que el Service Worker esté activo
          if (registration.active) {
            setIsServiceWorkerReady(true);
          } else if (registration.installing) {
            // Usar type assertion para el evento
            registration.installing.addEventListener('statechange', (event) => {
              const swEvent = event as unknown as ServiceWorkerStateChangeEvent;
              if (swEvent.target && swEvent.target.state === 'activated') {
                console.log('Service Worker activado después del registro');
                setIsServiceWorkerReady(true);
              }
            });
          }
        } catch (regError) {
          console.error('Error registrando Service Worker:', regError);
        }
      }
    };

    checkServiceWorker();
  }, []);

  // Función para obtener el token FCM con reintentos
  const getFcmTokenWithRetry = async (maxRetries = 3, delay = 1000) => {
    // First ensure notification permission is granted
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Attempting to get FCM token (attempt ${i + 1})`);
        const token = await getToken(messaging, { 
          vapidKey: 'BKgJdBsl0JMc8hlAF_tkBec20WjhWMk6oWogaFBeisQwz7sw_eXawcysrKmnr7v04gWcTK2nRW9mVFd4y5oMxAw'
        });
        
        if (token) {
          console.log('FCM token obtained successfully');
          return token;
        }
        
        console.log('Could not get FCM token, retrying...');
      } catch (error) {
        console.error(`Error in attempt ${i + 1}:`, error);
        
        if (i === maxRetries - 1) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    return null;
  };

  // Función para guardar el token FCM en Firestore
// AuthScreen.tsx - FUNCIÓN saveFcmTokenToFirestore CORREGIDA

// Función para guardar el token FCM en Firestore
const saveFcmTokenToFirestore = async (userData: any) => {
  try {
    if (!userData?.id) {
      console.log('No hay usuario, no se puede guardar el token');
      return false;
    }

    console.log('Guardando token para usuario:', userData.id);
    
    // Esperar a que el Service Worker esté listo
    if (!isServiceWorkerReady) {
      console.log('Esperando a que el Service Worker esté listo...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Obtener el token FCM con reintentos
    const fcmToken = await getFcmTokenWithRetry();
    
    if (!fcmToken) {
      console.log('No se pudo obtener el token FCM después de varios intentos');
      return false;
    }

    console.log('Token FCM obtenido:', fcmToken.substring(0, 30) + '...');

    const userDocRef = doc(db, 'users', userData.id);
    
    // Primero, asegurarse de que el documento de usuario existe
    try {
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        console.log('Creando documento de usuario...');
        await setDoc(userDocRef, {
          email: userData.email || '',
          name: userData.name || '',
          lastname: userData.lastname || '',
          phone: userData.phone || '',
          countryCode: userData.countryCode || '+54',
          notificationsEnabled: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Actualizar campos faltantes si es necesario
        const userDataFromDoc = userDoc.data();
        const updateData: any = {};
        
        if (!userDataFromDoc.name && userData.name) {
          updateData.name = userData.name;
        }
        if (!userDataFromDoc.lastname && userData.lastname) {
          updateData.lastname = userData.lastname;
        }
        if (!userDataFromDoc.phone && userData.phone) {
          updateData.phone = userData.phone;
        }
        if (!userDataFromDoc.countryCode && userData.countryCode) {
          updateData.countryCode = userData.countryCode;
        }
        
        // ✅ IMPORTANTE: Asegurar que notificationsEnabled está en true
        updateData.notificationsEnabled = true;
        updateData.updatedAt = serverTimestamp();
        
        // ❌ NO GUARDAR fcmToken en el documento raíz
        // ELIMINADO: updateData.fcmToken = fcmToken;
        
        if (Object.keys(updateData).length > 0) {
          await updateDoc(userDocRef, updateData);
          console.log('✅ Documento de usuario actualizado (sin fcmToken en raíz)');
        }
      }
    } catch (error) {
      console.error('Error verificando documento de usuario:', error);
    }

    // ✅ CORRECCIÓN: Crear o actualizar el token en la SUBCOLECCIÓN fcmTokens
    const fcmTokensRef = collection(userDocRef, 'fcmTokens');
    
    // Verificar si el token ya existe
    try {
      const existingTokensSnap = await getDocs(fcmTokensRef);
      console.log(`📊 Tokens existentes: ${existingTokensSnap.size}`);
      
      const tokenExists = existingTokensSnap.docs.some(doc => {
        const existingToken = doc.data().token;
        return existingToken === fcmToken;
      });

      if (!tokenExists) {
        // Añadir token con información del dispositivo
        await addDoc(fcmTokensRef, {
          token: fcmToken,
          device: navigator.userAgent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ FCM token almacenado en subcolección fcmTokens/');
        
        // Contar tokens después de agregar
        const updatedTokensSnap = await getDocs(fcmTokensRef);
        console.log(`📊 Total de tokens ahora: ${updatedTokensSnap.size}`);
        
        toast({
          title: "✅ Notificaciones activadas",
          description: `Recibirás notificaciones sobre tus citas y promociones (Dispositivo ${updatedTokensSnap.size})`,
        });
        return true;
      } else {
        console.log('ℹ️ El token FCM ya existe en Firestore');
        toast({
          title: "✅ Notificaciones activadas",
          description: "Este dispositivo ya está registrado para recibir notificaciones",
        });
        return true;
      }
    } catch (error) {
      console.error('Error verificando tokens existentes:', error);
      
      // Intentar método alternativo: guardar directamente
      try {
        await setDoc(doc(fcmTokensRef, 'current'), {
          token: fcmToken,
          device: navigator.userAgent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('✅ FCM token guardado con método alternativo');
        return true;
      } catch (altError) {
        console.error('Error con método alternativo:', altError);
        throw altError;
      }
    }
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    return false;
  }
};
  // Función para manejar acciones posteriores al login
  const handlePostLogin = async (firebaseUser: any) => {
    try {
      // Guardar el token FCM usando el usuario temporal (no bloquear el flujo)
      const notificationPermission = await requestNotificationPermission();
      
      if (notificationPermission) {
        // Mostrar diálogo para activar notificaciones
        setCurrentUser(firebaseUser);
        setShowNotificationPrompt(true);
      } else {
        // Navegar al menú si no se otorgan permisos
        navigate('/menu');
      }
    } catch (error) {
      console.error('Error en post-login:', error);
      // Navegar de todos modos aunque falle el guardado del token
      navigate('/menu');
    }
  };

  // Función para activar notificaciones
  const handleEnableNotifications = async () => {
    if (!currentUser) return;
    
    try {
      // Crear un objeto usuario temporal para guardar el token
      const tempUser = {
        ...currentUser,
        id: currentUser.uid
      };
      
      // Guardar el token FCM
      await saveFcmTokenToFirestore(tempUser);
      setShowNotificationPrompt(false);
      navigate('/menu');
    } catch (error) {
      console.error('Error activando notificaciones:', error);
      setShowNotificationPrompt(false);
      navigate('/menu');
    }
  };

  // Función para omitir notificaciones
  const handleSkipNotifications = () => {
    setShowNotificationPrompt(false);
    navigate('/menu');
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast({
        title: "⚠️ Campos requeridos",
        description: "Por favor completa todos los campos para continuar",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "🔒 Contraseña muy corta",
        description: "Tu contraseña debe tener al menos 6 caracteres por seguridad",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      if (authMode === 'login') {
        userCredential = await signIn(email, password);
      } else {
        userCredential = await signUp(email, password);
      }
      
      toast({
        title: authMode === 'login' ? "✨ ¡Bienvenida de vuelta!" : "🎉 ¡Cuenta creada exitosamente!",
        description: authMode === 'login' ? "Has iniciado sesión correctamente" : "Tu cuenta ha sido creada. ¡Disfruta nuestros servicios!",
      });
      
      // Usar el userCredential directamente para el post-login
      await handlePostLogin(userCredential.user);
    } catch (error) {
      toast({
        title: "❌ Error de autenticación",
        description: "Credenciales incorrectas. Por favor verifica tus datos.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handlePhoneAuth = async () => {
    if (!phoneNumber) {
      toast({
        title: "📱 Número requerido",
        description: "Por favor ingresa tu número de teléfono",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await sendOTP(`${countryCode}${phoneNumber}`);
      setShowOTP(true);
      toast({
        title: "📨 Código enviado",
        description: `Te enviamos un código de verificación a ${countryCode}${phoneNumber}`,
      });
    } catch (error) {
      toast({
        title: "❌ Error de envío",
        description: "No pudimos enviar el código. Verifica tu número e intenta nuevamente.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

const handleOTPVerification = async () => {
  if (otpValue.length !== 6) {
    toast({
      title: "🔢 Código incompleto",
      description: "Por favor ingresa el código de 6 dígitos completo",
      variant: "destructive",
    });
    return;
  }

  setLoading(true);
  try {
    await verifyOTP(otpValue);
    toast({
      title: "✅ Verificación exitosa",
      description: "Tu número ha sido verificado correctamente",
    });
    
    // Usar el usuario del contexto después de la verificación
    if (user) {
      await handlePostLogin(user);
    } else {
      throw new Error("No se pudo obtener el usuario después de la verificación");
    }
  } catch (error) {
    toast({
      title: "❌ Código incorrecto",
      description: "El código ingresado no es válido. Intenta nuevamente.",
      variant: "destructive",
    });
  }
  setLoading(false);
};

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "📧 Email requerido",
        description: "Por favor ingresa tu email para recuperar tu contraseña",
        variant: "destructive",
      });
      return;
    }

    try {
      await resetPassword(email);
      toast({
        title: "📬 Email de recuperación enviado",
        description: `Revisa tu bandeja de entrada en ${email}`,
      });
    } catch (error) {
      toast({
        title: "❌ Error de envío",
        description: "No pudimos enviar el email. Verifica tu dirección.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithGoogle();
      toast({
        title: "🎉 ¡Sesión iniciada con Google!",
        description: "Has accedido exitosamente con tu cuenta de Google",
      });
      await handlePostLogin(userCredential.user);
    } catch (error: any) {
      // Manejar errores específicos de autenticación con Google
      if (error.message === 'El proceso de autenticación fue cancelado') {
        // No mostrar error si el usuario canceló deliberadamente
        console.log('Autenticación cancelada por el usuario');
      } else if (error.message.includes('ventanas emergentes')) {
        toast({
          title: "🔒 Ventana bloqueada",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Error con Google",
          description: "No pudimos conectar con Google. Intenta nuevamente.",
          variant: "destructive",
        });
      }
    }
    setLoading(false);
  };

  // Función para eliminar la cuenta
  const handleDeleteAccount = async () => {
    setDeleteAccountLoading(true);
    try {
      await deleteAccount();
      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada exitosamente.",
      });
      setShowDeleteAccountDialog(false);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "❌ Error al eliminar cuenta",
        description: error.message || "No se pudo eliminar la cuenta. Intenta nuevamente.",
        variant: "destructive",
      });
    }
    setDeleteAccountLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 via-teal-50 to-green-100 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full -translate-x-48 -translate-y-48 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-teal-300/20 to-green-300/20 rounded-full translate-x-48 translate-y-48 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-emerald-200/10 to-green-200/10 rounded-full -translate-x-32 -translate-y-32 blur-2xl"></div>

      {/* Floating elements */}
      <motion.div 
        className="absolute top-20 left-20 w-6 h-6 bg-green-400/30 rounded-full"
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.3, 0.8, 0.3] 
        }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
      <motion.div 
        className="absolute top-40 right-20 w-4 h-4 bg-emerald-400/40 rounded-full"
        animate={{ 
          y: [0, 15, 0],
          opacity: [0.4, 0.9, 0.4] 
        }}
        transition={{ repeat: Infinity, duration: 4, delay: 1 }}
      />
      <motion.div 
        className="absolute bottom-32 left-32 w-8 h-8 bg-teal-400/25 rounded-full"
        animate={{ 
          y: [0, -25, 0],
          opacity: [0.25, 0.7, 0.25] 
        }}
        transition={{ repeat: Infinity, duration: 5, delay: 2 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md overflow-hidden">
          <CardHeader className="text-center space-y-6 bg-gradient-to-br from-green-500 via-emerald-500 via-teal-500 to-green-600 text-white relative">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
            
            <motion.div 
              className="mx-auto w-28 h-28 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-xl relative z-10"
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(255, 255, 255, 0.4)",
                  "0 0 0 10px rgba(255, 255, 255, 0)",
                ]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <img src="/images/logosecretos.png" alt="Secretos de Belleza" className="w-20 h-20 object-contain" />
            </motion.div>
            <div className="relative z-10">
              <CardTitle className="text-3xl font-bold text-white mb-2">
                {showOTP ? '🔐 Verificación' : authMode === 'login' ? '✨ Bienvenida' : '👑 Únete a Nosotros'}
              </CardTitle>
              <CardDescription className="text-white/90 text-lg font-medium">
                {showOTP ? 'Ingresa el código que enviamos a tu teléfono' : 
                 authMode === 'login' ? 'Tu momento de belleza te espera' : 'Comienza tu experiencia de lujo'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-8">
            <AnimatePresence mode="wait">
              {showOTP ? (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOTP(false)}
                    className="mb-4 hover:bg-pink-50 text-pink-600 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>

                  <div className="space-y-6">
                    <div className="text-center">
                      <motion.div 
                        className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <MessageCircle className="w-8 h-8 text-white" />
                      </motion.div>
                      <p className="text-gray-600 font-medium">
                        Código de verificación enviado a<br />
                        <span className="text-pink-600 font-bold">{countryCode}{phoneNumber}</span>
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otpValue}
                        onChange={setOtpValue}
                      >
                        <InputOTPGroup className="gap-3">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot 
                              key={index}
                              index={index} 
                              className="w-12 h-14 text-xl font-bold border-2 border-pink-200 focus:border-pink-500 rounded-xl"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button
                    onClick={handleOTPVerification}
                    disabled={loading || otpValue.length !== 6}
                    className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {loading ? (
                      <motion.div 
                        className="flex items-center space-x-2"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Zap className="w-5 h-5" />
                        <span>Verificando...</span>
                      </motion.div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Verificar Código</span>
                      </div>
                    )}
                  </Button>

                  <div className="text-center">
                    <Button variant="link" size="sm" className="text-pink-600 font-medium">
                      ¿No recibiste el código? Reenviar en 30s
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <Tabs value={authType} onValueChange={(value) => setAuthType(value as 'email' | 'phone')}>
                    <TabsList className="grid w-full grid-cols-2 bg-green-50 p-1 rounded-xl">
                      <TabsTrigger 
                        value="email" 
                        className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white font-semibold py-3 rounded-lg transition-all duration-300"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </TabsTrigger>
                      <TabsTrigger 
                        value="phone" 
                        className="flex items-center gap-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white font-semibold py-3 rounded-lg transition-all duration-300"
                      >
                        <Phone className="w-4 h-4" />
                        Teléfono
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email" className="space-y-6 mt-8">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-semibold flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-green-500" />
                          <span>Correo Electrónico</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tucorreo@ejemplo.com"
                          className="h-12 border-2 border-green-200 focus:border-green-500 rounded-xl font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-700 font-semibold flex items-center space-x-2">
                          <Lock className="w-4 h-4 text-teal-500" />
                          <span>Contraseña</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="h-12 border-2 border-teal-200 focus:border-teal-500 rounded-xl font-medium pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-4 py-2 hover:bg-transparent text-gray-500 hover:text-teal-600"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {authMode === 'login' && (
                        <div className="text-right">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={handleForgotPassword}
                            className="p-0 h-auto text-green-600 font-medium hover:text-green-700"
                          >
                            ¿Olvidaste tu contraseña?
                          </Button>
                        </div>
                      )}

                      <Button
                        onClick={handleEmailAuth}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        {loading ? (
                          <motion.div 
                            className="flex items-center space-x-2"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <Sparkles className="w-5 h-5" />
                            <span>Procesando...</span>
                          </motion.div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <img src="/images/logosecretos.png" alt="Logo" className="w-5 h-5 object-contain" />
                            <span>{authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                          </div>
                        )}
                      </Button>
                    </TabsContent>

                    <TabsContent value="phone" className="space-y-6 mt-8">
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-gray-700 font-semibold flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-emerald-500" />
                          <span>País</span>
                        </Label>
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="h-12 border-2 border-emerald-200 focus:border-emerald-500 rounded-xl font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-2 border-emerald-100">
                            <SelectItem value="+54" className="py-3">🇦🇷 Argentina (+54)</SelectItem>
                            <SelectItem value="+56" className="py-3">🇨🇱 Chile (+56)</SelectItem>
                            <SelectItem value="+55" className="py-3">🇧🇷 Brasil (+55)</SelectItem>
                            <SelectItem value="+57" className="py-3">🇨🇴 Colombia (+57)</SelectItem>
                            <SelectItem value="+52" className="py-3">🇲🇽 México (+52)</SelectItem>
                            <SelectItem value="+1" className="py-3">🇺🇸 EE.UU./Canadá (+1)</SelectItem>
                            <SelectItem value="+34" className="py-3">🇪🇸 España (+34)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 font-semibold flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-green-500" />
                          <span>Número de teléfono</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="11 1234-5678"
                          className="h-12 border-2 border-green-200 focus:border-green-500 rounded-xl font-medium"
                        />
                      </div>

                      <Button
                        onClick={handlePhoneAuth}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 via-teal-500 to-blue-600 hover:from-green-600 hover:via-teal-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        {loading ? (
                          <motion.div 
                            className="flex items-center space-x-2"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span>Enviando...</span>
                          </motion.div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <img src="/images/logosecretos.png" alt="Logo" className="w-5 h-5 object-contain" />
                            <span>Enviar Código</span>
                          </div>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>

                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                      className="text-green-600 font-semibold hover:text-green-700 text-base"
                    >
                      {authMode === 'login' ? (
                        <span>¿Primera vez aquí? <span className="underline">Crear cuenta</span></span>
                      ) : (
                        <span>¿Ya tienes cuenta? <span className="underline">Iniciar sesión</span></span>
                      )}
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="bg-green-200" />
                    </div>
                    <div className="relative flex justify-center text-sm uppercase">
                      <span className="bg-white px-4 text-gray-500 font-semibold">
                        o continúa con
                      </span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300 hover:scale-105" 
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continuar con Google</span>
                  </Button>

                  {/* Eliminar cuenta (solo visible para usuarios logueados) */}
                  {user && (
                    <div className="pt-4 border-t border-gray-200">
                      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar cuenta
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                              ¿Estás absolutamente seguro?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente
                              tu cuenta y todos tus datos de nuestros servidores.
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-700 font-medium">Advertencia:</p>
                                <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                                  <li>Todas tus citas serán eliminadas</li>
                                  <li>Tu historial de tratamientos se perderá</li>
                                  <li>No podrás recuperar esta cuenta</li>
                                </ul>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              disabled={deleteAccountLoading}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                              {deleteAccountLoading ? (
                                <>
                                  <motion.div 
                                    className="flex items-center space-x-2"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                  >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Eliminando...</span>
                                  </motion.div>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Sí, eliminar cuenta
                                </>
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Trust indicators */}
        <motion.div 
          className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="font-medium">Datos seguros</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">5 estrellas</span>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-pink-500" />
            <span className="font-medium">+1000 clientes</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Diálogo para activar notificaciones */}
      <Dialog open={showNotificationPrompt} onOpenChange={setShowNotificationPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-green-600" />
              Activar notificaciones
            </DialogTitle>
            <DialogDescription>
              ¿Deseas recibir notificaciones sobre tus citas y promociones exclusivas?
              Podrás gestionar esta configuración en cualquier momento desde tu perfil.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={handleEnableNotifications}
              className="bg-green-600 hover:bg-green-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              Activar notificaciones
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSkipNotifications}
            >
              Ahora no, gracias
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}