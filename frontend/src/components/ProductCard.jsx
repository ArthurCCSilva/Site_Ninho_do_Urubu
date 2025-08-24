// src/components/ProductCard.jsx

// ✅ 1. IMPORTAMOS AS FERRAMENTAS NECESSÁRIAS
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function ProductCard({ product }) {
  // ✅ 2. PEGAMOS AS FUNÇÕES E DADOS DOS NOSSOS CONTEXTOS E DO ROUTER
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const imageUrl = product.imagem_produto_url
    ? `http://localhost:3001/uploads/${product.imagem_produto_url}`
    : 'https://placehold.co/300x200';

  // ✅ 3. CRIAMOS A LÓGICA PARA O CLIQUE NO BOTÃO
  const handleAddToCart = () => {
    if (!user) {
      // Se o usuário não estiver logado, leva para a página de login
      alert('Você precisa fazer login para adicionar itens ao carrinho.');
      navigate('/login');
    } else {
      // Se estiver logado, adiciona o produto ao carrinho
      addToCart(product.id, 1);
      alert(`"${product.nome}" foi adicionado ao carrinho!`);
    }
  };

  return (
    <div className="card h-100">
      {/* ✅ 2. ENVOLVA a imagem com o Link */}
      <Link to={`/produtos/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <img src={imageUrl} className="card-img-top" alt={product.nome} style={{ height: '200px', objectFit: 'cover' }} />
        <div className="card-body">
          <h5 className="card-title">{product.nome}</h5>
          <p className="card-text">
            {product.descricao ? `${product.descricao.substring(0, 80)}...` : 'Sem descrição.'}
          </p>
        </div>
      </Link>
      <div className="card-footer bg-transparent border-top-0">
        <p className="card-text fw-bold fs-5">
          R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}
        </p>
        <button className="btn btn-primary w-100" onClick={handleAddToCart}>
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
}

export default ProductCard;