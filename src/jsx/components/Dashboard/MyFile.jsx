import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, User, FileText, TrendingUp, Camera, Download, Plus, Edit3, Eye, X } from 'lucide-react';

const PatientRecord = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showAddStudy, setShowAddStudy] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Datos de ejemplo del paciente
  const patientData = {
    id: "PAC-001",
    name: "María González López",
    age: 28,
    gender: "Femenino",
    phone: "+52 33 1234-5678",
    email: "maria.gonzalez@email.com",
    diagnosis: "Genu Valgo Bilateral",
    doctor: "Dr. Roberto Martínez",
    registrationDate: "2024-01-15",
    lastVisit: "2024-07-15"
  };

  // Datos de evolución para gráficas (incluyendo nuevos campos para radiografía e impedancia)
  const evolutionData = [
    { date: '2024-01', genuVaro: 15, genuValgo: -8, pisada: 'Pronadora', dolor: 7, anguloDiafisario: 15, anguloTibioFemoral: 178, impedancia: 5000 },
    { date: '2024-03', genuVaro: 12, genuValgo: -6, pisada: 'Neutra', dolor: 5, anguloDiafisario: 14, anguloTibioFemoral: 176, impedancia: 4800 },
    { date: '2024-05', genuVaro: 8, genuValgo: -4, pisada: 'Neutra', dolor: 3, anguloDiafisario: 13, anguloTibioFemoral: 175, impedancia: 4500 },
    { date: '2024-07', genuVaro: 5, genuValgo: -2, pisada: 'Neutra', dolor: 2, anguloDiafisario: 12, anguloTibioFemoral: 175, impedancia: 4200 }
  ];

  // Estudios realizados
  const studies = [
    {
      id: 1,
      date: '2024-07-15',
      type: 'Análisis de Pisada',
      results: {
        tipo: 'Pisada Neutra',
        presion: 'Distribuida',
        angulo: '5°',
        observaciones: 'Mejora significativa en distribución de peso'
      },
      images: ['pisada_jul2024.jpg'],
      status: 'Completado'
    },
    {
      id: 2,
      date: '2024-07-15',
      type: 'Análisis Radiográfico Angular',
      results: {
        anguloDiafisario: '12°',
        anguloTibioFemoral: '175°',
        desviacion: 'Leve',
        observaciones: 'Reducción del genu valgo en 2° respecto a estudio anterior'
      },
      images: ['rx_jul2024_1.jpg', 'rx_jul2024_2.jpg'],
      status: 'Completado'
    },
    {
      id: 3,
      date: '2024-05-10',
      type: 'Evaluación Postural',
      results: {
        alineacion: 'Mejorada',
        simetria: '85%',
        compensaciones: 'Mínimas',
        observaciones: 'Progreso notable en alineación general'
      },
      images: ['postura_may2024.jpg'],
      status: 'Completado'
    }
  ];

  // Próximas citas
  const appointments = [
    {
      id: 1,
      date: '2024-08-15',
      time: '10:00',
      type: 'Control Rutinario',
      doctor: 'Dr. Roberto Martínez',
      status: 'Programada'
    },
    {
      id: 2,
      date: '2024-09-15',
      time: '10:00',
      type: 'Análisis de Pisada',
      doctor: 'Dr. Roberto Martínez',
      status: 'Programada'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Completado': 'bg-green-100 text-green-800',
      'Programada': 'bg-blue-100 text-blue-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Cancelada': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleImageClick = (imageName) => {
    setSelectedImage(imageName);
  };

  const tabs = [
    { id: 'general', label: 'Información General', icon: User },
    { id: 'studies', label: 'Estudios', icon: FileText },
    { id: 'evolution', label: 'Evolución', icon: TrendingUp },
    { id: 'appointments', label: 'Citas', icon: Calendar }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header del Paciente */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-full p-4 mr-4">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{patientData.name}</h2>
              <p className="text-gray-600">
                ID: {patientData.id} | {patientData.age} años | {patientData.gender}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Diagnóstico:</span> {patientData.diagnosis}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors">
              <Edit3 size={16} className="mr-1" />
              Editar
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              <Plus size={16} className="mr-1" />
              Nueva Cita
            </button>
          </div>
        </div>
      </div>

      {/* Navegación por Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent size={16} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Información General */}
          {activeTab === 'general' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Datos del Paciente</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Nombre:</span>
                    <span>{patientData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Edad:</span>
                    <span>{patientData.age} años</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Género:</span>
                    <span>{patientData.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Teléfono:</span>
                    <span>{patientData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span className="text-sm">{patientData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Fecha de Registro:</span>
                    <span>{new Date(patientData.registrationDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Información Clínica</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Diagnóstico Principal:</span>
                    <span>{patientData.diagnosis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Médico Tratante:</span>
                    <span>{patientData.doctor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Última Consulta:</span>
                    <span>{new Date(patientData.lastVisit).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Estado del Tratamiento:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">En Progreso</span>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Nivel de Dolor Actual:</span>
                      <span>2/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '20%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Estudios */}
          {activeTab === 'studies' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Historial de Estudios</h3>
                <button 
                  onClick={() => setShowAddStudy(true)}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} className="mr-1" />
                  Nuevo Estudio
                </button>
              </div>

              <div className="space-y-4">
                {studies.map((study) => (
                  <div key={study.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-lg font-medium">{study.type}</h4>
                        <p className="text-gray-600 text-sm">{new Date(study.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(study.status)}`}>
                        {study.status}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <h5 className="font-semibold mb-3">Resultados:</h5>
                        <div className="space-y-2">
                          {Object.entries(study.results).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium w-32 capitalize">{key}:</span>
                              <span className="flex-1">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-semibold mb-3">Imágenes del Estudio:</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {study.images.map((image, index) => (
                            <div 
                              key={index}
                              className="bg-white p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                              onClick={() => handleImageClick(image)}
                            >
                              <Camera size={20} className="text-gray-400 mb-1" />
                              <p className="text-xs text-gray-600 truncate">{image}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Evolución */}
          {activeTab === 'evolution' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Evolución Angular (Genu Varo/Valgo)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="genuVaro" 
                      stroke="#3b82f6" 
                      name="Genu Varo (grados)" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="genuValgo" 
                      stroke="#10b981" 
                      name="Genu Valgo (grados)" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Nuevo Gráfico para Análisis Radiográfico Angular */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Evolución de Ángulos Radiográficos</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="anguloDiafisario"
                      stroke="#8884d8"
                      name="Ángulo Diafisario (grados)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="anguloTibioFemoral"
                      stroke="#82ca9d"
                      name="Ángulo Tibio-Femoral (grados)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Nuevo Gráfico para Evolución de Impedancia de la Piel */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Evolución de la Impedancia de la Piel (Ohmios)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Impedancia (Ω)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="impedancia"
                      stroke="#ff7300"
                      name="Impedancia de la Piel"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Evolución del Dolor</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="dolor" fill="#ef4444" name="Nivel de Dolor (0-10)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Resumen de Progreso */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Tipo de Pisada</h4>
                  <p className="text-2xl font-bold text-blue-600">Neutra</p>
                  <p className="text-sm text-blue-600">Mejora desde pronadora</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Reducción Angular</h4>
                  <p className="text-2xl font-bold text-green-600">67%</p>
                  <p className="text-sm text-green-600">Mejora en genu valgo</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">Reducción Dolor</h4>
                  <p className="text-2xl font-bold text-purple-600">71%</p>
                  <p className="text-sm text-purple-600">De 7/10 a 2/10</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Citas */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Próximas Citas</h3>
                  <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    <Plus size={16} className="mr-1" />
                    Agendar Cita
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{appointment.type}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <Calendar size={16} className="mr-2" />
                        <span>{new Date(appointment.date).toLocaleDateString()} - {appointment.time}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <User size={16} className="mr-2" />
                        <span>{appointment.doctor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="font-semibold">Historial de Citas</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">15/07/2024</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Control + Estudios</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Dr. Roberto Martínez</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Completada</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">Evaluación completa realizada</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">10/05/2024</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Evaluación Postural</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Dr. Roberto Martínez</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Completada</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">Progreso notable en tratamiento</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">15/03/2024</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Control Rutinario</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Dr. Roberto Martínez</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Completada</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">Ajuste en plan de tratamiento</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Nuevo Estudio */}
      {showAddStudy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Agregar Nuevo Estudio</h3>
              <button 
                onClick={() => setShowAddStudy(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Estudio</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Seleccionar...</option>
                    <option>Análisis de Pisada</option>
                    <option>Análisis Radiográfico Angular</option>
                    <option>Evaluación Postural</option>
                    <option>Evaluación Genu Varo/Valgo</option>
                    <option>Medición de Impedancia de la Piel</option> {/* Nueva opción */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha del Estudio</label>
                  <input 
                    type="date" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea 
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingrese las observaciones del estudio..."
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adjuntar Imágenes</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-2">Arrastra las imágenes aquí o haz clic para seleccionar</p>
                  <input type="file" multiple accept="image/*" className="hidden" id="file-upload" />
                  <label 
                    htmlFor="file-upload" 
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                  >
                    Seleccionar Archivos
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button 
                onClick={() => setShowAddStudy(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Guardar Estudio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Ver Imagen */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Vista de Imagen</h3>
              <button 
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 text-center">
              <div className="bg-gray-100 p-8 rounded-lg">
                <Camera size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Imagen: {selectedImage}</p>
                <p className="text-sm text-gray-600">
                  Aquí se mostraría la imagen real del estudio
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
              <button className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                <Download size={16} className="mr-1" />
                Descargar
              </button>
              <button 
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecord;