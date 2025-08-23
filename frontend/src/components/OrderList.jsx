// src/components/OrderList.jsx

// ✅ 1. RECEBA a nova prop 'onCancelarPedido' na lista de argumentos
function OrderList({ pedidos, onShowDetails, onCancelarPedido }) {
  // Se a lista de pedidos estiver vazia, mostra uma mensagem
  if (pedidos.length === 0) {
    return <p className="text-muted">Nenhum pedido encontrado nesta categoria.</p>;
  }

  // Função para definir a cor do "badge" de status
  const getStatusClass = (status) => {
    switch (status) {
      case 'Entregue': return 'success';
      case 'Cancelado': return 'danger';
      case 'Enviado': return 'info';
      default: return 'warning'; // Processando
    }
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th># Pedido</th>
            <th>Data</th>
            <th>Valor Total</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map(pedido => (
            <tr key={pedido.id}>
              <td>{pedido.id}</td>
              <td>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</td>
              <td>R$ {parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')}</td>
              <td>
                <span className={`badge bg-${getStatusClass(pedido.status)}`}>
                  {pedido.status}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onShowDetails(pedido.id)}>
                    Ver Detalhes
                </button>
                
                {/* ✅ 2. RENDERIZAÇÃO CONDICIONAL do botão de cancelar */}
                {/* Este botão só aparecerá na tela se o status do pedido for 'Processando' */}
                {pedido.status === 'Processando' && (
                  <button 
                    className="btn btn-danger btn-sm ms-2"
                    onClick={() => onCancelarPedido(pedido.id)}
                  >
                    Cancelar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrderList;