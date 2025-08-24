// src/pages/ProductDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';

function ProductDetailPage() {
  const { id } = useParams(); 
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/produtos/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError('Não foi possível carregar os detalhes do produto.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Função para o botão "Adicionar ao Carrinho" desta página
  const handleAddToCart = () => {
    if (!user) {
      alert('Você precisa fazer login para adicionar itens ao carrinho.');
      navigate('/login');
    } else {
      addToCart(product.id, 1);
      alert(`"${product.nome}" foi adicionado ao carrinho!`);
    }
  };

  if (loading) return <div className="text-center my-5"><div className="spinner-border" /></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!product) return <div className="text-center my-5"><h2>Produto não encontrado.</h2><Link to="/">Voltar para a Home</Link></div>;

  const imageUrl = product.imagem_produto_url
    ? `http://localhost:3001/uploads/${product.imagem_produto_url}`
    : 'https://placehold.co/600x400';

  // ✅ --- NOVA LÓGICA PARA O ESTOQUE --- ✅
  // Variável para verificar se o produto está esgotado
  const isOutOfStock = product.estoque <= 0;

  // Função auxiliar que decide qual mensagem de estoque renderizar
  const renderStockMessage = () => {
    if (isOutOfStock) {
      return <p className="text-danger fw-bold mt-3">Produto indisponível</p>;
    }
    // Mostra a mensagem de "últimas unidades" se o estoque for 10 ou menos
    if (product.estoque <= 10 && product.estoque > 1 ) {
      return <p className="text-warning fw-bold mt-3">Últimas {product.estoque} unidades!</p>;
    }

    if (product.estoque === 1) {
      return <p className="text-warning fw-bold mt-3">Última {product.estoque} unidade!</p>;
    }
    // Se o estoque for maior que 10, não retorna nada (a mensagem não aparece)
    return null; 
  };

  return (
    <div className="container my-5">
      <div className="row">
        <div className="col-md-6">
          <img src={imageUrl} alt={product.nome} className="img-fluid rounded" />
        </div>
        <div className="col-md-6">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active" aria-current="page">{product.nome}</li>
            </ol>
          </nav>
          <h1>{product.nome}</h1>
          <p className="lead text-muted">{product.categoria_nome}</p>
          <h3 className="my-3">R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}</h3>
          <p>{product.descricao}</p>
          <div className="d-grid gap-2">
            {/* ✅ O botão agora é inteligente: ele é desabilitado e muda o texto se não houver estoque */}
            <button 
              className="btn btn-primary btn-lg" 
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
            </button>
          </div>
          <div className="mt-3">
            {/* ✅ A mensagem de estoque agora é renderizada pela nossa função */}
            {renderStockMessage()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;