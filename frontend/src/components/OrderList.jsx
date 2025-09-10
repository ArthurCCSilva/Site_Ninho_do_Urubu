// src/components/OrderList.jsx
import React from 'react';

function OrderList({ pedidos, onShowDetails, onCancelarPedido }) {
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'Entregue': return 'success';
      case 'Cancelado':
      case 'Boleto Negado':
        return 'danger';
      case 'Enviado': return 'info';
      case 'Fiado': return 'dark';
      case 'Boleto em Pagamento': return 'primary';
      default: return 'warning'; // Processando, Aguardando Aprovação Boleto
    }
  };

  if (!pedidos || pedidos.length === 0) {
    return <p className="text-center text-muted">Nenhum pedido encontrado nesta categoria.</p>;
  }

  return (
    <div className="list-group">
      {pedidos.map(pedido => {
        // ✅ CONDIÇÃO ATUALIZADA: O botão de cancelar agora aparece para os dois status
        const podeCancelar = pedido.status === 'Processando' || pedido.status === 'Aguardando Aprovação Boleto';
        
        return (
          <div key={pedido.id} className="list-group-item list-group-item-action">
            <div className="d-flex w-100 justify-content-between">
              <h5 className="mb-1">Pedido #{pedido.id}</h5>
              <small>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</small>
            </div>
            <p className="mb-1">
              <strong>Status:</strong> <span className={`badge bg-${getStatusClass(pedido.status)}`}>{pedido.status}</span>
            </p>
            <p className="mb-1">
              <strong>Valor Total:</strong> {parseFloat(pedido.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <div className="mt-2">
              <button className="btn btn-primary btn-sm me-2" onClick={() => onShowDetails(pedido.id)}>
                Ver Detalhes
              </button>
              {/* O onCancelarPedido só é passado para a lista de 'pedidos em andamento' */}
              {onCancelarPedido && podeCancelar && (
                <button className="btn btn-outline-danger btn-sm" onClick={() => onCancelarPedido(pedido.id)}>
                  Cancelar Pedido
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default OrderList;