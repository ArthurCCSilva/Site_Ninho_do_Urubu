// src/components/CustomerOrderDetailsModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';

function CustomerOrderDetailsModal({ show, onHide, pedidoId }) {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef();

  const formatCurrency = (value) => {
    return (parseFloat(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  useEffect(() => {
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
        console.error("Erro ao buscar detalhes do pedido para cliente:", err);
      } finally {
        setLoading(false);
      }
    };
    if (show) {
      fetchDetalhesPedido();
    }
  }, [show, pedidoId]);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  const totalPagoFiado = pedido?.pagamentos_fiado?.reduce((acc, p) => acc + parseFloat(p.valor_pago), 0) || 0;
  const saldoDevedor = (parseFloat(pedido?.valor_total) || 0) - totalPagoFiado;

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
                  {pedido.itens && pedido.itens.map((item) => (
                    <div key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <img 
                          src={item.imagem_produto_url ? `http://localhost:3001/uploads/${item.imagem_produto_url}` : 'https://placehold.co/60'} 
                          alt={item.nome}
                          className="img-thumbnail me-3"
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        />
                        <div className="flex-grow-1">
                          <div>{item.nome}</div>
                          <small className="text-muted">{item.quantidade} x {formatCurrency(item.preco_unitario)}</small>
                        </div>
                      </div>
                      <div className="fw-bold">{formatCurrency(item.quantidade * item.preco_unitario)}</div>
                    </div>
                  ))}
                </div>

                <hr className="my-3"/>
                
                {pedido.status === 'Fiado' && (
                  <div className="card bg-light mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Resumo do Fiado</h5>
                      <ul className="list-group list-group-flush mb-3">
                        <li className="list-group-item d-flex justify-content-between bg-transparent">
                          <span>Total do Pedido:</span> 
                          <span>{formatCurrency(pedido.valor_total)}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between bg-transparent">
                          <span>Total Pago:</span> 
                          <span className="text-success fw-bold">{formatCurrency(totalPagoFiado)}</span>
                        </li>
                        <li className="list-group-item d-flex justify-content-between bg-transparent">
                          <span>Saldo Devedor:</span> 
                          <span className="text-danger fw-bold">{formatCurrency(saldoDevedor)}</span>
                        </li>
                      </ul>
                      {pedido.pagamentos_fiado && pedido.pagamentos_fiado.length > 0 && (
                        <>
                          <h6 className="mt-3">Histórico de Pagamentos:</h6>
                          <ul className="list-group list-group-sm">
                            {pedido.pagamentos_fiado.map(p => (
                              <li key={p.id} className="list-group-item d-flex justify-content-between">
                                <span>{new Date(p.data_pagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                <span>{formatCurrency(p.valor_pago)}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {pedido.detalhes_boleto && (
                  <div className="card bg-light mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Detalhes do Boleto</h5>
                      <ul className="list-group list-group-flush">
                        {pedido.detalhes_boleto.parcelas.map(parc => {
                          const isVencida = new Date(parc.data_vencimento) < new Date() && parc.status === 'pendente';
                          return (
                            <li key={parc.id} className={`list-group-item d-flex justify-content-between bg-transparent ${parc.status === 'pago' ? 'text-muted' : ''}`}>
                              <span>Parcela {parc.numero_parcela}</span>
                              <span>Vencimento: {new Date(parc.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                              <span>
                                {isVencida && <span className="badge bg-danger me-2">Vencida</span>}
                                <span className={`badge ${parc.status === 'pago' ? 'bg-success' : 'bg-warning text-dark'}`}>{parc.status}</span>
                              </span>
                              <span>{formatCurrency(parc.valor)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="text-end fw-bold fs-5 mt-3">Total do Pedido: {formatCurrency(pedido.valor_total)}</div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerOrderDetailsModal;