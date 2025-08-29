// src/pages/FinancialDashboardPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from "react-datepicker";
import ptBR from 'date-fns/locale/pt-BR';
registerLocale('pt-BR', ptBR);

import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import AddExpenseModal from '../components/AddExpenseModal';
import ExpenseCategoryModal from '../components/ExpenseCategoryModal';
import Pagination from '../components/Pagination';
import Select from 'react-select';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

function FinancialDashboardPage() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [endDate, setEndDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [topCustomers, setTopCustomers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [paymentStats, setPaymentStats] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [despesasLoading, setDespesasLoading] = useState(false);
  const [despesaSearchTerm, setDespesaSearchTerm] = useState('');
  const [despesaCurrentPage, setDespesaCurrentPage] = useState(1);
  const [despesaTotalPages, setDespesaTotalPages] = useState(0);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExpenseCatModal, setShowExpenseCatModal] = useState(false);
  
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState({ value: 'receitaBruta', label: 'Receita Bruta' });
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonChartData, setComparisonChartData] = useState({ labels: [], datasets: [] });

  const metricOptions = [
    { value: 'receitaBruta', label: 'Receita Bruta' },
    { value: 'custoProdutos', label: 'Custo dos Produtos' },
    { value: 'despesasOperacionais', label: 'Despesas Operacionais' },
  ];

  const fetchMainData = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');

    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = adjustedEndDate.toISOString().split('T')[0];
    const params = new URLSearchParams({ data_inicio: formattedStartDate, data_fim: formattedEndDate });
    const queryString = params.toString();

    try {
      const [summaryRes, salesOverTimeRes, customersRes, productsRes, paymentRes] = await Promise.all([
        api.get(`/api/financials/summary?${queryString}`),
        api.get(`/api/financials/sales-over-time?${queryString}`),
        api.get(`/api/financials/customer-profitability?${queryString}`),
        api.get(`/api/financials/product-profitability?${queryString}`),
        api.get(`/api/financials/payment-method-stats?${queryString}`)
      ]);
      setSummaryData(summaryRes.data);
      setTopCustomers(customersRes.data);
      setTopProducts(productsRes.data);
      setPaymentStats(paymentRes.data);
      const labels = salesOverTimeRes.data.map(d => new Date(d.dia).toLocaleDateString('pt-BR', { timeZone: 'UTC' }));
      const data = salesOverTimeRes.data.map(d => d.totalVendido);
      setChartData({ labels, datasets: [{
          label: 'Receita Bruta por Dia', data, fill: true,
          borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)', tension: 0.1
      }]});
    } catch (err) {
      console.error("Erro ao buscar dados financeiros principais", err);
      setError("Não foi possível carregar os dados principais.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDespesas = async (pageToFetch = despesaCurrentPage) => {
    if (!startDate || !endDate) return;
    try {
      setDespesasLoading(true);
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = new Date(endDate.getTime() + 86400000).toISOString().split('T')[0];
      const params = new URLSearchParams({
        data_inicio: formattedStartDate, data_fim: formattedEndDate,
        page: pageToFetch, limit: 10
      });
      if (despesaSearchTerm) { params.append('search', despesaSearchTerm); }
      const response = await api.get(`/api/despesas?${params.toString()}`);
      setDespesas(response.data.despesas);
      setDespesaTotalPages(response.data.totalPages);
      setDespesaCurrentPage(response.data.currentPage);
    } catch (err) {
      console.error("Erro ao buscar despesas", err);
    } finally {
      setDespesasLoading(false);
    }
  };
  
  const refreshAllData = () => {
    fetchMainData();
    fetchDespesas();
  };

  useEffect(() => {
    refreshAllData();
  }, [startDate, endDate]);
  
  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      if (despesaCurrentPage !== 1) { setDespesaCurrentPage(1); } 
      else { fetchDespesas(1); }
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [despesaSearchTerm]);

  useEffect(() => {
    fetchDespesas(despesaCurrentPage);
  }, [despesaCurrentPage]);

  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const response = await api.get('/api/financials/available-months');
        const monthOptions = response.data.map(item => {
          const monthName = new Date(item.ano, item.mes - 1).toLocaleString('pt-BR', { month: 'long' });
          return {
            value: `${item.ano}-${String(item.mes).padStart(2, '0')}`,
            label: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${item.ano}`
          };
        });
        setAvailableMonths(monthOptions);
      } catch (err) { console.error("Erro ao buscar meses disponíveis", err); }
    };
    fetchMonths();
  }, []);

  useEffect(() => {
    const fetchComparisonData = async () => {
      if (selectedMonths.length < 2 || !selectedMetric) {
        setComparisonChartData({ labels: [], datasets: [] });
        return;
      }
      try {
        setComparisonLoading(true);
        const meses = selectedMonths.map(m => m.value).join(',');
        const metrica = selectedMetric.value;
        const response = await api.get(`/api/financials/monthly-comparison?meses=${meses}&metrica=${metrica}`);
        const labels = response.data.map(d => d.mesAno);
        const data = response.data.map(d => d.valor);
        setComparisonChartData({
          labels,
          datasets: [{
            label: selectedMetric.label,
            data,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          }]
        });
      } catch (err) { console.error("Erro ao buscar dados de comparação", err); } 
      finally { setComparisonLoading(false); }
    };
    fetchComparisonData();
  }, [selectedMonths, selectedMetric]);

  const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      <h1 className="mb-4">Painel Financeiro</h1>
      <div className="card card-body mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-auto"><label className="form-label mb-0 me-2">Período:</label></div>
          <div className="col-md-auto"><DatePicker selected={startDate} onChange={(date) => setStartDate(date)} className="form-control" dateFormat="dd/MM/yyyy" locale="pt-BR" selectsStart startDate={startDate} endDate={endDate} /></div>
          <div className="col-md-auto"><label className="form-label mb-0 me-2">até</label></div>
          <div className="col-md-auto"><DatePicker selected={endDate} onChange={(date) => setEndDate(date)} className="form-control" dateFormat="dd/MM/yyyy" locale="pt-BR" selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} /></div>
        </div>
      </div>

      {loading ? ( <div className="text-center my-5"><div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} /></div> ) 
      : error ? ( <div className="alert alert-danger">{error}</div> ) 
      : summaryData && (
        <>
          <div className="row">
            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-white bg-success h-100"><div className="card-body"><h6 className="card-title text-uppercase">Receita Bruta</h6><p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.receitaBruta)}</p></div></div></div>
            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-white bg-warning h-100"><div className="card-body"><h6 className="card-title text-uppercase">Custo dos Produtos</h6><p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.custoProdutos)}</p></div></div></div>
            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-white bg-danger h-100"><div className="card-body"><h6 className="card-title text-uppercase">Despesas Operacionais</h6><p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.despesasOperacionais)}</p></div></div></div>
            <div className="col-lg-3 col-md-6 mb-4"><div className="card text-white bg-primary h-100"><div className="card-body"><h6 className="card-title text-uppercase">Lucro Líquido</h6><p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.lucroLiquido)}</p></div></div></div>
          </div>
          <div className="card mt-4">
            <div className="card-header"><h5>Vendas ao Longo do Tempo</h5></div>
            <div className="card-body"><Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Receita Bruta Diária' }}}} /></div>
          </div>
          <div className="row mt-4">
            <div className="col-lg-6 mb-4"><div className="card h-100"><div className="card-header"><h5>Top 10 Clientes Mais Lucrativos</h5></div><div className="card-body table-responsive"><table className="table table-sm table-striped"><thead><tr><th>Cliente</th><th className="text-end">Lucro Gerado</th></tr></thead><tbody>{topCustomers.map(c => <tr key={c.id}><td>{c.nome}</td><td className="text-end">{formatCurrency(c.lucro_total)}</td></tr>)}</tbody></table></div></div></div>
            <div className="col-lg-6 mb-4"><div className="card h-100"><div className="card-header"><h5>Top 10 Produtos Mais Lucrativos</h5></div><div className="card-body table-responsive"><table className="table table-sm table-striped"><thead><tr><th>Produto</th><th className="text-end">Lucro Gerado</th></tr></thead><tbody>{topProducts.map(p => <tr key={p.id}><td>{p.nome}</td><td className="text-end">{formatCurrency(p.lucro_total)}</td></tr>)}</tbody></table></div></div></div>
          </div>
          <div className="card mt-4">
            <div className="card-header"><h5>Análise por Forma de Pagamento</h5></div>
            <div className="card-body"><div className="table-responsive"><table className="table table-sm table-striped"><thead><tr><th>Forma de Pagamento</th><th className="text-center">Nº de Vendas</th><th className="text-end">Receita Total</th><th className="text-end">Lucro Total</th></tr></thead><tbody>{paymentStats.length > 0 ? paymentStats.map(p => (<tr key={p.forma_pagamento}><td>{p.forma_pagamento}</td><td className="text-center">{p.numero_de_vendas}</td><td className="text-end">{formatCurrency(p.receita_total)}</td><td className="text-end">{formatCurrency(p.lucro_total)}</td></tr>)) : (<tr><td colSpan="4" className="text-center text-muted">Nenhum dado neste período.</td></tr>)}</tbody></table></div></div>
          </div>
          <div className="card mt-4">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap">
              <h5 className="mb-2 me-3">Gerenciamento de Despesas</h5>
              <div>
                <button className="btn btn-outline-secondary me-2" onClick={() => setShowExpenseCatModal(true)}>Gerenciar Categorias</button>
                <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>+ Adicionar Despesa</button>
              </div>
            </div>
            <div className="card-body">
              <input type="text" className="form-control mb-3" placeholder="Pesquisar despesa por descrição..." value={despesaSearchTerm} onChange={(e) => { setDespesaSearchTerm(e.target.value); setDespesaCurrentPage(1); }} />
              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th className="text-end">Valor</th></tr></thead>
                  <tbody>
                    {despesasLoading ? (
                      <tr><td colSpan="4" className="text-center"><div className="spinner-border spinner-border-sm"/></td></tr>
                    ) : despesas.length > 0 ? despesas.map(d => (
                      <tr key={d.id}>
                        <td>{new Date(d.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                        <td>{d.descricao}{d.produto_nome && <small className="d-block text-muted">Produto: {d.produto_nome}</small>}</td>
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
            <div className="card-footer d-flex justify-content-center">
              <Pagination currentPage={despesaCurrentPage} totalPages={despesaTotalPages} onPageChange={(page) => setDespesaCurrentPage(page)} />
            </div>
          </div>
          <div className="card mt-4">
            <div className="card-header"><h5>Comparativo Mensal</h5></div>
            <div className="card-body">
              <div className="row g-3 mb-3">
                <div className="col-md-7">
                  <label className="form-label">Selecione 2 ou mais meses para comparar</label>
                  <Select isMulti options={availableMonths} value={selectedMonths} onChange={setSelectedMonths} placeholder="Escolha os meses..." noOptionsMessage={() => "Nenhum mês com vendas"} />
                </div>
                <div className="col-md-5">
                  <label className="form-label">Selecione a Métrica</label>
                  <Select options={metricOptions} value={selectedMetric} onChange={setSelectedMetric} />
                </div>
              </div>
              {comparisonLoading ? (
                <div className="text-center"><div className="spinner-border spinner-border-sm" /></div>
              ) : selectedMonths.length >= 2 && (
                <Bar data={comparisonChartData} options={{ responsive: true, plugins: { legend: { display: false }, title: { display: true, text: `Comparativo de ${selectedMetric.label}` } } }} />
              )}
            </div>
          </div>
        </>
      )}
      <AddExpenseModal show={showExpenseModal} onHide={() => setShowExpenseModal(false)} onSave={refreshAllData} />
      <ExpenseCategoryModal show={showExpenseCatModal} onHide={() => setShowExpenseCatModal(false)} onUpdate={refreshAllData} />
    </div>
  );
}

export default FinancialDashboardPage;