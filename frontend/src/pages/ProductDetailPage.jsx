// src/pages/ProductDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

// Importa as ferramentas e estilos do Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

function ProductDetailPage() {
  const { id } = useParams(); 
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // useEffect principal para buscar o produto da página
  useEffect(() => {
    window.scrollTo(0, 0); // Scrolla para o topo da página
    const fetchProduct = async () => {
      setLoading(true);
      setProduct(null);
      setRelatedProducts([]);
      try {
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

  // useEffect secundário para buscar os produtos relacionados
  useEffect(() => {
    if (product && product.categoria_nome) {
      const fetchRelatedProducts = async () => {
        try {
          const params = new URLSearchParams();
          params.append('category', product.categoria_nome);
          const response = await api.get(`/api/produtos?${params.toString()}`);
          const filteredProducts = response.data
            .filter(p => p.id !== product.id)
            .slice(0, 8);
          setRelatedProducts(filteredProducts);
        } catch (err) {
          console.error("Falha ao buscar produtos relacionados", err);
        }
      };
      fetchRelatedProducts();
    }
  }, [product]);

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

  const isOutOfStock = product.estoque <= 0;

  const renderStockMessage = () => {
    if (isOutOfStock) {
      return <p className="text-danger fw-bold mt-3">Produto indisponível</p>;
    }
    if (product.estoque === 1) {
      return <p className="text-warning fw-bold mt-3">Última unidade!</p>;
    }
    if (product.estoque <= 10) {
      return <p className="text-warning fw-bold mt-3">Últimas {product.estoque} unidades!</p>;
    }
    return null; 
  };

  return (
    <div className="container my-5">
      <div className="row">
        <div className="col-lg-6 mb-4">
          <img src={imageUrl} alt={product.nome} className="img-fluid rounded shadow-sm" />
        </div>
        <div className="col-lg-6">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item active" aria-current="page">{product.nome}</li>
            </ol>
          </nav>
          <h1>{product.nome}</h1>
          {product.categoria_nome && (
             <p className="lead text-muted">{product.categoria_nome}</p>
          )}
          <h3 className="my-3 display-5">R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}</h3>
          <p className="mt-4">{product.descricao}</p>
          <div className="d-grid gap-2 mt-4">
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
            {renderStockMessage()}
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-5">
          <hr />
          <h2 className="my-4">Produtos Relacionados</h2>
          {/* ✅ CONTAINER COM A CLASSE ESPECIAL PARA O CSS */}
          <div className="product-carousel">
            <Swiper
              modules={[Navigation]}
              navigation
              spaceBetween={30}
              breakpoints={{
                576: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1200: { slidesPerView: 4 },
              }}
            >
              {relatedProducts.map(relatedProduct => (
                <SwiperSlide key={relatedProduct.id}>
                  <ProductCard product={relatedProduct} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetailPage;