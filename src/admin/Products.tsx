// src/components/admin/Products.tsx
import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  getDocs
} from 'firebase/firestore';
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
import { Package, Edit, Trash2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
  active: boolean;
}

interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
}

const Products = () => {
  const { toast } = useToast();
  
  // Estados para gestión de productos
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    stock: 0,
    category: '',
    active: true
  });
  
  // Estados para gestión de órdenes
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filterOrderStatus, setFilterOrderStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar productos desde Firestore
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      const productsData = snap.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Product[];
      setProducts(productsData);
    });
    
    // Cargar órdenes desde Firestore
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const ordersData = snap.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Order[];
      
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setIsLoading(false);
    });
    
    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, []);

  // Filtrar órdenes cuando cambia el filtro
  useEffect(() => {
    if (filterOrderStatus === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === filterOrderStatus));
    }
  }, [orders, filterOrderStatus]);

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

  // Función para guardar producto (crear o actualizar)
  const handleAddProduct = async () => {
    try {
      let imageUrl = newProduct.imageUrl;
      
      // Subir imagen si existe
      if (productImage) {
        imageUrl = await uploadImage(productImage, 'products');
      }
      
      const productData = {
        ...newProduct,
        imageUrl
      };
      
      if (currentProduct) {
        // Actualizar producto existente
        const productRef = doc(db, 'products', currentProduct.id);
        await updateDoc(productRef, productData);
        
        toast({
          title: "Producto actualizado",
          description: "El producto ha sido actualizado exitosamente",
        });
      } else {
        // Agregar nuevo producto
        const productRef = collection(db, 'products');
        await addDoc(productRef, productData);
        
        toast({
          title: "Producto agregado",
          description: "El producto ha sido agregado exitosamente",
        });
      }
      
      // Limpiar formulario
      setShowProductForm(false);
      setCurrentProduct(null);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        stock: 0,
        category: '',
        active: true
      });
      setProductImage(null);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Error al guardar el producto",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar un producto
  const deleteProduct = async (productId: string) => {
    try {
      if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        const productRef = doc(db, 'products', productId);
        await deleteDoc(productRef);
        
        toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado exitosamente",
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el producto",
        variant: "destructive",
      });
    }
  };

  // Función para actualizar el estado de una orden
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
      
      // Actualizar estado local
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      
      toast({
        title: "Orden actualizada",
        description: `El estado de la orden ha sido actualizado a ${status}`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Error al actualizar la orden",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar una orden
  const deleteOrder = async (orderId: string) => {
    try {
      if (confirm('¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.')) {
        const orderRef = doc(db, 'orders', orderId);
        await deleteDoc(orderRef);
        
        toast({
          title: "Orden eliminada",
          description: "La orden ha sido eliminada exitosamente",
        });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la orden",
        variant: "destructive",
      });
    }
  };

  // Función para editar un producto
  const editProduct = (product: Product) => {
    setCurrentProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
      category: product.category,
      active: product.active
    });
    setShowProductForm(true);
  };

  // Función para iniciar la creación de un nuevo producto
  const startNewProduct = () => {
    setCurrentProduct(null);
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      stock: 0,
      category: '',
      active: true
    });
    setProductImage(null);
    setShowProductForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Sección de Gestión de Productos */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Productos</h3>
          <p className="text-sm text-gray-600">Administra los productos de tu tienda</p>
        </div>
        <Button
          onClick={startNewProduct}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Producto
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
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>${product.price}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      {product.active ? (
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
                          onClick={() => editProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
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
                    No hay productos disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Formulario de producto */}
      {showProductForm && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {currentProduct ? 'Editar Producto' : 'Agregar Producto'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowProductForm(false);
                setCurrentProduct(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nombre *</Label>
                <Input
                  id="product-name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Nombre del producto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Precio *</Label>
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  placeholder="Precio del producto"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-stock">Stock *</Label>
                <Input
                  id="product-stock"
                  type="number"
                  min="0"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                  placeholder="Cantidad en stock"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Categoría *</Label>
                <Input
                  id="product-category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="Categoría del producto"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-description">Descripción</Label>
              <Textarea
                id="product-description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                rows={3}
                placeholder="Descripción del producto"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-image">Imagen del Producto</Label>
              <Input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setProductImage(e.target.files[0]);
                  }
                }}
              />
              {productImage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Imagen seleccionada: {productImage.name}
                  </p>
                </div>
              )}
              {newProduct.imageUrl && !productImage && (
                <div className="mt-2">
                  <img 
                    src={newProduct.imageUrl} 
                    alt="Vista previa" 
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="product-active"
                checked={newProduct.active}
                onCheckedChange={(checked) => setNewProduct({ ...newProduct, active: checked === true })}
              />
              <Label htmlFor="product-active">Producto activo</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProductForm(false);
                  setCurrentProduct(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddProduct}>
                {currentProduct ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Gestión de Órdenes */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Gestión de Órdenes</h3>
            <p className="text-sm text-gray-600">Administra las órdenes de tus clientes</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-order-status">Filtrar por estado:</Label>
            <Select
              value={filterOrderStatus}
              onValueChange={setFilterOrderStatus}
            >
              <SelectTrigger id="filter-order-status" className="w-32">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>{order.userId || 'Cliente no registrado'}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm mb-1">
                            {item.name} x{item.quantity}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>${order.total}</TableCell>
                    <TableCell>
                      {order.createdAt instanceof Date 
                        ? order.createdAt.toLocaleDateString() 
                        : new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value: Order['status']) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                          <SelectItem value="shipped">Enviado</SelectItem>
                          <SelectItem value="delivered">Entregado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Aquí podrías implementar la funcionalidad para ver detalles de la orden
                            console.log('Ver detalles de orden:', order);
                          }}
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteOrder(order.id)}
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
                    No hay órdenes disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Products;