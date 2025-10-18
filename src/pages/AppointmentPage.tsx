import React from 'react';
import AppointmentSystem from '../components/AppointmentSystem';

const AppointmentPage = () => {
  console.log('AppointmentPage rendered');
  return (
    <div className="min-h-screen bg-gray-50">
      <AppointmentSystem />
    </div>
  );
};

export default AppointmentPage;