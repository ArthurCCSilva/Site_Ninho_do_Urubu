// src/pages/AdminCustomerInfoPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';

function AdminCustomerInfoPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: currentPage, limit: 10, search: searchTerm });
        const response = await api.get(`/api/usuarios/clientes?${params.toString()}`);
        setCustomers(response.data.clientes);
        setTotalPages(response.data.totalPages);
      } catch (err) { console.error("Erro ao buscar clientes", err); }
      finally { setLoading(false); }
    };
    const debounceFetch = setTimeout(() => { fetchCustomers(); }, 500);
    return () => clearTimeout(debounceFetch);
  }, [currentPage, searchTerm]);

  return (
    <div>
      <h1 className="mb-4">Informações de Clientes</h1>
      <div className="card card-body mb-4">
        <input type="text" className="form-control" placeholder="Pesquisar por ID, Nome, Email, Telefone ou CPF..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>
      {loading ? <div className="text-center"><div className="spinner-border"/></div> : (
        <div className="list-group">
          {customers.map(c => (
            <div key={c.id} className="list-group-item">
              <div className="row align-items-center">
                <div className="col-auto">
                  <img src={c.imagem_perfil_url ? `http://localhost:3001/uploads/${c.imagem_perfil_url}` : 'https://placehold.co/80'} alt={c.nome} className="rounded-circle" style={{width: 80, height: 80, objectFit: 'cover'}}/>
                </div>
                <div className="col">
                  <h5 className="mb-1">{c.nome} <span className="text-muted small"> (ID: {c.id})</span></h5>
                  <p className="mb-1"><strong>Email:</strong> {c.email || 'Não informado'}</p>
                  <p className="mb-1"><strong>Telefone:</strong> {c.telefone || 'Não informado'}</p>
                  <p className="mb-0"><strong>CPF:</strong> {c.cpf || 'Não informado'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="d-flex justify-content-center mt-4">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
export default AdminCustomerInfoPage;