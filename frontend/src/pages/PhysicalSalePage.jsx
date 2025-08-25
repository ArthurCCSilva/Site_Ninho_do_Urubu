// src/pages/PhysicalSalePage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import LocalCartModal from '../components/LocalCartModal';
import Select from 'react-select'; // ✅ 1. Importa o Select para o filtro de categoria

// Lembre-se de colocar aqui o ID do seu usuário "Venda Balcão"
const ID_CLIENTE_BALCAO = 4; // Substitua 4 pelo ID correto

function PhysicalSalePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [localCart, setLocalCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);

  // ✅ 2. NOVOS ESTADOS para as novas funcionalidades
  const [customerImage, setCustomerImage] = useState(null); // Guarda a URL da foto do cliente
  const [categories, setCategories] = useState([]); // Guarda a lista de categorias para o filtro
  const [filterCategory, setFilterCategory] = useState(''); // Guarda a categoria selecionada

  // ✅ 3. ATUALIZA a busca de produtos para incluir o filtro de categoria
  useEffect(() => {
    const fetchProducts = async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page, limit: 10 });
        if (searchTerm) params.append('search', searchTerm);
        if (filterCategory) params.append('category', filterCategory); // Adiciona o filtro

        const response = await api.get(`/api/produtos?${params.toString()}`);
        setProducts(response.data.produtos);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
      } catch (err) {
        console.error("Falha ao buscar produtos", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = setTimeout(() => {
      // Volta para a primeira página se o filtro ou busca mudarem
      if (currentPage !== 1) { setCurrentPage(1); }
      else { fetchProducts(1); }
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [searchTerm, filterCategory]); // Adiciona filterCategory como gatilho

  // useEffect para buscar quando a página muda
  useEffect(() => {
    const fetchProducts = async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 10, search: searchTerm, category: filterCategory });
            const response = await api.get(`/api/produtos?${params.toString()}`);
            setProducts(response.data.produtos);
            setTotalPages(response.data.totalPages);
            setCurrentPage(response.data.currentPage);
        } catch (err) {
            console.error("Falha ao buscar produtos", err);
        } finally {
            setLoading(false);
        }
    };
    fetchProducts(currentPage);
  }, [currentPage]);

  // ✅ 4. NOVO useEffect para buscar as categorias UMA VEZ
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categorias?limit=all');
        const formattedCategories = response.data.categorias.map(cat => ({
          value: cat.nome,
          label: cat.nome
        }));
        setCategories(formattedCategories);
      } catch (err) {
        console.error("Falha ao buscar categorias", err);
      }
    };
    fetchCategories();
  }, []);

  // ✅ 5. NOVA FUNÇÃO para lidar com a mudança de imagem do cliente
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCustomerImage(URL.createObjectURL(file));
    }
  };

  // ... (suas outras funções handle... continuam aqui, sem alteração)
  const handleAddToCart = (product) => { /* ... */ };
  const handleUpdateQuantity = (productId, newQuantity) => { /* ... */ };
  const handleRemoveItem = (productId) => { /* ... */ };
  const handleFinalizeSale = async (formaPagamento) => { /* ... */ };
  const totalItemsCarrinho = localCart.reduce((total, item) => total + item.quantidade, 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Registrar Venda Física</h1>
        <button className="btn btn-primary position-relative" onClick={() => setShowCartModal(true)}>
          Carrinho Local
          {totalItemsCarrinho > 0 && 
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {totalItemsCarrinho}
            </span>
          }
        </button>
      </div>

      {/* ✅ 6. NOVA SEÇÃO para foto do cliente */}
      <div className="card card-body mb-4">
        <div className="row align-items-center">
            <div className="col-auto">
                <img 
                    src={customerImage || 'https://placehold.co/100/6c757d/white?text=Cliente'} 
                    alt="Cliente da Venda" 
                    className="rounded-circle"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                />
            </div>
            <div className="col">
                <h5 className="card-title mb-1">Cliente da Venda</h5>
                <label htmlFor="customer-image-upload" className="btn btn-sm btn-outline-secondary">
                    Trocar Foto
                </label>
                <input type="file" id="customer-image-upload" style={{ display: 'none' }} onChange={handleImageChange} accept="image/png, image/jpeg" />
                <p className="small text-muted mb-0 mt-1">Opcional. Apenas para referência visual nesta tela.</p>
            </div>
        </div>
      </div>
      
      {/* ✅ 7. FILTROS ATUALIZADOS */}
      <div className="card card-body mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <input 
              type="text"
              className="form-control"
              placeholder="Pesquisar produto por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <Select
              options={categories}
              isClearable
              placeholder="Filtrar por Categoria..."
              onChange={(selectedOption) => setFilterCategory(selectedOption ? selectedOption.value : '')}
              noOptionsMessage={() => "Nenhuma categoria encontrada"}
            />
          </div>
        </div>
      </div>

      {loading ? <div className="text-center"><div className="spinner-border"/></div> : (
        <div className="list-group">
          {products.map(product => (
            <div key={product.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <img src={product.imagem_produto_url ? `http://localhost:3001/uploads/${product.imagem_produto_url}` : 'https://placehold.co/60'} alt={product.nome} className="img-thumbnail me-3" style={{width: '60px'}}/>
                <div>
                  <strong>{product.nome}</strong>
                  <div className="text-muted">Estoque: {product.estoque} | R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}</div>
                </div>
              </div>
              <button className="btn btn-outline-success" onClick={() => handleAddToCart(product)} disabled={product.estoque <= 0}>
                Adicionar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="d-flex justify-content-center mt-4">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <LocalCartModal 
        show={showCartModal}
        onHide={() => setShowCartModal(false)}
        cartItems={localCart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onFinalizeSale={handleFinalizeSale}
      />
    </div>
  );
}

export default PhysicalSalePage;