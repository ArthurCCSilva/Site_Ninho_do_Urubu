// src/components/UpdateField.jsx
import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function UpdateField({ fieldName, label, initialValue, inputType = 'text' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const { logout } = useAuth();

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append(fieldName, value);
      await api.put('/api/usuarios/perfil', formData);
      alert('Informação atualizada! Será necessário fazer login novamente para ver as mudanças.');
      logout();
    } catch (error) {
      alert(error.response?.data?.message || 'Falha ao atualizar.');
    } finally {
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
            <button className="btn btn-success me-2" onClick={handleSave}>Salvar</button>
            <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setValue(initialValue); }}>Cancelar</button>
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