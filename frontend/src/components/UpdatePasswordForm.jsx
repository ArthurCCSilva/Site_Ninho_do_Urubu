// src/components/UpdatePasswordForm.jsx
import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function UpdatePasswordForm() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!novaSenha || !senhaAtual) {
      return setError('Para alterar, a senha atual e a nova senha são necessárias.');
    }
    if (novaSenha !== confirmarNovaSenha) {
      return setError('A nova senha e a confirmação não coincidem.');
    }
    try {
      const formData = new FormData();
      formData.append('senhaAtual', senhaAtual);
      formData.append('novaSenha', novaSenha);
      await api.put('/api/usuarios/perfil', formData);
      setSuccess('Senha alterada com sucesso! Faça o login novamente.');
      setTimeout(logout, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao alterar a senha.');
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="card-title">Alterar Senha</h6>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">{success}</div>}
          <div className="mb-2">
            <label className="form-label small">Senha Atual</label>
            <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className="form-control" required/>
          </div>
          <div className="mb-2">
            <label className="form-label small">Nova Senha</label>
            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="form-control" required/>
          </div>
          <div className="mb-3">
            <label className="form-label small">Confirmar Nova Senha</label>
            <input type="password" value={confirmarNovaSenha} onChange={(e) => setConfirmarNovaSenha(e.target.value)} className="form-control" required/>
          </div>
          <button type="submit" className="btn btn-primary">Salvar Nova Senha</button>
        </form>
      </div>
    </div>
  );
}
export default UpdatePasswordForm;