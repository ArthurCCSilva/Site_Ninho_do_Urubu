// src/components/AdicionarFuncionarioModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

function AdicionarFuncionarioModal({ onSave, funcionario }) {
  const [form, setForm] = useState({
    nomeCompleto: '',
    cpf: '',
    usuario: '',
    senha: '',
    roleId: ''
  });
  const [funcoes, setFuncoes] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchFuncoes();
  }, []);

  useEffect(() => {
    const modalElement = document.getElementById('adicionarFuncionarioModal');
    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', () => {
        if (funcionario) {
          setForm({
            nomeCompleto: funcionario.nomeCompleto || '',
            cpf: funcionario.cpf || '',
            usuario: funcionario.usuario || '',
            senha: '',
            roleId: funcionario.role?._id || ''
          });
        } else {
          resetForm();
        }
        setError(null);
        setFormErrors({});
      });
      modalElement.addEventListener('hidden.bs.modal', resetForm);
    }
    return () => {
      if (modalElement) {
        modalElement.removeEventListener('shown.bs.modal', () => { }); // Remover com função anônima ou nomeada
        modalElement.removeEventListener('hidden.bs.modal', resetForm);
      }
    };
  }, [funcionario]); // Dependência de funcionario para resetar/preencher ao editar

  const fetchFuncoes = async () => {
    setLoadingRoles(true);
    try {
      const response = await api.get('/api/funcoes');
      // ✅ ADICIONE ESTA LINHA PARA DEBUGAR
      console.log('Dados recebidos de /api/funcoes:', response.data); 
      setFuncoes(response.data);
    } catch (err) {
      console.error("Erro ao buscar funções:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const resetForm = () => {
    setForm({
      nomeCompleto: '',
      cpf: '',
      usuario: '',
      senha: '',
      roleId: ''
    });
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.nomeCompleto.trim()) errors.nomeCompleto = "Nome completo é obrigatório.";
    if (!form.cpf.trim()) errors.cpf = "CPF é obrigatório.";
    if (!/^\d{11}$/.test(form.cpf)) errors.cpf = "CPF deve conter 11 dígitos numéricos.";
    if (!form.usuario.trim()) errors.usuario = "Usuário é obrigatório.";
    if (!funcionario && !form.senha.trim()) errors.senha = "Senha é obrigatória para novos funcionários.";
    if (form.senha.trim() && form.senha.length < 6) errors.senha = "A senha deve ter pelo menos 6 caracteres.";
    if (!form.roleId) errors.roleId = "A função é obrigatória.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      if (funcionario) {
        const updateData = {
          nomeCompleto: form.nomeCompleto,
          cpf: form.cpf,
          usuario: form.usuario,
          roleId: form.roleId,
        };
        if (form.senha) {
          updateData.senha = form.senha;
        }
        await api.put(`/admin/users/${funcionario._id}`, updateData);
        alert("Funcionário atualizado com sucesso!");
      } else {
        await api.post('/admin/users/register-employee', form);
        alert("Funcionário adicionado com sucesso!");
      }
      onSave();
      // Fechar modal via JS do Bootstrap
      const modalElement = document.getElementById('adicionarFuncionarioModal');
      if (modalElement) {
        const bootstrapModal = window.bootstrap.Modal.getInstance(modalElement) || new window.bootstrap.Modal(modalElement);
        bootstrapModal.hide();
      }
    } catch (err) {
      console.error("Erro ao salvar funcionário:", err);
      setError("Erro ao salvar funcionário. " + (err.response?.data?.message || err.message));
    }
  };

  return (
    // ✅ Estrutura de modal Bootstrap puro
    <div className="modal fade" id="adicionarFuncionarioModal" tabIndex="-1" aria-labelledby="adicionarFuncionarioModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="adicionarFuncionarioModalLabel">{funcionario ? "Editar Funcionário" : "Adicionar Funcionário"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="nomeCompleto" className="form-label">Nome Completo</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.nomeCompleto ? 'is-invalid' : ''}`}
                  id="nomeCompleto"
                  name="nomeCompleto"
                  value={form.nomeCompleto}
                  onChange={handleFormChange}
                  required
                />
                {formErrors.nomeCompleto && <div className="invalid-feedback">{formErrors.nomeCompleto}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="cpf" className="form-label">CPF</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.cpf ? 'is-invalid' : ''}`}
                  id="cpf"
                  name="cpf"
                  value={form.cpf}
                  onChange={handleFormChange}
                  required
                />
                {formErrors.cpf && <div className="invalid-feedback">{formErrors.cpf}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="usuario" className="form-label">Usuário (para Login)</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.usuario ? 'is-invalid' : ''}`}
                  id="usuario"
                  name="usuario"
                  value={form.usuario}
                  onChange={handleFormChange}
                  required
                />
                {formErrors.usuario && <div className="invalid-feedback">{formErrors.usuario}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="senha" className="form-label">Senha {funcionario && <small>(Deixe em branco para não alterar)</small>}</label>
                <input
                  type="password"
                  className={`form-control ${formErrors.senha ? 'is-invalid' : ''}`}
                  id="senha"
                  name="senha"
                  value={form.senha}
                  onChange={handleFormChange}
                  required={!funcionario}
                />
                {formErrors.senha && <div className="invalid-feedback">{formErrors.senha}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="roleId" className="form-label">Função</label>
                <select
                  className={`form-select ${formErrors.roleId ? 'is-invalid' : ''}`}
                  id="roleId"
                  name="roleId"
                  value={form.roleId}
                  onChange={handleFormChange}
                  disabled={loadingRoles}
                  required
                >
                  <option key="select-placeholder" value="">Selecione uma função</option>
                  {loadingRoles ? (
                    <option key="loading-option" disabled>Carregando funções...</option>
                  ) : (
                    funcoes.map(role => (
                      <option key={role._id} value={role._id}>{role.nome}</option>
                    ))
                  )}
                </select>
                {formErrors.roleId && <div className="invalid-feedback">{formErrors.roleId}</div>}
              </div>

              <button type="submit" className="btn btn-primary">
                {funcionario ? "Salvar Alterações" : "Adicionar Funcionário"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdicionarFuncionarioModal;