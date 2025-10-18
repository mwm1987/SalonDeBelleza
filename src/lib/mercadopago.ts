import axios from 'axios';
// Remove unused AxiosResponse import since it's not being used in the code
import { auth } from '@/lib/firebase'; // Asegúrate de que esta ruta sea correcta

// Constantes
const MERCADO_PAGO_BASE_URL = 'https://api.mercadopago.com/checkout/preferences';
// Token de producción para Mercado Pago
// Nota: Los tokens APP_USR son para el backend, no para el frontend
// Para el frontend se debe usar un token TEST o PROD que comience con TEST- o APP_USR-
const MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-1424488817528295-033118-f51ebb5f19f25aaa3925c1d2d186d950-58070769';

// Configuración para entorno de desarrollo o producción
// Si estás en modo sandbox, cambia a false
// Si estás en modo producción, cambia a true
const IS_PRODUCTION = true;

// Si estás en modo sandbox, deberías ver este mensaje en la consola
if (!IS_PRODUCTION) {
  console.warn('ADVERTENCIA: Estás usando Mercado Pago en modo sandbox (desarrollo)');
} else {
  console.log('Mercado Pago configurado en modo producción');
}

// Interfaces
export interface MercadoPagoItem {
  id: string;
  title: string;
  description?: string;
  picture_url?: string;
  category_id?: string;
  quantity: number;
  currency_id?: string;
  unit_price: number;
}

export interface MercadoPagoPreference {
  items: MercadoPagoItem[];
  payer?: {
    name?: string;
    surname?: string;
    email?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
  };
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: 'approved' | 'all';
  notification_url?: string;
  statement_descriptor?: string;
  external_reference?: string;
}

export interface MercadoPagoResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

/**
 * Crea una preferencia de pago en MercadoPago
 * @param preference Datos de la preferencia de pago
 * @returns Respuesta de MercadoPago con los links de pago
 */
export const createPaymentPreference = async (preference: MercadoPagoPreference): Promise<MercadoPagoResponse> => {
  try {
    // Verificar que el token de acceso esté configurado
    if (!MERCADO_PAGO_ACCESS_TOKEN || MERCADO_PAGO_ACCESS_TOKEN.trim() === '') {
      throw new Error('El token de acceso de MercadoPago no está configurado');
    }
    
    // Configurar la URL y los headers correctamente
    const url = MERCADO_PAGO_BASE_URL;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
      }
    };
    
    console.log('Enviando solicitud a MercadoPago:', url);
    console.log('Datos de la preferencia:', JSON.stringify(preference, null, 2));
    
    const response = await axios.post(url, preference, config);
    
    console.log('Respuesta de MercadoPago:', response.data);
    
    // Verificar que la respuesta contenga los campos necesarios
    if (!response.data || !response.data.id) {
      throw new Error('La respuesta de MercadoPago no contiene un ID de preferencia');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error al crear preferencia de pago en MercadoPago:', error);
    
    // Mostrar más detalles del error si están disponibles
    if (error.response) {
      console.error('Detalles del error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    throw new Error(`No se pudo crear la preferencia de pago: ${error.message}`);
  }
};

/**
 * Crea una preferencia de pago para una cita
 * @param appointmentId ID de la cita
 * @param treatments Tratamientos de la cita
 * @param userData Datos del usuario
 * @param successUrl URL de redirección en caso de éxito
 * @param failureUrl URL de redirección en caso de fallo
 * @returns Respuesta de MercadoPago con los links de pago
 */
export const createAppointmentPayment = async (
  appointmentId: string,
  treatments: any[],
  userData: {
    name: string;
    lastname: string;
    email: string;
    phone: string;
    countryCode: string;
  },
  successUrl: string = window.location.origin + '/my-appointments',
  failureUrl: string = window.location.origin + '/appointments'
): Promise<MercadoPagoResponse> => {
  // Crear los items para MercadoPago
  const items: MercadoPagoItem[] = treatments.map(treatment => ({
    id: treatment.id.toString(),
    title: `${treatment.name}${treatment.zone ? ` - ${treatment.zone}` : ''}`,
    description: `Turno para ${treatment.name}${treatment.zone ? ` - ${treatment.zone}` : ''}`,
    quantity: 1,
    currency_id: 'ARS',
    unit_price: parseFloat(treatment.price) // Asegurar que el precio sea un número
  }));

  // Calcular el total para verificar
  const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  console.log('Total a pagar:', total);
  
  if (items.length === 0 || total <= 0) {
    throw new Error('No hay items válidos para crear el pago');
  }

  // Crear la preferencia
  const preference: MercadoPagoPreference = {
    items,
    payer: {
      name: userData.name,
      surname: userData.lastname,
      email: userData.email,
      phone: {
        area_code: userData.countryCode.replace('+', ''),
        number: userData.phone
      }
    },
    back_urls: {
      success: window.location.origin + '/payment-callback',
      failure: window.location.origin + '/payment-callback',
      pending: window.location.origin + '/payment-callback'
    },
    auto_return: 'approved',
    external_reference: appointmentId
  };
  
  // Limpiar cualquier espacio o comilla adicional en las URLs
  if (preference.back_urls) {
    preference.back_urls.success = preference.back_urls.success.trim().replace(/["'`]/g, '');
    preference.back_urls.failure = preference.back_urls.failure.trim().replace(/["'`]/g, '');
    preference.back_urls.pending = preference.back_urls.pending.trim().replace(/["'`]/g, '');
  }
  
  // Imprimir la preferencia para depuración
  console.log('Preferencia de pago:', JSON.stringify(preference, null, 2));

  try {
    const response = await createPaymentPreference(preference);
    
    // Imprimir la respuesta completa para depuración
    console.log('Respuesta completa de MercadoPago:', JSON.stringify(response, null, 2));
    console.log('URL de pago (init_point):', response.init_point);
    console.log('URL de pago sandbox (sandbox_init_point):', response.sandbox_init_point);
    
    // Verificar si las URLs están vacías y mostrar advertencias
    if (!response.init_point) {
      console.warn('ADVERTENCIA: init_point está vacío en la respuesta de MercadoPago');
    }
    if (!response.sandbox_init_point) {
      console.warn('ADVERTENCIA: sandbox_init_point está vacío en la respuesta de MercadoPago');
    }
    
    // Usar sandbox_init_point en desarrollo y init_point en producción
    // Asegurarse de que siempre se use init_point en producción
    if (!IS_PRODUCTION) {
      response.init_point = response.sandbox_init_point;
    } else {
      // En producción, asegurarse de que init_point no sea vacío
      if (!response.init_point) {
        console.warn('init_point está vacío en producción, usando sandbox_init_point como fallback');
        response.init_point = response.sandbox_init_point;
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error en createAppointmentPayment:', error);
    throw error;
  }
};

/**
 * Verifica el estado de un pago en MercadoPago
 * @param paymentId ID del pago en MercadoPago
 * @returns Estado del pago
 */
export const checkPaymentStatus = async (paymentId: string): Promise<string> => {
  try {
    const url = `https://api.mercadopago.com/v1/payments/${paymentId}?access_token=${MERCADO_PAGO_ACCESS_TOKEN}`;
    
    const response = await axios.get(url);
    
    return response.data.status;
  } catch (error) {
    console.error('Error al verificar estado de pago en MercadoPago:', error);
    throw new Error('No se pudo verificar el estado del pago');
  }
};

/**
 * Crea una preferencia de pago para productos
 * @param orderId ID de la orden
 * @param products Productos en el carrito
 * @param total Total de la compra
 * @param successUrl URL de redirección en caso de éxito
 * @param failureUrl URL de redirección en caso de fallo
 * @returns Respuesta de MercadoPago con los links de pago
 */
export const createProductPayment = async (
  orderId: string,
  products: any[],
  total: number,
  successUrl: string = window.location.origin + '/my-orders',
  failureUrl: string = window.location.origin + '/productos'
): Promise<MercadoPagoResponse> => {
  // Crear los items para MercadoPago
  const items: MercadoPagoItem[] = products.map(product => ({
    id: product.id.toString(),
    title: product.name || product.title,
    description: product.description || `Producto: ${product.name || product.title}`,
    quantity: product.quantity || 1,
    currency_id: 'ARS',
    unit_price: parseFloat(product.price) // Asegurar que el precio sea un número
  }));
  
  // Imprimir los items para depuración
  console.log('Items para MercadoPago:', JSON.stringify(items, null, 2));

  // Verificar que el total coincida con la suma de los productos
  const calculatedTotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  console.log('Total calculado:', calculatedTotal);
  console.log('Total proporcionado:', total);
  
  if (items.length === 0 || calculatedTotal <= 0) {
    throw new Error('No hay items válidos para crear el pago');
  }

  // Crear la preferencia
  const preference: MercadoPagoPreference = {
    items,
    back_urls: {
      success: window.location.origin + '/payment-callback',
      failure: window.location.origin + '/payment-callback',
      pending: window.location.origin + '/payment-callback'
    },
    auto_return: 'approved',
    external_reference: orderId,
    statement_descriptor: 'Compra de productos'
  };
  
  // Limpiar cualquier espacio o comilla adicional en las URLs
  if (preference.back_urls) {
    preference.back_urls.success = preference.back_urls.success.trim().replace(/["'`]/g, '');
    preference.back_urls.failure = preference.back_urls.failure.trim().replace(/["'`]/g, '');
    preference.back_urls.pending = preference.back_urls.pending.trim().replace(/["'`]/g, '');
  }
  
  // Imprimir la preferencia para depuración
  console.log('Preferencia de pago para productos:', JSON.stringify(preference, null, 2));

  try {
    // Verificar que la preferencia sea válida antes de enviarla
    if (!preference.items || preference.items.length === 0) {
      throw new Error('No hay items válidos para crear el pago');
    }
    
    // Verificar que todos los items tengan precio y cantidad
    const invalidItems = preference.items.filter(item => !item.unit_price || item.unit_price <= 0 || !item.quantity || item.quantity <= 0);
    if (invalidItems.length > 0) {
      console.error('Items inválidos:', invalidItems);
      throw new Error('Hay items con precio o cantidad inválidos');
    }
    
    const response = await createPaymentPreference(preference);
    
    // Imprimir la respuesta completa para depuración
    console.log('Respuesta completa de MercadoPago:', JSON.stringify(response, null, 2));
    console.log('URL de pago (init_point):', response.init_point);
    console.log('URL de pago sandbox (sandbox_init_point):', response.sandbox_init_point);
    
    // Verificar si las URLs están vacías y mostrar advertencias
    if (!response.init_point) {
      console.warn('ADVERTENCIA: init_point está vacío en la respuesta de MercadoPago');
    }
    if (!response.sandbox_init_point) {
      console.warn('ADVERTENCIA: sandbox_init_point está vacío en la respuesta de MercadoPago');
    }
    
    // Usar sandbox_init_point en desarrollo y init_point en producción
    if (!IS_PRODUCTION) {
      response.init_point = response.sandbox_init_point;
    } else {
      // En producción, asegurarse de que init_point no sea vacío
      if (!response.init_point) {
        console.warn('init_point está vacío en producción, usando sandbox_init_point como fallback');
        response.init_point = response.sandbox_init_point;
      }
    }
    
    // Verificar que tengamos una URL de pago válida
    if (!response.init_point) {
      throw new Error('No se pudo obtener una URL de pago válida de MercadoPago');
    }
    
    return response;
  } catch (error) {
    console.error('Error en createProductPayment:', error);
    throw error;
  }
};
// En mercadopago.ts - modificar la función createMembershipPayment
// ... código existente ...

export const createMembershipPayment = async (
  membershipId: string,
  membership: any,
  userData: {
    name: string;
    lastname: string;
    email: string;
    phone: string;
    countryCode: string;
  }
): Promise<MercadoPagoResponse> => {
  // Convertir el precio a número si es string, o usar directamente si es número
  const price = typeof membership.price === 'string' 
    ? parseFloat(membership.price.replace('$', '').replace(',', '').trim())
    : membership.price;

  const items: MercadoPagoItem[] = [{
    id: membershipId,
    title: membership.name,
    description: membership.description,
    quantity: 1,
    currency_id: 'ARS',
    unit_price: price
  }];

  const preference: MercadoPagoPreference = {
    items,
    payer: {
      name: userData.name,
      surname: userData.lastname,
      email: userData.email,
      phone: {
        area_code: userData.countryCode.replace('+', ''),
        number: userData.phone
      }
    },
    back_urls: {
      success: `${window.location.origin}/payment-callback?type=membership`,
      failure: `${window.location.origin}/payment-callback?type=membership`,
      pending: `${window.location.origin}/payment-callback?type=membership`
    },
    auto_return: 'approved',
    external_reference: `membership_${membershipId}_${userData.email}`
  };

  return await createPaymentPreference(preference);
};
// Añadir esta función en lib/mercadopago.ts
export const createCouponPayment = async (
  couponId: string,
  coupon: any,
  userInfo: {
    name: string;
    lastname: string;
    email: string;
    phone: string;
    countryCode: string;
  }
) => {
  try {
    const preference = {
      items: [
        {
          id: couponId,
          title: `Cupón: ${coupon.motivo || 'Descuento'}`,
          description: coupon.descripcion,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: coupon.precio,
        },
      ],
      payer: {
        name: userInfo.name,
        surname: userInfo.lastname,
        email: userInfo.email,
        phone: {
          area_code: userInfo.countryCode.replace('+', ''),
          number: userInfo.phone,
        },
      },
      back_urls: {
        success: `${window.location.origin}/payment-success`,
        failure: `${window.location.origin}/payment-failure`,
        pending: `${window.location.origin}/payment-pending`,
      },
      auto_return: 'approved',
      notification_url: `${import.meta.env.VITE_APP_URL}/api/mercadopago/webhook`,
      metadata: {
        type: 'coupon',
        couponId,
        userId: auth.currentUser?.uid,
      },
    };

    const response = await fetch(`${import.meta.env.VITE_APP_URL}/api/mercadopago/create-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      throw new Error('Error creating payment preference');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating coupon payment:', error);
    throw error;
  }
};