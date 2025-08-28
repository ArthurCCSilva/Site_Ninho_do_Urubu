// src/pages/FinancialDashboardPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from  "react-datepicker";
import ptBR from 'date-fns/locale/pt-BR';
registerLocale('pt-BR', ptBR);

// Importa as ferramentas de gráfico
import { Line } from 'react-chartjs-2';
// ✅ 1. Importa o 'Filler' junto com os outros módulos
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// ✅ 2. Registra o 'Filler'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function FinancialDashboardPage() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Define as datas padrão para o último mês
  const [endDate, setEndDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  
  // Novo estado para os dados do gráfico
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  // useEffect unificado para buscar todos os dados financeiros
  useEffect(() => {
    if (!startDate || !endDate) return;

    // Garante que a data final inclua o dia inteiro
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    // Formata as datas para o formato que a API espera
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = adjustedEndDate.toISOString().split('T')[0];
    
    const params = new URLSearchParams({
      data_inicio: formattedStartDate,
      data_fim: formattedEndDate,
    });
    const queryString = params.toString();

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError('');

        // Busca os dados dos KPIs e do gráfico em paralelo para mais performance
        const [summaryRes, salesOverTimeRes] = await Promise.all([
          api.get(`/api/financials/summary?${queryString}`),
          api.get(`/api/financials/sales-over-time?${queryString}`)
        ]);

        setSummaryData(summaryRes.data);
        
        // Prepara os dados para o formato que o gráfico espera
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

    fetchAllData();
  }, [startDate, endDate]); // Roda a busca sempre que as datas mudam

  // Função para formatar números como moeda (BRL)
  const formatCurrency = (value) => {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div>
      <h1 className="mb-4">Painel Financeiro</h1>

      <div className="card card-body mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-auto">
            <label className="form-label mb-0 me-2">Período:</label>
          </div>
          <div className="col-md-auto">
            <DatePicker 
              selected={startDate} 
              onChange={(date) => setStartDate(date)}
              className="form-control"
              dateFormat="dd/MM/yyyy"
              locale="pt-BR"
              selectsStart
              startDate={startDate}
              endDate={endDate}
            />
          </div>
          <div className="col-md-auto">
             <label className="form-label mb-0 me-2">até</label>
          </div>
          <div className="col-md-auto">
            <DatePicker 
              selected={endDate} 
              onChange={(date) => setEndDate(date)}
              className="form-control"
              dateFormat="dd/MM/yyyy"
              locale="pt-BR"
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
            />
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
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="card text-white bg-success h-100">
                <div className="card-body">
                  <h6 className="card-title text-uppercase">Receita Bruta</h6>
                  <p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.receitaBruta)}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="card text-white bg-warning h-100">
                <div className="card-body">
                  <h6 className="card-title text-uppercase">Custo dos Produtos</h6>
                  <p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.custoProdutos)}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="card text-white bg-danger h-100">
                <div className="card-body">
                  <h6 className="card-title text-uppercase">Despesas Operacionais</h6>
                  <p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.despesasOperacionais)}</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 mb-4">
              <div className="card text-white bg-primary h-100">
                <div className="card-body">
                  <h6 className="card-title text-uppercase">Lucro Líquido</h6>
                  <p className="card-text fs-4 fw-bold">{formatCurrency(summaryData.lucroLiquido)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5>Vendas ao Longo do Tempo</h5>
            </div>
            <div className="card-body">
              <Line 
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Receita Bruta Diária' },
                  },
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FinancialDashboardPage;