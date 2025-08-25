// src/components/LocalCartModal.jsx
import { useEffect, useRef, useState } from 'react';
import { Modal } from 'bootstrap';

function LocalCartModal({ show, onHide, cartItems, onUpdateQuantity, onRemoveItem, onFinalizeSale }) {
  const [formaPagamento, setFormaPagamento] = useState('Físico');
  const modalRef = useRef();

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  const totalCarrinho = cartItems.reduce((total, item) => total + (item.valor * item.quantidade), 0);

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
                            <div>
                                <strong>{item.nome}</strong>
                                <br/>
                                <small>R$ {parseFloat(item.valor).toFixed(2).replace('.', ',')}</small>
                            </div>
                            <div className="d-flex align-items-center">
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => onUpdateQuantity(item.id, item.quantidade - 1)}>-</button>
                                <span className="mx-2">{item.quantidade}</span>
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => onUpdateQuantity(item.id, item.quantidade + 1)} disabled={item.quantidade >= item.estoque}>+</button>
                                <button className="btn btn-danger btn-sm ms-3" onClick={() => onRemoveItem(item.id)}>Remover</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-center text-muted">O carrinho está vazio.</p> }
            <div className="mb-3">
                <label className="form-label">Forma de Pagamento</label>
                <select className="form-select" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                    <option value="Físico">Dinheiro Físico</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="PIX">PIX</option>
                </select>
            </div>
            <div className="text-end fw-bold fs-5">
              Total: R$ {totalCarrinho.toFixed(2).replace('.', ',')}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Continuar Vendendo</button>
            <button type="button" className="btn btn-success" onClick={() => onFinalizeSale(formaPagamento)} disabled={cartItems.length === 0}>Finalizar Venda Física</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocalCartModal;