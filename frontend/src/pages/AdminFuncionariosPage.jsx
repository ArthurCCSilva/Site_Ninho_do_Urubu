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

  // ✅ ADICIONADO: console.log para verificar as permissões do usuário logado
  useEffect(() => {
    if (user) {
      // Agora ele mostra o conteúdo do array
      console.log("Conteúdo das Permissões:", user.permissoes);
    }
  }, [user]);

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
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteFuncionario = async (funcionarioId) => {
    if (!user?.permissoes?.includes('gerenciarUsuarios')) {
      alert('Você não tem permissão para excluir funcionários.');
      return;
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

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Carregando...</span></div></div>;
  if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gerenciar Funcionários</h2>
      <div className="d-flex justify-content-between mb-4">
        {/* Botão de Gerenciar Funções */}
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

        {/* Botão de Adicionar Funcionário */}
        {user?.permissoes?.includes('gerenciarUsuarios') && (
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

      { /* O resto do seu JSX permanece igual */}
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
                  <td>{func.role?.name || 'Não definida'}</td>
                  <td>
                    <span className={`badge ${func.is_active ? 'bg-success' : 'bg-danger'}`}>
                      {func.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    {user?.permissoes?.includes('admin_gerenciar_usuarios') && (
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