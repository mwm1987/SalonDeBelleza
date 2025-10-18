// src/components/admin/Announcements.tsx
import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'event';
  startDate: string;
  endDate: string;
  active: boolean;
  imageUrl: string;
}

const Announcements = () => {
  const { toast } = useToast();
  
  // Estados para gestión de anuncios
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement>({
    id: '',
    title: '',
    content: '',
    type: 'info',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    active: true,
    imageUrl: ''
  });
  const [announcementImage, setAnnouncementImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar anuncios desde Firestore
  useEffect(() => {
    setIsLoading(true);
    
    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const announcementsData = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Announcement[];
      
      setAnnouncements(announcementsData);
      setIsLoading(false);
    });

    return () => {
      unsubAnnouncements();
    };
  }, []);

  // Función para subir imágenes
  const uploadImage = async (file: File, path: string): Promise<string> => {
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Función para guardar anuncio (crear o actualizar)
  const saveAnnouncement = async () => {
    try {
      if (!currentAnnouncement.title || !currentAnnouncement.content || !currentAnnouncement.startDate || !currentAnnouncement.endDate) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        });
        return;
      }
      
      let imageUrl = currentAnnouncement.imageUrl;
      
      // Subir imagen si existe
      if (announcementImage) {
        imageUrl = await uploadImage(announcementImage, 'announcements');
      }
      
      // Preparar datos del anuncio
      const announcementData = {
        title: currentAnnouncement.title,
        content: currentAnnouncement.content,
        type: currentAnnouncement.type,
        startDate: currentAnnouncement.startDate,
        endDate: currentAnnouncement.endDate,
        active: currentAnnouncement.active,
        imageUrl: imageUrl
      };
      
      if (currentAnnouncement.id) {
        // Actualizar anuncio existente
        const announcementRef = doc(db, 'announcements', currentAnnouncement.id);
        await updateDoc(announcementRef, announcementData);
        
        // Actualizar estado local
        setAnnouncements(announcements.map(a => 
          a.id === currentAnnouncement.id ? { ...currentAnnouncement, imageUrl } : a
        ));
        
        toast({
          title: "Anuncio actualizado",
          description: "El anuncio ha sido actualizado exitosamente",
        });
      } else {
        // Agregar nuevo anuncio
        const announcementRef = collection(db, 'announcements');
        const docRef = await addDoc(announcementRef, announcementData);
        
        // Actualizar estado local
        const announcementWithId = { ...currentAnnouncement, id: docRef.id, imageUrl };
        setAnnouncements([...announcements, announcementWithId]);
        
        toast({
          title: "Anuncio agregado",
          description: "El anuncio ha sido agregado exitosamente",
        });
      }
      
      // Cerrar formulario y limpiar datos
      setShowAnnouncementForm(false);
      setCurrentAnnouncement({
        id: '',
        title: '',
        content: '',
        type: 'info',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        active: true,
        imageUrl: ''
      });
      setAnnouncementImage(null);
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({
        title: "Error",
        description: "Error al guardar el anuncio",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar un anuncio
  const deleteAnnouncement = async (announcementId: string) => {
    try {
      if (confirm('¿Estás seguro de que deseas eliminar este anuncio?')) {
        const announcementRef = doc(db, 'announcements', announcementId);
        await deleteDoc(announcementRef);
        
        toast({
          title: "Anuncio eliminado",
          description: "El anuncio ha sido eliminado exitosamente",
        });
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el anuncio",
        variant: "destructive",
      });
    }
  };

  // Función para editar un anuncio
  const editAnnouncement = (announcement: Announcement) => {
    setCurrentAnnouncement(announcement);
    setAnnouncementImage(null);
    setShowAnnouncementForm(true);
  };

  // Función para iniciar la creación de un nuevo anuncio
  const startNewAnnouncement = () => {
    setCurrentAnnouncement({
      id: '',
      title: '',
      content: '',
      type: 'info',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      active: true,
      imageUrl: ''
    });
    setAnnouncementImage(null);
    setShowAnnouncementForm(true);
  };

  // Función para obtener el nombre del tipo de anuncio
  const getTypeName = (type: string) => {
    switch (type) {
      case 'info': return 'Información';
      case 'warning': return 'Advertencia';
      case 'success': return 'Éxito';
      case 'event': return 'Evento';
      default: return type;
    }
  };

  // Función para obtener el color del badge según el tipo
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-amber-100 text-amber-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={startNewAnnouncement}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Anuncio
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead>Imagen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell>
                      <Badge className={getTypeBadge(announcement.type)}>
                        {getTypeName(announcement.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{announcement.startDate}</TableCell>
                    <TableCell>{announcement.endDate}</TableCell>
                    <TableCell>
                      {announcement.imageUrl && (
                        <div className="w-16 h-16 rounded-md overflow-hidden">
                          <img 
                            src={announcement.imageUrl} 
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {announcement.active ? (
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editAnnouncement(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No hay anuncios disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Formulario de anuncio */}
      {showAnnouncementForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{currentAnnouncement.id ? 'Editar Anuncio' : 'Agregar Anuncio'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-title">Título *</Label>
                <Input
                  id="announcement-title"
                  value={currentAnnouncement.title}
                  onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, title: e.target.value })}
                  placeholder="Título del anuncio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-type">Tipo *</Label>
                <Select
                  value={currentAnnouncement.type}
                  onValueChange={(value: 'info' | 'warning' | 'success' | 'event') => 
                    setCurrentAnnouncement({ ...currentAnnouncement, type: value })
                  }
                >
                  <SelectTrigger id="announcement-type">
                    <SelectValue placeholder="Tipo de anuncio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Información</SelectItem>
                    <SelectItem value="warning">Advertencia</SelectItem>
                    <SelectItem value="success">Éxito</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="announcement-content">Contenido *</Label>
              <Textarea
                id="announcement-content"
                value={currentAnnouncement.content}
                onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, content: e.target.value })}
                rows={4}
                placeholder="Contenido del anuncio"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-start-date">Fecha de Inicio *</Label>
                <Input
                  id="announcement-start-date"
                  type="date"
                  value={currentAnnouncement.startDate}
                  onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-end-date">Fecha de Fin *</Label>
                <Input
                  id="announcement-end-date"
                  type="date"
                  value={currentAnnouncement.endDate}
                  onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="announcement-image">Imagen de Anuncio</Label>
              <Input
                id="announcement-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAnnouncementImage(e.target.files[0]);
                  }
                }}
              />
              {announcementImage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Imagen seleccionada: {announcementImage.name}
                  </p>
                </div>
              )}
              {currentAnnouncement.imageUrl && !announcementImage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Imagen actual: <a href={currentAnnouncement.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Ver imagen</a>
                  </p>
                  <img 
                    src={currentAnnouncement.imageUrl} 
                    alt="Imagen actual" 
                    className="w-32 h-32 object-cover rounded mt-2"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="announcement-active"
                checked={currentAnnouncement.active}
                onCheckedChange={(checked) => 
                  setCurrentAnnouncement({ ...currentAnnouncement, active: checked === true })
                }
              />
              <Label htmlFor="announcement-active">Anuncio activo</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAnnouncementForm(false);
                  if (!currentAnnouncement.id) {
                    setCurrentAnnouncement({
                      id: '',
                      title: '',
                      content: '',
                      type: 'info',
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      active: true,
                      imageUrl: ''
                    });
                  }
                  setAnnouncementImage(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={saveAnnouncement}>
                {currentAnnouncement.id ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Announcements;