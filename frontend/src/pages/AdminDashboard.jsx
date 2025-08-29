// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProductAdminList from '../components/ProductAdminList';
import ProductModal from '../components/ProductModal';
import CategoryModal from '../components/CategoryModal';
import Select from 'react-select';
import EditProfileModal from '../components/EditProfileModal';
import Pagination from '../components/Pagination';

function AdminDashboard() {
  // --- Estados do Componente Principal ---
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(7);

  // --- Estados para a ferramenta de ADICIONAR estoque ---
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockFilterCategory, setStockFilterCategory] = useState('');
  const [stockProducts, setStockProducts] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockUpdateValues, setStockUpdateValues] = useState({});
  const [stockCurrentPage, setStockCurrentPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(0);

  // --- Estados para a ferramenta de CORREÇÃO de estoque ---
  const [correctionSearchTerm, setCorrectionSearchTerm] = useState('');
  const [correctionFilterCategory, setCorrectionFilterCategory] = useState('');
  const [correctionProducts, setCorrectionProducts] = useState([]);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionValues, setCorrectionValues] = useState({});
  const [correctionCurrentPage, setCorrectionCurrentPage] = useState(1);
  const [correctionTotalPages, setCorrectionTotalPages] = useState(0);

  
  // --- Funções e Efeitos do Componente ---

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit });
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category', filterCategory);
      if (sortOrder) params.append('sort', sortOrder);
      const response = await api.get(`/api/produtos?${params.toString()}`);
      setProducts(response.data.produtos);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar produtos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categorias?limit=all');
      const formattedCategories = response.data.categorias.map(cat => ({ value: cat.nome, label: cat.nome }));
      setCategories(formattedCategories);
    } catch (err) {
      console.error("Falha ao buscar categorias para o filtro", err);
    }
  };
  
  // Efeitos para a lista principal
  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      if (currentPage !== 1) { setCurrentPage(1); } 
      else { fetchProducts(1); }
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [limit, searchTerm, filterCategory, sortOrder]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);
  
  useEffect(() => { 
    fetchCategories(); 
  }, []);

  // Funções e Efeitos para ADICIONAR estoque
  const fetchStockProducts = async (page = 1) => {
    if (!stockSearchTerm && !stockFilterCategory) {
      setStockProducts([]); setStockTotalPages(0); return;
    }
    try {
      setStockLoading(true);
      const params = new URLSearchParams({ page, limit: 5 });
      if (stockSearchTerm) params.append('search', stockSearchTerm);
      if (stockFilterCategory) params.append('category', stockFilterCategory);
      const response = await api.get(`/api/produtos?${params.toString()}`);
      setStockProducts(response.data.produtos || []);
      setStockTotalPages(response.data.totalPages);
      setStockCurrentPage(response.data.currentPage);
    } catch (err) {
      console.error("Erro ao buscar produtos para estoque", err);
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      if (stockCurrentPage !== 1) { setStockCurrentPage(1); }
      else { fetchStockProducts(1); }
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [stockSearchTerm, stockFilterCategory]);

  useEffect(() => {
    if (stockSearchTerm || stockFilterCategory) {
      fetchStockProducts(stockCurrentPage);
    }
  }, [stockCurrentPage]);
  
  // ✅ --- LÓGICA CORRIGIDA E COMPLETA para a ferramenta de CORREÇÃO de estoque ---
  const fetchCorrectionProducts = async (page = 1) => {
    if (!correctionSearchTerm && !correctionFilterCategory) {
      setCorrectionProducts([]); setCorrectionTotalPages(0); return;
    }
    try {
      setCorrectionLoading(true);
      const params = new URLSearchParams({ page, limit: 5 });
      if (correctionSearchTerm) params.append('search', correctionSearchTerm);
      if (correctionFilterCategory) params.append('category', correctionFilterCategory);
      const response = await api.get(`/api/produtos?${params.toString()}`);
      setCorrectionProducts(response.data.produtos || []);
      setCorrectionTotalPages(response.data.totalPages);
      setCorrectionCurrentPage(response.data.currentPage);
    } catch (err) { 
      console.error("Erro ao buscar produtos para correção", err);
    } finally { 
      setCorrectionLoading(false);
    }
  };

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      if (correctionCurrentPage !== 1) { setCorrectionCurrentPage(1); }
      else { fetchCorrectionProducts(1); }
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [correctionSearchTerm, correctionFilterCategory]);

  useEffect(() => { 
    if (correctionSearchTerm || correctionFilterCategory) {
      fetchCorrectionProducts(correctionCurrentPage);
    }
  }, [correctionCurrentPage]);
  
  const handleStockValueChange = (productId, field, value) => {
    setStockUpdateValues(prev => ({ ...prev, [productId]: { ...prev[productId], [field]: value } }));
  };

  const handleStockUpdate = async (productId) => {
    const values = stockUpdateValues[productId];
    if (!values || !values.qtd || !values.custo) {
      return alert("Preencha a Quantidade a Adicionar e o Custo de Entrada.");
    }
    try {
      await api.patch(`/api/produtos/${productId}/adicionar-estoque`, {
        quantidadeAdicional: values.qtd,
        custoUnitarioEntrada: values.custo,
        novoValorVenda: values.valorVenda || null
      });
      alert('Estoque atualizado!');
      setStockUpdateValues(prev => ({ ...prev, [productId]: { qtd: '', custo: '', valorVenda: '' } }));
      fetchStockProducts(stockCurrentPage);
      fetchProducts(currentPage);
    } catch (err) {
      alert(err.response?.data?.message || "Falha ao atualizar estoque.");
    }
  };
  
  const handleCorrectionValueChange = (productId, value) => { setCorrectionValues(prev => ({ ...prev, [productId]: value })); };

  const handleStockCorrection = async (productId, currentStock) => {
    const quantityToRemove = correctionValues[productId];
    if (!quantityToRemove || parseInt(quantityToRemove) <= 0) { return alert("Insira um valor positivo."); }
    if (parseInt(quantityToRemove) > currentStock) { return alert("A correção não pode ser maior que o estoque atual."); }
    if (window.confirm(`Confirmar a remoção de ${quantityToRemove} unidade(s) do estoque?`)) {
      try {
        await api.patch(`/api/produtos/${productId}/corrigir-estoque`, { quantidadeParaRemover: quantityToRemove });
        alert('Estoque corrigido!');
        setCorrectionValues(prev => ({ ...prev, [productId]: '' }));
        fetchCorrectionProducts(correctionCurrentPage);
        fetchProducts(currentPage);
      } catch (err) { alert(err.response?.data?.message || "Falha ao corrigir estoque."); }
    }
  };
  
  const handleShowAddModal = () => { setProductToEdit(null); setShowModal(true); };
  const handleShowEditModal = (product) => { setProductToEdit(product); setShowModal(true); };
  const handleCloseModal = () => setShowModal(false);
  const handleSaveProduct = () => { setShowModal(false); fetchProducts(currentPage); };
  
  const handleDelete = async (productId) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await api.delete(`/api/produtos/${productId}`);
        fetchProducts(currentPage);
      } catch (err) {
        alert('Falha ao excluir produto.');
      }
    }
  };
  
  const profileImageUrl = user?.imagem_perfil_url ? `http://localhost:3001/uploads/${user.imagem_perfil_url}` : 'https://placehold.co/150';

  return (
    <div>
      <h1 className="mb-4">Painel do Administrador</h1>
      <div className="row">
        <div className="col-lg-7 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center"><h4>Informações do Admin</h4></div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-3 text-center">
                  <img src={profileImageUrl} alt="Foto de Perfil" className="img-fluid rounded-circle" style={{ maxWidth: '100px' }}/>
                </div>
                <div className="col-md-9">
                  <h5 className="card-title">{user?.nome}</h5>
                  <p className="card-text mb-0"><strong>Email:</strong> {user?.email || 'Não informado'}</p>
                  <p className="card-text"><strong>Status:</strong> <span className="badge bg-success text-uppercase">{user?.role}</span></p>
                  <button className="btn btn-secondary btn-sm mt-2" onClick={() => setShowEditProfileModal(true)}>Editar Perfil</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-5 mb-4">
          <div className="card h-100">
            <div className="card-header"><h4>Ações Gerais</h4></div>
            <div className="card-body d-flex flex-column justify-content-center align-items-start">
              <Link to="/admin/pedidos" className="btn btn-primary mb-3 w-100">Gerenciar Pedidos</Link>
              <Link to="/admin/venda-fisica" className="btn btn-success mb-3 w-100">Registrar Venda Física</Link>
              <Link to="/admin/financeiro" className="btn btn-warning mb-3 w-100">Painel Financeiro</Link>
              <button className="btn btn-info w-100" onClick={() => setShowCategoryModal(true)}>Gerenciar Categorias</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="d-flex justify-content-between align-items-center my-4">
        <h2>Gerenciamento de Produtos</h2>
        <button className="btn btn-primary" onClick={handleShowAddModal}>Adicionar Novo Produto</button>
      </div>
      
      <div className="card card-body mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-lg-5"><input type="text" className="form-control" placeholder="Buscar por nome ou descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="col-lg-3"><Select options={categories} isClearable placeholder="Filtrar por Categoria..." onChange={(selectedOption) => setFilterCategory(selectedOption ? selectedOption.value : '')} /></div>
          <div className="col-lg-4">
            <div className="btn-group w-100" role="group">
              <button type="button" className={`btn btn-outline-secondary ${sortOrder === 'stock_asc' ? 'active' : ''}`} onClick={() => setSortOrder('stock_asc')}>Menor Estoque</button>
              <button type="button" className={`btn btn-outline-secondary ${sortOrder === 'stock_desc' ? 'active' : ''}`} onClick={() => setSortOrder('stock_desc')}>Maior Estoque</button>
              <button type="button" className={`btn btn-outline-secondary ${!sortOrder ? 'active' : ''}`} onClick={() => setSortOrder('')}>Padrão</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          {loading ? ( <div className="text-center my-5"><div className="spinner-border" /></div> ) 
            : error ? ( <div className="alert alert-danger">{error}</div> ) 
            : ( <ProductAdminList products={products} onEdit={handleShowEditModal} onDelete={handleDelete} /> )
          }
        </div>
        <div className="card-footer d-flex justify-content-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
        </div>
      </div>
      
      <div className="card mt-5">
        <div className="card-header"><h3 className="mb-0">Atualização Rápida de Estoque</h3></div>
        <div className="card-body">
          <p className="text-muted">Busque por nome ou filtre por categoria para ver os produtos e adicionar ao estoque.</p>
          <div className="row g-3 mb-4">
            <div className="col-md-6"><input type="text" className="form-control" placeholder="Pesquisar produto..." value={stockSearchTerm} onChange={(e) => setStockSearchTerm(e.target.value)} /></div>
            <div className="col-md-6"><Select options={categories} isClearable placeholder="Filtrar por Categoria..." onChange={(selectedOption) => setStockFilterCategory(selectedOption ? selectedOption.value : '')} noOptionsMessage={() => "Nenhuma categoria"} /></div>
          </div>
          {stockLoading ? ( <div className="text-center"><div className="spinner-border" /></div> ) : (
            <div>
              {stockProducts.map(product => (
                <div key={`stock-${product.id}`} className="d-flex align-items-center border-bottom py-2 flex-wrap">
                  <img src={product.imagem_produto_url ? `http://localhost:3001/uploads/${product.imagem_produto_url}` : 'https://placehold.co/60'} alt={product.nome} className="rounded" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                  <div className="flex-grow-1 mx-3"><strong>{product.nome}</strong><div className="text-muted">Estoque: {product.estoque_total} | Venda: R$ {parseFloat(product.valor).toFixed(2)}</div></div>
                  <div className="d-flex" style={{ minWidth: '400px' }}>
                    <input type="number" className="form-control me-2" placeholder="+ Qtd." value={stockUpdateValues[product.id]?.qtd || ''} onChange={(e) => handleStockValueChange(product.id, 'qtd', e.target.value)} />
                    <input type="number" step="0.01" className="form-control me-2" placeholder="Custo/un. (R$)" value={stockUpdateValues[product.id]?.custo || ''} onChange={(e) => handleStockValueChange(product.id, 'custo', e.target.value)} />
                    <input type="number" step="0.01" className="form-control me-2" placeholder="Novo Valor Venda (Opc.)" value={stockUpdateValues[product.id]?.valorVenda || ''} onChange={(e) => handleStockValueChange(product.id, 'valorVenda', e.target.value)} />
                    <button className="btn btn-success" onClick={() => handleStockUpdate(product.id)}>Atualizar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card-footer d-flex justify-content-center"><Pagination currentPage={stockCurrentPage} totalPages={stockTotalPages} onPageChange={(page) => setStockCurrentPage(page)} /></div>
      </div>

      <div className="card mt-5">
        <div className="card-header"><h3 className="mb-0">Correção de Estoque</h3></div>
        <div className="card-body">
          <p className="text-muted">Use esta ferramenta para corrigir erros de contagem, removendo unidades do inventário. Esta ação não gera uma despesa financeira.</p>
          <div className="row g-3 mb-4">
            <div className="col-md-8"><input type="text" className="form-control" placeholder="Pesquisar produto..." value={correctionSearchTerm} onChange={(e) => setCorrectionSearchTerm(e.target.value)} /></div>
            <div className="col-md-4"><Select options={categories} isClearable placeholder="Filtrar por Categoria..." onChange={(option) => setCorrectionFilterCategory(option ? option.value : '')} /></div>
          </div>
          {correctionLoading ? ( <div className="text-center"><div className="spinner-border" /></div> ) : (
            <div>
              {correctionProducts.map(product => (
                <div key={`corr-${product.id}`} className="d-flex align-items-center border-bottom py-2 flex-wrap">
                  <img src={product.imagem_produto_url ? `http://localhost:3001/uploads/${product.imagem_produto_url}` : 'https://placehold.co/60'} alt={product.nome} className="rounded" style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                  <div className="flex-grow-1 mx-3"><strong>{product.nome}</strong><div className="text-muted">Estoque Atual: {product.estoque_total}</div></div>
                  <div className="d-flex" style={{ minWidth: '250px' }}>
                    <input type="number" className="form-control me-2" placeholder="Qtd. a remover" value={correctionValues[product.id] || ''} onChange={(e) => handleCorrectionValueChange(product.id, e.target.value)} />
                    <button className="btn btn-warning" onClick={() => handleStockCorrection(product.id, product.estoque_total)}>Corrigir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card-footer d-flex justify-content-center"><Pagination currentPage={correctionCurrentPage} totalPages={correctionTotalPages} onPageChange={(page) => setCorrectionCurrentPage(page)} /></div>
      </div>

      <ProductModal show={showModal} onHide={handleCloseModal} productToEdit={productToEdit} onSave={handleSaveProduct} />
      <CategoryModal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} onUpdate={fetchCategories} />
      <EditProfileModal show={showEditProfileModal} onHide={() => setShowEditProfileModal(false)} />
    </div>
  );
}

export default AdminDashboard;