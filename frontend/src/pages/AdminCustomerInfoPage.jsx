// src/pages/AdminCustomerInfoPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Pagination from '../components/Pagination';
import CurrencyInput from 'react-currency-input-field';

function AdminCustomerInfoPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [financialStatus, setFinancialStatus] = useState(null);
  const [fiadoOrders, setFiadoOrders] = useState([]);
  const [fiadoPaymentValue, setFiadoPaymentValue] = useState('');
  const [loadingFinancial, setLoadingFinancial] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: currentPage, limit: 5, search: searchTerm });
        const response = await api.get(`/api/usuarios/clientes?${params.toString()}`);
        setCustomers(response.data.clientes);
        setTotalPages(response.data.totalPages);
      } catch (err) { console.error("Erro ao buscar clientes", err); }
      finally { setLoading(false); }
    };
    const debounceFetch = setTimeout(() => { fetchCustomers(); }, 500);
    return () => clearTimeout(debounceFetch);
  }, [currentPage, searchTerm]);

  const handleSelectCustomer = async (customer) => {
    if (selectedCustomer && selectedCustomer.id === customer.id) {
        setSelectedCustomer(null);
        return;
    }
    setSelectedCustomer(customer);
    setLoadingFinancial(true);
    try {
      const [statusRes, fiadoRes] = await Promise.all([
          api.get(`/api/usuarios/${customer.id}/status-financeiro`),
          api.get(`/api/usuarios/${customer.id}/fiados`)
      ]);
      setFinancialStatus(statusRes.data);
      setFiadoOrders(fiadoRes.data);
    } catch (err) { 
      console.error("Erro ao buscar status financeiro", err); 
    } finally {
        setLoadingFinancial(false);
    }
  };

  const handleNavigateToBoletos = () => {
    navigate('/admin/boletos', { state: { clienteNome: selectedCustomer.nome } });
  };
  
  const handlePayFiado = async () => {
      if (!fiadoPaymentValue || parseFloat(String(fiadoPaymentValue).replace(',','.')) <= 0) {
          return alert("Por favor, insira um valor de pagamento válido.");
      }
      if (window.confirm("Confirmar o recebimento deste valor?")) {
          try {
              await api.post(`/api/usuarios/${selectedCustomer.id}/pagar-fiado-total`, { valor_pago: fiadoPaymentValue });
              alert("Pagamento registrado com sucesso!");
              setFiadoPaymentValue('');
              // Re-executa a busca para atualizar os dados na tela
              handleSelectCustomer(selectedCustomer); 
          } catch (err) {
              alert(err.response?.data?.message || "Erro ao registrar pagamento.");
          }
      }
  };

  const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const saldoDevedorTotalFiado = fiadoOrders.reduce((acc, pedido) => {
      const totalPagoNestePedido = pedido.pagamentos_fiado?.reduce((pAcc, p) => pAcc + parseFloat(p.valor_pago), 0) || 0;
      const saldoDoPedido = parseFloat(pedido.valor_total) - totalPagoNestePedido;
      return acc + saldoDoPedido;
  }, 0);

  return (
    <div>
      <h1 className="mb-4">Informações de Clientes</h1>
      <div className="card card-body mb-4">
        <input type="text" className="form-control" placeholder="Pesquisar por ID, Nome, Email, Telefone ou CPF..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="list-group">
        {customers.map(c => (
          <div key={c.id} className="list-group-item">
            <div className="row align-items-center">
              <div className="col-auto"><img src={c.imagem_perfil_url ? `http://localhost:3001/uploads/${c.imagem_perfil_url}`: 'https://placehold.co/80'} alt={c.nome} className="rounded-circle" style={{width: 80, height: 80, objectFit: 'cover'}}/></div>
              <div className="col"><h5 className="mb-1">{c.nome} <span className="text-muted small">(ID: {c.id})</span></h5><p className="mb-1"><strong>Telefone:</strong> {c.telefone || 'N/A'}</p><p className="mb-0"><strong>CPF:</strong> {c.cpf || 'N/A'}</p></div>
              <div className="col-auto"><button className="btn btn-primary" onClick={() => handleSelectCustomer(c)}>Info Cliente</button></div>
            </div>
            
            {selectedCustomer && selectedCustomer.id === c.id && (
              <div className="mt-3 p-3 bg-light rounded">
                <h5 className="mb-3">Detalhes Financeiros de {selectedCustomer.nome}</h5>
                {loadingFinancial ? <div className="text-center"><div className="spinner-border spinner-border-sm"/></div> :
                <>
                  {financialStatus?.temBoleto && (
                      <div className="alert alert-warning d-flex justify-content-between align-items-center">
                          <span>Este cliente possui carnês de boleto em aberto.</span>
                          <button className="btn btn-warning btn-sm" onClick={handleNavigateToBoletos}>Ver Boletos</button>
                      </div>
                  )}
                  {financialStatus?.temFiado && (
                      <div className="card">
                          <div className="card-header"><h6>Pedidos em Fiado (Dívida Total: <span className="text-danger">{formatCurrency(saldoDevedorTotalFiado)}</span>)</h6></div>
                          <ul className="list-group list-group-flush">
                              {fiadoOrders.map(order => {
                                  const totalPagoPedido = order.pagamentos_fiado.reduce((acc, p) => acc + parseFloat(p.valor_pago), 0);
                                  const saldoPedido = parseFloat(order.valor_total) - totalPagoPedido;
                                  return (
                                    <li key={order.id} className="list-group-item d-flex justify-content-between">
                                        <span>Pedido #{order.id} - {new Date(order.data_pedido).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                                        <span className="text-danger">{formatCurrency(saldoPedido)}</span>
                                    </li>
                                  )
                              })}
                          </ul>
                          <div className="card-body">
                              <div className="input-group">
                                  <CurrencyInput className="form-control" placeholder="Valor recebido" value={fiadoPaymentValue} onValueChange={value => setFiadoPaymentValue(value || '')} intlConfig={{ locale: 'pt-BR', currency: 'BRL' }} />
                                  <button className="btn btn-success" onClick={handlePayFiado}>Registrar Pagamento</button>
                              </div>
                          </div>
                      </div>
                  )}
                  {!financialStatus?.temBoleto && !financialStatus?.temFiado && (
                      <p className="text-muted text-center">Este cliente não possui pendências financeiras.</p>
                  )}
                </>
                }
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="d-flex justify-content-center mt-4">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default AdminCustomerInfoPage;