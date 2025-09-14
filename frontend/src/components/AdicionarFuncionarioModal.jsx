// src/components/AdicionarFuncionarioModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

function AdicionarFuncionarioModal({ onSave, funcionario }) {
  const [form, setForm] = useState({
    nomeCompleto: '',
    cpf: '',
    usuario: '', // No backend, isso corresponde ao 'email'
    senha: '',
    funcao_id: '' // O nome correto para o ID da função
  });
  const [funcoes, setFuncoes] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchFuncoes();
  }, []);

  // Efeito para preencher o formulário quando um 'funcionario' para editar é passado
  useEffect(() => {
    if (funcionario) {
      setForm({
        nomeCompleto: funcionario.nomeCompleto || '',
        cpf: funcionario.cpf || '',
        usuario: funcionario.usuario || '', // O 'usuario' aqui é o email
        senha: '', // Senha sempre vazia ao editar
        funcao_id: funcionario.role?.id || '' // ✅ CORREÇÃO: Pega o ID da função do objeto 'role'
      });
    } else {
      resetForm();
    }
  }, [funcionario]);

  const fetchFuncoes = async () => {
    setLoadingRoles(true);
    try {
      const response = await api.get('/api/funcoes');
      setFuncoes(response.data);
    } catch (err) {
      console.error("Erro ao buscar funções:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const resetForm = () => {
    setForm({ nomeCompleto: '', cpf: '', usuario: '', senha: '', funcao_id: '' });
    setFormErrors({});
    setError(null);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validateForm = () => {
    // A lógica de validação permanece a mesma, mas verificamos 'funcao_id'
    const errors = {};
    if (!form.nomeCompleto.trim()) errors.nomeCompleto = "Nome completo é obrigatório.";
    if (!form.cpf.trim()) errors.cpf = "CPF é obrigatório.";
    if (!/^\d{11}$/.test(form.cpf.replace(/\D/g, ''))) errors.cpf = "CPF deve ser válido.";
    if (!form.usuario.trim()) errors.usuario = "Usuário (email) é obrigatório.";
    if (!funcionario && !form.senha.trim()) errors.senha = "Senha é obrigatória para novos funcionários.";
    if (form.senha.trim() && form.senha.length < 6) errors.senha = "A senha deve ter pelo menos 6 caracteres.";
    if (!form.funcao_id) errors.funcao_id = "A função é obrigatória.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    // Prepara os dados para enviar, garantindo que o campo de email seja enviado corretamente
    const dadosParaEnviar = {
        nome: form.nomeCompleto,
        email: form.usuario,
        cpf: form.cpf,
        senha: form.senha,
        funcao_id: form.funcao_id,
        // O backend espera 'role' como 'funcionario' para novos cadastros
        role: 'funcionario' 
    };

    try {
      if (funcionario) {
        // Na edição, não enviamos a role, pois ela não deve ser alterada aqui
        delete dadosParaEnviar.role;
        // Se a senha estiver vazia na edição, não a enviamos
        if (!dadosParaEnviar.senha) delete dadosParaEnviar.senha;

        await api.put(`/api/usuarios/${funcionario._id}`, dadosParaEnviar);
        alert("Funcionário atualizado com sucesso!");
      } else {
        await api.post('/api/usuarios/register-employee', dadosParaEnviar);
        alert("Funcionário adicionado com sucesso!");
      }
      onSave();
      
      const modalElement = document.getElementById('adicionarFuncionarioModal');
      if (modalElement) {
        const bootstrapModal = window.bootstrap.Modal.getInstance(modalElement);
        if (bootstrapModal) bootstrapModal.hide();
      }
      resetForm();

    } catch (err) {
      console.error("Erro ao salvar funcionário:", err);
      setError(err.response?.data?.message || "Erro ao salvar funcionário.");
    }
  };

  return (
    <div className="modal fade" id="adicionarFuncionarioModal" tabIndex="-1" aria-labelledby="adicionarFuncionarioModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="adicionarFuncionarioModalLabel">{funcionario ? "Editar Funcionário" : "Adicionar Funcionário"}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetForm}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              
              <div className="mb-3">
                <label htmlFor="nomeCompleto" className="form-label">Nome Completo</label>
                <input type="text" className={`form-control ${formErrors.nomeCompleto ? 'is-invalid' : ''}`} id="nomeCompleto" name="nomeCompleto" value={form.nomeCompleto} onChange={handleFormChange} required />
                {formErrors.nomeCompleto && <div className="invalid-feedback">{formErrors.nomeCompleto}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="cpf" className="form-label">CPF</label>
                <input type="text" className={`form-control ${formErrors.cpf ? 'is-invalid' : ''}`} id="cpf" name="cpf" value={form.cpf} onChange={handleFormChange} required />
                {formErrors.cpf && <div className="invalid-feedback">{formErrors.cpf}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="usuario" className="form-label">Email (para Login)</label>
                <input type="email" className={`form-control ${formErrors.usuario ? 'is-invalid' : ''}`} id="usuario" name="usuario" value={form.usuario} onChange={handleFormChange} required />
                {formErrors.usuario && <div className="invalid-feedback">{formErrors.usuario}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="senha" className="form-label">Senha {funcionario && <small>(Deixe em branco para não alterar)</small>}</label>
                <input type="password" className={`form-control ${formErrors.senha ? 'is-invalid' : ''}`} id="senha" name="senha" value={form.senha} onChange={handleFormChange} required={!funcionario} />
                {formErrors.senha && <div className="invalid-feedback">{formErrors.senha}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="funcao_id" className="form-label">Função</label>
                <select className={`form-select ${formErrors.funcao_id ? 'is-invalid' : ''}`} id="funcao_id" name="funcao_id" value={form.funcao_id} onChange={handleFormChange} disabled={loadingRoles} required>
                  {/* ✅ CORREÇÃO FINAL: Adicionamos keys a todas as options */}
                  <option key="placeholder" value="">Selecione uma função</option>
                  {loadingRoles ? (
                    <option key="loading" disabled>Carregando funções...</option>
                  ) : (
                    funcoes.map(funcao => (
                      <option key={funcao.id} value={funcao.id}>{funcao.nome_funcao}</option>
                    ))
                  )}
                </select>
                {formErrors.funcao_id && <div className="invalid-feedback">{formErrors.funcao_id}</div>}
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