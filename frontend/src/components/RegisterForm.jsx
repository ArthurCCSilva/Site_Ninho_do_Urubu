// src/components/RegisterForm.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { InputMask } from '@react-input/mask';
import { Link, useNavigate } from 'react-router-dom';

function RegisterForm() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cpf: '',
    dia: '',
    mes: '',
    ano: '',
  });
  const [telefone, setTelefone] = useState('');
  const [imagemFile, setImagemFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [maiorDeIdade, setMaiorDeIdade] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // ✅ 1. NOVA LÓGICA: Verifica a idade sempre que a data de nascimento mudar
  useEffect(() => {
    const { ano, mes, dia } = formData;
    if (ano && mes && dia) {
      const hoje = new Date();
      const dataNascimento = new Date(ano, mes - 1, dia);
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      const m = hoje.getMonth() - dataNascimento.getMonth();
      // Ajusta a idade se o aniversário ainda não ocorreu este ano
      if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
        idade--;
      }
      
      // Atualiza o checkbox de maioridade automaticamente
      setMaiorDeIdade(idade >= 18);
    }
  }, [formData.ano, formData.mes, formData.dia]);


  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setImagemFile(e.target.files[0]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.senha !== formData.confirmarSenha) { return setError('As senhas não coincidem.'); }
    if (!telefone) { return setError('O número de WhatsApp é obrigatório.'); }
    if (!formData.dia || !formData.mes || !formData.ano) { return setError('A data de nascimento é obrigatória.'); }
    if (!aceitaTermos) { return setError('Você deve aceitar os Termos de Uso para continuar.'); }
    
    // ✅ 2. A validação agora verifica o estado 'maiorDeIdade'
    if (!maiorDeIdade) { return setError('Você deve ser maior de 18 anos para se cadastrar.'); }
    
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('telefone', telefone);
    if (imagemFile) {
      data.append('imagem_perfil', imagemFile);
    }

     try {
      await register(data);
      
      // ✅ CORREÇÃO DEFINITIVA: Usando o método direto do navegador.
      alert('Cadastro realizado com sucesso!');
      window.location.href = '/login'; // Força o navegador a ir para a página de login.

    } catch(err) {
      setError(err.response?.data?.message || 'Falha no cadastro. Tente novamente.');
      // Apenas em caso de erro, garantimos que o loading pare.
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const anos = Array.from({ length: 100 }, (_, i) => currentYear - i); // Permite selecionar anos mais recentes também
  const meses = Array.from({ length: 12 }, (_, i) => i + 1);
  const dias = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger p-2 small">{error}</div>}
      {success && <div className="alert alert-success p-2 small">{success}</div>}
      
      <div className="mb-3"><label className="form-label">Nome Completo</label><input type="text" name="nome" className="form-control" value={formData.nome} onChange={handleChange} required /></div>
      <div className="mb-3"><label className="form-label">Email (Opcional)</label><input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} /></div>
      <div className="mb-3"><label className="form-label">WhatsApp</label><PhoneInput value={telefone} onChange={setTelefone} defaultCountry="BR" className="form-control" required /></div>
      <div className="mb-3"><label className="form-label">CPF</label><InputMask mask="___.___.___-__" replacement={{ _: /\d/ }} value={formData.cpf} onChange={handleChange} name="cpf" className="form-control" required/></div>

      <div className="mb-3">
        <label className="form-label">Data de Nascimento</label>
        <div className="d-flex">
            <select name="dia" value={formData.dia} onChange={handleChange} className="form-select me-2" required><option value="">Dia</option>{dias.map(d => <option key={d} value={d}>{d}</option>)}</select>
            <select name="mes" value={formData.mes} onChange={handleChange} className="form-select me-2" required><option value="">Mês</option>{meses.map(m => <option key={m} value={m}>{m}</option>)}</select>
            <select name="ano" value={formData.ano} onChange={handleChange} className="form-select" required><option value="">Ano</option>{anos.map(a => <option key={a} value={a}>{a}</option>)}</select>
        </div>
      </div>

      <div className="mb-3"><label className="form-label">Senha</label><input type="password" name="senha" className="form-control" value={formData.senha} onChange={handleChange} minLength="6" required /></div>
      <div className="mb-3"><label className="form-label">Confirmar Senha</label><input type="password" name="confirmarSenha" className="form-control" value={formData.confirmarSenha} onChange={handleChange} required /></div>
      <div className="mb-3"><label className="form-label">Foto de Perfil (Opcional)</label><input type="file" name="imagem_perfil" className="form-control" onChange={handleFileChange} accept="image/*" /></div>

      {/* ✅ 3. O checkbox agora é preenchido e desabilitado pela lógica */}
      <div className="form-check mb-2">
        <input 
            className="form-check-input" 
            type="checkbox" 
            id="maiorDeIdadeCheck" 
            checked={maiorDeIdade} 
            readOnly // O usuário não pode alterar diretamente
        />
        <label className="form-check-label small" htmlFor="maiorDeIdadeCheck">
          Declaro que sou maior de idade (18 anos ou mais).
        </label>
      </div>
      <div className="form-check mb-3">
        <input className="form-check-input" type="checkbox" id="termosCheck" checked={aceitaTermos} onChange={e => setAceitaTermos(e.target.checked)} />
        <label className="form-check-label small" htmlFor="termosCheck">
          Eu li e aceito os <Link to="/termos-de-uso" target="_blank">Termos de Uso</Link>.
        </label>
      </div>

      <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? 'Cadastrando...' : 'Criar Cadastro'}</button>
    </form>
  );
}

export default RegisterForm;