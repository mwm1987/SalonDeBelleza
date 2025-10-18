import React, { useState, useEffect } from "react";
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sun, Moon, Bell, Trash2, Save, Palette, Copy, AlertTriangle } from 'lucide-react';
import { deleteToken } from 'firebase/messaging'; // ← NUEVO

import { useToast } from '@/hooks/use-toast';
import { getToken, messaging, db } from '@/lib/firebase';


import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc, // ← NUEVO
  serverTimestamp, // ← NUEVO
  deleteField 
} from 'firebase/firestore';

const Settings: React.FC = () => {
  const { user, deleteAccount } = useAuth();
  const { toast } = useToast();
  
  // Estados para las configuraciones
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  // Cargar configuraciones guardadas al iniciar
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedNotifications = localStorage.getItem('notifications') !== 'false';
    
    setDarkMode(savedDarkMode);
    setNotifications(savedNotifications);
    
    // Aplicar el tema al cargar
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Obtener el token FCM actual
    const getCurrentToken = async () => {
      try {
        const token = await getToken(messaging, { 
          vapidKey: 'BKgJdBsl0JMc8hlAF_tkBec20WjhWMk6oWogaFBeisQwz7sw_eXawcysrKmnr7v04gWcTK2nRW9mVFd4y5oMxAw'
        });
        setCurrentToken(token);
      } catch (error) {
        console.error('Error obteniendo token:', error);
      }
    };
    
    getCurrentToken();
  }, []);

  // Función para alternar el modo oscuro
  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  // Función para manejar el cambio de estado de las notificaciones
// Reemplazar la función handleNotificationsChange en Settings.tsx

// VERSIÓN MEJORADA de handleNotificationsChange en Settings.tsx
// Esta versión detecta si ya hay permisos o si necesita solicitarlos

// Settings.tsx - VERSIÓN FINAL CORREGIDA
// Imports necesarios (agregar al principio del archivo):


// Función handleNotificationsChange COMPLETA:
const handleNotificationsChange = async (checked: boolean) => {
  setNotifications(checked);
  
  if (checked) {
    try {
      console.log('🔔 Activando notificaciones...');
      console.log('Estado de permisos:', Notification.permission);
      
      let permission = Notification.permission;
      
      // Solicitar permisos si no están concedidos
      if (permission === 'default') {
        console.log('📋 Solicitando permisos...');
        permission = await Notification.requestPermission();
        console.log('✅ Permisos obtenidos:', permission);
      }
      
      // Si están denegados, mostrar error
      if (permission === 'denied') {
        console.error('❌ Permisos bloqueados');
        toast({
          title: "Permisos bloqueados",
          description: "Ve a la configuración de tu navegador → Permisos del sitio → Notificaciones → Permitir",
          variant: "destructive",
        });
        setNotifications(false);
        return;
      }
      
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Verificar Service Worker
        if (!('serviceWorker' in navigator)) {
          console.error('❌ Service Worker no soportado');
          toast({
            title: "Navegador no compatible",
            description: "Tu navegador no soporta notificaciones push.",
            variant: "destructive",
          });
          setNotifications(false);
          return;
        }
        
        // Esperar que el Service Worker esté listo
        console.log('⏳ Esperando Service Worker...');
        const registration = await navigator.serviceWorker.ready;
        console.log('✅ Service Worker listo');
        
        // Obtener token FCM
        try {
          console.log('🔑 Obteniendo token FCM...');
          const token = await getToken(messaging, { 
            vapidKey: 'BKgJdBsl0JMc8hlAF_tkBec20WjhWMk6oWogaFBeisQwz7sw_eXawcysrKmnr7v04gWcTK2nRW9mVFd4y5oMxAw',
            serviceWorkerRegistration: registration
          });
          
          if (!token) {
            console.error('❌ No se obtuvo token');
            toast({
              title: "Error",
              description: "No se pudo obtener el token. Recarga la página e intenta nuevamente.",
              variant: "destructive",
            });
            setNotifications(false);
            return;
          }
          
          console.log('✅ Token obtenido:', token.substring(0, 30) + '...');
          setCurrentToken(token);
          
          // Verificar usuario autenticado
          if (!user || !user.id) {
            console.error('❌ Usuario no autenticado');
            toast({
              title: "Error de sesión",
              description: "Debes iniciar sesión para activar notificaciones.",
              variant: "destructive",
            });
            setNotifications(false);
            return;
          }
          
          console.log('💾 Guardando en Firestore para usuario:', user.id);
          const userDocRef = doc(db, 'users', user.id);
          
          // Actualizar documento de usuario
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // IMPORTANTE: Eliminar campo obsoleto fcmToken y actualizar notificationsEnabled
            await updateDoc(userDocRef, {
              fcmToken: deleteField(),  // ← Elimina el campo obsoleto del documento raíz
              notificationsEnabled: true,
              updatedAt: new Date()
            });
            console.log('✅ Documento actualizado (campo fcmToken eliminado)');
          } else {
            await setDoc(userDocRef, {
              notificationsEnabled: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log('✅ Documento creado');
          }
          
          // Guardar token en la SUBCOLECCIÓN fcmTokens
          const fcmTokensRef = collection(userDocRef, 'fcmTokens');
          
          console.log('🔍 Verificando tokens existentes...');
          const tokensSnapshot = await getDocs(fcmTokensRef);
          console.log(`📊 Tokens encontrados: ${tokensSnapshot.size}`);
          
          // Verificar si este token específico ya existe
          const tokenExists = tokensSnapshot.docs.some(doc => {
            const existingToken = doc.data().token;
            console.log(`Comparando: ${existingToken.substring(0, 20)}... === ${token.substring(0, 20)}...`);
            return existingToken === token;
          });
          
          if (!tokenExists) {
            console.log('➕ Token nuevo, agregando a subcolección...');
            await addDoc(fcmTokensRef, {
              token: token,
              device: navigator.userAgent,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            console.log('✅ Token guardado en fcmTokens/');
            
            // Verificar cuántos tokens hay ahora
            const updatedTokensSnapshot = await getDocs(fcmTokensRef);
            console.log(`📊 Total de tokens ahora: ${updatedTokensSnapshot.size}`);
            
            toast({
              title: "✅ Notificaciones activadas",
              description: `Este dispositivo (${updatedTokensSnapshot.size}º) recibirá notificaciones.`,
            });
          } else {
            console.log('ℹ️ Token ya registrado');
            toast({
              title: "✅ Notificaciones activadas",
              description: "Este dispositivo ya está registrado.",
            });
          }
          
        } catch (tokenError: any) {
          console.error('❌ Error con token:', tokenError);
          
          let errorMsg = "Error al configurar notificaciones.";
          if (tokenError.code === 'messaging/permission-blocked') {
            errorMsg = "Permisos bloqueados. Ve a configuración del navegador.";
          } else if (tokenError.code === 'messaging/failed-service-worker-registration') {
            errorMsg = "Error con Service Worker. Recarga la página.";
          }
          
          toast({
            title: "Error",
            description: errorMsg + " (" + tokenError.code + ")",
            variant: "destructive",
          });
          setNotifications(false);
        }
      } else {
        console.log('❌ Permisos no concedidos');
        toast({
          title: "Permisos denegados",
          description: "Necesitas permitir las notificaciones.",
          variant: "destructive",
        });
        setNotifications(false);
      }
    } catch (error: any) {
      console.error('❌ Error general:', error);
      toast({
        title: "Error",
        description: "Error: " + error.message,
        variant: "destructive",
      });
      setNotifications(false);
    }
  } else {
    // Desactivar notificaciones
    console.log('🔕 Desactivando notificaciones');
    if (user && user.id) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await updateDoc(userDocRef, {
          notificationsEnabled: false,
          updatedAt: new Date()
        });
        
        console.log('✅ Notificaciones desactivadas');
        toast({
          title: "Notificaciones desactivadas",
          description: "Ya no recibirás notificaciones push.",
        });
      } catch (error) {
        console.error('❌ Error desactivando:', error);
        toast({
          title: "Error",
          description: "No se pudieron actualizar las preferencias.",
          variant: "destructive",
        });
      }
    }
  }
};


  // Función para guardar todas las configuraciones
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('notifications', notifications.toString());
      
      toast({
        title: "Configuraciones guardadas",
        description: "Tus preferencias se han guardado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Función para eliminar la cuenta
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada exitosamente.",
      });
      // Redirigir a la página de autenticación después de eliminar la cuenta
      window.location.href = '/auth';
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const copyTokenToClipboard = () => {
    if (currentToken) {
      navigator.clipboard.writeText(currentToken);
      toast({
        title: "Token copiado",
        description: "El token FCM se ha copiado al portapapeles",
      });
    }
  };
const forceTokenRenewal = async () => {
  try {
    console.log('🔄 Forzando renovación de token en celular...');
    
    // 1. Eliminar token actual del storage del navegador
    await deleteToken(messaging); // ← CORREGIDO
    console.log('✅ Token eliminado del navegador');
    
    // 2. Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Obtener nuevo token
    const newToken = await getToken(messaging, {
      vapidKey: 'BKgJdBsl0JMc8hlAF_tkBec20WjhWMk6oWogaFBeisQwz7sw_eXawcysrKmnr7v04gWcTK2nRW9mVFd4y5oMxAw'
    });
    
    console.log('✅ Nuevo token generado:', newToken);
    
    // 4. Guardar en Firestore (reemplazando el antiguo)
    if (user && user.id) {
      const userDocRef = doc(db, 'users', user.id);
      const fcmTokensRef = collection(userDocRef, 'fcmTokens');
      
      // Eliminar token antiguo del celular
      const tokensSnapshot = await getDocs(fcmTokensRef);
      const oldMobileToken = tokensSnapshot.docs.find(doc => 
        doc.data().token === 'e533gOzk2r6yBepzQJYOS1:APA91bFjrK1ugSZZeuYGAToyvy4JlieCM35E1cC4yfJjxGY4qsaOVi7_T8Vvlh7eDaSXeZkM8kv2zT2c2TiEXUbmmjC2nzYDUckyWVBllt0zVP4BO4b7tKk'
      );
      
      if (oldMobileToken) {
        await deleteDoc(oldMobileToken.ref); // ← CORREGIDO
        console.log('🗑️ Token móvil antiguo eliminado de Firestore');
      }
      
      // Guardar nuevo token
      await addDoc(fcmTokensRef, {
        token: newToken,
        device: navigator.userAgent,
        createdAt: serverTimestamp(), // ← CORREGIDO
        updatedAt: serverTimestamp() // ← CORREGIDO
      });
      
      console.log('✅ Nuevo token guardado en Firestore');
      setCurrentToken(newToken);
      
      // Mostrar nuevo token
      toast({
        title: "✅ Token renovado",
        description: `Nuevo token generado para este dispositivo`,
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error renovando token:', error);
    toast({
      title: "Error renovando token",
      description: error.message,
      variant: "destructive",
    });
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 p-6 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 dark:bg-gray-800">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 dark:text-white">
          <Palette className="inline mr-2" /> Configuración
        </h1>

        <div className="space-y-6">
          {/* Sección de Apariencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {darkMode ? <Moon className="mr-2" /> : <Sun className="mr-2" />}
                Apariencia
              </CardTitle>
              <CardDescription>
                Personaliza el aspecto de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-base">
                    Modo oscuro
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Activa el modo oscuro para una experiencia visual más cómoda en entornos con poca luz.
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sección de Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Controla cómo recibes las notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications" className="text-base">
                    Notificaciones push
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recibe notificaciones sobre promociones, recordatorios de citas y novedades.
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={handleNotificationsChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sección de Depuración de Notificaciones */}
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-yellow-600 dark:text-yellow-500 flex items-center">
                <AlertTriangle className="mr-2" />
                Depuración de Notificaciones
              </CardTitle>
              <CardDescription className="text-yellow-500 dark:text-yellow-400">
                Información técnica para resolver problemas de notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Token FCM Actual</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={currentToken || "No disponible"} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyTokenToClipboard}
                    disabled={!currentToken}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Este token debe coincidir con el almacenado en Firestore
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Permisos de Notificación</Label>
                <Input 
                  value={notificationPermission} 
                  readOnly 
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estado actual de los permisos de notificación en este navegador
                </p>
              </div>
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-900/20 dark:border-amber-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 dark:text-amber-500" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-400">Importante</h4>
                    <p className="text-sm text-amber-700 mt-1 dark:text-amber-300">
                      Si no recibes notificaciones, verifica que:
                    </p>
                    <ul className="text-sm text-amber-700 mt-1 list-disc list-inside dark:text-amber-300">
                      <li>El token FCM esté guardado en Firestore</li>
                      <li>Los permisos de notificación estén habilitados</li>
                      <li>El service worker de Firebase esté correctamente configurado</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección de Cuenta */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-500 flex items-center">
                <Trash2 className="mr-2" />
                Eliminar cuenta
              </CardTitle>
              <CardDescription className="text-red-500 dark:text-red-400">
                Esta acción no se puede deshacer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Al eliminar tu cuenta, se borrarán permanentemente todos tus datos,
                  historial de citas y información personal. Esta acción es irreversible.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Eliminar mi cuenta</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente
                        tu cuenta y eliminará tus datos de nuestros servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Sí, eliminar cuenta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Botón para guardar configuraciones */}
          <div className="flex justify-end pt-4">
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
              {!isSaving && <Save className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;