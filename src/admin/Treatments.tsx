// src/components/admin/Treatments.tsx
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
import { Image, Edit, Trash2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Treatment {
  id: string;
  name: string;
  zone?: string;
  price: number;
  duration: number;
  description?: string;
  image?: string;
  imageFile?: File;
  imagePreview?: string;
}

const Treatments = () => {
  const { toast } = useToast();
  
  // Estados para gestión de tratamientos
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [currentTreatment, setCurrentTreatment] = useState<Treatment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar tratamientos desde Firestore
  useEffect(() => {
    setIsLoading(true);
    
    const unsubTreatments = onSnapshot(collection(db, 'treatments'), (snapshot) => {
      const treatmentsData = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Treatment[];
      
      setTreatments(treatmentsData);
      setIsLoading(false);
    });

    return () => {
      unsubTreatments();
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

  // Función para manejar la selección de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (isEditing && currentTreatment) {
          setCurrentTreatment({
            ...currentTreatment,
            imageFile: file,
            imagePreview: reader.result as string
          });
        } else {
          setCurrentTreatment({
            id: '',
            name: '',
            price: 0,
            duration: 0,
            description: '',
            zone: '',
            imageFile: file,
            imagePreview: reader.result as string
          });
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Función para guardar tratamiento (crear o actualizar)
  const saveTreatment = async () => {
    try {
      if (!currentTreatment?.name || !currentTreatment?.price || !currentTreatment?.duration) {
        toast({
          title: "Error",
          description: "Por favor completa los campos requeridos",
          variant: "destructive",
        });
        return;
      }
      
      let imageUrl = currentTreatment.image;
      
      // Subir imagen si existe
      if (currentTreatment.imageFile) {
        imageUrl = await uploadImage(currentTreatment.imageFile, 'treatments');
      }
      
      // Preparar datos del tratamiento
      const treatmentData = {
        name: currentTreatment.name,
        zone: currentTreatment.zone || '',
        price: Number(currentTreatment.price),
        duration: Number(currentTreatment.duration),
        description: currentTreatment.description || '',
        image: imageUrl || ''
      };
      
      if (currentTreatment.id) {
        // Actualizar tratamiento existente
        const treatmentRef = doc(db, 'treatments', currentTreatment.id);
        await updateDoc(treatmentRef, treatmentData);
        
        toast({
          title: "Tratamiento actualizado",
          description: "El tratamiento ha sido actualizado exitosamente",
        });
      } else {
        // Agregar nuevo tratamiento
        const treatmentRef = collection(db, 'treatments');
        await addDoc(treatmentRef, treatmentData);
        
        toast({
          title: "Tratamiento agregado",
          description: "El tratamiento ha sido agregado exitosamente",
        });
      }
      
      // Cerrar formulario y limpiar datos
      setShowTreatmentForm(false);
      setCurrentTreatment(null);
    } catch (error) {
      console.error('Error saving treatment:', error);
      toast({
        title: "Error",
        description: "Error al guardar el tratamiento",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar un tratamiento
  const deleteTreatment = async (treatmentId: string) => {
    try {
      if (confirm('¿Estás seguro de que deseas eliminar este tratamiento?')) {
        const treatmentRef = doc(db, 'treatments', treatmentId);
        await deleteDoc(treatmentRef);
        
        toast({
          title: "Tratamiento eliminado",
          description: "El tratamiento ha sido eliminado exitosamente",
        });
      }
    } catch (error) {
      console.error('Error deleting treatment:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el tratamiento",
        variant: "destructive",
      });
    }
  };

  // Función para editar un tratamiento
  const editTreatment = (treatment: Treatment) => {
    setCurrentTreatment({
      ...treatment,
      imageFile: undefined,
      imagePreview: treatment.image || ''
    });
    setShowTreatmentForm(true);
  };

  // Función para iniciar la creación de un nuevo tratamiento
  const startNewTreatment = () => {
    setCurrentTreatment({
      id: '',
      name: '',
      zone: '',
      price: 0,
      duration: 0,
      description: '',
      image: '',
      imageFile: undefined,
      imagePreview: ''
    });
    setShowTreatmentForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Tratamientos</h3>
          <p className="text-sm text-gray-600">Administra los tratamientos disponibles en tu centro</p>
        </div>
        <Button
          onClick={startNewTreatment}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Tratamiento
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
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatments.length > 0 ? (
                treatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell>
                      {treatment.image ? (
                        <div className="w-12 h-12 rounded-md overflow-hidden">
                          <img 
                            src={treatment.image} 
                            alt={treatment.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{treatment.name}</TableCell>
                    <TableCell>{treatment.zone || '-'}</TableCell>
                    <TableCell>${treatment.price}</TableCell>
                    <TableCell>{treatment.duration} min</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={treatment.description}>
                        {treatment.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editTreatment(treatment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTreatment(treatment.id)}
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
                    No hay tratamientos disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Formulario de tratamiento */}
      {showTreatmentForm && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {currentTreatment?.id ? 'Editar Tratamiento' : 'Agregar Tratamiento'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowTreatmentForm(false);
                setCurrentTreatment(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treatment-name">Nombre *</Label>
                <Input
                  id="treatment-name"
                  value={currentTreatment?.name || ''}
                  onChange={(e) => {
                    if (currentTreatment) {
                      setCurrentTreatment({
                        ...currentTreatment,
                        name: e.target.value
                      });
                    }
                  }}
                  placeholder="Nombre del tratamiento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment-zone">Zona</Label>
                <Input
                  id="treatment-zone"
                  value={currentTreatment?.zone || ''}
                  onChange={(e) => {
                    if (currentTreatment) {
                      setCurrentTreatment({
                        ...currentTreatment,
                        zone: e.target.value
                      });
                    }
                  }}
                  placeholder="Zona del cuerpo (opcional)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treatment-price">Precio *</Label>
                <Input
                  id="treatment-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentTreatment?.price || ''}
                  onChange={(e) => {
                    if (currentTreatment) {
                      setCurrentTreatment({
                        ...currentTreatment,
                        price: parseFloat(e.target.value) || 0
                      });
                    }
                  }}
                  placeholder="Precio del tratamiento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment-duration">Duración (minutos) *</Label>
                <Input
                  id="treatment-duration"
                  type="number"
                  min="0"
                  value={currentTreatment?.duration || ''}
                  onChange={(e) => {
                    if (currentTreatment) {
                      setCurrentTreatment({
                        ...currentTreatment,
                        duration: parseInt(e.target.value) || 0
                      });
                    }
                  }}
                  placeholder="Duración en minutos"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="treatment-description">Descripción</Label>
              <Textarea
                id="treatment-description"
                value={currentTreatment?.description || ''}
                onChange={(e) => {
                  if (currentTreatment) {
                    setCurrentTreatment({
                      ...currentTreatment,
                      description: e.target.value
                    });
                  }
                }}
                rows={3}
                placeholder="Descripción del tratamiento (opcional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="treatment-image">Imagen</Label>
              <div className="flex items-center gap-4">
                {(currentTreatment?.imagePreview || currentTreatment?.image) && (
                  <div className="relative w-24 h-24 rounded-md overflow-hidden">
                    <img 
                      src={currentTreatment.imagePreview || currentTreatment.image} 
                      alt="Imagen del tratamiento" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Input
                  id="treatment-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, !!currentTreatment?.id)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTreatmentForm(false);
                  setCurrentTreatment(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={saveTreatment}>
                {currentTreatment?.id ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Treatments;