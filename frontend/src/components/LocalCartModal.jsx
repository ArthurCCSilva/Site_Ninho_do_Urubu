// src/components/LocalCartModal.jsx
import { useEffect, useRef, useState } from 'react';
import { Modal } from 'bootstrap';

function LocalCartModal({ show, onHide, cartItems, onUpdateQuantity, onRemoveItem, onFinalizeSale }) {
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro'); // Padrão 'Dinheiro' para venda física
  
  // ✅ 1. NOVO ESTADO para o valor que o cliente vai usar para pagar
  const [valorPago, setValorPago] = useState('');
  
  const modalRef = useRef();

  // Limpa o valor do troco sempre que o modal é aberto ou a forma de pagamento muda
  useEffect(() => {
    if (show) {
      setValorPago('');
    }
  }, [show, formaPagamento]);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  const totalCarrinho = cartItems.reduce((total, item) => total + (item.valor * item.quantidade), 0);
  
  // ✅ 2. LÓGICA para calcular o troco
  const troco = valorPago > totalCarrinho ? valorPago - totalCarrinho : 0;

  const handleFinalize = () => {
    // ✅ 3. VALIDAÇÃO para o pagamento em dinheiro
    if (formaPagamento === 'Dinheiro' && (!valorPago || parseFloat(valorPago) < totalCarrinho)) {
      alert('Para pagamento em dinheiro, informe um valor igual ou maior que o total da compra para o cálculo do troco.');
      return;
    }
    onFinalizeSale(formaPagamento);
  }

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Carrinho da Venda Física</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="text-center mb-3">
                <img src="https://placehold.co/100/6c757d/white?text=Cliente" alt="Cliente" className="rounded-circle"/>
            </div>
            {cartItems.length > 0 ? (
                <ul className="list-group mb-3">
                    {cartItems.map(item => (
                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <img src={item.imagem_produto_url ? `http://localhost:3001/uploads/${item.imagem_produto_url}` : 'https://placehold.co/60'} alt={item.nome} className="img-thumbnail me-3" style={{width: '60px', height: '60px', objectFit: 'cover'}}/>
                                <div>
                                    <strong>{item.nome}</strong><br/>
                                    <small>R$ {parseFloat(item.valor).toFixed(2).replace('.', ',')}</small>
                                </div>
                            </div>
                            <div className="d-flex align-items-center">
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => onUpdateQuantity(item.id, item.quantidade - 1)}>-</button>
                                <span className="mx-2" style={{minWidth: '20px', textAlign: 'center'}}>{item.quantidade}</span>
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => onUpdateQuantity(item.id, item.quantidade + 1)} disabled={item.quantidade >= item.estoque_total}>+</button>
                                <button className="btn btn-danger btn-sm ms-3" onClick={() => onRemoveItem(item.id)}>&times;</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-center text-muted">O carrinho está vazio.</p> }
            <div className="mb-3">
                <label className="form-label fw-bold">Forma de Pagamento</label>
                <select className="form-select" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="PIX">PIX</option>
                </select>
            </div>
            
            {/* ✅ 4. CAMPO CONDICIONAL PARA TROCO */}
            {formaPagamento === 'Dinheiro' && (
                <div className="mb-3">
                  <label htmlFor="valor-pago-local" className="form-label">Pagar com (para troco)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="valor-pago-local"
                    className="form-control"
                    placeholder="Ex: 50.00"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                  />
                  {valorPago > totalCarrinho && (
                    <div className="form-text text-success fw-bold">Troco: R$ {troco.toFixed(2).replace('.', ',')}</div>
                  )}
                </div>
            )}

            <div className="text-end fw-bold fs-5">
              Total: R$ {totalCarrinho.toFixed(2).replace('.', ',')}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Continuar Vendendo</button>
            <button type="button" className="btn btn-success" onClick={handleFinalize} disabled={cartItems.length === 0}>Finalizar Venda Física</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocalCartModal;