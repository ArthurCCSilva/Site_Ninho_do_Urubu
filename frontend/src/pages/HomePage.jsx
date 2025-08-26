// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import Select from 'react-select';

// Importa os estilos que já criamos para o ProductCard
import '../components/ProductCard.css'; 

function HomePage() {
  // --- Estados para os dados ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para os filtros e ordenação ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [categories, setCategories] = useState([]);

  // --- Estados para a paginação ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(12); // 12 produtos por página como você pediu

  // --- Funções de Busca de Dados ---
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit });
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category', filterCategory);
      if (sortOrder) params.append('sort', sortOrder);
      
      const response = await api.get(`/api/produtos?${params.toString()}`);
      
      setProducts(response.data.produtos || []);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar os produtos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categorias?limit=all');
      const formattedCategories = response.data.categorias.map(cat => ({
        value: cat.nome,
        label: cat.nome
      }));
      setCategories(formattedCategories);
    } catch (err) {
      console.error("Falha ao buscar categorias para o filtro", err);
    }
  };

  // --- Efeitos (useEffect Hooks) ---
  // Roda a busca quando um filtro é alterado
  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      if (currentPage !== 1) { setCurrentPage(1); } 
      else { fetchProducts(1); }
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [searchTerm, filterCategory, sortOrder]);

  // Roda a busca quando a página muda
  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);
  
  // Roda uma vez para buscar as categorias do filtro
  useEffect(() => {
    fetchCategories();
  }, []);

  // --- Renderização do Componente ---
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <h1 className="homepage-title mb-3 mb-md-0">Nossos Produtos</h1>
      </div>
      
      {/* --- NOVA INTERFACE DE FILTROS --- */}
      <div className="card card-body mb-4">
        <div className="row g-3">
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
              onChange={(selectedOption) => setFilterCategory(selectedOption ? selectedOption.value : '')}
              noOptionsMessage={() => "Nenhuma categoria"}
            />
          </div>
          <div className="col-lg-4">
            <div className="btn-group w-100" role="group">
              <button type="button" className={`btn btn-outline-secondary ${sortOrder === 'price_asc' ? 'active' : ''}`} onClick={() => setSortOrder('price_asc')}>Preço ↑</button>
              <button type="button" className={`btn btn-outline-secondary ${sortOrder === 'price_desc' ? 'active' : ''}`} onClick={() => setSortOrder('price_desc')}>Preço ↓</button>
              <button type="button" className={`btn btn-outline-secondary ${!sortOrder ? 'active' : ''}`} onClick={() => setSortOrder('')}>Padrão</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- LISTA DE PRODUTOS E MENSAGEM DE CARREGAMENTO --- */}
      {loading ? (
        <div className="text-center my-5"><div className="spinner-border" /></div>
      ) : (
        <>
          <div className="row g-4 product-grid">
            {products.length > 0 ? products.map(product => (
              // Classes de grid responsivas como você pediu
              <div key={product.id} className="col-12 col-sm-6 col-md-4 col-xl-2 d-flex align-items-stretch">
                <ProductCard product={product} />
              </div>
            )) : (
              <div className="col-12 text-center my-5">
                <h4>Nenhum produto encontrado</h4>
                <p className="text-muted">Tente ajustar seus filtros de busca.</p>
              </div>
            )}
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