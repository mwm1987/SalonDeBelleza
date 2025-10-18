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

// Definir los tratamientos con sus zonas y descripciones
const tratamientos = [
  {
    name: "Depilación con cera",
    description: "Método de depilación tradicional que elimina el vello desde la raíz, dejando la piel suave por más tiempo.",
    zonas: ["Axilas", "Cavado", "Media Pierna", "Pierna Entera", "Rostro Completo", "Perfilado de cejas"],
    price: 0,
    duration: 0
  },
  {
    name: "Criolipolisis",
    description: "Técnica de reducción localizada de grasa mediante frío controlado, sin cirugía.",
    zonas: ["Aductores", "Abdomen y flancos", "Brazos", "Bajo corpiño", "Pantalón de montar", "Promo 3 zonas"],
    price: 0,
    duration: 0
  },
  {
    name: "Drenaje linfático",
    description: "Masaje específico que estimula la circulación linfática, reduciendo retención de líquidos y toxinas.",
    zonas: [],
    price: 0,
    duration: 0
  },
  {
    name: "Masaje",
    description: "Masaje relajante o descontracturante para aliviar tensión muscular y mejorar la circulación.",
    zonas: [],
    price: 0,
    duration: 0
  },
  {
    name: "Pestañas",
    description: "Realce estético de las pestañas: lifting, extensiones o permanentes para una mirada más definida.",
    zonas: ["Extensiones pelo por pelo", "Lifting", "Permanentes"],
    price: 0,
    duration: 0
  },
  {
    name: "Tratamiento Facial",
    description: "Tratamientos para mejorar la piel del rostro: antiacné, antiage, limpieza profunda, dermapen, etc.",
    zonas: ["Acné", "Antiage", "Dermapen", "Dermaplaning", "Higiene", "Reafirmante"],
    price: 0,
    duration: 0
  },
  {
    name: "Tratamiento Corporal",
    description: "Tratamientos que ayudan a reducir celulitis, flacidez y mejorar la tonicidad corporal.",
    zonas: ["Celulitis", "Electroestimulación", "Flacidez"],
    price: 0,
    duration: 0
  },
  {
    name: "Tratamiento Capilar",
    description: "Terapias capilares para fortalecer el cabello, mejorar la caída y nutrir el cuero cabelludo.",
    zonas: [],
    price: 0,
    duration: 0
  },
  {
    name: "Microblading",
    description: "Técnica semipermanente para diseño de cejas, labios o párpados con efecto natural.",
    zonas: ["Cejas", "Labios", "Párpados"],
    price: 0,
    duration: 0
  }
];

async function addTreatments() {
  try {
    for (const tratamiento of tratamientos) {
      if (tratamiento.zonas.length > 0) {
        // Si tiene zonas, crear un tratamiento para cada zona
        for (const zona of tratamiento.zonas) {
          const treatmentData = {
            name: `${tratamiento.name} - ${zona}`,
            description: tratamiento.description,
            price: tratamiento.price,
            duration: tratamiento.duration,
            zone: tratamiento.name,
            image: "",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          await db.collection('treatments').add(treatmentData);
          console.log(`Added: ${treatmentData.name}`);
        }
      } else {
        // Si no tiene zonas, crear un solo tratamiento
        const treatmentData = {
          name: tratamiento.name,
          description: tratamiento.description,
          price: tratamiento.price,
          duration: tratamiento.duration,
          zone: tratamiento.name,
          image: "",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('treatments').add(treatmentData);
        console.log(`Added: ${treatmentData.name}`);
      }
    }
    
    console.log('All treatments added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding treatments:', error);
    process.exit(1);
  }
}

addTreatments();