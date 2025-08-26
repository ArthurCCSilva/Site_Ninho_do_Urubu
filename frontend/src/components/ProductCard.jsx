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
  
  const isOutOfStock = product.estoque <= 0;

  const handleAddToCart = () => {
    if (!user) {
      alert('Você precisa fazer login para adicionar itens ao carrinho.');
      navigate('/login');
    } else {
      addToCart(product.id, 1);
      alert(`"${product.nome}" foi adicionado ao carrinho!`);
    }
  };

  return (
    <div className="card h-100 product-card">
      {/* O link agora envolve apenas a imagem */}
      <Link to={`/produtos/${product.id}`}>
        <img src={imageUrl} className="card-img-top" alt={product.nome} />
      </Link>

      {/* O card-body agora é um filho direto do .product-card (flex container) */}
      <div className="card-body">
        {/* O título também vira um link para a página de detalhes */}
        <h5 className="card-title">
          <Link to={`/produtos/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {product.nome}
          </Link>
        </h5>
      </div>

      {/* O card-footer é o último item do flex container, sendo empurrado para baixo */}
      <div className="card-footer">
        <p className="card-text fw-bold fs-5 mb-2">
          R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}
        </p>
        
        {isOutOfStock ? (
          <div className="d-grid">
            <button className="btn btn-secondary" disabled>Sem Estoque</button>
          </div>
        ) : (
          <button className="btn btn-primary w-100" onClick={handleAddToCart}>
            Adicionar ao Carrinho
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;