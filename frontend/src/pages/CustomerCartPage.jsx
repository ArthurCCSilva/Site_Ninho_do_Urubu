// src/pages/CustomerCartPage.jsx
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './CustomerCartPage.css';

function CustomerCartPage() {
  const { cartItems, removeFromCart, checkout } = useCart();
  const navigate = useNavigate();
  
  const [formaPagamento, setFormaPagamento] = useState('Cartão de Crédito');
  const [localEntrega, setLocalEntrega] = useState('');
  const [loading, setLoading] = useState(false);

  const totalCarrinho = cartItems.reduce((total, item) => {
    return total + (item.valor * item.quantidade);
  }, 0);

  const handleCheckout = async () => {
    if (!localEntrega.trim()) {
      alert('Por favor, preencha o local de entrega.');
      return;
    }
    if (window.confirm('Deseja confirmar a compra?')) {
      setLoading(true);
      try {
        const novoPedido = await checkout(formaPagamento, localEntrega);
        alert(`Compra finalizada com sucesso! Pedido #${novoPedido.pedidoId}`);
        navigate('/meus-pedidos');
      } catch (err) {
        alert(err.response?.data?.message || 'Não foi possível finalizar a compra.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center mt-5">
        <h2>Seu carrinho está vazio.</h2>
        <p className="lead text-muted">Parece que você ainda não adicionou nenhum produto.</p>
        <Link to="/" className="btn btn-primary mt-3">
          Ver Produtos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Meu Carrinho</h1>
      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-body">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th scope="col" colSpan="2">Produto</th>
                    <th scope="col" className="text-center">Preço Unitário</th>
                    <th scope="col" className="text-center">Quantidade</th>
                    <th scope="col" className="text-end">Subtotal</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map(item => (
                    <tr key={item.produto_id}>
                      <td style={{ width: '120px' }}>
                        <img 
                          src={item.imagem_produto_url ? `http://localhost:3001/uploads/${item.imagem_produto_url}` : 'https://placehold.co/100'} 
                          alt={item.nome}
                          className="cart-product-image rounded"
                        />
                      </td>
                      <td>{item.nome}</td>
                      <td className="text-center">R$ {parseFloat(item.valor).toFixed(2).replace('.', ',')}</td>
                      <td className="text-center">{item.quantidade}</td>
                      <td className="text-end">R$ {(parseFloat(item.valor) * item.quantidade).toFixed(2).replace('.', ',')}</td>
                      <td className="text-center">
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          title="Remover item"
                          onClick={() => removeFromCart(item.produto_id)}
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Finalizar Pedido</h5>
              <hr />
              <div className="mb-3">
                <label htmlFor="local-entrega" className="form-label">Local de Entrega</label>
                <textarea 
                  id="local-entrega"
                  className="form-control"
                  rows="3"
                  placeholder="Ex: Rua Exemplo, 123, Bairro, Cidade - RJ, CEP: 20000-000"
                  value={localEntrega}
                  onChange={(e) => setLocalEntrega(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="forma-pagamento" className="form-label">Forma de Pagamento</label>
                <select 
                  id="forma-pagamento" 
                  className="form-select"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                >
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="PIX">PIX</option>
                </select>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold mt-2 fs-5">
                <span>Total</span>
                <span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="d-grid mt-4">
                <button className="btn btn-success btn-lg" onClick={handleCheckout} disabled={loading}>
                  {loading ? 'Processando...' : 'Finalizar Compra'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerCartPage;