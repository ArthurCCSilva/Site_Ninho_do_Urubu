// src/pages/FinancialDashboardPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from "react-datepicker";
import ptBR from 'date-fns/locale/pt-BR';
registerLocale('pt-BR', ptBR);

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import AddExpenseModal from '../components/AddExpenseModal';
import ExpenseCategoryModal from '../components/ExpenseCategoryModal'; // Importa o novo modal

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function FinancialDashboardPage() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [endDate, setEndDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [topCustomers, setTopCustomers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  
  // Estados para as despesas
  const [despesas, setDespesas] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExpenseCatModal, setShowExpenseCatModal] = useState(false);

  // Função unificada para buscar todos os dados financeiros
  const fetchAllData = async () => {
    if (!startDate || !endDate) return;

    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = adjustedEndDate.toISOString().split('T')[0];
    
    const params = new URLSearchParams({ data_inicio: formattedStartDate, data_fim: formattedEndDate });
    const queryString = params.toString();

    try {
      setLoading(true);
      setError('');

      // Busca todos os dados em paralelo, incluindo as despesas
      const [summaryRes, salesOverTimeRes, customersRes, productsRes, despesasRes] = await Promise.all([
        api.get(`/api/financials/summary?${queryString}`),
        api.get(`/api/financials/sales-over-time?${queryString}`),
        api.get(`/api/financials/customer-profitability?${queryString}`),
        api.get(`/api/financials/product-profitability?${queryString}`),
        api.get(`/api/despesas?data_inicio=${formattedStartDate}&data_fim=${formattedEndDate}`)
      ]);

      setSummaryData(summaryRes.data);
      setTopCustomers(customersRes.data);
      setTopProducts(productsRes.data);
      setDespesas(despesasRes.data);
      
      const labels = salesOverTimeRes.data.map(d => new Date(d.dia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }));
      const data = salesOverTimeRes.data.map(d => d.totalVendido);
      
      setChartData({
        labels,
        datasets: [{
          label: 'Receita Bruta por Dia',
          data,
          fill: true,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1
        }],
      });
      
    } catch (err) {
      console.error("Erro ao buscar dados financeiros", err);
      setError("Não foi possível carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [startDate, endDate]);

  const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      <h1 className="mb-4">Painel Financeiro</h1>

      <div className="card card-body mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-auto"><label className="form-label mb-0 me-2">Período:</label></div>
          <div className="col-md-auto">
            <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} className="form-control" dateFormat="dd/MM/yyyy" locale="pt-BR" selectsStart startDate={startDate} endDate={endDate} />
          </div>
          <div className="col-md-auto"><label className="form-label mb-0 me-2">até</label></div>
          <div className="col-md-auto">
            <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} className="form-control" dateFormat="dd/MM/yyyy" locale="pt-BR" selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center my-5"><div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} /></div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : summaryData && (
        <>
          <div className="row">
            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-white bg-success h-100"><div className="card-body"><h6 className="card-title text-uppercase">Receita Bruta</h6><p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.receitaBruta)}</p></div></div></div>
            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-white bg-warning h-100"><div className="card-body"><h6 className="card-title text-uppercase">Custo dos Produtos</h6><p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.custoProdutos)}</p></div></div></div>
            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-white bg-danger h-100"><div className="card-body"><h6 className="card-title text-uppercase">Despesas Operacionais</h6><p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.despesasOperacionais)}</p></div></div></div>
            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-white bg-primary h-100"><div className="card-body"><h6 className="card-title text-uppercase">Lucro Líquido</h6><p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.lucroLiquido)}</p></div></div></div>
          </div>

          <div className="card mt-4">
            <div className="card-header"><h5>Vendas ao Longo do Tempo</h5></div>
            <div className="card-body"><Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Receita Bruta Diária' }, }, }} /></div>
          </div>

          <div className="row mt-4">
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-header"><h5>Top 10 Clientes Mais Lucrativos</h5></div>
                <div className="card-body table-responsive"><table className="table table-sm table-striped"><thead><tr><th>Cliente</th><th className="text-end">Lucro Gerado</th></tr></thead><tbody>{topCustomers.map(c => <tr key={c.id}><td>{c.nome}</td><td className="text-end">{formatCurrency(c.lucro_total)}</td></tr>)}</tbody></table></div>
              </div>
            </div>
            <div className="col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-header"><h5>Top 10 Produtos Mais Lucrativos</h5></div>
                <div className="card-body table-responsive"><table className="table table-sm table-striped"><thead><tr><th>Produto</th><th className="text-end">Lucro Gerado</th></tr></thead><tbody>{topProducts.map(p => <tr key={p.id}><td>{p.nome}</td><td className="text-end">{formatCurrency(p.lucro_total)}</td></tr>)}</tbody></table></div>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>Gerenciamento de Despesas</h5>
              <div>
                <button className="btn btn-outline-secondary me-2" onClick={() => setShowExpenseCatModal(true)}>
                  Gerenciar Categorias
                </button>
                <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
                  + Adicionar Despesa
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th className="text-end">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.length > 0 ? despesas.map(d => (
                      <tr key={d.id}>
                        <td>{new Date(d.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                        <td>{d.descricao}</td>
                        <td>{d.categoria_nome || '--'}</td>
                        <td className="text-end text-danger">-{formatCurrency(d.valor)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="text-center text-muted">Nenhuma despesa registrada neste período.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      <AddExpenseModal 
        show={showExpenseModal}
        onHide={() => setShowExpenseModal(false)}
        onSave={fetchAllData}
      />
      <ExpenseCategoryModal 
        show={showExpenseCatModal}
        onHide={() => setShowExpenseCatModal(false)}
        onUpdate={fetchAllData}
      />
    </div>
  );
}

export default FinancialDashboardPage;