// src/pages/CustomerDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';

function CustomerDashboard() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await api.get('/api/pedidos/meus-pedidos');
        setPedidos(response.data);
      } catch (err) {
        setError('Não foi possível carregar seus pedidos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPedidos();
  }, []);

  if (loading) return <div className="text-center"><div className="spinner-border" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <h1 className="mb-4">Painel do Cliente</h1>
      <p>Olá, <strong>{user?.nome}</strong>. Bem-vindo de volta!</p>

      <h3 className="mt-5">Meus Pedidos</h3>
      {pedidos.length > 0 ? (
        <table className="table table-hover">
          <thead>
            <tr>
              <th># Pedido</th>
              <th>Data</th>
              <th>Valor Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(pedido => (
              <tr key={pedido.id}>
                <td>{pedido.id}</td>
                <td>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</td>
                <td>R$ {parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')}</td>
                <td>
                  <span className={`badge bg-${pedido.status === 'Entregue' ? 'success' : pedido.status === 'Cancelado' ? 'danger' : 'warning'}`}>
                    {pedido.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Você ainda não fez nenhum pedido.</p>
      )}
    </div>
  );
}

export default CustomerDashboard;