// components/admin/ContactAdmin.tsx
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Phone, Mail, MapPin, Clock, MessageCircle, Instagram, Facebook } from 'lucide-react';

interface ContactData {
  phone: string;
  email: string;
  address: string;
  schedule: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
}

const ContactAdmin = () => {
  const { toast } = useToast();
  const [contactData, setContactData] = useState<ContactData>({
    phone: '',
    email: '',
    address: '',
    schedule: '',
    instagram: '',
    facebook: '',
    whatsapp: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadContactData();
  }, []);

  const loadContactData = async () => {
    try {
      const docRef = doc(db, 'settings', 'contact');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setContactData(docSnap.data() as ContactData);
      }
    } catch (error) {
      console.error('Error loading contact data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de contacto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await setDoc(doc(db, 'settings', 'contact'), contactData);
      
      toast({
        title: "Datos guardados",
        description: "La información de contacto se ha actualizado correctamente",
      });
    } catch (error) {
      console.error('Error saving contact data:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos de contacto",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ContactData, value: string) => {
    setContactData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Información de Contacto</h3>
          <p className="text-sm text-gray-600">Gestiona la información de contacto que se muestra en la página</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={contactData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+54 9 297 461-1699"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={contactData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="salon.sdbellza@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={contactData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Calle Williams 1332, Sarmiento, Chubut"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Horario</Label>
              <Input
                id="schedule"
                value={contactData.schedule}
                onChange={(e) => handleInputChange('schedule', e.target.value)}
                placeholder="Lun-Vie: 9:00-20:00, Sáb: 9:00-14:00"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes Sociales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center">
                <Instagram className="h-4 w-4 mr-2 text-pink-600" />
                Instagram
              </Label>
              <Input
                id="instagram"
                value={contactData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder="@sdbestetica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center">
                <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                Facebook
              </Label>
              <Input
                id="facebook"
                value={contactData.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                placeholder="Secretos de Belleza"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={contactData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder="+54 9 297 461-1699"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactAdmin;