// src/pages/FuncionariosPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ✅ Importamos os modais que construiremos com Bootstrap puro e HTML
import FuncoesModal from '../components/FuncoesModal'; 
import AdicionarFuncionarioModal from '../components/AdicionarFuncionarioModal'; 

function FuncionariosPage() {
  const { user } = useAuth(); // Assume que user.role contém nome e permissoes
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [funcionarioToEdit, setFuncionarioToEdit] = useState(null); // Para editar funcionário
  const [refreshKey, setRefreshKey] = useState(0); // Para forçar remount dos modais e resetar estados

  useEffect(() => {
    fetchFuncionarios();
  }, [refreshKey]); // Atualiza a lista de funcionários se algo no modal disparar refresh

  const fetchFuncionarios = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ ATUALIZAÇÃO: Ajuste o endpoint da sua API se for diferente.
      // E o filtro para identificar 'funcionários' (por exemplo, role.name !== 'cliente')
      const response = await api.get('/admin/users'); 
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
    setRefreshKey(prev => prev + 1); // Força remount do modal para limpar estados
    // O modal será aberto pelo data-bs-target no JSX
  };

  const handleDeleteFuncionario = async (funcionarioId) => {
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      try {
        await api.delete(`/admin/users/${funcionarioId}`); 
        fetchFuncionarios(); // Recarrega a lista
        alert("Funcionário excluído com sucesso!");
      } catch (err) {
        console.error("Erro ao excluir funcionário:", err);
        setError("Erro ao excluir funcionário. " + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Carregando...</span></div></div>;
  if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;

  // ✅ VERIFICAÇÃO DE PERMISSÃO: Certifique-se que o usuário logado tem a role correta
  if (!user || (!user.role || (user.role.name !== 'admin' && user.role.name !== 'dev'))) { 
    return <div className="alert alert-warning text-center mt-5">Você não tem permissão para acessar esta página.</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">FUNCIONARIOS PAGE</h2>
      
      <div className="d-flex justify-content-between mb-4">
        {/* Botão Gerenciar Funções - usa data-bs-toggle para abrir o modal */}
        <button 
          type="button" // Importante para botões dentro de forms ou div genéricas
          className="btn btn-primary" 
          data-bs-toggle="modal" 
          data-bs-target="#funcoesModal"
          onClick={() => setRefreshKey(prev => prev + 1)} // Força remount do modal de funções
        >
          Gerenciar Funções
        </button>

        {/* Botão Adicionar Funcionário - usa data-bs-toggle para abrir o modal */}
        <button 
          type="button"
          className="btn btn-success" 
          data-bs-toggle="modal" 
          data-bs-target="#adicionarFuncionarioModal"
          onClick={() => { setFuncionarioToEdit(null); setRefreshKey(prev => prev + 1); }} // Reseta e força remount
        >
          Adicionar Funcionário
        </button>
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
                  <td>{func.role?.nome || 'N/A'}</td> {/* Exibe o nome da função */}
                  <td>
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
                      onClick={() => handleDeleteFuncionario(func._id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Modais são renderizados no DOM. O Bootstrap lida com show/hide. 
          Usamos o 'key' para forçar a montagem/desmontagem e resetar o estado interno do modal. */}
      <FuncoesModal 
        key={`funcoes-modal-${refreshKey}`} // Garante que o modal é remontado ao abrir
        onUpdateRoles={fetchFuncionarios} // Recarregar funcionários se as funções mudarem
        adminPermissions={user.role.permissoes || []} // Passa as permissões do admin
      />

      <AdicionarFuncionarioModal 
        key={`add-func-modal-${refreshKey}`} // Garante que o modal é remontado ao abrir
        onSave={fetchFuncionarios} // Recarregar funcionários após salvar
        funcionario={funcionarioToEdit}
      />
    </div>
  );
}

export default FuncionariosPage;