import React, { useState } from 'react';
import { Camera, Edit3, Save, X } from 'lucide-react';

const PosturalDiagnosis = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [findings, setFindings] = useState({
    cabeza: "Antepulsión de cabeza (2.5 cm)",
    hombros: "Asimetría con elevación del hombro derecho (1.2 cm)",
    columna: "Hiperlordosis lumbar, escoliosis leve (5°)",
    pelvis: "Anteversión pélvica, rotación derecha",
    rodillas: "Valgo leve bilateral",
    pies: "Pronación bilateral, más acentuada en pie derecho"
  });

  const handleFindingChange = (key, value) => {
    setFindings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // Aquí puedes agregar la lógica para guardar los cambios
    console.log('Hallazgos guardados:', findings);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Aquí puedes revertir los cambios si es necesario
  };

  return (
    <div className="card">
      <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
        <h4 className="fs-20 font-w600 d-flex align-items-center">
          Último diagnóstico Postural
        </h4>
        <div>
          {!isEditing ? (
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={16} className="me-1" />
              Editar
            </button>
          ) : (
            <div className="d-flex gap-2">
              <button 
                className="btn btn-success btn-sm"
                onClick={handleSave}
              >
                <Save size={16} className="me-1" />
                Guardar
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleCancel}
              >
                <X size={16} className="me-1" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="card-body">
        <div className="row">
          {/* Vista Frontal */}
          <div className="col-md-4">
            <div className="text-center mb-3">
              <h5 className="fs-16 font-w600 mb-3">Vista Frontal</h5>
              <div 
                className="border rounded-3 d-flex align-items-center justify-content-center bg-light"
                style={{ height: '280px', cursor: 'pointer' }}
              >
                <div className="text-muted text-center">
                  <Camera size={48} className="mb-2" />
                  <p className="mb-0">Hacer clic para subir imagen</p>
                  <small>Vista frontal del paciente</small>
                </div>
              </div>
            </div>
          </div>

          {/* Vista Lateral */}
          <div className="col-md-4">
            <div className="text-center mb-3">
              <h5 className="fs-16 font-w600 mb-3">Vista Lateral</h5>
              <div 
                className="border rounded-3 d-flex align-items-center justify-content-center bg-light"
                style={{ height: '280px', cursor: 'pointer' }}
              >
                <div className="text-muted text-center">
                  <Camera size={48} className="mb-2" />
                  <p className="mb-0">Hacer clic para subir imagen</p>
                  <small>Vista lateral del paciente</small>
                </div>
              </div>
            </div>
          </div>

          {/* Hallazgos Posturales */}
          <div className="col-md-4">
            <h5 className="fs-16 font-w600 mb-3">Hallazgos posturales</h5>
            <div className="postural-findings">
              
              <div className="mb-3">
                <strong className="d-block text-dark fs-14">Cabeza y cuello</strong>
                {isEditing ? (
                  <textarea
                    className="form-control form-control-sm mt-1"
                    rows="2"
                    value={findings.cabeza}
                    onChange={(e) => handleFindingChange('cabeza', e.target.value)}
                  />
                ) : (
                  <p className="text-muted fs-13 mb-0">{findings.cabeza}</p>
                )}
              </div>

              <div className="mb-3">
                <strong className="d-block text-dark fs-14">Hombros</strong>
                {isEditing ? (
                  <textarea
                    className="form-control form-control-sm mt-1"
                    rows="2"
                    value={findings.hombros}
                    onChange={(e) => handleFindingChange('hombros', e.target.value)}
                  />
                ) : (
                  <p className="text-muted fs-13 mb-0">{findings.hombros}</p>
                )}
              </div>

              <div className="mb-3">
                <strong className="d-block text-dark fs-14">Columna</strong>
                {isEditing ? (
                  <textarea
                    className="form-control form-control-sm mt-1"
                    rows="2"
                    value={findings.columna}
                    onChange={(e) => handleFindingChange('columna', e.target.value)}
                  />
                ) : (
                  <p className="text-muted fs-13 mb-0">{findings.columna}</p>
                )}
              </div>

              <div className="mb-3">
                <strong className="d-block text-dark fs-14">Pelvis</strong>
                {isEditing ? (
                  <textarea
                    className="form-control form-control-sm mt-1"
                    rows="2"
                    value={findings.pelvis}
                    onChange={(e) => handleFindingChange('pelvis', e.target.value)}
                  />
                ) : (
                  <p className="text-muted fs-13 mb-0">{findings.pelvis}</p>
                )}
              </div>

              <div className="mb-3">
                <strong className="d-block text-dark fs-14">Rodillas</strong>
                {isEditing ? (
                  <textarea
                    className="form-control form-control-sm mt-1"
                    rows="2"
                    value={findings.rodillas}
                    onChange={(e) => handleFindingChange('rodillas', e.target.value)}
                  />
                ) : (
                  <p className="text-muted fs-13 mb-0">{findings.rodillas}</p>
                )}
              </div>

              <div className="mb-3">
                <strong className="d-block text-dark fs-14">Pies</strong>
                {isEditing ? (
                  <textarea
                    className="form-control form-control-sm mt-1"
                    rows="2"
                    value={findings.pies}
                    onChange={(e) => handleFindingChange('pies', e.target.value)}
                  />
                ) : (
                  <p className="text-muted fs-13 mb-0">{findings.pies}</p>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Gráfico de Desviaciones */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="border-top pt-3">
              <h6 className="fs-14 font-w600 mb-3">Desviaciones posturales (cm)</h6>
              <div className="postural-chart">
                <div className="d-flex align-items-center mb-2">
                  <span className="fs-12 me-3" style={{ minWidth: '80px' }}>Cabeza</span>
                  <div className="flex-grow-1 d-flex align-items-center">
                    <div className="bg-warning" style={{ width: '30%', height: '20px', marginRight: '5px' }}></div>
                    <div className="bg-primary" style={{ width: '25%', height: '20px' }}></div>
                    <span className="fs-12 ms-2">2.5 cm</span>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className="fs-12 me-3" style={{ minWidth: '80px' }}>Hombros</span>
                  <div className="flex-grow-1 d-flex align-items-center">
                    <div className="bg-warning" style={{ width: '25%', height: '20px', marginRight: '5px' }}></div>
                    <div className="bg-primary" style={{ width: '45%', height: '20px' }}></div>
                    <span className="fs-12 ms-2">1.2 cm</span>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className="fs-12 me-3" style={{ minWidth: '80px' }}>Columna</span>
                  <div className="flex-grow-1 d-flex align-items-center">
                    <div className="bg-warning" style={{ width: '35%', height: '20px', marginRight: '5px' }}></div>
                    <div className="bg-primary" style={{ width: '55%', height: '20px' }}></div>
                    <span className="fs-12 ms-2">5°</span>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className="fs-12 me-3" style={{ minWidth: '80px' }}>Pelvis</span>
                  <div className="flex-grow-1 d-flex align-items-center">
                    <div className="bg-warning" style={{ width: '20%', height: '20px', marginRight: '5px' }}></div>
                    <div className="bg-primary" style={{ width: '80%', height: '20px' }}></div>
                    <span className="fs-12 ms-2">Moderada</span>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <span className="fs-12 me-3" style={{ minWidth: '80px' }}>Pies</span>
                  <div className="flex-grow-1 d-flex align-items-center">
                    <div className="bg-warning" style={{ width: '28%', height: '20px', marginRight: '5px' }}></div>
                    <div className="bg-primary" style={{ width: '22%', height: '20px' }}></div>
                    <span className="fs-12 ms-2">Bilateral</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosturalDiagnosis;