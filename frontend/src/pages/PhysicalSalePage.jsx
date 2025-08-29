// src/pages/PhysicalSalePage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import LocalCartModal from '../components/LocalCartModal';
import Select from 'react-select';

const ID_CLIENTE_BALCAO = 11; // Lembre-se de verificar se este ID está correto no seu banco

function PhysicalSalePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [localCart, setLocalCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [saleType, setSaleType] = useState('balcao');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerImage, setCustomerImage] = useState(null);

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

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      if (currentPage !== 1) { setCurrentPage(1); } 
      else { fetchProducts(1); }
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [searchTerm, filterCategory]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, custRes] = await Promise.all([
            api.get('/api/categorias?limit=all'),
            api.get('/api/usuarios/clientes')
        ]);
        const formattedCategories = catRes.data.categorias.map(cat => ({ value: cat.nome, label: cat.nome }));
        setCategories(formattedCategories);
        const formattedCustomers = custRes.data.map(c => ({
          value: c.id,
          label: `${c.nome} (${c.email || 'Sem email'})`,
          imagem_perfil_url: c.imagem_perfil_url
        }));
        setCustomers(formattedCustomers);
      } catch (err) {
        console.error("Falha ao buscar dados iniciais da página", err);
      }
    };
    fetchInitialData();
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCustomerImage(URL.createObjectURL(file));
    }
  };

  const handleAddToCart = (productToAdd) => {
    setLocalCart(currentCart => {
      const itemExistente = currentCart.find(item => item.id === productToAdd.id);
      if (itemExistente) {
        return currentCart.map(item =>
          // ✅ CORREÇÃO: Usa 'estoque_total'
          item.id === productToAdd.id && item.quantidade < productToAdd.estoque_total
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...currentCart, { ...productToAdd, quantidade: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
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
    let finalCustomerId = ID_CLIENTE_BALCAO;
    if (saleType === 'cadastrado') {
      if (!selectedCustomer) {
        return alert("Por favor, selecione um cliente cadastrado para registrar a venda.");
      }
      finalCustomerId = selectedCustomer.value;
    }
    if (!window.confirm("Confirmar a finalização desta venda?")) return;
    try {
      const itens = localCart.map(item => ({ produto_id: item.id, quantidade: item.quantidade }));
      const response = await api.post('/api/pedidos/admin/venda-fisica', {
        itens: itens,
        usuario_id: finalCustomerId,
        forma_pagamento: formaPagamento
      });
      alert(`Venda #${response.data.pedidoId} registrada com sucesso!`);
      setLocalCart([]);
      setShowCartModal(false);
      setSelectedCustomer(null);
      setSaleType('balcao');
      fetchProducts(currentPage);
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao registrar a venda.");
    }
  };

  const totalItemsCarrinho = localCart.reduce((total, item) => total + item.quantidade, 0);

  let displayImage = customerImage || 'https://placehold.co/100/6c757d/white?text=Cliente';
  if (saleType === 'cadastrado' && selectedCustomer && selectedCustomer.imagem_perfil_url) {
    displayImage = `http://localhost:3001/uploads/${selectedCustomer.imagem_perfil_url}`;
  } else if (saleType === 'cadastrado' && selectedCustomer) {
    displayImage = 'https://placehold.co/100/0d6efd/white?text=User';
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Registrar Venda Física</h1>
        <button className="btn btn-primary position-relative" onClick={() => setShowCartModal(true)}>
          Carrinho Local
          {totalItemsCarrinho > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{totalItemsCarrinho}</span>}
        </button>
      </div>

      <div className="card card-body mb-4">
        <div className="row align-items-center">
          <div className="col-md-auto"><img src={displayImage} alt="Cliente" className="rounded-circle" style={{ width: '80px', height: '80px', objectFit: 'cover' }} /></div>
          <div className="col-md-4">
            <label className="form-label fw-bold">Tipo de Venda</label>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="saleType" id="vendaBalcao" value="balcao" checked={saleType === 'balcao'} onChange={(e) => setSaleType(e.target.value)} />
              <label className="form-check-label" htmlFor="vendaBalcao">Cliente Não Cadastrado</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="saleType" id="vendaCadastrado" value="cadastrado" checked={saleType === 'cadastrado'} onChange={(e) => setSaleType(e.target.value)} />
              <label className="form-check-label" htmlFor="vendaCadastrado">Cliente Cadastrado</label>
            </div>
          </div>
          <div className="col-md">
            {saleType === 'cadastrado' ? (
              <div>
                <label className="form-label fw-bold">Buscar Cliente</label>
                <Select options={customers} isClearable placeholder="Digite para buscar..." value={selectedCustomer} onChange={setSelectedCustomer} noOptionsMessage={() => "Nenhum cliente"} />
              </div>
            ) : (
              <div>
                <label className="form-label fw-bold">Foto (Opcional)</label>
                <label htmlFor="customer-image-upload" className="btn btn-sm btn-outline-secondary">Carregar Foto</label>
                <input type="file" id="customer-image-upload" style={{ display: 'none' }} onChange={handleImageChange} accept="image/png, image/jpeg" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="card card-body mb-4">
        <div className="row g-3">
          <div className="col-md-7"><input type="text" className="form-control" placeholder="Pesquisar produto por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="col-md-5"><Select options={categories} isClearable placeholder="Filtrar por Categoria..." onChange={(option) => setFilterCategory(option ? option.value : '')} noOptionsMessage={() => "Nenhuma categoria"} /></div>
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
                  {/* ✅ CORREÇÃO: Usa 'estoque_total' */}
                  <div className="text-muted">Estoque: {product.estoque_total} | R$ {parseFloat(product.valor).toFixed(2).replace('.', ',')}</div>
                </div>
              </div>
              {/* ✅ CORREÇÃO: Usa 'estoque_total' */}
              <button className="btn btn-outline-success" onClick={() => handleAddToCart(product)} disabled={product.estoque_total <= 0}>
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