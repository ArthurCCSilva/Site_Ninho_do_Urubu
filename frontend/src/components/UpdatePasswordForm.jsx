// src/components/UpdatePasswordForm.jsx
import { useState } from 'react';
import api from '../services/api';

function UpdatePasswordForm({ onSuccess }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    if (!novaSenha || !senhaAtual) {
      setLoading(false); return setError('Senha atual e nova senha são necessárias.');
    }
    if (novaSenha !== confirmarNovaSenha) {
      setLoading(false); return setError('As senhas não coincidem.');
    }
    try {
      const formData = new FormData();
      formData.append('senhaAtual', senhaAtual);
      formData.append('novaSenha', novaSenha);
      await api.put('/api/usuarios/perfil', formData);
      setSuccess('Senha alterada com sucesso! Você será deslogado em breve.');
      setTimeout(() => onSuccess('Senha alterada'), 2000); // Avisa o pai que deu certo após 2 segundos
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="card-title">Alterar Senha</h6>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">{success}</div>}
          <div className="mb-2"><label className="form-label small">Senha Atual</label><input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className="form-control" required/></div>
          <div className="mb-2"><label className="form-label small">Nova Senha</label><input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="form-control" required/></div>
          <div className="mb-3"><label className="form-label small">Confirmar Nova Senha</label><input type="password" value={confirmarNovaSenha} onChange={(e) => setConfirmarNovaSenha(e.target.value)} className="form-control" required/></div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Nova Senha'}</button>
        </form>
      </div>
    </div>
  );
}
export default UpdatePasswordForm;