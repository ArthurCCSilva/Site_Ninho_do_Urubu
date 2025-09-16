// src/pages/AdminFuncionariosPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import FuncoesModal from '../components/FuncoesModal';
import AdicionarFuncionarioModal from '../components/AdicionarFuncionarioModal';

function AdminFuncionariosPage() {
  const { user } = useAuth();
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [funcionarioToEdit, setFuncionarioToEdit] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchFuncionarios();
  }, [refreshKey]);

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
  };

  const handleDeleteFuncionario = async (funcionarioId) => {
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      try {
        await api.delete(`/api/usuarios/${funcionarioId}`);
        fetchFuncionarios();
        alert("Funcionário excluído com sucesso!");
      } catch (err) {
        console.error("Erro ao excluir funcionário:", err);
        setError("Erro ao excluir funcionário: " + (err.response?.data?.message || err.message));
      }
    }
  };
  
  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Carregando...</span></div></div>;
  if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gerenciar Funcionários</h2>
      <div className="d-flex justify-content-between mb-4">
        
        {user?.permissoes?.includes('gerenciarFuncoes') && (
          // ✅ VOLTAMOS A USAR O MÉTODO DO BOOTSTRAP
          <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#funcoesModal">
            Gerenciar Funções
          </button>
        )}
        
        {user?.permissoes?.includes('admin_gerenciar_funcionarios') && (
          // ✅ VOLTAMOS A USAR O MÉTODO DO BOOTSTRAP
          <button
            type="button"
            className="btn btn-success"
            data-bs-toggle="modal"
            data-bs-target="#adicionarFuncionarioModal"
            onClick={() => setFuncionarioToEdit(null)} // Limpa para garantir que é um novo cadastro
          >
            Adicionar Funcionário
          </button>
        )}
      </div>

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
                <td>{func.funcaoNome || 'Não definida'}</td>
                <td>
                  <span className={`badge ${func.is_active ? 'bg-success' : 'bg-danger'}`}>
                    {func.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  {user?.permissoes?.includes('admin_gerenciar_funcionarios') && (
                    <>
                      {/* ✅ O botão de editar agora usa data-bs-toggle também */}
                      <button 
                        type="button" 
                        className="btn btn-sm btn-info me-2" 
                        onClick={() => handleEditFuncionario(func)}
                        data-bs-toggle="modal"
                        data-bs-target="#adicionarFuncionarioModal"
                      >
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

      {/* Os modais são renderizados, mas controlados pelo Bootstrap */}
      <FuncoesModal
        key={`funcoes-modal-${refreshKey}`}
        onUpdateRoles={() => setRefreshKey(prev => prev + 1)}
        adminPermissions={user?.permissoes || []}
      />
      <AdicionarFuncionarioModal
        key={`add-func-modal-${refreshKey}`}
        onSave={() => setRefreshKey(prev => prev + 1)}
        funcionario={funcionarioToEdit}
      />
    </div>
  );
}

export default AdminFuncionariosPage;