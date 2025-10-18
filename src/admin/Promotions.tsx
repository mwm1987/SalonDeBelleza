// src/components/admin/Promotions.tsx
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
import { Edit, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: string | number;
  validUntil: string;
  imageUrl: string;
  tag: string;
}

const Promotions = () => {
  const { toast } = useToast();
  
  // Estados para gestión de promociones
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion>({
    id: '',
    title: '',
    description: '',
    discount: '',
    validUntil: '',
    imageUrl: '',
    tag: ''
  });
  const [promotionImage, setPromotionImage] = useState<File | null>(null);
  const [isSavingPromotion, setIsSavingPromotion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar promociones desde Firestore
  useEffect(() => {
    setIsLoading(true);
    
    const unsubPromotions = onSnapshot(collection(db, 'promotions'), (snapshot) => {
      const promotionsData = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Promotion[];
      
      setPromotions(promotionsData);
      setIsLoading(false);
    });

    return () => {
      unsubPromotions();
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

  // Función para guardar promoción (crear o actualizar)
  const savePromotion = async () => {
    try {
      setIsSavingPromotion(true);
      
      if (!currentPromotion.title || !currentPromotion.description || !currentPromotion.discount || !currentPromotion.validUntil) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        });
        return;
      }
      
      let imageUrl = currentPromotion.imageUrl;
      
      // Upload image if exists
      if (promotionImage) {
        toast({
          title: "Subiendo imagen",
          description: "Por favor espera...",
        });
        imageUrl = await uploadImage(promotionImage, 'promotions');
      }
      
      // Prepare promotion data
      const promotionData = {
        title: currentPromotion.title,
        description: currentPromotion.description,
        discount: currentPromotion.discount,
        validUntil: currentPromotion.validUntil,
        imageUrl: imageUrl,
        tag: currentPromotion.tag
      };
      
      if (currentPromotion.id) {
        // Update existing promotion
        const promotionRef = doc(db, 'promotions', currentPromotion.id);
        await updateDoc(promotionRef, promotionData);
        
        // Update local state
        setPromotions(promotions.map(p => 
          p.id === currentPromotion.id ? { ...currentPromotion, imageUrl } : p
        ));
        
        toast({
          title: "Promoción actualizada",
          description: "La promoción ha sido actualizada exitosamente",
        });
      } else {
        // Add new promotion
        const promotionRef = collection(db, 'promotions');
        const docRef = await addDoc(promotionRef, promotionData);
        
        // Update local state
        const promotionWithId = { ...currentPromotion, id: docRef.id, imageUrl };
        setPromotions([...promotions, promotionWithId]);
        
        toast({
          title: "Promoción agregada",
          description: "La promoción ha sido agregada exitosamente",
        });
      }
      
      // Close form and clear data
      setShowPromotionForm(false);
      setCurrentPromotion({
        id: '',
        title: '',
        description: '',
        discount: '',
        validUntil: '',
        imageUrl: '',
        tag: ''
      });
      setPromotionImage(null);
      
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast({
        title: "Error",
        description: "Error al guardar la promoción",
        variant: "destructive",
      });
    } finally {
      setIsSavingPromotion(false);
    }
  };

  // Función para eliminar una promoción
  const deletePromotion = async (promotionId: string) => {
    try {
      if (confirm('¿Estás seguro de que deseas eliminar esta promoción?')) {
        const promotionRef = doc(db, 'promotions', promotionId);
        await deleteDoc(promotionRef);
        
        toast({
          title: "Promoción eliminada",
          description: "La promoción ha sido eliminada exitosamente",
        });
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la promoción",
        variant: "destructive",
      });
    }
  };

  // Función para editar una promoción
  const editPromotion = (promotion: Promotion) => {
    setCurrentPromotion(promotion);
    setPromotionImage(null);
    setShowPromotionForm(true);
  };

  // Función para iniciar la creación de una nueva promoción
  const startNewPromotion = () => {
    setCurrentPromotion({
      id: '',
      title: '',
      description: '',
      discount: '',
      validUntil: '',
      imageUrl: '',
      tag: ''
    });
    setPromotionImage(null);
    setShowPromotionForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={startNewPromotion}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Promoción
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
                <TableHead>Descripción</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Válido Hasta</TableHead>
                <TableHead>Imagen</TableHead>
                <TableHead>Etiqueta</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.length > 0 ? (
                promotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell className="font-medium">{promotion.title}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={promotion.description}>
                        {promotion.description}
                      </div>
                    </TableCell>
                    <TableCell>{promotion.discount}</TableCell>
                    <TableCell>{promotion.validUntil}</TableCell>
                    <TableCell>
                      {promotion.imageUrl && (
                        <div className="w-16 h-16 rounded-md overflow-hidden">
                          <img 
                            src={promotion.imageUrl} 
                            alt={promotion.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{promotion.tag}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editPromotion(promotion)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePromotion(promotion.id)}
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
                    No hay promociones disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Formulario de promoción */}
      {showPromotionForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{currentPromotion.id ? 'Editar Promoción' : 'Agregar Promoción'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promotion-title">Título *</Label>
                <Input
                  id="promotion-title"
                  value={currentPromotion.title}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, title: e.target.value })}
                  placeholder="Título de la promoción"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promotion-discount">Descuento *</Label>
                <Input
                  id="promotion-discount"
                  value={currentPromotion.discount}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, discount: e.target.value })}
                  placeholder="Ej: 20% o $500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promotion-valid-until">Válido Hasta *</Label>
                <Input
                  id="promotion-valid-until"
                  type="date"
                  value={currentPromotion.validUntil}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, validUntil: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promotion-tag">Etiqueta</Label>
                <Input
                  id="promotion-tag"
                  value={currentPromotion.tag}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, tag: e.target.value })}
                  placeholder="Etiqueta para la promoción"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-description">Descripción *</Label>
              <Textarea
                id="promotion-description"
                value={currentPromotion.description}
                onChange={(e) => setCurrentPromotion({ ...currentPromotion, description: e.target.value })}
                rows={3}
                placeholder="Descripción detallada de la promoción"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="promotion-image">Imagen de Promoción</Label>
              <Input
                id="promotion-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPromotionImage(e.target.files[0]);
                  }
                }}
              />
              {promotionImage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Imagen seleccionada: {promotionImage.name}
                  </p>
                </div>
              )}
              {currentPromotion.imageUrl && !promotionImage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Imagen actual: <a href={currentPromotion.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Ver imagen</a>
                  </p>
                  <img 
                    src={currentPromotion.imageUrl} 
                    alt="Imagen actual" 
                    className="w-32 h-32 object-cover rounded mt-2"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPromotionForm(false);
                  if (!currentPromotion.id) {
                    setCurrentPromotion({
                      id: '',
                      title: '',
                      description: '',
                      discount: '',
                      validUntil: '',
                      imageUrl: '',
                      tag: ''
                    });
                  }
                  setPromotionImage(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={savePromotion} 
                disabled={isSavingPromotion}
              >
                {isSavingPromotion ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  currentPromotion.id ? 'Actualizar' : 'Agregar'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Promotions;