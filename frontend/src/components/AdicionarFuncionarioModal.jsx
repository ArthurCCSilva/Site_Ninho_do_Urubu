// frontend/src/components/AdicionarFuncionarioModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

// ✅ VERSÃO SIMPLIFICADA E CORRIGIDA
function AdicionarFuncionarioModal({ onSave, funcionario }) {
  const [form, setForm] = useState({ nome: '', usuario: '', senha: '', funcao_id: '' });
  const [funcoes, setFuncoes] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFuncoes();
  }, []);

  useEffect(() => {
    // Quando o 'funcionario' (prop) muda, atualiza o formulário
    if (funcionario) {
      setForm({
        nome: funcionario.nomeCompleto || '',
        usuario: funcionario.usuario || '',
        senha: '',
        funcao_id: funcionario.role?.id || ''
      });
    } else {
      resetForm(); // Limpa o formulário se não houver funcionário para editar
    }
  }, [funcionario]);

  const fetchFuncoes = async () => {
    setLoadingRoles(true);
    try {
      const response = await api.get('/api/funcoes');
      setFuncoes(response.data);
    } catch (err) {
      setError("Não foi possível carregar os cargos.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const resetForm = () => {
    setForm({ nome: '', usuario: '', senha: '', funcao_id: '' });
    setError(null);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const dadosParaEnviar = { ...form };
      if (funcionario) {
        if (!dadosParaEnviar.senha) delete dadosParaEnviar.senha;
        await api.put(`/api/usuarios/${funcionario._id}`, dadosParaEnviar);
        alert("Funcionário atualizado com sucesso!");
      } else {
        await api.post('/api/usuarios/register-employee', dadosParaEnviar);
        alert("Funcionário adicionado com sucesso!");
      }
      onSave(); // Avisa a página principal para recarregar a lista
      
      // Fecha o modal via JS do Bootstrap
      const modalElement = document.getElementById('adicionarFuncionarioModal');
      const bootstrapModal = window.bootstrap.Modal.getInstance(modalElement);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <div className="modal fade" id="adicionarFuncionarioModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{funcionario ? "Editar Funcionário" : "Adicionar Funcionário"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={resetForm}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="nome" className="form-label">Nome Completo</label>
                <input type="text" className="form-control" id="nome" name="nome" value={form.nome} onChange={handleFormChange} required />
              </div>
              <div className="mb-3">
                <label htmlFor="usuario" className="form-label">Usuário (Email de Login)</label>
                <input type="email" className="form-control" id="usuario" name="usuario" value={form.usuario} onChange={handleFormChange} required />
              </div>
              <div className="mb-3">
                <label htmlFor="senha" className="form-label">Senha {funcionario && <small>(Deixe em branco para não alterar)</small>}</label>
                <input type="password" minLength="6" className="form-control" id="senha" name="senha" value={form.senha} onChange={handleFormChange} required={!funcionario} />
              </div>
              <div className="mb-3">
                <label htmlFor="funcao_id" className="form-label">Cargo</label>
                <select className="form-select" id="funcao_id" name="funcao_id" value={form.funcao_id} onChange={handleFormChange} disabled={loadingRoles} required>
                  <option value="">Selecione um cargo</option>
                  {loadingRoles ? (<option disabled>Carregando...</option>) : (funcoes.map(funcao => (<option key={funcao.id} value={funcao.id}>{funcao.nome_funcao}</option>)))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">{funcionario ? "Salvar Alterações" : "Adicionar Funcionário"}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdicionarFuncionarioModal;