import React, { useState } from 'react';
import {
  Heart,
  Shield,
  Star,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  Feather,
  Eye,
  Waves,
  Hand,
  Sparkles,
  Zap,
  Calendar
} from 'lucide-react';

interface TreatmentCardProps {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  icon: React.ReactNode;
  headerColor: string;
  benefits: string[];
  children: React.ReactNode;
}

const TreatmentCard: React.FC<TreatmentCardProps> = ({
  id,
  title,
  subtitle,
  duration,
  icon,
  headerColor,
  benefits,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDetails = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 transition-all duration-300 border border-gray-100 hover:shadow-2xl hover:-translate-y-1">
      <div className={`p-8 relative text-white overflow-hidden bg-gradient-to-br ${headerColor}`}>
        <div className="absolute top-0 right-0 opacity-10 transform rotate-12 scale-[3]">
          {icon}
        </div>
        <div className="flex items-center gap-4 mb-2 relative z-10">
          {icon}
          <h2 className="text-3xl font-bold">{title}</h2>
        </div>
        <p className="text-lg opacity-90 mb-6">{subtitle}</p>
        <div className="flex gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={16} />
            <span>Profesional Certificada</span>
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <h3 className="text-xl font-semibold mb-4">Principales Beneficios:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
        
        <button
          onClick={toggleDetails}
          className="w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white border-none py-4 px-6 rounded-xl font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/30"
        >
          <span>{isExpanded ? 'Ocultar Información' : 'Ver Información Completa'}</span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 p-8 border-t border-gray-200 animate-in slide-in-from-top-4 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

const InfoBox: React.FC<{
  type: 'info' | 'success' | 'warning';
  title: string;
  children: React.ReactNode;
}> = ({ type, title, children }) => {
  const styles = {
    info: 'bg-blue-50 border-blue-400 text-blue-900',
    success: 'bg-green-50 border-green-400 text-green-900',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-900'
  };

  const icons = {
    info: <Info size={20} />,
    success: <CheckCircle size={20} />,
    warning: <AlertTriangle size={20} />
  };

  return (
    <div className={`border-l-4 p-6 my-6 rounded-r-lg ${styles[type]}`}>
      <div className="flex items-center gap-3 font-semibold mb-4">
        {icons[type]}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
};

const TratamientosEsteticos: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 font-sans leading-relaxed">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-violet-600 via-pink-500 to-blue-500 text-white py-16 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-8 flex items-center justify-center">
            <Heart size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Tratamientos Estéticos</h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-4xl mx-auto">
            Descubre nuestros tratamientos profesionales diseñados para realzar tu belleza natural con técnicas avanzadas y resultados duraderos
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Shield size={16} />
              <span>Materiales Certificados</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star size={16} />
              <span>Técnicas Avanzadas</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Heart size={16} />
              <span>Resultados Naturales</span>
            </div>
          </div>
        </div>
      </div>

      {/* Treatments Container */}
      <div className="max-w-6xl mx-auto py-12 px-6">
        
        {/* Microblading */}
        <TreatmentCard
          id="microblading"
          title="Microblading"
          subtitle="Maquillaje semipermanente para cejas, labios y párpados"
          duration="1-2 años"
          icon={<Star size={32} />}
          headerColor="from-violet-600 to-pink-500"
          benefits={[
            "Diseño personalizado",
            "Ahorra tiempo en maquillaje",
            "Corrige asimetrías",
            "Técnica segura y probada"
          ]}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">¿Qué es el Microblading?</h3>
              <p>El Microblading es una técnica de maquillaje semipermanente que crea un diseño personalizado para realzar tus rasgos faciales. Con una durabilidad de 1-2 años, el procedimiento se realiza en la capa basal de la epidermis, siendo completamente seguro y de bajo riesgo.</p>
            </div>

            <InfoBox type="success" title="Tipos de Microblading Disponibles">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-violet-600 font-semibold mb-2">Cejas</h5>
                  <p className="text-sm text-gray-600">Diseño completo con técnica pelo a pelo para un resultado natural</p>
                </div>
                <div>
                  <h5 className="text-pink-500 font-semibold mb-2">Labios</h5>
                  <p className="text-sm text-gray-600">Perfilado y relleno de labios con pigmentación natural</p>
                </div>
                <div>
                  <h5 className="text-blue-500 font-semibold mb-2">Párpados</h5>
                  <p className="text-sm text-gray-600">Delineado sutil para realzar la mirada naturalmente</p>
                </div>
              </div>
            </InfoBox>

            <div>
              <h4 className="text-lg font-semibold mb-4">Proceso Profesional</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h5 className="font-semibold mb-2">1. Diseño y Aprobación</h5>
                  <p className="text-sm text-gray-600">Creamos el diseño perfecto según tu rostro y preferencias</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h5 className="font-semibold mb-2">2. Antisepsia y Anestesia</h5>
                  <p className="text-sm text-gray-600">Preparación profesional con anestesia tópica local</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h5 className="font-semibold mb-2">3. Aplicación Técnica</h5>
                  <p className="text-sm text-gray-600">Microincisiones precisas con pigmentos certificados</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h5 className="font-semibold mb-2">4. Seguimiento</h5>
                  <p className="text-sm text-gray-600">Cuidados post-tratamiento y retoque incluido</p>
                </div>
              </div>
            </div>

            <InfoBox type="info" title="Cuidados Post-Tratamiento">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-blue-700 font-semibold mb-2">Primeros 7 días:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Mantener la zona seca</li>
                    <li>• Aplicar pomada cicatrizante</li>
                    <li>• No tocar ni rascar</li>
                    <li>• Evitar ejercicio intenso</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-blue-700 font-semibold mb-2">Siguientes 30 días:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Usar protector solar</li>
                    <li>• Evitar piscinas y saunas</li>
                    <li>• No usar maquillaje en la zona</li>
                    <li>• Hidratar suavemente</li>
                  </ul>
                </div>
              </div>
            </InfoBox>

            <InfoBox type="warning" title="Contraindicaciones">
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div>• Embarazo y lactancia</div>
                <div>• Diabetes descompensada</div>
                <div>• Enfermedades autoinmunes</div>
                <div>• Tratamientos con anticoagulantes</div>
                <div>• Infecciones activas en la zona</div>
                <div>• Alergia a pigmentos</div>
              </div>
            </InfoBox>
          </div>
        </TreatmentCard>

        {/* Criolipólisis */}
        <TreatmentCard
          id="criolipolisis"
          title="Criolipólisis"
          subtitle="Eliminación de grasa localizada sin cirugía"
          duration="35-60 minutos por zona"
          icon={<Shield size={32} />}
          headerColor="from-blue-500 to-cyan-500"
          benefits={[
            "Elimina grasa localizada definitivamente",
            "Procedimiento no invasivo",
            "Sin tiempo de recuperación",
            "Resultados visibles en 2-3 meses"
          ]}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">¿Qué es la Criolipólisis?</h3>
              <p>La criolipólisis es un tratamiento no invasivo que utiliza frío controlado para eliminar células grasas de manera definitiva. El procedimiento congela las células adiposas, que posteriormente son eliminadas naturalmente por el organismo, reduciendo el volumen de grasa en la zona tratada.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-4">Zonas Tratables</h4>
                <div className="space-y-3">
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 mb-2">Abdomen y Flancos</h5>
                    <p className="text-xs text-blue-700">Zona más popular para eliminar la "pancita" y los rollitos laterales</p>
                  </div>
                  <div className="bg-cyan-100 border border-cyan-300 rounded-lg p-4">
                    <h5 className="font-semibold text-cyan-800 mb-2">Pantalón de Montar</h5>
                    <p className="text-xs text-cyan-700">Reduce la acumulación de grasa en caderas y muslos externos</p>
                  </div>
                  <div className="bg-indigo-100 border border-indigo-300 rounded-lg p-4">
                    <h5 className="font-semibold text-indigo-800 mb-2">Brazos</h5>
                    <p className="text-xs text-indigo-700">Elimina la grasa acumulada en la parte posterior de los brazos</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Proceso del Tratamiento</h4>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">1</div>
                    <div>
                      <h5 className="font-semibold mb-1">Evaluación</h5>
                      <p className="text-sm text-gray-600">Medición y marcado de la zona a tratar</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">2</div>
                    <div>
                      <h5 className="font-semibold mb-1">Aplicación</h5>
                      <p className="text-sm text-gray-600">Colocación del aplicador y enfriamiento controlado</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">3</div>
                    <div>
                      <h5 className="font-semibold mb-1">Masaje Post-tratamiento</h5>
                      <p className="text-sm text-gray-600">Estimulación manual para facilitar la eliminación de grasas</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">4</div>
                    <div>
                      <h5 className="font-semibold mb-1">Resultados Progresivos</h5>
                      <p className="text-sm text-gray-600">Evolución visible durante 2-3 meses post-tratamiento</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <InfoBox type="info" title="Recomendaciones Post-Tratamiento">
              <ul className="list-none space-y-1 text-sm">
                <li>• Beber al menos 2 litros de agua diarios</li>
                <li>• Mantener una alimentación equilibrada</li>
                <li>• Realizar actividad física regular</li>
                <li>• Evitar consumo de alcohol 48 horas post-tratamiento</li>
                <li>• Seguir las indicaciones específicas del profesional</li>
              </ul>
            </InfoBox>
          </div>
        </TreatmentCard>

        {/* Depilación con Cera */}
        <TreatmentCard
          id="depilacion"
          title="Depilación con Cera"
          subtitle="Piel suave y libre de vello por más tiempo"
          duration="15-45 minutos"
          icon={<Feather size={32} />}
          headerColor="from-amber-500 to-orange-500"
          benefits={[
            "Resultados duraderos (3-6 semanas)",
            "Vello más fino y débil con el tiempo",
            "Exfoliación natural de la piel",
            "Técnica higiénica y profesional"
          ]}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Depilación Profesional con Cera</h3>
              <p>Nuestro servicio de depilación con cera utiliza productos de alta calidad y técnicas profesionales para garantizar resultados óptimos con mínimo dolor. La cera empleada es hipoalergénica y se aplica a temperatura ideal para respetar tu piel.</p>
            </div>

            <InfoBox type="success" title="Zonas de Tratamiento">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-amber-100 border border-amber-300 rounded-lg p-3">
                  <h5 className="font-semibold text-amber-800 text-sm">Axilas</h5>
                  <p className="text-xs text-amber-700">Zona delicada con técnica especializada</p>
                </div>
                <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                  <h5 className="font-semibold text-orange-800 text-sm">Cavado</h5>
                  <p className="text-xs text-orange-700">Tratamiento preciso para zona íntima</p>
                </div>
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                  <h5 className="font-semibold text-yellow-800 text-sm">Media Pierna</h5>
                  <p className="text-xs text-yellow-700">Desde rodilla hasta tobillo</p>
                </div>
                <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                  <h5 className="font-semibold text-red-800 text-sm">Perfilado de Cejas</h5>
                  <p className="text-xs text-red-700">Diseño profesional según tu rostro</p>
                </div>
                <div className="bg-pink-100 border border-pink-300 rounded-lg p-3">
                  <h5 className="font-semibold text-pink-800 text-sm">Pierna Entera</h5>
                  <p className="text-xs text-pink-700">Tratamiento completo de piernas</p>
                </div>
                <div className="bg-purple-100 border border-purple-300 rounded-lg p-3">
                  <h5 className="font-semibold text-purple-800 text-sm">Rostro Completo</h5>
                  <p className="text-xs text-purple-700">Labio, mentón, patillas y cejas</p>
                </div>
              </div>
            </InfoBox>

            <InfoBox type="warning" title="Contraindicaciones">
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div>• Diabetes avanzada</div>
                <div>• Problemas de circulación severos</div>
                <div>• Varices importantes</div>
                <div>• Heridas o irritaciones en la zona</div>
                <div>• Tratamientos con isotretinoína</div>
                <div>• Quimioterapia o radioterapia reciente</div>
              </div>
            </InfoBox>
          </div>
        </TreatmentCard>

        {/* Tratamientos Faciales */}
        <TreatmentCard
          id="faciales"
          title="Tratamientos Faciales"
          subtitle="Cuidado integral para tu rostro"
          duration="45-90 minutos por sesión"
          icon={<Sparkles size={32} />}
          headerColor="from-yellow-500 to-amber-500"
          benefits={[
            "Mejora la textura y luminosidad",
            "Reduce imperfecciones",
            "Hidratación profunda",
            "Personalizado según tipo de piel"
          ]}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Tratamientos Faciales Profesionales</h3>
              <p>Ofrecemos una amplia gama de tratamientos faciales especializados para cada tipo de piel y necesidad específica, utilizando tecnología avanzada y productos de alta calidad.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Tratamiento Antiacné</h4>
                <p className="text-sm text-gray-600">Protocolo especializado para piel grasa y con tendencia acneica. Incluye limpieza profunda, extracción profesional y tratamiento con activos específicos.</p>
              </div>
              <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Tratamiento Antiage</h4>
                <p className="text-sm text-gray-600">Combate los signos del envejecimiento con técnicas que estimulan la producción de colágeno y mejoran la elasticidad cutánea.</p>
              </div>
              <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Dermapen</h4>
                <p className="text-sm text-gray-600">Microagujas que estimulan la regeneración celular, ideales para cicatrices, poros dilatados y textura irregular.</p>
              </div>
              <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-green-800 mb-2">Dermaplaning</h4>
                <p className="text-sm text-gray-600">Exfoliación mecánica que elimina células muertas y vello facial, dejando la piel ultra suave y receptiva a tratamientos posteriores.</p>
              </div>
              <div className="bg-teal-100 border-l-4 border-teal-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-teal-800 mb-2">Higiene Facial Profunda</h4>
                <p className="text-sm text-gray-600">Limpieza completa con extracción de impurezas, mascarillas específicas y finalización con productos hidratantes.</p>
              </div>
              <div className="bg-pink-100 border-l-4 border-pink-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-pink-800 mb-2">Tratamiento Reafirmante</h4>
                <p className="text-sm text-gray-600">Combina radiofrecuencia y activos tensores para mejorar la firmeza y definición del óvalo facial.</p>
              </div>
            </div>

            <InfoBox type="info" title="Proceso de Aplicación">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">1</div>
                  <div>
                    <h5 className="font-semibold mb-1">Limpieza y Preparación</h5>
                    <p className="text-sm text-gray-600">Desmaquillado y acondicionamiento de la piel</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">2</div>
                  <div>
                    <h5 className="font-semibold mb-1">Aplicación</h5>
                    <p className="text-sm text-gray-600">Técnica precisa según el tratamiento seleccionado</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">3</div>
                  <div>
                    <h5 className="font-semibold mb-1">Fijación y Secado</h5>
                    <p className="text-sm text-gray-600">Tiempo necesario para fijar el tratamiento</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">4</div>
                  <div>
                    <h5 className="font-semibold mb-1">Revisión Final</h5>
                    <p className="text-sm text-gray-600">Ajustes y recomendaciones de cuidado</p>
                  </div>
                </div>
              </div>
            </InfoBox>

            <InfoBox type="warning" title="Cuidados Post-Tratamiento">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-amber-800 font-semibold mb-2">Primeras 24-48 horas:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Evitar exposición solar directa</li>
                    <li>• No aplicar maquillaje</li>
                    <li>• Evitar saunas y piscinas</li>
                    <li>• No exfoliar la piel</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-amber-800 font-semibold mb-2">Mantenimiento:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Usar protector solar diariamente</li>
                    <li>• Mantener hidratación adecuada</li>
                    <li>• Seguir rutina recomendada</li>
                    <li>• Repetir tratamiento según indicación</li>
                  </ul>
                </div>
              </div>
            </InfoBox>

            <InfoBox type="info" title="Cronograma Recomendado">
              <div className="bg-gradient-to-r from-amber-100 to-yellow-200 p-4 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-amber-800 mb-2">Fase Intensiva:</h5>
                    <p className="text-sm text-gray-600">4-6 sesiones con intervalos de 1-2 semanas</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-amber-800 mb-2">Mantenimiento:</h5>
                    <p className="text-sm text-gray-600">1 sesión mensual para sostener resultados</p>
                  </div>
                </div>
              </div>
            </InfoBox>
          </div>
        </TreatmentCard>

        {/* Tratamientos Corporales */}
        <TreatmentCard
          id="corporales"
          title="Tratamientos Corporales"
          subtitle="Soluciones efectivas para tu cuerpo"
          duration="60-90 minutos por sesión"
          icon={<Waves size={32} />}
          headerColor="from-cyan-500 to-blue-500"
          benefits={[
            "Reduce medidas y volumen",
            "Mejora la textura de la piel",
            "Combate la celulitis",
            "Resultados visibles desde primeras sesiones"
          ]}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Tratamientos Corporales Especializados</h3>
              <p>Nuestros tratamientos corporales combinan tecnología avanzada con técnicas manuales para ayudarte a conseguir el cuerpo que deseas de forma segura y efectiva.</p>
            </div>

            <div className="bg-cyan-100 border-l-4 border-cyan-500 p-6 rounded-r-lg mb-6">
              <h4 className="font-semibold text-cyan-800 mb-3">Tratamiento Anticelulítico (Celulitis)</h4>
              <p className="mb-4 text-gray-600">Protocolo integral que combina drenaje linfático, radiofrecuencia y masajes específicos para mejorar la apariencia de la piel de naranja y activar la circulación.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h5 className="font-semibold text-cyan-700 mb-2">Beneficios:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Mejora textura de la piel</li>
                    <li>• Reduce nódulos celulíticos</li>
                    <li>• Activa circulación</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h5 className="font-semibold text-cyan-700 mb-2">Zonas tratadas:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Glúteos</li>
                    <li>• Muslos</li>
                    <li>• Abdomen</li>
                    <li>• Brazos</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-100 border-l-4 border-blue-500 p-6 rounded-r-lg mb-6">
              <h4 className="font-semibold text-blue-800 mb-3">Tratamiento Reductor</h4>
              <p className="mb-4 text-gray-600">Combinación de técnicas que favorecen la eliminación de grasa localizada y mejoran el contorno corporal, con resultados medibles desde las primeras sesiones.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h5 className="font-semibold text-blue-700 mb-2">Incluye:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Ultrasonido cavitacional</li>
                    <li>• Radiofrecuencia</li>
                    <li>• Masaje reductor</li>
                    <li>• Vendas frías</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h5 className="font-semibold text-blue-700 mb-2">Duración del tratamiento:</h5>
                  <p className="text-sm text-gray-600">Se recomiendan 8-10 sesiones, 1-2 veces por semana para resultados óptimos.</p>
                </div>
              </div>
            </div>

            <InfoBox type="info" title="Plan de Tratamiento Corporal">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h5 className="font-semibold text-blue-700 mb-2">Fase Intensiva</h5>
                  <p className="text-sm text-gray-600">2 sesiones semanales durante 4-6 semanas</p>
                </div>
                <div>
                  <h5 className="font-semibold text-purple-700 mb-2">Fase de Mantenimiento</h5>
                  <p className="text-sm text-gray-600">1 sesión cada 15 días durante 2 meses</p>
                </div>
                <div>
                  <h5 className="font-semibold text-pink-700 mb-2">Fase de Conservación</h5>
                  <p className="text-sm text-gray-600">1 sesión mensual para mantener resultados</p>
                </div>
              </div>
            </InfoBox>

            <InfoBox type="warning" title="Contraindicaciones">
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div>• Fiebre o infecciones agudas</div>
                <div>• Flebitis o trombosis</div>
                <div>• Enfermedades contagiosas de piel</div>
                <div>• Fracturas recientes no consolidadas</div>
                <div>• Embarazo de alto riesgo (primer trimestre)</div>
                <div>• Tumores malignos no tratados</div>
              </div>
            </InfoBox>

            <InfoBox type="success" title="Recomendaciones Complementarias">
              <ul className="space-y-1 text-sm">
                <li>• Hidratación constante (2-3 litros de agua diarios)</li>
                <li>• Alimentación balanceada rica en proteínas y fibra</li>
                <li>• Actividad física regular (3-4 veces por semana)</li>
                <li>• Evitar alcohol y tabaco durante el tratamiento</li>
                <li>• Usar cremas reafirmantes recomendadas</li>
              </ul>
            </InfoBox>

            <InfoBox type="success" title="Frecuencia Recomendada">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h5 className="font-semibold text-green-700 mb-2">Bienestar General</h5>
                  <p className="text-sm text-gray-600">1-2 veces al mes para mantenimiento</p>
                </div>
                <div>
                  <h5 className="font-semibold text-green-700 mb-2">Estrés Laboral</h5>
                  <p className="text-sm text-gray-600">Semanal durante períodos de alta exigencia</p>
                </div>
                <div>
                  <h5 className="font-semibold text-green-700 mb-2">Dolor Crónico</h5>
                  <p className="text-sm text-gray-600">2-3 veces por semana inicialmente</p>
                </div>
              </div>
            </InfoBox>
          </div>
        </TreatmentCard>

        {/* Tratamientos de Pestañas */}
        <TreatmentCard
          id="pestanas"
          title="Tratamientos de Pestañas"
          subtitle="Realza tu mirada con pestañas espectaculares"
          duration="60-120 minutos"
          icon={<Eye size={32} />}
          headerColor="from-pink-500 to-rose-500"
          benefits={[
            "Mirada más expresiva y abierta",
            "Ahorro de tiempo en maquillaje diario",
            "Resultados naturales y duraderos",
            "Técnicas personalizadas según tu tipo de ojo"
          ]}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Servicios para Pestañas</h3>
              <p>Nuestros tratamientos de pestañas están diseñados para realzar tu mirada de forma natural, utilizando productos de alta calidad y técnicas avanzadas que respetan la salud de tus pestañas naturales.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-pink-100 border-l-4 border-pink-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-pink-800 mb-2">Lifting de Pestañas</h4>
                <p className="text-sm text-gray-600">Técnica que curva y levanta tus pestañas naturales desde la raíz, creando un efecto de pestañas más largas y definidas sin extensiones.</p>
              </div>
              <div className="bg-rose-100 border-l-4 border-rose-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-rose-800 mb-2">Tinte de Pestañas</h4>
                <p className="text-sm text-gray-600">Coloración semipermanente que oscurece tus pestañas naturales, ideal para quienes tienen pestañas claras o desean un look más intenso.</p>
              </div>
              <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Extensiones Pelo a Pelo</h4>
                <p className="text-sm text-gray-600">Aplicación meticulosa de pestañas sintéticas individuales sobre cada pestaña natural, creando un efecto personalizado y natural.</p>
              </div>
              <div className="bg-violet-100 border-l-4 border-violet-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-violet-800 mb-2">Extensiones Volumen Ruso</h4>
                <p className="text-sm text-gray-600">Técnica avanzada que aplica múltiples extensiones ultraligeras en cada pestaña natural, creando un efecto de volumen dramático.</p>
              </div>
            </div>

            <InfoBox type="info" title="Proceso de Aplicación">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="bg-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">1</div>
                  <div>
                    <h5 className="font-semibold mb-1">Consulta y Diseño</h5>
                    <p className="text-sm text-gray-600">Evaluamos la forma de tus ojos y definimos el estilo ideal</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">2</div>
                  <div>
                    <h5 className="font-semibold mb-1">Preparación</h5>
                    <p className="text-sm text-gray-600">Limpieza profunda del área y protección de la piel</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">3</div>
                  <div>
                    <h5 className="font-semibold mb-1">Aplicación</h5>
                    <p className="text-sm text-gray-600">Técnica precisa según el tratamiento seleccionado</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">4</div>
                  <div>
                    <h5 className="font-semibold mb-1">Fijación y Secado</h5>
                    <p className="text-sm text-gray-600">Tiempo necesario para fijar el tratamiento</p>
                  </div>
                </div>
              </div>
            </InfoBox>

            <InfoBox type="warning" title="Cuidados Post-Tratamiento">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-rose-800 font-semibold mb-2">Primeras 24-48 horas:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Evitar mojar las pestañas</li>
                    <li>• No usar maquillaje en la zona</li>
                    <li>• Evitar frotar o tocar las pestañas</li>
                    <li>• No usar rizador de pestañas</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-rose-800 font-semibold mb-2">Mantenimiento:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Limpiar suavemente con productos específicos</li>
                    <li>• Evitar productos a base de aceite</li>
                    <li>• Peinar diariamente con cepillo limpio</li>
                    <li>• Retoque cada 3-4 semanas (extensiones)</li>
                  </ul>
                </div>
              </div>
            </InfoBox>
          </div>
        </TreatmentCard>

        {/* Masajes Terapéuticos */}
        <TreatmentCard
          id="masajes"
          title="Masajes Terapéuticos"
          subtitle="Bienestar integral para cuerpo y mente"
          duration="60-90 minutos"
          icon={<Hand size={32} />}
          headerColor="from-teal-500 to-green-500"
          benefits={[
            "Alivia tensiones musculares",
            "Mejora la circulación sanguínea",
            "Reduce el estrés y la ansiedad",
            "Promueve la relajación profunda"
          ]}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Masajes Profesionales</h3>
              <p>Nuestros masajes terapéuticos combinan diferentes técnicas para aliviar tensiones, mejorar la circulación y proporcionar una sensación de bienestar general, adaptándose a tus necesidades específicas.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-teal-100 border-l-4 border-teal-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-teal-800 mb-2">Masaje Descontracturante</h4>
                <p className="text-sm text-gray-600">Enfocado en liberar tensiones musculares profundas y aliviar dolores específicos mediante presión controlada y técnicas de estiramiento.</p>
              </div>
              <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-green-800 mb-2">Masaje Relajante</h4>
                <p className="text-sm text-gray-600">Movimientos suaves y envolventes que inducen a un estado de relajación profunda, ideal para reducir el estrés y mejorar la calidad del sueño.</p>
              </div>
              <div className="bg-emerald-100 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-emerald-800 mb-2">Drenaje Linfático</h4>
                <p className="text-sm text-gray-600">Técnica específica que estimula el sistema linfático para eliminar toxinas, reducir la retención de líquidos y mejorar el sistema inmunológico.</p>
              </div>
              <div className="bg-cyan-100 border-l-4 border-cyan-500 p-4 rounded-r-lg">
                <h4 className="font-semibold text-cyan-800 mb-2">Reflexología Podal</h4>
                <p className="text-sm text-gray-600">Masaje en puntos específicos de los pies que se corresponden con órganos y sistemas del cuerpo, promoviendo el equilibrio energético general.</p>
              </div>
            </div>

            <InfoBox type="info" title="¿Qué esperar durante tu sesión?">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="bg-teal-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">1</div>
                  <div>
                    <h5 className="font-semibold mb-1">Consulta Inicial</h5>
                    <p className="text-sm text-gray-600">Evaluamos tus necesidades y preferencias</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-teal-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">2</div>
                  <div>
                    <h5 className="font-semibold mb-1">Preparación</h5>
                    <p className="text-sm text-gray-600">Te ofrecemos un ambiente tranquilo y privado</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-teal-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">3</div>
                  <div>
                    <h5 className="font-semibold mb-1">Aplicación</h5>
                    <p className="text-sm text-gray-600">Masaje personalizado con técnicas profesionales</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-teal-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">4</div>
                  <div>
                    <h5 className="font-semibold mb-1">Recomendaciones</h5>
                    <p className="text-sm text-gray-600">Consejos para prolongar los beneficios del masaje</p>
                  </div>
                </div>
              </div>
            </InfoBox>

            <InfoBox type="success" title="Beneficios para la Salud">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <h5 className="font-semibold text-teal-700 mb-2">Beneficios Físicos:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Alivio del dolor muscular</li>
                    <li>• Mejora de la flexibilidad</li>
                    <li>• Fortalecimiento del sistema inmune</li>
                    <li>• Mejor calidad de sueño</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <h5 className="font-semibold text-teal-700 mb-2">Beneficios Mentales:</h5>
                  <ul className="list-none space-y-1 text-sm text-gray-600">
                    <li>• Reducción de ansiedad</li>
                    <li>• Disminución del estrés</li>
                    <li>• Mejora del estado de ánimo</li>
                    <li>• Mayor claridad mental</li>
                  </ul>
                </div>
              </div>
            </InfoBox>

            <InfoBox type="warning" title="Contraindicaciones">
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div>• Fiebre o infecciones agudas</div>
                <div>• Flebitis o trombosis</div>
                <div>• Enfermedades contagiosas de piel</div>
                <div>• Fracturas recientes no consolidadas</div>
                <div>• Embarazo de alto riesgo (primer trimestre)</div>
                <div>• Tumores malignos no tratados</div>
              </div>
            </InfoBox>
          </div>
        </TreatmentCard>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-violet-600 to-pink-500 text-white rounded-3xl p-12 text-center mt-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Lista para tu transformación?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-4xl mx-auto">
            Reserva tu consulta gratuita y descubre el tratamiento perfecto para tus necesidades. Nuestras especialistas te guiarán hacia los mejores resultados.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reserva Online</h3>
              <p className="text-sm opacity-90">Agenda tu cita fácilmente desde nuestro sistema online</p>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seguridad Garantizada</h3>
              <p className="text-sm opacity-90">Materiales certificados y protocolos de higiene exhaustivos</p>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Resultados Naturales</h3>
              <p className="text-sm opacity-90">Técnicas que realzan tu belleza natural sin excesos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TratamientosEsteticos;