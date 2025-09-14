// src/pages/AdminFuncionariosPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Corrigi o nome da pasta para 'context'
import api from '../services/api';

import FuncoesModal from '../components/FuncoesModal';
import AdicionarFuncionarioModal from '../components/AdicionarFuncionarioModal';

function AdminFuncionariosPage() {
  // ✅ MUDANÇA 1: Capturar o 'isLoading' do AuthContext. Renomeamos para 'authLoading' para não conflitar.
  const { user, isLoading: authLoading } = useAuth();

  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true); // Este é o loading para os dados da página
  const [error, setError] = useState(null);

  const [funcionarioToEdit, setFuncionarioToEdit] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Só busca os funcionários se a autenticação já tiver sido verificada e o usuário for um admin/dev
    if (!authLoading && user && (user.role === 'admin' || user.role === 'dev')) {
      fetchFuncionarios();
    }
  }, [refreshKey, authLoading, user]); // Adicionamos authLoading e user como dependências

  const fetchFuncionarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/usuarios');
      const apenasFuncionarios = response.data.filter(u => u.role && u.role.name !== 'cliente');
      setFuncionarios(apenasFuncionarios);
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

  // ✅ MUDANÇA 2: Adicionar uma verificação para o 'authLoading'.
  // Enquanto o AuthContext estiver validando o token, mostramos um spinner.
  if (authLoading) {
    return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Verificando autenticação...</span></div></div>;
  }

  // ✅ MUDANÇA 3: Corrigir a lógica de verificação de permissão.
  // Agora verificamos 'user.role' diretamente, que é uma string.
  if (!user || (user.role !== 'admin' && user.role !== 'dev')) {
    return <div className="alert alert-warning text-center mt-5">Você não tem permissão para acessar esta página.</div>;
  }

  // O resto do componente continua a partir daqui, mas a lógica de loading/error de dados pode ser simplificada
  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Carregando...</span></div></div>;
  if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gerenciar Funcionários</h2>

      {/* O resto do seu JSX permanece o mesmo */}
      <div className="d-flex justify-content-between mb-4">
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#funcoesModal"
          onClick={() => setRefreshKey(prev => prev + 1)}
        >
          Gerenciar Funções
        </button>
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

      {funcionarios.length === 0 ? (
        <div className="alert alert-info text-center">Nenhum funcionário encontrado.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Usuário</th>
                <th>Função</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map(func => (
                <tr key={func._id}>
                  <td>{func.nomeCompleto}</td>
                  <td>{func.cpf}</td>
                  <td>{func.usuario}</td>
                  <td>{func.role?.name || 'N/A'}</td>
                  <td>
                    <button type="button" className="btn btn-sm btn-info me-2" onClick={() => handleEditFuncionario(func)} data-bs-toggle="modal" data-bs-target="#adicionarFuncionarioModal">
                      Editar
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteFuncionario(func._id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cuidado aqui: A permissão para o modal pode precisar da mesma correção */}
      <FuncoesModal
        key={`funcoes-modal-${refreshKey}`}
        onUpdateRoles={fetchFuncionarios}
        adminPermissions={[]}
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