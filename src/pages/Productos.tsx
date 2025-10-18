import { useState, useEffect } from 'react';
import { db, auth, storage } from '@/lib/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Package,
  Tag,
  Image as ImageIcon,
  ArrowLeft,
  Star,
  Heart,
  Filter,
  Search,
  Grid3X3,
  List,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface CartItem {
  product: Product;
  quantity: number;
}

const Productos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  
  // Cargar productos desde Firestore
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      const activeProducts = productsData.filter(product => product.active);
      setProducts(activeProducts);
      setFilteredProducts(activeProducts);
      setIsLoading(false);
    });

    return () => unsubProducts();
  }, []);

  // Filtrar y ordenar productos
  useEffect(() => {
    let filtered = [...products];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'stock':
          return b.stock - a.stock;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Cargar carrito desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    
    toast({
      title: "¡Agregado al carrito!",
      description: `${product.name} se ha agregado exitosamente`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    
    toast({
      title: "Producto eliminado",
      description: "El producto se ha eliminado del carrito",
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const maxQuantity = Math.min(newQuantity, product.stock);
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: maxQuantity }
          : item
      )
    );
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    try {
      const orderData = {
        userId: auth.currentUser?.uid || null,
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        })),
        total: getTotal(),
        status: 'pending',
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      const orderId = docRef.id;
      
      if (getTotal() > 0) {
        try {
          const { createProductPayment } = await import('@/lib/mercadopago');
          // Formatear los productos para MercadoPago
          const formattedProducts = cart.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            description: item.product.description
          }));
          
          const paymentResponse = await createProductPayment(orderId, formattedProducts, getTotal());
          
          console.log('Respuesta de MercadoPago:', paymentResponse);
          
          if (paymentResponse && paymentResponse.init_point) {
            console.log('Redirigiendo a:', paymentResponse.init_point);
            setCart([]);
            // Usar window.open para evitar problemas con bloqueo de popups
            window.location.href = paymentResponse.init_point;
          } else {
            console.error('Error: No se recibió init_point en la respuesta', paymentResponse);
            toast({
              title: "Error de pago",
              description: "No se pudo procesar el pago. Intenta nuevamente.",
              variant: "destructive",
            });
          }
        } catch (paymentError) {
          console.error('Error al procesar el pago:', paymentError);
          
          // Mostrar mensaje de error más detallado
          let errorMessage = "Ocurrió un error al procesar el pago";
          if (paymentError instanceof Error) {
            errorMessage += ": " + paymentError.message;
          }
          
          toast({
            title: "Error de pago",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Carrito vacío",
          description: "Agrega productos al carrito antes de proceder al pago",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la orden",
        variant: "destructive",
      });
    }
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(products.map(product => product.category))];
    return categories.filter(Boolean);
  };

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header moderno */}
      <div className="bg-white shadow-lg border-b sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Inicio
              </Button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Catálogo de Productos
                </h1>
                <p className="text-sm text-gray-600">Encuentra lo que necesitas</p>
              </div>
            </div>
            
            {/* Carrito */}
            <div className="relative">
              <Button 
                variant="default"
                onClick={() => document.getElementById('cart-dialog')?.click()}
                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="font-medium">Carrito</span>
                {cartItemsCount > 0 && (
                  <span className="bg-white text-blue-600 rounded-full px-2 py-1 text-xs font-bold">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filtros y controles */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 rounded-xl">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {getUniqueCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-44 rounded-xl">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre A-Z</SelectItem>
                  <SelectItem value="price">Precio menor</SelectItem>
                  <SelectItem value="stock">Mayor stock</SelectItem>
                </SelectContent>
              </Select>

              {/* Modo de vista */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-lg"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-lg"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Productos */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <p className="text-gray-600">Cargando productos...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500">Intenta ajustar tus filtros de búsqueda</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  {viewMode === 'grid' ? (
                    <Card className="h-full flex flex-col overflow-hidden bg-white border-0 shadow-md hover:shadow-2xl transition-all duration-300 rounded-2xl">
                      <div className="relative h-56 overflow-hidden bg-gray-100">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Badge de stock */}
                        <div className="absolute top-3 right-3">
                          <Badge 
                            variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                            className="px-3 py-1 rounded-full font-medium shadow-sm"
                          >
                            {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="flex-grow p-6">
                        <div className="space-y-3">
                          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-2xl font-bold text-gray-900">
                                ${product.price.toLocaleString()}
                              </span>
                              {product.category && (
                                <span className="block text-xs text-gray-500 mt-1">
                                  {product.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-6 pt-0">
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ) : (
                    <Card className="flex overflow-hidden bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
                      <div className="w-32 h-32 flex-shrink-0 bg-gray-100 relative overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 p-6 flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-1">{product.description}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-bold text-gray-900">${product.price.toLocaleString()}</span>
                            <Badge 
                              variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                              className="px-2 py-1 rounded-full text-xs"
                            >
                              {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl"
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    </Card>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Dialog del Carrito Modernizado */}
        <Dialog>
          <DialogTrigger asChild>
            <Button id="cart-dialog" className="hidden">Abrir Carrito</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
                Tu Carrito de Compras
              </DialogTitle>
            </DialogHeader>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="h-12 w-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Tu carrito está vacío</h3>
                <p className="text-gray-500">Agrega algunos productos para comenzar</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {cart.map((item) => (
                    <motion.div 
                      key={item.product.id} 
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-sm">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.product.name}</h4>
                        <p className="text-sm text-gray-600">${item.product.price.toLocaleString()} c/u</p>
                        <p className="text-xs text-gray-500">Stock disponible: {item.product.stock}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white rounded-xl shadow-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="h-10 w-10 rounded-l-xl hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="px-4 py-2 font-semibold min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="h-10 w-10 rounded-r-xl hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                          className="h-10 w-10 hover:bg-red-50 hover:text-red-600 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="border-t bg-white rounded-2xl p-6 -m-6 mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-600">Subtotal:</span>
                      <span className="text-lg font-semibold">${getTotal().toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xl font-bold border-t pt-4">
                      <span>Total:</span>
                      <span className="text-blue-600">${getTotal().toLocaleString()}</span>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      onClick={handleCheckout}
                    >
                      <CreditCard className="h-5 w-5 mr-3" />
                      Proceder al Pago - ${getTotal().toLocaleString()}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Productos;