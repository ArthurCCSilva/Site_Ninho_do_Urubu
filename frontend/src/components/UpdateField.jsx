// src/components/UpdateField.jsx
import { useState } from 'react';
import api from '../services/api';

// Recebe a função 'onSuccess' do modal principal
function UpdateField({ fieldName, label, initialValue, inputType = 'text', onSuccess }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Evita salvar se o valor não mudou
    if (value === initialValue) {
      setIsEditing(false);
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(fieldName, value);
      await api.put('/api/usuarios/perfil', formData);
      onSuccess(`${label} atualizado(a)`); // Avisa o pai que deu tudo certo
    } catch (error) {
      alert(error.response?.data?.message || `Falha ao atualizar ${label}.`);
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h6 className="card-title">{label}</h6>
        {isEditing ? (
          <div className="d-flex">
            <input 
              type={inputType} 
              className="form-control me-2" 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
            <button className="btn btn-success me-2" onClick={handleSave} disabled={loading}>
              {loading ? '...' : 'Salvar'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setValue(initialValue); }} disabled={loading}>Cancelar</button>
          </div>
        ) : (
          <div className="d-flex justify-content-between align-items-center">
            <p className="card-text mb-0">{initialValue}</p>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setIsEditing(true)}>Alterar</button>
          </div>
        )}
      </div>
    </div>
  );
}
export default UpdateField;