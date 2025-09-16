import React, { useState, useEffect } from 'react';
import api from '../services/api';

function EditarFuncionarioModal({ onSave, funcionario }) {
  const [details, setDetails] = useState({ nome: '', usuario: '' });
  const [selectedFuncaoId, setSelectedFuncaoId] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [allFunctions, setAllFunctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (funcionario) {
      setDetails({ nome: funcionario.nomeCompleto || '', usuario: funcionario.usuario || '' });
      setSelectedFuncaoId(funcionario.role?.id || '');
      setIsActive(funcionario.is_active);
      setError('');
      setSuccess('');
      setNovaSenha('');
    }
  }, [funcionario]);

  useEffect(() => {
    const fetchFuncoes = async () => {
      try {
        const response = await api.get('/api/funcoes');
        setAllFunctions(response.data);
      } catch (err) {
        console.error("Erro ao buscar funções", err);
      }
    };
    fetchFuncoes();
  }, []);

  const handleUpdate = async (endpoint, data, successMessage) => {
    if (!funcionario) return; // Segurança extra
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/usuarios/${funcionario._id}/${endpoint}`, data);
      setSuccess(successMessage);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || `Erro ao atualizar.`);
    } finally {
      setLoading(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 3000);
    }
  };

  const handleUpdateDetails = () => handleUpdate('details', { nome: details.nome, email: details.usuario }, 'Dados atualizados!');
  const handleUpdateFunction = () => handleUpdate('function', { funcao_id: selectedFuncaoId }, 'Cargo atualizado!');
  const handleResetPassword = () => handleUpdate('password', { novaSenha }, 'Senha redefinida!');
  const handleUpdateStatus = () => handleUpdate('status', { is_active: !isActive }, `Funcionário ${!isActive ? 'ativado' : 'desativado'}!`);

  return (
    <div className="modal fade" id="editarFuncionarioModal" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            {/* ✅ CORREÇÃO: Lida com 'funcionario' sendo null inicialmente */}
            <h5 className="modal-title">Editar Funcionário: {funcionario?.nomeCompleto || ''}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Card de Dados Cadastrais */}
            <div className="card mb-3">
              <div className="card-body">
                <h6 className="card-title">Dados Cadastrais</h6>
                <div className="mb-3">
                  <label>Nome Completo</label>
                  <input type="text" className="form-control" value={details.nome} onChange={e => setDetails({ ...details, nome: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label>Email (Usuário de Login)</label>
                  <input type="email" className="form-control" value={details.usuario} onChange={e => setDetails({ ...details, usuario: e.target.value })} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleUpdateDetails} disabled={loading}>Salvar Dados</button>
              </div>
            </div>

            {/* Card de Cargo */}
            <div className="card mb-3">
              <div className="card-body">
                <h6 className="card-title">Cargo do Funcionário</h6>
                <div className="mb-3">
                  <select className="form-select" value={selectedFuncaoId} onChange={e => setSelectedFuncaoId(e.target.value)}>
                    <option value="">Selecione um cargo</option>
                    {allFunctions.map(funcao => (
                      <option key={funcao.id} value={funcao.id}>{funcao.nome_funcao}</option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleUpdateFunction} disabled={loading}>Alterar Cargo</button>
              </div>
            </div>

            {/* Card de Senha */}
            <div className="card mb-3">
              <div className="card-body">
                <h6 className="card-title">Redefinir Senha</h6>
                <div className="mb-3">
                  <input type="password" placeholder="Digite a nova senha" className="form-control" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
                </div>
                <button className="btn btn-warning btn-sm" onClick={handleResetPassword} disabled={loading || novaSenha.length < 6}>Redefinir Senha</button>
              </div>
            </div>

            {/* Card de Status */}
            <div className="card">
              <div className="card-body">
                <h6 className="card-title">Status do Funcionário</h6>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="statusSwitch" checked={isActive} onChange={handleUpdateStatus} />
                  <label className="form-check-label" htmlFor="statusSwitch">{isActive ? 'Ativo' : 'Inativo'}</label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditarFuncionarioModal;