// src/pages/PhysicalSalePage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import LocalCartModal from '../components/LocalCartModal';
import Select from 'react-select';

// Lembre-se de colocar aqui o ID do seu usuário "Venda Balcão"
const ID_CLIENTE_BALCAO = 11; // Substitua 4 pelo ID correto

function PhysicalSalePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [localCart, setLocalCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [customerImage, setCustomerImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');

  // Função para buscar os produtos
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category', filterCategory);

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

  // useEffect para buscar quando um filtro muda
  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      if (currentPage !== 1) { setCurrentPage(1); }
      else { fetchProducts(1); }
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [searchTerm, filterCategory]);

  // useEffect para buscar quando a página muda
  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  // useEffect para buscar as categorias uma vez
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

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCustomerImage(URL.createObjectURL(file));
    }
  };

  // ✅ --- FUNÇÃO DE ADICIONAR AO CARRINHO (LÓGICA REVISADA) --- ✅
  const handleAddToCart = (productToAdd) => {
    setLocalCart(currentCart => {
      const itemExistente = currentCart.find(item => item.id === productToAdd.id);

      if (itemExistente) {
        // Se o item já existe, atualiza a quantidade (respeitando o estoque)
        return currentCart.map(item =>
          item.id === productToAdd.id && item.quantidade < productToAdd.estoque
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      // Se o item não existe, adiciona ao carrinho com quantidade 1
      return [...currentCart, { ...productToAdd, quantidade: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    // Se a nova quantidade for zero ou menos, remove o item
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    // Atualiza o carrinho, garantindo que a nova quantidade não ultrapasse o estoque
    setLocalCart(prevCart => prevCart.map(item => 
      item.id === productId && newQuantity <= item.estoque_total
        ? { ...item, quantidade: newQuantity } 
        : item
    ));
  };

  const handleRemoveItem = (productId) => {
    setLocalCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
  
  const handleFinalizeSale = async (formaPagamento) => {
    if (!window.confirm("Confirmar a finalização desta venda?")) return;
    try {
      const itens = localCart.map(item => ({ produto_id: item.id, quantidade: item.quantidade }));
      const response = await api.post('/api/pedidos/admin/venda-fisica', {
        itens: itens,
        usuario_id: ID_CLIENTE_BALCAO,
        forma_pagamento: formaPagamento
      });
      alert(`Venda #${response.data.pedidoId} registrada com sucesso!`);
      setLocalCart([]);
      setShowCartModal(false);
      // Atualiza a lista de produtos para refletir o novo estoque
      fetchProducts(currentPage);
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao registrar a venda.");
    }
  };

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

      <div className="card card-body mb-4">
        <div className="row align-items-center">
          <div className="col-md-auto">
            <img 
              src={customerImage || 'https://placehold.co/100/6c757d/white?text=Cliente'} 
              alt="Cliente da Venda" 
              className="rounded-circle"
              style={{ width: '80px', height: '80px', objectFit: 'cover' }}
            />
          </div>
          <div className="col-md-3">
            <h5 className="card-title mb-1">Cliente da Venda</h5>
            <label htmlFor="customer-image-upload" className="btn btn-sm btn-outline-secondary">
              Trocar Foto
            </label>
            <input type="file" id="customer-image-upload" style={{ display: 'none' }} onChange={handleImageChange} accept="image/png, image/jpeg" />
          </div>
          <div className="col-md">
            <input 
              type="text"
              className="form-control"
              placeholder="Pesquisar produto por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md">
            <Select
              options={categories}
              isClearable
              placeholder="Filtrar por Categoria..."
              onChange={(selectedOption) => setFilterCategory(selectedOption ? selectedOption.value : '')}
              noOptionsMessage={() => "Nenhuma categoria"}
            />
          </div>
        </div>
      </div>

      {loading ? <div className="text-center"><div className="spinner-border"/></div> : (
        <div className="list-group">
          {products.map(product => (
            <div key={product.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <img src={product.imagem_produto_url ? `http://localhost:3001/uploads/${product.imagem_produto_url}` : 'https://placehold.co/60'} alt={product.nome} className="img-thumbnail me-3" style={{width: '60px', height: '60px', objectFit: 'cover'}}/>
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