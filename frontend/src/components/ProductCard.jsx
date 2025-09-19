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
    : 'https://placehold.co/200x200';
  
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

  const renderStockMessage = () => {
    // Não mostra nada se o estoque for alto ou se já estiver esgotado (o botão já avisa)
    if (product.estoque_total > 10 || isOutOfStock) {
      return null;
    }
    if (product.estoque_total === 1) {
      return <p className="text-warning small mb-1 fw-bold">Última unidade!</p>;
    }
    return <p className="text-warning small mb-1 fw-bold">Últimas {product.estoque_total} unidades!</p>;
  };

  return (
    <div className="card h-100 product-card">
      
      {/* ✅ ATUALIZAÇÃO: O Link envolve a imagem e tem a posição relativa para o selo */}
      <Link to={`/produtos/${product.id}`} style={{ position: 'relative' }}>
        
        {/* O selo de promoção é renderizado aqui, se o produto tiver a flag 'promocao' */}
        {product.promocao ? <div className="promotion-badge">PROMOÇÃO</div> : null}
        
        <img src={imageUrl} className="card-img-top" alt={product.nome} />
      </Link>

      {/* Mantivemos a estrutura que garante o alinhamento dos rodapés */}
      <div className="card-body">
        <h5 className="card-title">
          <Link to={`/produtos/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {product.nome}
          </Link>
        </h5>
      </div>

      <div className="card-footer">
        {renderStockMessage()}
        <p className="card-text fw-bold fs-5 mb-2">
          R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}
        </p>
        
        {isOutOfStock ? (
          <div className="d-grid">
            <button className="btn btn-secondary" disabled>Sem Estoque</button>
          </div>
        ) : (
          <button className="btn btn-dark w-100" onClick={handleAddToCart}>
            Adicionar ao Carrinho
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;