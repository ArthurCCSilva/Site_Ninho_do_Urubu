//frontend/src/components/AdicionarFuncionarioModal.jsx
const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    // Prepara os dados para enviar com os nomes corretos que o backend espera
    const dadosParaEnviar = {
        nome: form.nomeCompleto,
        email: form.usuario,
        cpf: form.cpf,
        senha: form.senha,
        funcao_id: form.roleId,
        // ✅ CORREÇÃO: Adicionamos a 'role' para novos funcionários
        role: 'funcionario'
    };

    try {
      if (funcionario) {
        // Na edição, não precisamos enviar a 'role', pois ela não deve ser alterada aqui.
        delete dadosParaEnviar.role; 
        
        // Se a senha estiver vazia na edição, não a enviamos
        if (!dadosParaEnviar.senha) delete dadosParaEnviar.senha;

        // A rota de edição de usuário geral (PUT) pode ser mantida
        await api.put(`/api/usuarios/${funcionario._id}`, dadosParaEnviar);
        alert("Funcionário atualizado com sucesso!");
      } else {
        // Ao criar um novo funcionário, enviamos o objeto completo
        await api.post('/api/usuarios/register-employee', dadosParaEnviar);
        alert("Funcionário adicionado com sucesso!");
      }
      
      onSave(); // Atualiza a lista de funcionários na página
      
      // Lógica para fechar o modal
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
};// frontend/src/components/AdicionarFuncionarioModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

// 1. DECLARAÇÃO DO COMPONENTE
// É a função principal que define o componente
function AdicionarFuncionarioModal({ onSave, funcionario }) {

  // 2. ESTADOS (useState)
  // Guardam as informações do formulário, a lista de funções, etc.
  const [form, setForm] = useState({
    nomeCompleto: '',
    cpf: '',
    usuario: '', // Corresponde ao 'email' no backend
    senha: '',
    roleId: '' // Corresponde ao 'funcao_id' no backend
  });
  const [funcoes, setFuncoes] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // 3. EFEITOS (useEffect)
  // Executam código quando o componente carrega ou quando algo muda
  useEffect(() => {
    fetchFuncoes();
  }, []);

  useEffect(() => {
    if (funcionario) {
      setForm({
        nomeCompleto: funcionario.nomeCompleto || '',
        cpf: funcionario.cpf || '',
        usuario: funcionario.usuario || '',
        senha: '',
        roleId: funcionario.role?.id || ''
      });
    } else {
      resetForm();
    }
  }, [funcionario]);

  // 4. FUNÇÕES AUXILIARES
  // Ajudam o componente a realizar suas tarefas
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
    setForm({ nomeCompleto: '', cpf: '', usuario: '', senha: '', roleId: '' });
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
    const errors = {};
    if (!form.nomeCompleto.trim()) errors.nomeCompleto = "Nome completo é obrigatório.";
    if (!form.cpf.trim()) errors.cpf = "CPF é obrigatório.";
    if (!/^\d{11}$/.test(form.cpf.replace(/\D/g, ''))) errors.cpf = "CPF deve ser válido.";
    if (!form.usuario.trim()) errors.usuario = "Usuário (email) é obrigatório.";
    if (!funcionario && !form.senha.trim()) errors.senha = "Senha é obrigatória para novos funcionários.";
    if (form.senha.trim() && form.senha.length < 6) errors.senha = "A senha deve ter pelo menos 6 caracteres.";
    if (!form.roleId) errors.roleId = "A função é obrigatória.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 5. A SUA FUNÇÃO `handleSubmit` (já corrigida)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    const dadosParaEnviar = {
        nome: form.nomeCompleto,
        email: form.usuario,
        cpf: form.cpf,
        senha: form.senha,
        funcao_id: form.roleId,
        role: 'funcionario'
    };

    try {
      if (funcionario) {
        delete dadosParaEnviar.role;
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

  // 6. A INTERFACE (return com JSX)
  // O que o usuário vê na tela
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
                <label htmlFor="roleId" className="form-label">Função</label>
                <select className={`form-select ${formErrors.roleId ? 'is-invalid' : ''}`} id="roleId" name="roleId" value={form.roleId} onChange={handleFormChange} disabled={loadingRoles} required>
                  <option key="placeholder" value="">Selecione uma função</option>
                  {loadingRoles ? (
                    <option key="loading" disabled>Carregando funções...</option>
                  ) : (
                    funcoes.map(funcao => (
                      <option key={funcao.id} value={funcao.id}>{funcao.nome_funcao}</option>
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

// 7. A EXPORTAÇÃO (a causa do erro original)
// Permite que outros arquivos, como o AdminFuncionariosPage, usem este componente
export default AdicionarFuncionarioModal;