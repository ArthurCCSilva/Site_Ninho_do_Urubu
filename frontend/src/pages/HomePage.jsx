// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import Select from 'react-select';
import './HomePage.css';
import '../components/ProductCard.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { useFeatureFlags } from '../context/FeatureFlagContext';

// Importa o novo CSS e a biblioteca de animações
import './HomePage.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para os filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);
  const [sortOrder, setSortOrder] = useState(''); // Armazena a string de ordenação, ex: 'price_asc'
  const [categories, setCategories] = useState([]);

  // Estados para a paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(12);

  const { isEnabled } = useFeatureFlags();

  // ✅ 2. Inicializa a biblioteca de animações AOS
  useEffect(() => {
    AOS.init({
      duration: 1000, // Duração da animação em milissegundos
      once: true,     // Animação acontece apenas uma vez
    });
  }, []);

  // useEffect "assistente" para a barra de busca (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // useEffect "principal" para buscar os produtos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page: currentPage, limit });
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        // Se filterCategory for um objeto (do Select), pega o .value
        if (filterCategory) params.append('category', filterCategory.value);
        // Se sortOrder for uma string (dos botões), usa diretamente
        if (sortOrder) params.append('sort', sortOrder);

        const response = await api.get(`/api/produtos?${params.toString()}`);

        setProducts(response.data.produtos || []);
        setTotalPages(response.data.totalPages);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar os produtos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [currentPage, debouncedSearchTerm, filterCategory, sortOrder, limit]);

  // useEffect para buscar categorias e destaques (apenas uma vez)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, featRes] = await Promise.all([
          api.get('/api/categorias?limit=all'),
          api.get('/api/produtos?destaque=true')
        ]);
        const formattedCategories = catRes.data.categorias.map(cat => ({ value: cat.nome, label: cat.nome }));
        setCategories(formattedCategories);
        setFeaturedProducts(featRes.data.produtos || []);
      } catch (err) {
        console.error("Falha ao buscar dados iniciais", err);
      }
    };
    fetchInitialData();
  }, []);

  // Handlers para resetar a página ao filtrar
  const handleFilterChange = (setter, value) => {
    setter(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };


  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      {/* ✅ 3. ADICIONA A NOVA SEÇÃO DE "HERÓI" AQUI */}
      <header>
        {/* A 'section' agora é naturalmente de largura total */}
        <section id="hero" className="img-home d-flex align-items-center text-center">
          {/* O 'container' agora está DENTRO, para centralizar apenas o conteúdo */}
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-md-10 col-lg-8">
                <h1 data-aos="fade-left" className="text-white text-uppercase fw-semibold display-1">
                  Bar Ninho do Urubu
                </h1>
                <h5 data-aos="fade-right" className="text-white mt-3 mb-4">
                  O melhor Bar da Região!
                </h5>
              </div>
            </div>
          </div>
        </section>
      </header>

      {isEnabled('produtos_destaque') && (
 
        // Condição interna que você já tinha, para só mostrar se houver produtos
        featuredProducts.length > 0 && (
          <section className="mb-5">
            <h2 className="homepage-title">Produtos em Destaque</h2>
            <div className="product-carousel">
              <Swiper
                modules={[Navigation]}
                navigation
                spaceBetween={20}
                autoHeight={false}
                breakpoints={{
                  0: { slidesPerView: 1 }, 576: { slidesPerView: 2 },
                  992: { slidesPerView: 4 }, 1200: { slidesPerView: 6 },
                }}
              >
                {featuredProducts.map(product => (
                  <SwiperSlide key={product.id}>
                    <ProductCard product={product} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <hr className="my-5" />
          </section>
        )

      )}

      <h1 className="homepage-title">Nossos Produtos</h1>
      <div className="card card-body mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-lg-5">
            <input
              type="text"
              className="form-control"
              placeholder="Pesquisar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-lg-3">
            <Select
              options={categories}
              isClearable
              placeholder="Filtrar por Categoria..."
              value={filterCategory}
              onChange={(option) => handleFilterChange(setFilterCategory, option)}
              noOptionsMessage={() => "Nenhuma categoria"}
            />
          </div>
          <div className="col-lg-4">
            <div className="btn-group w-100" role="group">
              <button type="button" className={`btn btn-outline-secondary ${sortOrder === 'price_asc' ? 'active' : ''}`} onClick={() => handleFilterChange(setSortOrder, 'price_asc')}>Preço ↑</button>
              <button type="button" className={`btn btn-outline-secondary ${sortOrder === 'price_desc' ? 'active' : ''}`} onClick={() => handleFilterChange(setSortOrder, 'price_desc')}>Preço ↓</button>
              <button type="button" className={`btn btn-outline-secondary ${!sortOrder ? 'active' : ''}`} onClick={() => handleFilterChange(setSortOrder, '')}>Padrão</button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center my-5"><div className="spinner-border" /></div>
      ) : (
        <>
          <div className="row g-4 product-grid">
            {products.map(product => (
              <div key={product.id} className="col-12 col-sm-6 col-md-4 col-xl-2 d-flex align-items-stretch">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default HomePage;