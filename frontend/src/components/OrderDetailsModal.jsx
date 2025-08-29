// src/components/OrderDetailsModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';

function OrderDetailsModal({ show, onHide, pedidoId, onBack, onOrderUpdate }) {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef();

  // Função para buscar os detalhes do pedido, agora será reutilizada
  const fetchDetalhesPedido = async () => {
    if (!pedidoId) return;
    setLoading(true);
    setError('');
    setPedido(null);
    try {
      const response = await api.get(`/api/pedidos/${pedidoId}`);
      setPedido(response.data);
    } catch (err) {
      setError('Não foi possível carregar os detalhes do pedido.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Busca os dados quando o modal abre
  useEffect(() => {
    if (show) {
      fetchDetalhesPedido();
    }
  }, [show, pedidoId]);

  // Controla a exibição do modal do Bootstrap
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  // Nova função para lidar com a atualização da quantidade de um item
  const handleUpdateQuantity = async (itemId, novaQuantidade) => {
    try {
      await api.patch(`/api/pedidos/itens/${itemId}`, { novaQuantidade });
      fetchDetalhesPedido(); // Atualiza os dados DENTRO do modal

      // ✅ 2. AVISA A PÁGINA PRINCIPAL que uma mudança ocorreu
      if (onOrderUpdate) {
        onOrderUpdate();
      }

    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao atualizar item.');
    }
  };
  
  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Detalhes do Pedido #{pedidoId}</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {loading && <div className="text-center my-5"><div className="spinner-border" /></div>}
            {error && <div className="alert alert-danger">{error}</div>}
            
            {pedido && !loading && (
              <div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Data:</strong> {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</p>
                    <p className="mb-1"><strong>Status:</strong> {pedido.status}</p>
                    <p className="mb-0"><strong>Pagamento:</strong> {pedido.forma_pagamento || 'Não informado'}</p>
                  </div>
                  <div className="col-md-6">
                    {pedido.local_entrega && (
                      <div>
                        <strong>Local de Entrega:</strong>
                        <p className="bg-light p-2 rounded small" style={{ whiteSpace: 'pre-wrap' }}>{pedido.local_entrega}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <h6 className="mt-4">Itens do Pedido:</h6>
                <div className="list-group">
                  {pedido.itens.map((item) => (
                    <div key={item.id} className="list-group-item d-flex flex-wrap justify-content-between align-items-center">
                      <div className="d-flex align-items-center me-3" style={{minWidth: '250px'}}>
                        <img 
                          src={item.imagem_produto_url ? `http://localhost:3001/uploads/${item.imagem_produto_url}` : 'https://placehold.co/60'} 
                          alt={item.nome}
                          className="img-thumbnail me-3"
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        />
                        <div className="flex-grow-1">
                          <div>{item.nome}</div>
                          <small className="text-muted">{item.quantidade} x R$ {parseFloat(item.preco_unitario).toFixed(2).replace('.', ',')}</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <div className="input-group input-group-sm" style={{ width: '120px' }}>
                          <button className="btn btn-outline-secondary" type="button" onClick={() => handleUpdateQuantity(item.id, item.quantidade - 1)}>-</button>
                          <span className="form-control text-center">{item.quantidade}</span>
                          <button className="btn btn-outline-secondary" type="button" onClick={() => handleUpdateQuantity(item.id, item.quantidade + 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="my-3"/>
                
                {pedido.forma_pagamento === 'Dinheiro' && pedido.valor_pago_cliente && (
                  <div className="alert alert-info">
                    <div className="d-flex justify-content-between">
                      <span>Cliente pagará com:</span>
                      <span>R$ {parseFloat(pedido.valor_pago_cliente).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <hr/>
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Levar troco de:</span>
                      <span>R$ {(pedido.valor_pago_cliente - pedido.valor_total).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                )}

                <div className="text-end fw-bold fs-5 mt-3">Total do Pedido: R$ {parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')}</div>
              </div>
            )}
          </div>
          <div className="modal-footer justify-content-between">
            {onBack && 
              <button type="button" className="btn btn-secondary" onClick={onBack}>
                &larr; Voltar para Ações 
              </button>
            }
            <button type="button" className="btn btn-primary" onClick={onHide}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;