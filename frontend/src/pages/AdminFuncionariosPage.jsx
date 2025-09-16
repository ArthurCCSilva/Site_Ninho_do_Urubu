// src/pages/AdminFuncionariosPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import FuncoesModal from '../components/FuncoesModal';
import AdicionarFuncionarioModal from '../components/AdicionarFuncionarioModal';

function AdminFuncionariosPage() {
  // ✅ PASSO 1: Pegamos também o 'isLoading' do nosso contexto
  const { user, isLoading: authLoading } = useAuth();
  
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true); // Loading dos dados da PÁGINA
  const [error, setError] = useState(null);
  const [funcionarioToEdit, setFuncionarioToEdit] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // A busca só acontece APÓS a autenticação terminar E se o usuário tiver permissão
    if (!authLoading && user?.permissoes?.includes('admin_gerenciar_funcionarios')) {
      fetchFuncionarios();
    } else if (!authLoading) {
        // Se o carregamento terminou e não tem permissão, paramos o loading da página
        setLoading(false);
    }
  }, [refreshKey, user, authLoading]); // Adicionamos 'authLoading'

  const fetchFuncionarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/usuarios?role=funcionario');
      setFuncionarios(response.data);
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err);
      setError("Erro ao carregar lista de funcionários.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditFuncionario = (funcionario) => {
    setFuncionarioToEdit(funcionario);
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteFuncionario = async (funcionarioId) => {
    if (!user?.permissoes?.includes('admin_gerenciar_funcionarios')) {
        return alert('Você não tem permissão para excluir funcionários.');
    }
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      try {
        await api.delete(`/api/usuarios/${funcionarioId}`);
        fetchFuncionarios();
        alert("Funcionário excluído com sucesso!");
      } catch (err) {
        console.error("Erro ao excluir funcionário:", err);
        setError("Erro ao excluir funcionário. " + (err.response?.data?.message || err.message));
      }
    }
  };
  
  // ✅ PASSO 2: Verificação de carregamento da AUTENTICAÇÃO
  // Essa verificação vem primeiro e resolve o erro da página em branco/bloqueada
  if (authLoading) {
    return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Verificando autenticação...</span></div></div>;
  }
  
  // ✅ PASSO 3: Verificação de PERMISSÃO
  // Agora que sabemos que a autenticação terminou, esta verificação é segura
  if (!user?.permissoes?.includes('admin_gerenciar_funcionarios')) {
    return <div className="alert alert-warning text-center mt-5">Você não tem permissão para acessar esta página.</div>;
  }
  
  // Se passou pelas verificações acima, continua com o loading dos dados da PÁGINA
  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Carregando funcionários...</span></div></div>;
  if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gerenciar Funcionários</h2>
      <div className="d-flex justify-content-between mb-4">
        
        {user?.permissoes?.includes('gerenciarFuncoes') && (
            <button
              type="button"
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#funcoesModal"
            >
              Gerenciar Funções
            </button>
        )}
        
        {(user?.permissoes?.includes('admin_gerenciar_funcionarios') || user?.permissoes?.includes('gerenciarUsuarios')) && (
          <button
            type="button"
            className="btn btn-success"
            data-bs-toggle="modal"
            data-bs-target="#adicionarFuncionarioModal"
            onClick={() => { setFuncionarioToEdit(null); setRefreshKey(prev => prev + 1); }}
          >
            Adicionar Funcionário
          </button>
        )}
      </div>

      {funcionarios.length === 0 ? (
        <div className="alert alert-info text-center">Nenhum funcionário encontrado.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Login (Email)</th>
                <th>Função</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map(func => (
                <tr key={func._id}>
                  <td>{func.nomeCompleto}</td>
                  <td>{func.usuario}</td>
                  {/* ✅ CORREÇÃO FINAL: Usamos func.funcaoNome que vem da API de usuários */}
                  <td>{func.funcaoNome || func.role.name || 'Não definida'}</td>
                  <td>
                    <span className={`badge ${func.is_active ? 'bg-success' : 'bg-danger'}`}>
                      {func.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    {(user?.permissoes?.includes('admin_gerenciar_funcionarios') || user?.permissoes?.includes('gerenciarUsuarios')) && (
                        <>
                            <button 
                                type="button" 
                                className="btn btn-sm btn-info me-2" 
                                onClick={() => handleEditFuncionario(func)} 
                                data-bs-toggle="modal" 
                                data-bs-target="#adicionarFuncionarioModal">
                                Editar
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-sm btn-danger" 
                                onClick={() => handleDeleteFuncionario(func._id)}>
                                Excluir
                            </button>
                        </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FuncoesModal
        key={`funcoes-modal-${refreshKey}`}
        onUpdateRoles={fetchFuncionarios}
        adminPermissions={user?.permissoes || []}
      />
      <AdicionarFuncionarioModal
        key={`add-func-modal-${refreshKey}`}
        onSave={fetchFuncionarios}
        funcionario={funcionarioToEdit}
      />
    </div>
  );
}

export default AdminFuncionariosPage;