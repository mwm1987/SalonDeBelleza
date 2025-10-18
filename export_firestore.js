import fs from "fs";
import admin from "firebase-admin";

// Inicialización con tu clave de servicio
admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json"),
});

const db = admin.firestore();

// 🔁 Función recursiva para recorrer colecciones y subcolecciones
async function exportCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  const data = {};

  for (const doc of snapshot.docs) {
    const docData = doc.data();
    data[doc.id] = { ...docData };

    // Buscar subcolecciones dentro del documento
    const subcollections = await doc.ref.listCollections();
    if (subcollections.length > 0) {
      data[doc.id]._subcollections = {};
      for (const sub of subcollections) {
        data[doc.id]._subcollections[sub.id] = await exportCollection(sub);
      }
    }
  }

  return data;
}

async function main() {
  console.log("⏳ Exportando base de datos Firestore...");
  const collections = await db.listCollections();
  const exportData = {};

  for (const collection of collections) {
    console.log("📁 Colección:", collection.id);
    exportData[collection.id] = await exportCollection(collection);
  }

  // Guardar el resultado como archivo JSON legible
  const outputPath = "./firestore_export.txt";
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

  console.log("✅ Exportación completa. Archivo guardado en:", outputPath);
}

main().catch(console.error);
