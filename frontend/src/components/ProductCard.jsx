// src/components/ProductCard.jsx
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './ProductCard.css';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const imageUrl = product.imagem_produto_url
    ? `http://localhost:3001/uploads/${product.imagem_produto_url}`
    : 'https://placehold.co/340x220'; // Imagem de placeholder ajustada

  const isOutOfStock = product.estoque_total <= 0;

  const handleAddToCart = () => {
    if (!user) {
      alert('Você precisa fazer login para adicionar itens ao carrinho.');
      navigate('/login');
    } else {
      addToCart(product.id, 1);
      alert(`"${product.nome}" foi adicionado ao carrinho!`);
    }
  };
  
  // Função melhorada para renderizar a mensagem de estoque com classes
  const renderStockMessage = () => {
    if (isOutOfStock) {
      return null; // O botão já informa "Sem Estoque"
    }
    if (product.estoque_total === 1) {
      return <p className="stock-message low-stock">Última unidade!</p>;
    }
    if (product.estoque_total > 1 && product.estoque_total <= 10) {
      return <p className="stock-message low-stock">Últimas {product.estoque_total} unidades!</p>;
    }
    return <p className="stock-message in-stock">Em estoque</p>;
  };

  return (
    <div className="product-card">
      <div className="product-content">
        {/* A imagem e o selo ficam juntos no image-wrapper */}
        <Link to={`/produtos/${product.id}`} className="image-wrapper">
          {product.promocao && <div className="promotion-badge">PROMOÇÃO</div>}
          <img src={imageUrl} alt={product.nome} />
        </Link>
        
        {/* Wrapper para informações, necessário para o layout responsivo */}
        <div className="info-wrapper">
          <div className="card-body">
            <h5 className="card-title">
              <Link to={`/produtos/${product.id}`}>
                {product.nome}
              </Link>
            </h5>
          </div>

          <div className="card-footer">
            {renderStockMessage()}
            <p className="price">
              R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}
            </p>
            
            {isOutOfStock ? (
              <button className="btn-add" disabled>Sem Estoque</button>
            ) : (
              <button className="btn-add" onClick={handleAddToCart}>
                Adicionar ao Carrinho
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;