// src/components/FuncoesModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFeatureFlags } from '../context/FeatureFlagContext';

// A lista MESTRA de todas as permissões possíveis no sistema
const PERMISSIONS_BY_CATEGORY = {
  globais: {
    name: 'Permissões Globais (Painel Admin)',
    permissions: [
      { key: 'admin_gerenciar_pedidos', name: 'Gerenciar Pedidos', description: 'Permite acesso ao botão "Gerenciar Pedidos".' },
      { key: 'admin_registrar_venda_fisica', name: 'Registrar Venda Física', description: 'Permite acesso ao botão "Registrar Venda Física".' },
      { key: 'admin_gerenciar_comandas', name: 'Gerenciar Comandas', description: 'Permite acesso ao botão "Gerenciar Comandas".' },
      { key: 'admin_painel_financeiro', name: 'Acessar Painel Financeiro', description: 'Permite acesso ao botão "Painel Financeiro".' },
      { key: 'admin_info_clientes', name: 'Acessar Info Clientes', description: 'Permite acesso ao botão "Info Clientes".' },
      { key: 'admin_gerenciar_funcionarios', name: 'Gerenciar Funcionários', description: 'Permite acesso ao botão "Gerenciar Funcionários".' },
      { key: 'admin_gerenciar_categorias', name: 'Gerenciar Categorias', description: 'Permite acesso ao modal "Gerenciar Categorias".' },
      { key: 'admin_reativar_produtos', name: 'Reativar Produtos', description: 'Permite acesso ao modal "Reativar Produtos".' },
      { key: 'admin_editar_cliente', name: 'Editar Cliente', description: 'Permite acesso ao modal "Editar Cliente".' },
    ]
  },
  pagamentos: {
    name: 'Permissões de Pagamento',
    permissions: [
      { key: 'sistema_fiado', name: 'Habilitar Sistema Fiado', description: 'Permite fechar comandas ou alterar status de pedidos para "Fiado".' },
      { key: 'sistema_boleto', name: 'Habilitar Boleto Virtual', description: 'Permite que clientes paguem com Boleto e admins gerenciem os carnês.' },
    ]
  },
  financeiras: {
    name: 'Permissões do Painel Financeiro',
    permissions: [
      { key: 'financeiro_analise_pagamentos', name: 'Análise de Pagamentos', description: 'Permite ver a análise de vendas por formas de pagamento.' },
      { key: 'financeiro_comparativo_mensal', name: 'Comparativo Mensal', description: 'Permite ver o comparativo mensal de vendas.' },
      { key: 'financeiro_comparativo_produto', name: 'Comparativo por Produto', description: 'Permite ver o comparativo de vendas por produto.' },
      { key: 'financeiro_top10_clientes', name: 'Top 10 Clientes', description: 'Permite ver os Top 10 Clientes Mais Lucrativos.' },
      { key: 'financeiro_top10_produtos', name: 'Top 10 Produtos', description: 'Permite ver os Top 10 Produtos Mais Lucrativos.' },
    ]
  }
};

function FuncoesModal({ onUpdateRoles, adminPermissions }) {
  const { isEnabled, flagsLoading } = useFeatureFlags();
  const [funcoes, setFuncoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingFuncao, setEditingFuncao] = useState(null); 
  const [funcaoForm, setFuncaoForm] = useState({ nome_funcao: '', lista_permissoes: [] });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
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

  // ✅ LÓGICA DE FILTRO CORRIGIDA E CENTRALIZADA
  // Cria a lista de permissões que o admin pode atribuir.
  // Uma permissão só aparece aqui se:
  // 1. A feature flag correspondente estiver ATIVA (ligada pelo dev).
  // 2. O admin logado TIVER essa permissão.
  const permissionsAdminCanAssign = Object.entries(PERMISSIONS_BY_CATEGORY)
    .map(([categoryKey, categoryData]) => ({
      ...categoryData,
      key: categoryKey,
      permissions: categoryData.permissions.filter(perm => 
        isEnabled(perm.key) && adminPermissions.includes(perm.key)
      )
    }))
    .filter(category => category.permissions.length > 0);

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
    setFuncaoForm({ nome_funcao: '', lista_permissoes: [] });
    setFormError(null);
  };

  const handleFormChange = (e) => {
    setFuncaoForm({ ...funcaoForm, [e.target.name]: e.target.value });
  };

  const handlePermissionToggle = (permissionKey) => {
    setFuncaoForm(prevForm => {
      const newPermissions = prevForm.lista_permissoes.includes(permissionKey)
        ? prevForm.lista_permissoes.filter(p => p !== permissionKey)
        : [...prevForm.lista_permissoes, permissionKey];
      return { ...prevForm, lista_permissoes: newPermissions };
    });
  };

  const handleSaveFuncao = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!funcaoForm.nome_funcao.trim()) {
      setFormError("O nome da função é obrigatório.");
      return;
    }
    try {
      if (editingFuncao) {
        await api.put(`/api/funcoes/${editingFuncao.id}`, funcaoForm); 
        alert("Função atualizada com sucesso!");
      } else {
        await api.post('/api/funcoes', funcaoForm); 
        alert("Função criada com sucesso!");
      }
      fetchFuncoes(); 
      if (onUpdateRoles) onUpdateRoles(); 

      document.querySelector('#funcoesModal .btn-close').click();
      
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar função:", err);
      setFormError(err.response?.data?.message || "Erro ao salvar função.");
    }
  };

  const handleEditClick = (funcao) => {
    setEditingFuncao(funcao);
    setFuncaoForm({ nome_funcao: funcao.nome_funcao, lista_permissoes: funcao.permissoes || [] });
    setFormError(null);
  };

  const handleDeleteFuncao = async (funcaoId) => {
    if (window.confirm("Tem certeza que deseja excluir esta função?")) {
      try {
        await api.delete(`/api/funcoes/${funcaoId}`); 
        fetchFuncoes(); 
        if (onUpdateRoles) onUpdateRoles(); 
        alert("Função excluída com sucesso!");
      } catch (err) {
        console.error("Erro ao excluir função:", err);
        setFormError(err.response?.data?.message || "Erro ao excluir função.");
      }
    }
  };

  if (loading || flagsLoading) {
    return (
        <div className="modal fade" id="funcoesModal" tabIndex="-1">
            <div className="modal-dialog modal-lg"><div className="modal-content"><div className="modal-body text-center p-5">
                <div className="spinner-border text-primary" /><p className="mt-3">Carregando...</p>
            </div></div></div>
        </div>
    );
  }

  return (
    <div className="modal fade" id="funcoesModal" tabIndex="-1" aria-labelledby="funcoesModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="funcoesModalLabel">Gerenciar Funções</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetForm}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {formError && <div className="alert alert-danger">{formError}</div>}

            <form onSubmit={handleSaveFuncao} className="mb-4 p-3 border rounded">
              <h4>{editingFuncao ? `Editar Função: ${editingFuncao.nome_funcao}` : "Criar Nova Função"}</h4>
              <div className="mb-3">
                <label htmlFor="nome_funcao" className="form-label">Nome da Função</label>
                <input type="text" className="form-control" id="nome_funcao" name="nome_funcao" value={funcaoForm.nome_funcao} onChange={handleFormChange} placeholder="Ex: Gerente, Atendente" required />
              </div>

              <div className="mb-3">
                <label className="form-label">Permissões para Atribuir</label>
                <div className="accordion" id="accordionPermissions">
                  {permissionsAdminCanAssign.map((categoryData) => (
                    <div className="accordion-item" key={categoryData.key}>
                      <h2 className="accordion-header" id={`heading-${categoryData.key}`}>
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${categoryData.key}`}>{categoryData.name}</button>
                      </h2>
                      <div id={`collapse-${categoryData.key}`} className="accordion-collapse collapse" data-bs-parent="#accordionPermissions">
                        <div className="accordion-body">
                          <ul className="list-group">
                            {categoryData.permissions.map(perm => (
                              <li key={perm.key} className="list-group-item border-0">
                                <div className="form-check">
                                  <input type="checkbox" className="form-check-input" id={`perm-${perm.key}`} checked={funcaoForm.lista_permissoes.includes(perm.key)} onChange={() => handlePermissionToggle(perm.key)} />
                                  <label className="form-check-label" htmlFor={`perm-${perm.key}`}>{perm.name}</label>
                                  {perm.description && <small className="d-block text-muted">{perm.description}</small>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                  {permissionsAdminCanAssign.length === 0 && (
                      <div className="alert alert-info small">Nenhuma permissão disponível para você gerenciar no momento.</div>
                  )}
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary me-2">{editingFuncao ? "Salvar Edição" : "Criar Função"}</button>
              {editingFuncao && (<button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar Edição</button>)}
            </form>

            <hr />

            <h4>Funções Criadas</h4>
            {funcoes.length === 0 ? (
              <div className="alert alert-info">Nenhuma função cadastrada.</div>
            ) : (
              <ul className="list-group">
                {funcoes.map(funcao => (
                  <li key={funcao.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{funcao.nome_funcao}</strong>
                      <br />
                      <small className="text-muted">Permissões: {funcao.permissoes && funcao.permissoes.length > 0 ? funcao.permissoes.join(', ') : 'Nenhuma'}</small>
                    </div>
                    <div>
                      <button type="button" className="btn btn-warning btn-sm me-2" onClick={() => handleEditClick(funcao)}>Editar</button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteFuncao(funcao.id)}>Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FuncoesModal;