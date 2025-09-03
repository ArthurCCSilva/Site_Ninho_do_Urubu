// src/components/OrderDetailsModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';
import CurrencyInput from 'react-currency-input-field';

function OrderDetailsModal({ show, onHide, pedidoId, onBack, onOrderUpdate }) {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef();
  const [novoPagamento, setNovoPagamento] = useState('');

  // ✅ 1. ADICIONE A FUNÇÃO QUE ESTAVA FALTANDO
  const formatCurrency = (value) => {
    return (parseFloat(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

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

  useEffect(() => {
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

  const handleUpdateQuantity = async (itemId, novaQuantidade) => {
    try {
      await api.patch(`/api/pedidos/itens/${itemId}`, { novaQuantidade });
      fetchDetalhesPedido();
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao atualizar item.');
    }
  };

  const handleRegistrarPagamento = async () => {
    if (!novoPagamento || parseFloat(String(novoPagamento).replace(',', '.')) <= 0) {
      return alert("Insira um valor de pagamento válido.");
    }
    try {
      const valorCorrigido = String(novoPagamento).replace(',', '.');
      await api.post(`/api/pedidos/${pedidoId}/pagamento-fiado`, { valor_pago: valorCorrigido });
      alert('Pagamento registrado com sucesso!');
      setNovoPagamento('');
      fetchDetalhesPedido();
      if (onOrderUpdate) onOrderUpdate();
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao registrar pagamento.");
    }
  };

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
                      <span>{formatCurrency(pedido.valor_pago_cliente)}</span>
                    </div>
                    <hr/>
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Levar troco de:</span>
                      <span>{formatCurrency(pedido.valor_pago_cliente - pedido.valor_total)}</span>
                    </div>
                  </div>
                )}
                
                {pedido.status === 'Fiado' && (
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Status do Fiado</h5>
                      <ul className="list-group list-group-flush mb-3">
                        <li className="list-group-item d-flex justify-content-between bg-transparent"><span>Total do Pedido:</span> <span>{formatCurrency(pedido.valor_total)}</span></li>
                        <li className="list-group-item d-flex justify-content-between bg-transparent"><span>Total Pago:</span> <span className="text-success fw-bold">{formatCurrency(totalPagoFiado)}</span></li>
                        <li className="list-group-item d-flex justify-content-between bg-transparent"><span>Saldo Devedor:</span> <span className="text-danger fw-bold">{formatCurrency(saldoDevedor)}</span></li>
                      </ul>
                      <h6>Registrar Novo Pagamento:</h6>
                      <div className="input-group">
                        <CurrencyInput className="form-control" placeholder="0,00" value={novoPagamento} onValueChange={(value) => setNovoPagamento(value || '')} intlConfig={{ locale: 'pt-BR', currency: 'BRL' }} />
                        <button className="btn btn-primary" type="button" onClick={handleRegistrarPagamento}>Registrar</button>
                      </div>
                      {pedido.pagamentos_fiado && pedido.pagamentos_fiado.length > 0 && (
                        <>
                          <h6 className="mt-3">Histórico de Pagamentos:</h6>
                          <ul className="list-group list-group-sm">
                            {pedido.pagamentos_fiado.map(p => (
                              <li key={p.id} className="list-group-item d-flex justify-content-between">
                                <span>{new Date(p.data_pagamento).toLocaleDateString('pt-BR')}</span>
                                <span>{formatCurrency(p.valor_pago)}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-end fw-bold fs-5 mt-3">Total do Pedido: {formatCurrency(pedido.valor_total)}</div>
              </div>
            )}
          </div>
          <div className="modal-footer justify-content-between">
            {onBack && <button type="button" className="btn btn-secondary" onClick={onBack}>&larr; Voltar para Ações</button>}
            <button type="button" className="btn btn-primary" onClick={onHide}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;