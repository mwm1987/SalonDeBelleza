import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Calendar, Bell, LogOut, Home, Settings, ChevronDown, ChevronRight, Sparkles, Heart, Crown, Scissors, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados principales inspirados en react-pro-sidebar
  const [collapsed, setCollapsed] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [transitionDuration] = useState(300);
  
  // Breakpoints y responsividad
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Configuración de breakpoints similar a react-pro-sidebar
  const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
  };

  // Manejo de responsividad mejorado
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      const mobile = width < breakpoints.lg;
      setIsMobile(mobile);
      
      if (mobile) {
        setCollapsed(false); // En móvil nunca colapsar
        setToggled(false); // Cerrar sidebar móvil
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manejo de clicks fuera (backdrop)
  useEffect(() => {
    const handleBackdropClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Cerrar menú de usuario
      if (!target.closest('#user-menu') && !target.closest('#user-menu-button')) {
        setIsUserMenuOpen(false);
      }
      
      // Cerrar sidebar móvil si se hace click en backdrop
      if (isMobile && toggled && !target.closest('#sidebar-container') && !target.closest('#mobile-menu-button')) {
        setToggled(false);
      }
    };

    document.addEventListener('mousedown', handleBackdropClick);
    return () => document.removeEventListener('mousedown', handleBackdropClick);
  }, [isMobile, toggled]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Forzar una recarga completa para limpiar el estado
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Función de navegación con closeOnClick
  const handleNavigation = (path: string) => {
    navigate(path);
    setToggled(false); // Cerrar en móvil
    setIsUserMenuOpen(false);
  };

  // Toggle collapsed state (solo desktop)
  const handleToggleCollapsed = () => {
    if (!isMobile) {
      setCollapsed(!collapsed);
    }
  };

  // Toggle sidebar (móvil)
  const handleToggleSidebar = () => {
    setToggled(!toggled);
  };

  // Configuración del sidebar
  const sidebarWidth = isMobile ? (windowWidth < 400 ? '85%' : '320px') : '280px';
  const sidebarCollapsedWidth = '80px';
  const currentWidth = isMobile ? sidebarWidth : (collapsed ? sidebarCollapsedWidth : sidebarWidth);

  // Configuración de elementos de navegación con Green To Heart colors
  const navigationItems = [
    { href: '/', label: 'Inicio', icon: Home, color: 'from-[#86FAAF] to-[#30ED7B]' },
    { href: '/appointment', label: 'Reservar Turno', icon: Calendar, color: 'from-[#30ED7B] to-[#00D765]' },
    { href: '/my-appointments', label: 'Mis Turnos', icon: Bell, color: 'from-[#86FAAF] to-[#00B369]' },
    { href: '/featured-services', label: 'Servicios', icon: Scissors, color: 'from-[#00D765] to-[#00B369]' },
    { href: '/promotions', label: 'Promociones', icon: Sparkles, color: 'from-[#30ED7B] to-[#00875F]' },
    { href: '/vip-program', label: 'Club VIP', icon: Crown, color: 'from-[#00B369] to-[#00875F]' },
    { href: '/tratamientos', label: 'Tratamientos', icon: Heart, color: 'from-[#00875F] to-[#00B369]' },
    { href: '/productos', label: 'Productos', icon: Package, color: 'from-[#30ED7B] to-[#00B369]' }
  ];

  const isAdmin = user?.email === 'kawazulu.intel05@gmail.com' || 
                  user?.email === 'kawazulu.intel01@gmail.com' || 
                  user?.email === 'marvifig@gmail.com';

  // Estilos del menu item según estado (similar to react-pro-sidebar menuItemStyles)
  const getMenuItemStyles = (isActive: boolean, disabled = false) => ({
    base: `group relative flex items-center w-full text-left rounded-2xl transition-all overflow-hidden`,
    spacing: `${collapsed && !isMobile ? 'justify-center px-2 py-4' : 'space-x-4 px-4 py-4'}`,
    colors: isActive 
      ? 'bg-white/20 text-white shadow-lg' 
      : 'text-white/80 hover:text-white hover:bg-white/10',
    animations: 'hover:scale-105 duration-300',
    disabled: disabled ? 'opacity-50 cursor-not-allowed' : ''
  });

  return (
    <>
      {/* Mobile Menu Toggle Button - Solo mostrar cuando el sidebar está cerrado */}
      {isMobile && !toggled && (
        <button
          id="mobile-menu-button"
          className="fixed top-4 left-4 z-[60] p-3 rounded-2xl bg-gradient-to-br from-[#86FAAF] to-[#00875F] text-white shadow-2xl hover:scale-110 transition-all duration-300 border border-white/20 dark:border-white/10"
          onClick={handleToggleSidebar}
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6 transition-transform duration-300" />
        </button>
      )}

      {/* Backdrop para móvil */}
      {isMobile && toggled && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setToggled(false)}
        />
      )}

      {/* Sidebar Principal */}
      <nav 
        id="sidebar-container"
        className={`fixed left-0 top-0 h-full z-50 transition-all ease-out ${
          isMobile 
            ? (toggled ? 'translate-x-0' : '-translate-x-full')
            : 'translate-x-0'
        }`}
        style={{
          width: currentWidth,
          transitionDuration: `${transitionDuration}ms`,
          background: 'linear-gradient(180deg, rgba(134, 250, 175, 0.95) 0%, rgba(48, 237, 123, 0.95) 25%, rgba(0, 215, 101, 0.95) 50%, rgba(0, 179, 105, 0.95) 75%, rgba(0, 135, 95, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '4px 0 30px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Patrones de fondo animados */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#86FAAF]/20 via-[#30ED7B]/20 to-[#00875F]/20"></div>
          <div className="absolute top-10 left-5 w-3 h-3 bg-white/30 rounded-full animate-pulse dark:bg-white/20"></div>
          <div className="absolute top-32 right-8 w-2 h-2 bg-white/40 rounded-full animate-ping dark:bg-white/30"></div>
          <div className="absolute top-64 left-12 w-2 h-2 bg-white/25 rounded-full animate-bounce dark:bg-white/20"></div>
          <div className="absolute bottom-32 right-6 w-1.5 h-1.5 bg-white/35 rounded-full animate-pulse dark:bg-white/25"></div>
        </div>

        <div className="relative h-full flex flex-col">
          {/* Botón de cerrar en la esquina superior derecha (solo móvil) */}
          {isMobile && toggled && (
            <button
              onClick={() => setToggled(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all duration-300 hover:scale-110 border border-white/20"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Header del Sidebar */}
          <div className={`p-6 border-b border-white/20 ${collapsed && !isMobile ? 'px-4' : ''}`}>
            <button 
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-4 w-full text-left hover:scale-105 transition-transform duration-300"
            >
              {/* Logo */}
              <div className="relative p-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl group-hover:rotate-3 transition-transform duration-300 dark:bg-white/10 dark:border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#86FAAF] to-[#00875F] rounded-2xl blur-md opacity-50 dark:opacity-30"></div>
                <img 
                  src="/images/logosecretos.png" 
                  alt="Logo Secretos De Belleza" 
                  className="relative h-8 w-8 object-contain" 
                />
              </div>
              
              {/* Texto del logo (oculto cuando collapsed en desktop) */}
              {(!collapsed || isMobile) && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-lg">
                    Secretos De Belleza
                  </span>
                </div>
              )}
            </button>
            
            {/* Botón de colapso (solo desktop) */}
            {!isMobile && (
              <button
                onClick={handleToggleCollapsed}
                className="absolute -right-4 top-8 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 group"
                aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
              >
                <ChevronRight className={`h-4 w-4 text-gray-600 transition-transform duration-300 group-hover:text-[#30ED7B] dark:text-gray-400 dark:group-hover:text-[#86FAAF] ${
                  collapsed ? 'rotate-0' : 'rotate-180'
                }`} />
              </button>
            )}
          </div>

          {/* Menu de navegación */}
          <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              const itemStyles = getMenuItemStyles(isActive);
              
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`${itemStyles.base} ${itemStyles.spacing} ${itemStyles.colors} ${itemStyles.animations}`}
                  aria-label={item.label}
                >
                  {/* Fondo animado en hover */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-r ${item.color} rounded-2xl transform scale-90 group-hover:scale-100`}></div>
                  
                  {/* Icono */}
                  <item.icon className={`relative z-10 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 flex-shrink-0 ${
                    collapsed && !isMobile ? 'h-6 w-6' : 'h-5 w-5'
                  }`} />
                  
                  {/* Label (oculto cuando collapsed en desktop) */}
                  {(!collapsed || isMobile) && (
                    <span className="relative z-10 font-semibold text-base tracking-wide">
                      {item.label}
                    </span>
                  )}
                  
                  {/* Tooltip para estado collapsed (solo desktop) */}
                  {collapsed && !isMobile && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 dark:bg-gray-700">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45 dark:bg-gray-700"></div>
                    </div>
                  )}

                  {/* Indicador de activo */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sección de Usuario */}
          <div className="border-t border-white/20 p-4">
            {user ? (
              <div className="relative">
                <button
                  id="user-menu-button"
                  className={`group w-full flex items-center text-white transition-all duration-300 hover:bg-white/10 rounded-2xl ${
                    collapsed && !isMobile ? 'justify-center px-2 py-4' : 'space-x-4 px-4 py-4'
                  }`}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="Abrir menú de usuario"
                >
                  {/* Avatar */}
                  <Avatar className={`border-2 border-white/50 ring-2 ring-white/30 transition-all duration-300 flex-shrink-0 ${
                    collapsed && !isMobile ? 'h-10 w-10' : 'h-12 w-12'
                  }`}>
                    <AvatarImage src={user?.photoURL || "/images/Avatar.jpg"} alt="Avatar del usuario" />
                    <AvatarFallback className="bg-gradient-to-br from-[#86FAAF] to-[#00875F] text-white font-bold">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Información del usuario */}
                  {(!collapsed || isMobile) && (
                    <>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {user.displayName || user.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-white/70 truncate">
                          {user.email}
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 flex-shrink-0 ${
                        isUserMenuOpen ? 'rotate-180' : 'rotate-0'
                      }`} />
                    </>
                  )}
                </button>

                {/* Menú desplegable del usuario */}
                {isUserMenuOpen && (
                  <div 
                    id="user-menu"
                    className={`absolute bottom-full mb-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 z-50 animate-in slide-in-from-bottom-2 duration-300 dark:bg-gray-900/95 dark:border-white/10 ${
                      collapsed && !isMobile ? 'left-full ml-4 w-56' : 'left-0 right-0'
                    }`}
                  >
                    <button 
                      onClick={() => handleNavigation('/profile')}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#86FAAF]/10 hover:to-[#30ED7B]/10 hover:text-[#00875F] transition-all duration-300 group text-left dark:text-gray-300 dark:hover:text-[#86FAAF]"
                      aria-label="Ir a mi perfil"
                    >
                      <User className="h-4 w-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                      <span className="font-medium">Mi Perfil</span>
                    </button>
                    
                    <button 
                      onClick={() => handleNavigation('/settings')}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#86FAAF]/10 hover:to-[#30ED7B]/10 hover:text-[#00875F] transition-all duration-300 group text-left dark:text-gray-300 dark:hover:text-[#86FAAF]"
                      aria-label="Ir a configuración"
                    >
                      <Settings className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />
                      <span className="font-medium">Configuración</span>
                    </button>
                    
                    <div className="border-t border-gray-100/50 mt-1 pt-1">
                      <button 
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-300 group text-left dark:text-red-400 dark:hover:bg-red-950/30"
                        aria-label="Cerrar sesión"
                      >
                        <LogOut className="h-4 w-4 group-hover:-rotate-12 transition-transform duration-300 flex-shrink-0" />
                        <span className="font-medium">Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => handleNavigation('/auth')}
                className={`group relative flex items-center w-full bg-white/20 backdrop-blur-md text-white font-semibold hover:bg-white/30 transition-all duration-300 overflow-hidden hover:scale-105 rounded-2xl ${
                  collapsed && !isMobile ? 'justify-center px-2 py-4' : 'justify-center space-x-3 px-4 py-4'
                }`}
                aria-label="Iniciar sesión"
              >
                <User className={`transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${
                  collapsed && !isMobile ? 'h-6 w-6' : 'h-5 w-5'
                }`} />
                {(!collapsed || isMobile) && (
                  <span>Iniciar Sesión</span>
                )}
                
                {/* Tooltip para estado collapsed */}
                {collapsed && !isMobile && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 dark:bg-gray-700">
                    Iniciar Sesión
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45 dark:bg-gray-700"></div>
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;