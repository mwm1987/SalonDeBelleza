import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar las credenciales de Firebase
const serviceAccount = JSON.parse(
  await readFile(resolve(__dirname, 'serviceAccountKey.json'), 'utf8')
);

// Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Definir membresías VIP
const memberships = [
  {
    name: "VIP Esencial",
    price: 15000,
    description: "Acceso inicial al Club VIP, pensado para quienes quieren comenzar a disfrutar beneficios exclusivos.",
    features: [
      "10% de descuento en todos los tratamientos",
      "1 sesión de diagnóstico gratuito al mes",
      "Acceso prioritario a promociones especiales"
    ],
    duration: "1 mes",
    active: true,
    recommended: false
  },
  {
    name: "VIP Premium",
    price: 35000,
    description: "El plan más elegido: combina ahorro, beneficios y flexibilidad para que disfrutes al máximo.",
    features: [
      "20% de descuento en todos los tratamientos",
      "2 diagnósticos gratuitos al mes",
      "Acceso anticipado a nuevas promociones",
      "1 servicio facial express de cortesía"
    ],
    duration: "3 meses",
    active: true,
    recommended: true
  },
  {
    name: "VIP Elite",
    price: 90000,
    description: "La experiencia definitiva para quienes buscan un nivel exclusivo de atención y beneficios premium.",
    features: [
      "30% de descuento en todos los tratamientos",
      "Diagnóstico y seguimiento personalizado ilimitado",
      "Turnos preferenciales en cualquier horario",
      "2 servicios premium de cortesía por mes",
      "Regalo sorpresa exclusivo cada temporada"
    ],
    duration: "12 meses",
    active: true,
    recommended: false
  }
];

async function addMemberships() {
  try {
    for (const membership of memberships) {
      const data = {
        ...membership,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('vipMemberships').add(data);
      console.log(`Added membership: ${membership.name}`);
    }

    console.log('All memberships added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding memberships:', error);
    process.exit(1);
  }
}

addMemberships();
