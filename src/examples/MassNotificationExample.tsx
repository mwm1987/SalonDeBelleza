import React, { useState } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Componente de ejemplo para enviar notificaciones masivas
 * Este componente muestra cómo crear una notificación masiva que será procesada
 * por la Cloud Function processMassNotifications
 */
const MassNotificationExample = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };
  
  const sendMassNotification = async () => {
    if (!user) {
      alert('Debes iniciar sesión para enviar notificaciones');
      return;
    }
    
    if (!message) {
      alert('El mensaje es obligatorio');
      return;
    }
    
    try {
      setSending(true);
      
      // Si hay una imagen, subirla a Firebase Storage
      let imageUrl = null;
      if (image) {
        const timestamp = Date.now();
        const imageName = `users/${user.id}/notifications/mass_${timestamp}_${image.name}`;
        const storageRef = ref(storage, imageName);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Crear documento en la colección massNotifications
      const massNotificationRef = collection(db, 'massNotifications');
      await addDoc(massNotificationRef, {
        title: title || 'Notificación importante',
        message,
        imageUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: user.id
      });
      
      alert('Notificación masiva creada. Será procesada por la Cloud Function.');
      
      // Limpiar formulario
      setMessage('');
      setTitle('');
      setImage(null);
      
      // Limpiar input de archivo
      const fileInput = document.getElementById('mass-notification-image') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      console.error('Error al enviar notificación masiva:', error);
      alert(`Error al enviar notificación masiva: ${error.message || 'Error desconocido'}`);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Enviar Notificación Masiva</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-title">Título (opcional)</Label>
            <Input
              id="notification-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la notificación"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notification-message">Mensaje</Label>
            <Textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mass-notification-image">Imagen (opcional)</Label>
            <Input
              id="mass-notification-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          
          <Button 
            onClick={sendMassNotification} 
            disabled={sending || !message}
            className="w-full"
          >
            {sending ? 'Enviando...' : 'Enviar a todos los usuarios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MassNotificationExample;