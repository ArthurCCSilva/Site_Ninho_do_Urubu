// src/components/AdminEditUserModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import Pagination from './Pagination';

function AdminEditUserModal({ show, onHide }) {
  const [view, setView] = useState('list'); // 'list' ou 'edit'
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({ telefone: '', senha: '', confirmSenha: '' });
  const modalRef = useRef();

  useEffect(() => {
    if (!show) return;
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: currentPage, limit: 8, search: searchTerm });
        const response = await api.get(`/api/usuarios/clientes?${params.toString()}`);
        setCustomers(response.data.clientes);
        setTotalPages(response.data.totalPages);
      } catch (err) { console.error("Erro ao buscar clientes", err); } 
      finally { setLoading(false); }
    };
    const debounceFetch = setTimeout(() => { fetchCustomers(); }, 500);
    return () => clearTimeout(debounceFetch);
  }, [show, currentPage, searchTerm]);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) { setView('list'); setSelectedCustomer(null); setSearchTerm(''); bsModal.show(); } 
    else { bsModal.hide(); }
  }, [show]);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData({ telefone: '', senha: '', confirmSenha: '' });
    setView('edit');
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (formData.senha && formData.senha !== formData.confirmSenha) {
      return alert("As senhas não coincidem.");
    }
    const payload = {};
    if (formData.telefone) payload.telefone = formData.telefone;
    if (formData.senha) payload.senha = formData.senha;
    if (Object.keys(payload).length === 0) {
      return alert("Preencha pelo menos um campo para atualizar.");
    }
    try {
      await api.put(`/api/usuarios/admin/${selectedCustomer.id}`, payload);
      alert('Dados do cliente atualizados com sucesso!');
      setView('list');
      setSelectedCustomer(null);
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao atualizar dados.");
    }
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{view === 'list' ? 'Selecionar Cliente' : `Editando ${selectedCustomer?.nome}`}</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {view === 'list' ? (
              <>
                <input type="text" className="form-control mb-3" placeholder="Pesquisar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {loading ? <div className="text-center"><div className="spinner-border"/></div> : (
                  <ul className="list-group">
                    {customers.map(c => (
                      <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <img src={c.imagem_perfil_url ? `http://localhost:3001/uploads/${c.imagem_perfil_url}` : 'https://placehold.co/50'} alt={c.nome} className="rounded-circle me-3" style={{width: 50, height: 50, objectFit: 'cover'}}/>
                          <div>{c.nome}</div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => handleSelectCustomer(c)}>Selecionar</button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <form onSubmit={handleSaveChanges}>
                <button type="button" className="btn btn-secondary mb-3" onClick={() => setView('list')}>&larr; Voltar para a lista</button>
                <div className="mb-3"><label className="form-label">Novo Telefone (Opcional)</label><input type="text" className="form-control" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} /></div>
                <div className="mb-3"><label className="form-label">Nova Senha (Opcional)</label><input type="password" placeholder="••••••••" className="form-control" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} /></div>
                {formData.senha && <div className="mb-3"><label className="form-label">Confirmar Nova Senha</label><input type="password" placeholder="••••••••" className="form-control" value={formData.confirmSenha} onChange={(e) => setFormData({...formData, confirmSenha: e.target.value})} /></div>}
                <button type="submit" className="btn btn-success">Salvar Alterações</button>
              </form>
            )}
          </div>
          {view === 'list' && <div className="modal-footer d-flex justify-content-center"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>}
        </div>
      </div>
    </div>
  );
}
export default AdminEditUserModal;