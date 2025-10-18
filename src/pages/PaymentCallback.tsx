import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { checkPaymentStatus } from '../lib/mercadopago';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando el pago...');
  const [paymentType, setPaymentType] = useState<'appointment' | 'membership' | 'unknown'>('unknown');

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const paymentId = params.get('payment_id');
        const statusParam = params.get('status');
        const externalReference = params.get('external_reference');
        const type = params.get('type');

        // Determine payment type
        if (type === 'membership') {
          setPaymentType('membership');
        } else if (externalReference && !externalReference.startsWith('membership_')) {
          setPaymentType('appointment');
        }

        if (!externalReference) {
          setStatus('error');
          setMessage('No se pudo identificar la transacción asociada al pago.');
          return;
        }

        // For membership payments
        if (type === 'membership' || externalReference.startsWith('membership_')) {
          await processMembershipPayment(externalReference, paymentId, statusParam);
          return;
        }

        // For appointment payments (original functionality)
        await processAppointmentPayment(externalReference, paymentId, statusParam);
      } catch (error) {
        console.error('Error al procesar el pago:', error);
        setStatus('error');
        setMessage('Ocurrió un error al procesar el pago. Por favor contacta al soporte.');
      }
    };

    processPayment();
  }, [location.search]);

  const processAppointmentPayment = async (appointmentId: string, paymentId: string | null, statusParam: string | null) => {
    // Get appointment
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);

    if (!appointmentSnap.exists()) {
      setStatus('error');
      setMessage('No se encontró la cita asociada al pago.');
      return;
    }

    // Update appointment payment status based on MercadoPago status
    if (statusParam === 'approved') {
      await updateDoc(appointmentRef, {
        paymentStatus: 'completed',
        status: 'confirmed',
        paymentId: paymentId || '',
        paymentUpdatedAt: new Date()
      });

      setStatus('success');
      setMessage('¡Pago completado con éxito! Tu turno ha sido confirmado.');
    } else if (statusParam === 'pending') {
      await updateDoc(appointmentRef, {
        paymentStatus: 'pending',
        paymentId: paymentId || '',
        paymentUpdatedAt: new Date()
      });

      setStatus('loading');
      setMessage('El pago está pendiente. Te notificaremos cuando se complete.');
    } else {
      await updateDoc(appointmentRef, {
        paymentStatus: 'failed',
        paymentId: paymentId || '',
        paymentUpdatedAt: new Date()
      });

      setStatus('error');
      setMessage('El pago no pudo ser procesado. Por favor intenta nuevamente.');
    }
  };

  const processMembershipPayment = async (externalReference: string, paymentId: string | null, statusParam: string | null) => {
    try {
      // Extract membership ID and user email from external reference
      // Format: membership_{membershipId}_{userEmail}
      const parts = externalReference.split('_');
      if (parts.length < 3) {
        setStatus('error');
        setMessage('Referencia de pago inválida para membresía.');
        return;
      }

      const membershipId = parts[1];
      const userEmail = parts.slice(2).join('_'); // In case email contains underscores

      // Verify payment status with MercadoPago API for additional security
      let paymentStatus = statusParam;
      if (paymentId) {
        try {
          paymentStatus = await checkPaymentStatus(paymentId);
        } catch (error) {
          console.error('Error verifying payment with MercadoPago API:', error);
          // Continue with status from URL params if API verification fails
        }
      }

      if (paymentStatus === 'approved') {
        // Find user by email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setStatus('error');
          setMessage('No se encontró el usuario asociado a esta membresía.');
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;

        // Get membership details
        const membershipDoc = await getDoc(doc(db, 'vipMemberships', membershipId));
        if (!membershipDoc.exists()) {
          setStatus('error');
          setMessage('No se encontró la membresía seleccionada.');
          return;
        }

        const membershipData = membershipDoc.data();

        // Calculate dates
        const startDate = new Date().toISOString();
        const endDate = calculateEndDate(membershipData.duration || '1 mes');

        // Create VIP subscription
        const subscriptionData = {
          userId: userId,
          membershipId: membershipId,
          membershipName: membershipData.name,
          startDate: startDate,
          endDate: endDate,
          status: 'active',
          paymentStatus: 'paid',
          paymentId: paymentId || '',
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'vipSubscriptions'), subscriptionData);

        setStatus('success');
        setMessage('¡Pago completado con éxito! Tu membresía VIP ha sido activada. Serás redirigido a tu cupón VIP.');

        // Redirect to VIP coupon page after 3 seconds
        setTimeout(() => {
          navigate('/vip-coupon');
        }, 3000);
      } else if (paymentStatus === 'pending') {
        setStatus('loading');
        setMessage('El pago está pendiente. Tu membresía se activará automáticamente cuando se complete el pago.');
      } else {
        setStatus('error');
        setMessage('El pago no pudo ser procesado. Por favor intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error processing membership payment:', error);
      setStatus('error');
      setMessage('Ocurrió un error al procesar tu membresía. Por favor contacta al soporte.');
    }
  };

  const calculateEndDate = (duration: string): string => {
    const now = new Date();
    if (duration.includes('mes')) {
      const months = parseInt(duration.match(/\d+/)?.[0] || '1');
      now.setMonth(now.getMonth() + months);
    } else if (duration.includes('año')) {
      const years = parseInt(duration.match(/\d+/)?.[0] || '1');
      now.setFullYear(now.getFullYear() + years);
    }
    return now.toISOString();
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <h2 className="text-2xl font-bold">Procesando Pago</h2>
            </>
          )}

          {status === 'success' && (
            <>
              {paymentType === 'membership' ? (
                <Crown className="h-16 w-16 text-amber-500" />
              ) : (
                <CheckCircle className="h-16 w-16 text-green-500" />
              )}
              <h2 className="text-2xl font-bold">¡Pago Exitoso!</h2>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500" />
              <h2 className="text-2xl font-bold">Error en el Pago</h2>
            </>
          )}

          <p className="text-gray-600">{message}</p>

          <div className="flex space-x-4">
            {paymentType === 'membership' ? (
              <>
                {status === 'success' && (
                  <Button onClick={() => navigate('/vip-coupon')}>
                    Ver Mi Cupón VIP
                  </Button>
                )}
                {status === 'error' && (
                  <Button onClick={() => navigate('/vip-program')}>
                    Volver al Programa VIP
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/my-appointments')}>
                  Mis Turnos
                </Button>
                {status === 'error' && (
                  <Button variant="outline" onClick={() => navigate('/appointment')}>
                    Intentar Nuevamente
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;