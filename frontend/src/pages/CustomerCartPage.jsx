// src/pages/CustomerCartPage.jsx
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import './CustomerCartPage.css'; // Importa nosso CSS customizado

function CustomerCartPage() {
  // 1. Pega os itens e as funções do nosso CartContext
  const { cartItems, removeFromCart, checkout } = useCart();
  const navigate = useNavigate(); // Hook para navegação

  // 2. Lógica para calcular o total do carrinho
  // O método .reduce() soma os valores de um array.
  // Para cada 'item', ele multiplica 'valor' pela 'quantidade' e soma ao total acumulado.
  const totalCarrinho = cartItems.reduce((total, item) => {
    return total + (item.valor * item.quantidade);
  }, 0); // O '0' é o valor inicial do total.

  // 3. Função para lidar com a finalização da compra
  const handleCheckout = async () => {
    if (window.confirm('Deseja confirmar a compra?')) {
      try {
        const novoPedido = await checkout();
        alert(`Compra finalizada com sucesso! Pedido #${novoPedido.pedidoId}`);
        navigate('/meus-pedidos'); // Redireciona para a nova página de pedidos
      } catch (err) {
        alert(err.response?.data?.message || 'Não foi possível finalizar a compra. Verifique o estoque dos produtos.');
      }
    }
  };

  // 4. Lógica para lidar com o carrinho vazio
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

  // 5. Se o carrinho não estiver vazio, mostra a tabela de itens e o resumo
  return (
    <div>
      <h1 className="mb-4">Meu Carrinho</h1>
      <div className="row">
        {/* Coluna da esquerda com a lista de produtos */}
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

        {/* Coluna da direita com o resumo e o botão de finalizar */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Resumo da Compra</h5>
              <hr />
              <div className="d-flex justify-content-between">
                <span>Subtotal</span>
                <span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
              </div>
              {/* Espaço para futuras adições como frete ou descontos */}
              <div className="d-flex justify-content-between fw-bold mt-3 border-top pt-3">
                <span>Total</span>
                <span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="d-grid mt-4">
                <button className="btn btn-success btn-lg" onClick={handleCheckout}>
                  Finalizar Compra
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