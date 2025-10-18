import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

// Define FeaturedService type
export type FeaturedService = {
  id?: string;
  title: string;
  description: string;
  price: string;
  duration: string;
  image: string;
  category: string;
  icon: string;
  popular: boolean;
};

// Create initial collections and data if they don't exist
export const initializeFirestore = async () => {
  try {
    console.log('Starting Firestore initialization...');
    
    // Create unavailableTimes collection if it doesn't exist
    console.log('Creating unavailableTimes collection...');
    const unavailableTimesRef = collection(db, 'unavailableTimes');
    const unavailableTimesSnapshot = await getDocs(unavailableTimesRef);
    console.log('UnavailableTimes collection created');
    
    // Create promotions collection if it doesn't exist
    console.log('Creating promotions collection...');
    const promotionsRef = collection(db, 'promotions');
    const promotionsSnapshot = await getDocs(promotionsRef);
    console.log('Promotions collection created');
    
    // Create or update business settings with default values
    console.log('Creating business settings...');
    const businessSettingsRef = doc(db, 'settings', 'business');
    const businessSettingsSnap = await getDoc(businessSettingsRef);
    
    if (!businessSettingsSnap.exists()) {
      // Set default business settings
      console.log('Setting default business settings...');
      await setDoc(businessSettingsRef, {
        businessHours: {
          from: '08:00',
          to: '21:00'
        },
        slotDuration: 30,
        advanceBookingDays: 30
      });
      console.log('Default business settings set');
    } else {
      console.log('Business settings already exist');
    }
    
    console.log('Firestore initialized successfully');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
  }
};

// Get business settings
export const getBusinessSettings = async () => {
  try {
    const businessSettingsRef = doc(db, 'settings', 'business');
    const businessSettingsSnap = await getDoc(businessSettingsRef);
    
    if (businessSettingsSnap.exists()) {
      return businessSettingsSnap.data();
    } else {
      // Return default settings if none exist
      return {
        businessHours: {
          from: '08:00',
          to: '21:00'
        },
        slotDuration: 30,
        advanceBookingDays: 30
      };
    }
  } catch (error) {
    console.error('Error getting business settings:', error);
    // Return default settings if there's an error
    return {
      businessHours: {
        from: '08:00',
        to: '21:00'
      },
      slotDuration: 30,
      advanceBookingDays: 30
    };
  }
};

// Get unavailable times
export const getUnavailableTimes = async () => {
  try {
    const q = query(collection(db, 'unavailableTimes'));
    const querySnapshot = await getDocs(q);
    const unavailableTimes = [];
    querySnapshot.forEach((doc) => {
      unavailableTimes.push({ id: doc.id, ...doc.data() });
    });
    return unavailableTimes;
  } catch (error) {
    console.error('Error getting unavailable times:', error);
    return [];
  }
};

// Add unavailable time
export const addUnavailableTime = async (timeData) => {
  try {
    const docRef = await addDoc(collection(db, 'unavailableTimes'), timeData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding unavailable time:', error);
    throw error;
  }
};

// Delete unavailable time
export const deleteUnavailableTime = async (id) => {
  try {
    await deleteDoc(doc(db, 'unavailableTimes', id));
    return true;
  } catch (error) {
    console.error('Error deleting unavailable time:', error);
    throw error;
  }
};

// Delete multiple unavailable times by filter
export const deleteUnavailableTimesByFilter = async (filter) => {
  try {
    const { type, date, week, month } = filter;
    const unavailableTimes = await getUnavailableTimes();
    let filteredTimes = [];
    
    if (type === 'time' && date) {
      // Delete specific time on a specific date
      filteredTimes = unavailableTimes.filter(time => time.type === 'time' && time.date === date);
    } else if (type === 'day' && date) {
      // Delete specific day
      filteredTimes = unavailableTimes.filter(time => time.type === 'day' && time.date === date);
    } else if (type === 'week' && week) {
      // Delete specific week
      filteredTimes = unavailableTimes.filter(time => time.type === 'week' && time.week === week);
    } else if (type === 'month' && month) {
      // Delete all days and times in a specific month
      const monthPrefix = month; // Format: 'YYYY-MM'
      filteredTimes = unavailableTimes.filter(time => 
        (time.type === 'day' && time.date.startsWith(monthPrefix)) ||
        (time.type === 'time' && time.date.startsWith(monthPrefix)) ||
        (time.type === 'week' && time.week.startsWith(monthPrefix.split('-')[0]))
      );
    }
    
    // Delete all filtered times
    const deletePromises = filteredTimes.map(time => deleteUnavailableTime(time.id));
    await Promise.all(deletePromises);
    
    return filteredTimes.length;
  } catch (error) {
    console.error('Error deleting unavailable times by filter:', error);
    throw error;
  }
};

// Get promotions
export const getPromotions = async () => {
  try {
    const q = query(collection(db, 'promotions'));
    const querySnapshot = await getDocs(q);
    const promotions = [];
    querySnapshot.forEach((doc) => {
      promotions.push({ id: doc.id, ...doc.data() });
    });
    return promotions;
  } catch (error) {
    console.error('Error getting promotions:', error);
    return [];
  }
};

// Get all treatments
export const getAllTreatments = async () => {
  try {
    const q = query(collection(db, 'treatments'));
    const querySnapshot = await getDocs(q);
    const treatments = [];
    querySnapshot.forEach((doc) => {
      treatments.push({ id: doc.id, ...doc.data() });
    });
    return treatments;
  } catch (error) {
    console.error('Error getting treatments:', error);
    // Return default treatments if there's an error
    return [
      { id: '1', name: 'Depilación Facial', price: 1500, duration: 30 },
      { id: '2', name: 'Depilación Corporal', price: 3000, duration: 60 },
      { id: '3', name: 'Masaje Relajante', price: 2500, duration: 60 },
      { id: '4', name: 'Tratamiento Facial', price: 2000, duration: 45 }
    ];
  }
};

// Get appointments by date
export const getAppointmentsByDate = async (date) => {
  try {
    const q = query(collection(db, 'appointments'), where('date', '==', date));
    const querySnapshot = await getDocs(q);
    const appointments = [];
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    return appointments;
  } catch (error) {
    console.error('Error getting appointments by date:', error);
    return [];
  }
};

// Add promotion
export const addPromotion = async (promotionData) => {
  try {
    const docRef = await addDoc(collection(db, 'promotions'), promotionData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding promotion:', error);
    throw error;
  }
};

// Get announcements
export const getAnnouncements = async () => {
  try {
    const q = query(collection(db, 'announcements'));
    const querySnapshot = await getDocs(q);
    const announcements = [];
    querySnapshot.forEach((doc) => {
      announcements.push({ id: doc.id, ...doc.data() });
    });
    return announcements;
  } catch (error) {
    console.error('Error getting announcements:', error);
    return [];
  }
};

// Add announcement
export const addAnnouncement = async (announcementData) => {
  try {
    const docRef = await addDoc(collection(db, 'announcements'), announcementData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding announcement:', error);
    throw error;
  }
};

// Get featured services
export const getFeaturedServices = async (): Promise<FeaturedService[]> => {
  try {
    const q = query(collection(db, 'featuredServices'));
    const querySnapshot = await getDocs(q);
    const featuredServices: FeaturedService[] = [];
    querySnapshot.forEach((doc) => {
      featuredServices.push({ id: doc.id, ...doc.data() } as FeaturedService);
    });
    return featuredServices;
  } catch (error) {
    console.error('Error getting featured services:', error);
    return [];
  }
};

// Add featured service
export const addFeaturedService = async (serviceData: Omit<FeaturedService, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'featuredServices'), serviceData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding featured service:', error);
    throw error;
  }
};

// Delete featured service
export const deleteFeaturedService = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'featuredServices', id));
    return true;
  } catch (error) {
    console.error('Error deleting featured service:', error);
    throw error;
  }
};

// Update featured service
export const updateFeaturedService = async (id: string, serviceData: Partial<FeaturedService>) => {
  try {
    await updateDoc(doc(db, 'featuredServices', id), serviceData);
    return true;
  } catch (error) {
    console.error('Error updating featured service:', error);
    throw error;
  }
};

// Initialize Firestore on app startup
initializeFirestore();