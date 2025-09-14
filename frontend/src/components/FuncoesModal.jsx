// src/components/FuncoesModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Lista estática de permissões disponíveis no frontend
const ALL_AVAILABLE_PERMISSIONS = [
  { key: 'gerenciarProdutos', name: 'Gerenciar Produtos', description: 'Permite adicionar, editar e remover produtos.' },
  { key: 'verPedidos', name: 'Visualizar Pedidos', description: 'Permite ver a lista de todos os pedidos.' },
  { key: 'editarPedidos', name: 'Editar Pedidos', description: 'Permite mudar o status e detalhes dos pedidos.' },
  { key: 'gerenciarUsuarios', name: 'Gerenciar Usuários', description: 'Permite criar, editar e excluir contas de usuários (clientes e funcionários).' },
  { key: 'gerenciarFuncoes', name: 'Gerenciar Funções', description: 'Permite criar, editar e excluir funções de acesso.' },
  { key: 'acessoRelatorios', name: 'Acesso a Relatórios', description: 'Permite visualizar relatórios de vendas e desempenho.' },
  // ✅ Adicione outras permissões conforme a necessidade do seu sistema
];

function FuncoesModal({ onUpdateRoles, adminPermissions }) {
  const [funcoes, setFuncoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editingFuncao, setEditingFuncao] = useState(null); 
  const [funcaoForm, setFuncaoForm] = useState({ nome: '', permissoes: [] });
  const [formError, setFormError] = useState(null);

  const adminAllowedPermissionKeys = Array.isArray(adminPermissions) 
    ? adminPermissions.map(p => typeof p === 'string' ? p : p.key) 
    : [];

  useEffect(() => {
    // Quando o modal é aberto (assumindo que ele é montado/remontado), carregamos as funções
    // ou quando o modal é exibido (via JS do Bootstrap)
    const modalElement = document.getElementById('funcoesModal');
    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', fetchFuncoes);
      modalElement.addEventListener('hidden.bs.modal', resetForm);
    }
    return () => {
      if (modalElement) {
        modalElement.removeEventListener('shown.bs.modal', fetchFuncoes);
        modalElement.removeEventListener('hidden.bs.modal', resetForm);
      }
    };
  }, []);

  const fetchFuncoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/funcoes'); 
      setFuncoes(response.data);
    } catch (err) {
      console.error("Erro ao buscar funções:", err);
      setError("Erro ao carregar funções.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingFuncao(null);
    setFuncaoForm({ nome: '', permissoes: [] });
    setFormError(null);
  };

  const handleFormChange = (e) => {
    setFuncaoForm({ ...funcaoForm, [e.target.name]: e.target.value });
  };

  const handlePermissionToggle = (permissionKey) => {
    if (!adminAllowedPermissionKeys.includes(permissionKey)) {
      setFormError(`Você não tem permissão para gerenciar a permissão '${permissionKey}'.`);
      return;
    }

    setFuncaoForm(prevForm => {
      const newPermissions = prevForm.permissoes.includes(permissionKey)
        ? prevForm.permissoes.filter(p => p !== permissionKey)
        : [...prevForm.permissoes, permissionKey];
      return { ...prevForm, permissoes: newPermissions };
    });
  };

  const handleSaveFuncao = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!funcaoForm.nome.trim()) {
      setFormError("O nome da função é obrigatório.");
      return;
    }

    try {
      if (editingFuncao) {
        await api.put(`/admin/funcoes/${editingFuncao._id}`, funcaoForm); 
        alert("Função atualizada com sucesso!");
      } else {
        await api.post('/admin/funcoes', funcaoForm); 
        alert("Função criada com sucesso!");
      }
      fetchFuncoes(); 
      onUpdateRoles(); 
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar função:", err);
      setFormError("Erro ao salvar função. " + (err.response?.data?.message || err.message));
    }
  };

  const handleEditClick = (funcao) => {
    setEditingFuncao(funcao);
    setFuncaoForm({ nome: funcao.nome, permissoes: funcao.permissoes || [] });
    setFormError(null);
  };

  const handleDeleteFuncao = async (funcaoId) => {
    if (window.confirm("Tem certeza que deseja excluir esta função? Isso só será possível se nenhum funcionário estiver atualmente atribuído a ela.")) {
      try {
        await api.delete(`/admin/funcoes/${funcaoId}`); 
        fetchFuncoes(); 
        onUpdateRoles(); 
        alert("Função excluída com sucesso!");
      } catch (err) {
        console.error("Erro ao excluir função:", err);
        setFormError("Erro ao excluir função. " + (err.response?.data?.message || "Verifique se não há funcionários usando esta função."));
      }
    }
  };
  
  const permissionsAdminCanAssign = ALL_AVAILABLE_PERMISSIONS.filter(
    p => adminAllowedPermissionKeys.includes(p.key)
  );

  return (
    // ✅ Estrutura de modal Bootstrap puro
    <div className="modal fade" id="funcoesModal" tabIndex="-1" aria-labelledby="funcoesModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="funcoesModalLabel">Gerenciar Funções</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {loading && <div className="text-center"><div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Carregando...</span></div> Carregando funções...</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            {formError && <div className="alert alert-danger">{formError}</div>}

            {/* Formulário de Criação/Edição de Função */}
            <form onSubmit={handleSaveFuncao} className="mb-4 p-3 border rounded">
              <h4>{editingFuncao ? `Editar Função: ${editingFuncao.nome}` : "Criar Nova Função"}</h4>
              <div className="mb-3">
                <label htmlFor="nomeFuncao" className="form-label">Nome da Função</label>
                <input
                  type="text"
                  className="form-control"
                  id="nomeFuncao"
                  name="nome"
                  value={funcaoForm.nome}
                  onChange={handleFormChange}
                  placeholder="Ex: Gerente, Atendente"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Permissões</label>
                <ul className="list-group">
                  {permissionsAdminCanAssign.length === 0 && (
                    <li className="list-group-item list-group-item-warning">
                      Nenhuma permissão disponível para você gerenciar.
                    </li>
                  )}
                  {permissionsAdminCanAssign.map(perm => (
                    <li key={perm.key} className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`perm-${perm.key}`}
                          checked={funcaoForm.permissoes.includes(perm.key)}
                          onChange={() => handlePermissionToggle(perm.key)}
                          disabled={!adminAllowedPermissionKeys.includes(perm.key)}
                        />
                        <label className="form-check-label" htmlFor={`perm-${perm.key}`}>
                          {perm.name}
                        </label>
                        {perm.description && <small className="d-block text-muted">{perm.description}</small>}
                      </div>
                      {!adminAllowedPermissionKeys.includes(perm.key) && (
                        <span className="badge bg-warning text-dark">Permissão Admin Insuficiente</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <button type="submit" className="btn btn-primary me-2">
                {editingFuncao ? "Salvar Edição" : "Criar Função"}
              </button>
              {editingFuncao && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar Edição
                </button>
              )}
            </form>

            <hr />

            {/* Listagem de Funções Existentes */}
            <h4>Funções Criadas</h4>
            {funcoes.length === 0 ? (
              <div className="alert alert-info">Nenhuma função cadastrada.</div>
            ) : (
              <ul className="list-group">
                {funcoes.map(funcao => (
                  <li key={funcao._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{funcao.nome}</strong>
                      <br />
                      <small className="text-muted">
                        Permissões: {funcao.permissoes && funcao.permissoes.length > 0 
                          ? funcao.permissoes.map(pKey => ALL_AVAILABLE_PERMISSIONS.find(ap => ap.key === pKey)?.name || pKey).join(', ') 
                          : 'Nenhuma'}
                      </small>
                    </div>
                    <div>
                      <button 
                        type="button"
                        className="btn btn-warning btn-sm me-2" 
                        onClick={() => handleEditClick(funcao)}
                      >
                        Editar
                      </button>
                      <button 
                        type="button"
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDeleteFuncao(funcao._id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FuncoesModal;