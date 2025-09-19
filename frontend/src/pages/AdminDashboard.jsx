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
import ReactivateProductModal from '../components/ReactivateProductModal';
import CurrencyInput from 'react-currency-input-field';
import AdminEditUserModal from '../components/AdminEditUserModal';
import { useFeatureFlags } from '../context/FeatureFlagContext';

function AdminDashboard() {
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlags();

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
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockFilterCategory, setStockFilterCategory] = useState('');
  const [stockProducts, setStockProducts] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockUpdateValues, setStockUpdateValues] = useState({});
  const [stockCurrentPage, setStockCurrentPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(0);
  const [correctionSearchTerm, setCorrectionSearchTerm] = useState('');
  const [correctionFilterCategory, setCorrectionFilterCategory] = useState('');
  const [correctionProducts, setCorrectionProducts] = useState([]);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionValues, setCorrectionValues] = useState({});
  const [correctionCurrentPage, setCorrectionCurrentPage] = useState(1);
  const [correctionTotalPages, setCorrectionTotalPages] = useState(0);
  const [unbundleProduct, setUnbundleProduct] = useState(null);
  const [unbundleQty, setUnbundleQty] = useState(1);
  const [allProductsForSelect, setAllProductsForSelect] = useState([]);
  const [showAdminEditUserModal, setShowAdminEditUserModal] = useState(false);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit });
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category', filterCategory);
      if (sortOrder) params.append('sort', sortOrder);
      if (showInactive) params.append('showInactive', 'true');
      const response = await api.get(`/api/produtos?${params.toString()}`);
      setProducts(response.data.produtos);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar produtos.');
      console.error(err);
    } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categorias?limit=all');
      const formattedCategories = response.data.categorias.map(cat => ({ value: cat.nome, label: cat.nome }));
      setCategories(formattedCategories);
    } catch (err) { console.error("Falha ao buscar categorias para o filtro", err); }
  };

  const fetchAllProductsForSelect = async () => {
    try {
      const response = await api.get('/api/produtos?limit=1000');
      const parentProducts = response.data.produtos
        .filter(p => p.unidades_por_pai > 0)
        .map(p => ({ value: p.id, label: p.nome }));
      setAllProductsForSelect(parentProducts);
    } catch (err) {
      console.error("Erro ao buscar todos os produtos para o seletor", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAllProductsForSelect();
  }, []);

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      fetchProducts(1);
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [limit, searchTerm, filterCategory, sortOrder, showInactive]);

  useEffect(() => {
    if (!loading) fetchProducts(currentPage);
  }, [currentPage]);

  const fetchStockProducts = async (page = 1) => {
    if (!stockSearchTerm && !stockFilterCategory) { setStockProducts([]); setStockTotalPages(0); return; }
    try {
      setStockLoading(true);
      const params = new URLSearchParams({ page, limit: 5 });
      if (stockSearchTerm) params.append('search', stockSearchTerm);
      if (stockFilterCategory) params.append('category', stockFilterCategory);
      const response = await api.get(`/api/produtos?${params.toString()}`);
      setStockProducts(response.data.produtos || []);
      setStockTotalPages(response.data.totalPages);
      setStockCurrentPage(response.data.currentPage);
    } catch (err) { console.error("Erro ao buscar produtos para estoque", err); }
    finally { setStockLoading(false); }
  };

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      fetchStockProducts(1);
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [stockSearchTerm, stockFilterCategory]);

  useEffect(() => { if (stockSearchTerm || stockFilterCategory) { fetchStockProducts(stockCurrentPage); } }, [stockCurrentPage]);

  const fetchCorrectionProducts = async (page = 1) => {
    if (!correctionSearchTerm && !correctionFilterCategory) { setCorrectionProducts([]); setCorrectionTotalPages(0); return; }
    try {
      setCorrectionLoading(true);
      const params = new URLSearchParams({ page, limit: 5 });
      if (correctionSearchTerm) params.append('search', correctionSearchTerm);
      if (correctionFilterCategory) params.append('category', correctionFilterCategory);
      const response = await api.get(`/api/produtos?${params.toString()}`);
      setCorrectionProducts(response.data.produtos || []);
      setCorrectionTotalPages(response.data.totalPages);
      setCorrectionCurrentPage(response.data.currentPage);
    } catch (err) { console.error("Erro ao buscar produtos para correção", err); }
    finally { setCorrectionLoading(false); }
  };

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      fetchCorrectionProducts(1);
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [correctionSearchTerm, correctionFilterCategory]);

  useEffect(() => { if (correctionSearchTerm || correctionFilterCategory) { fetchCorrectionProducts(correctionCurrentPage); } }, [correctionCurrentPage]);

  const handleStockValueChange = (productId, field, value) => { setStockUpdateValues(prev => ({ ...prev, [productId]: { ...prev[productId], [field]: value } })); };
  const handleStockCurrencyChange = (productId, field, value) => { setStockUpdateValues(prev => ({ ...prev, [productId]: { ...prev[productId], [field]: value || '' } })); };

  const handleStockUpdate = async (productId) => {
    const values = stockUpdateValues[productId];
    if (!values || !values.qtd || !values.custo) { return alert("Preencha a Quantidade a Adicionar e o Custo de Entrada."); }
    try {
      await api.patch(`/api/produtos/${productId}/adicionar-estoque`, {
        quantidadeAdicional: values.qtd, custoUnitarioEntrada: values.custo, novoValorVenda: values.valorVenda || null
      });
      alert('Estoque atualizado!');
      setStockUpdateValues(prev => ({ ...prev, [productId]: { qtd: '', custo: '', valorVenda: '' } }));
      fetchStockProducts(stockCurrentPage);
      fetchProducts(currentPage);
    } catch (err) { alert(err.response?.data?.message || "Falha ao atualizar estoque."); }
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

  const handleUnbundle = async () => {
    if (!unbundleProduct || !unbundleQty || parseInt(unbundleQty) <= 0) {
      return alert("Selecione um fardo e uma quantidade válida para desmembrar.");
    }
    if (window.confirm(`Tem certeza que deseja desmembrar ${unbundleQty} fardo(s) de "${unbundleProduct.label}" em unidades?`)) {
      try {
        const response = await api.post(`/api/produtos/${unbundleProduct.value}/desmembrar`, { quantidadeFardos: unbundleQty });
        alert(response.data.message);
        setUnbundleProduct(null); setUnbundleQty(1);
        fetchProducts(currentPage);
        fetchAllProductsForSelect();
        if (stockSearchTerm || stockFilterCategory) fetchStockProducts(stockCurrentPage);
        if (correctionSearchTerm || correctionFilterCategory) fetchCorrectionProducts(correctionCurrentPage);
      } catch (err) { alert(err.response?.data?.message || "Falha ao desmembrar produto."); }
    }
  };

  const handleShowAddModal = () => { setProductToEdit(null); setShowModal(true); };
  const handleShowEditModal = (product) => { setProductToEdit(product); setShowModal(true); };
  const handleCloseModal = () => setShowModal(false);
  const handleSaveProduct = () => { setShowModal(false); fetchProducts(currentPage); fetchAllProductsForSelect(); };

  const handleDelete = async (productId) => {
    if (window.confirm('Tem certeza que deseja DESATIVAR este produto? Ele não aparecerá mais na loja.')) {
      try {
        await api.delete(`/api/produtos/${productId}`);
        fetchProducts(currentPage);
      } catch (err) { alert('Falha ao desativar produto.'); }
    }
  };

  const handleReactivate = async (productId) => {
    if (window.confirm('Tem certeza que deseja REATIVAR este produto? Ele voltará a aparecer na loja.')) {
      try {
        await api.patch(`/api/produtos/${productId}/reativar`);
        fetchProducts(currentPage);
      } catch (err) { alert('Falha ao reativar produto.'); }
    }
  };

  const handleProductReactivated = () => {
    fetchProducts(currentPage);
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
                <div className="col-md-3 text-center"><img src={profileImageUrl} alt="Foto de Perfil" className="img-fluid rounded-circle" style={{ width: '100px', height: '100px', objectFit: 'cover' }} /></div>
                <div className="col-md-9">
                  <h5 className="card-title">{user?.nomeCompleto}</h5>
                  <p className="card-text mb-0"><strong>Email:</strong> {user?.usuario || 'Não informado'}</p>
                  <p className="card-text mb-0"><strong>Telefone:</strong> {user?.telefone || 'Não informado'}</p>
                  <p className="card-text mb-0"><strong>CPF:</strong> {user?.cpf || 'Não informado'}</p>
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
            <div className="card-body">
              <div className="d-none d-lg-grid gap-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {/* TODOS os botões agora são filhos diretos desta única div */}
                {isEnabled('admin_gerenciar_pedidos') && <Link to="/admin/pedidos" className="btn btn-primary">Gerenciar Pedidos</Link>}
                {isEnabled('admin_registrar_venda_fisica') && <Link to="/admin/venda-fisica" className="btn btn-success">Registrar Venda Física</Link>}
                {isEnabled('admin_gerenciar_comandas') && <Link to="/admin/comandas" className="btn btn-info">Gerenciar Comandas</Link>}
                {isEnabled('admin_painel_financeiro') && <Link to="/admin/financeiro" className="btn btn-warning">Painel Financeiro</Link>}
                {isEnabled('sistema_boleto') && <Link to="/admin/boletos" className="btn btn-dark">Gerenciar Boletos</Link>}
                {isEnabled('admin_info_clientes') && <Link to="/admin/clientes" className="btn btn-secondary">Info Clientes</Link>}
                {isEnabled('admin_gerenciar_funcionarios') && <Link to="/admin/funcionarios" className="btn btn-primary">Gerenciar Funcionários</Link>}
                {isEnabled('admin_gerenciar_categorias') && <button className="btn btn-info" onClick={() => setShowCategoryModal(true)}>Gerenciar Categorias</button>}
                {isEnabled('admin_reativar_produtos') && <button className="btn btn-outline-success" onClick={() => setShowReactivateModal(true)}>Reativar Produtos</button>}
                {isEnabled('admin_editar_cliente') && <button className="btn btn-outline-info" onClick={() => setShowAdminEditUserModal(true)}>Editar Cliente</button>}
              </div>
              <div className="d-lg-none d-grid gap-2">
                {isEnabled('admin_gerenciar_pedidos') && <Link to="/admin/pedidos" className="btn btn-primary">Gerenciar Pedidos</Link>}
                {isEnabled('admin_registrar_venda_fisica') && <Link to="/admin/venda-fisica" className="btn btn-success">Registrar Venda Física</Link>}
                {isEnabled('admin_gerenciar_comandas') && <Link to="/admin/comandas" className="btn btn-info">Gerenciar Comandas</Link>}
                {isEnabled('admin_painel_financeiro') && <Link to="/admin/financeiro" className="btn btn-warning">Painel Financeiro</Link>}
                {isEnabled('sistema_boleto') && <Link to="/admin/boletos" className="btn btn-dark">Gerenciar Boletos</Link>}
                {isEnabled('admin_info_clientes') && <Link to="/admin/clientes" className="btn btn-secondary">Info Clientes</Link>}
                {isEnabled('admin_gerenciar_funcionarios') && <Link to="/admin/funcionarios" className="btn btn-primary">Gerenciar Funcionários</Link>}
                {isEnabled('admin_gerenciar_categorias') && <button className="btn btn-info" onClick={() => setShowCategoryModal(true)}>Gerenciar Categorias</button>}
                {isEnabled('admin_reativar_produtos') && <button className="btn btn-outline-success" onClick={() => setShowReactivateModal(true)}>Reativar Produtos</button>}
                {isEnabled('admin_editar_cliente') && <button className="btn btn-outline-info" onClick={() => setShowAdminEditUserModal(true)}>Editar Cliente</button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SEÇÕES CONDICIONAIS COM BASE NAS FEATURE FLAGS */}

      {isEnabled('admin_gerenciar_produtos_secao') && (
        <>
          <div className="d-flex justify-content-between align-items-center my-4"><h2>Gerenciamento de Produtos</h2><button className="btn btn-primary" onClick={handleShowAddModal}>Adicionar Novo Produto</button></div>
          <div className="card card-body mb-4">
            <div className="row g-3 align-items-center">
              <div className="col-lg-5"><input type="text" className="form-control" placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <div className="col-lg-3"><Select options={categories} isClearable placeholder="Filtrar por Categoria..." onChange={(option) => setFilterCategory(option ? option.value : '')} /></div>
              <div className="col-lg-4"><div className="btn-group w-100" role="group"><button type="button" className={`btn btn-outline-secondary ${sortOrder === 'stock_asc' ? 'active' : ''}`} onClick={() => setSortOrder('stock_asc')}>Menor Estoque</button><button type="button" className={`btn btn-outline-secondary ${sortOrder === 'stock_desc' ? 'active' : ''}`} onClick={() => setSortOrder('stock_desc')}>Maior Estoque</button><button type="button" className={`btn btn-outline-secondary ${!sortOrder ? 'active' : ''}`} onClick={() => setSortOrder('')}>Padrão</button></div></div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">{loading ? (<div className="text-center my-5"><div className="spinner-border" /></div>) : error ? (<div className="alert alert-danger">{error}</div>) : (<ProductAdminList products={products} onEdit={handleShowEditModal} onDelete={handleDelete} onReactivate={handleReactivate} />)}</div>
            <div className="card-footer d-flex justify-content-center"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} /></div>
          </div>
        </>
      )}

      {isEnabled('admin_atualizacao_estoque_secao') && (
        <div className="card mt-5">
          <div className="card-header"><h3 className="mb-0">Atualização Rápida de Estoque</h3></div>
          <div className="card-body">
            <p className="text-muted">Busque por um produto para adicionar ao estoque.</p>
            <div className="row g-3 mb-4">
              <div className="col-md-6"><input type="text" className="form-control" placeholder="Pesquisar produto..." value={stockSearchTerm} onChange={(e) => setStockSearchTerm(e.target.value)} /></div>
              <div className="col-md-6"><Select options={categories} isClearable placeholder="Filtrar por Categoria..." onChange={(option) => setStockFilterCategory(option ? option.value : '')} /></div>
            </div>
            {stockLoading ? (<div className="text-center"><div className="spinner-border" /></div>) : (<div>{stockProducts.map(product => (<div key={`stock-${product.id}`} className="d-flex align-items-center border-bottom py-2 flex-wrap"><img src={product.imagem_produto_url ? `http://localhost:3001/uploads/${product.imagem_produto_url}` : 'https://placehold.co/60'} alt={product.nome} className="rounded" style={{ width: '60px', height: '60px', objectFit: 'cover' }} /><div className="flex-grow-1 mx-3"><strong>{product.nome}</strong><div className="text-muted">Estoque: {product.estoque_total} | Venda: R$ {parseFloat(product.valor).toFixed(2)}</div></div><div className="d-flex" style={{ minWidth: '400px' }}><input  type="number" className="form-control me-2" placeholder="+ Qtd." value={stockUpdateValues[product.id]?.qtd || ''} onChange={(e) => handleStockValueChange(product.id, 'qtd', e.target.value)} /><CurrencyInput type="tel" name="custo" className="form-control me-2" placeholder="Custo/un. (R$)" value={stockUpdateValues[product.id]?.custo} onValueChange={(value) => handleStockCurrencyChange(product.id, 'custo', value)} intlConfig={{ locale: 'pt-BR', currency: 'BRL' }} decimalScale={2} /><CurrencyInput type="tel" name="valorVenda" className="form-control me-2" placeholder="Novo Valor Venda (Opc.)" value={stockUpdateValues[product.id]?.valorVenda} onValueChange={(value) => handleStockCurrencyChange(product.id, 'valorVenda', value)} intlConfig={{ locale: 'pt-BR', currency: 'BRL' }} decimalScale={2} /><button className="btn btn-success" onClick={() => handleStockUpdate(product.id)}>Atualizar</button></div></div>))}</div>)}
          </div>
          <div className="card-footer d-flex justify-content-center"><Pagination currentPage={stockCurrentPage} totalPages={stockTotalPages} onPageChange={(page) => setStockCurrentPage(page)} /></div>
        </div>
      )}

      {isEnabled('admin_correcao_estoque_secao') && (
        <div className="card mt-5">
          <div className="card-header"><h3 className="mb-0">Correção de Estoque</h3></div>
          <div className="card-body">
            <p className="text-muted">Use para corrigir erros de contagem, removendo unidades do inventário.</p>
            <div className="row g-3 mb-4">
              <div className="col-md-8"><input type="text" className="form-control" placeholder="Pesquisar produto..." value={correctionSearchTerm} onChange={(e) => setCorrectionSearchTerm(e.target.value)} /></div>
              <div className="col-md-4"><Select options={categories} isClearable placeholder="Filtrar por Categoria..." onChange={(option) => setCorrectionFilterCategory(option ? option.value : '')} /></div>
            </div>
            {correctionLoading ? (<div className="text-center"><div className="spinner-border" /></div>) : (<div>{correctionProducts.map(product => (<div key={`corr-${product.id}`} className="d-flex align-items-center border-bottom py-2 flex-wrap"><img src={product.imagem_produto_url ? `http://localhost:3001/uploads/${product.imagem_produto_url}` : 'https://placehold.co/60'} alt={product.nome} className="rounded" style={{ width: '60px', height: '60px', objectFit: 'cover' }} /><div className="flex-grow-1 mx-3"><strong>{product.nome}</strong><div className="text-muted">Estoque: {product.estoque_total}</div></div><div className="d-flex" style={{ minWidth: '250px' }}><input type="number" className="form-control me-2" placeholder="Qtd. a remover" value={correctionValues[product.id] || ''} onChange={(e) => handleCorrectionValueChange(product.id, e.target.value)} /><button className="btn btn-warning" onClick={() => handleStockCorrection(product.id, product.estoque_total)}>Corrigir</button></div></div>))}</div>)}
          </div>
          <div className="card-footer d-flex justify-content-center"><Pagination currentPage={correctionCurrentPage} totalPages={correctionTotalPages} onPageChange={(page) => setCorrectionCurrentPage(page)} /></div>
        </div>
      )}

      {isEnabled('admin_desmembrar_produto_secao') && (
        <div className="card mt-5">
          <div className="card-header"><h3 className="mb-0">Desmembrar Produto (Fardo em Unidades)</h3></div>
          <div className="card-body">
            <p className="text-muted">Converta um produto "pai" (fardo) em seus produtos "filho" (unidades).</p>
            <div className="row g-3 align-items-end">
              <div className="col-md-6"><label className="form-label">Selecione o Fardo/Pacote</label><Select options={allProductsForSelect} isClearable placeholder="Selecione..." value={unbundleProduct} onChange={setUnbundleProduct} noOptionsMessage={() => "Nenhum fardo encontrado"} /></div>
              <div className="col-md-3"><label className="form-label">Qtd. de Fardos</label><input type="number" className="form-control" value={unbundleQty} onChange={(e) => setUnbundleQty(e.target.value)} min="1" /></div>
              <div className="col-md-3"><button className="btn btn-info w-100" onClick={handleUnbundle}>Desmembrar</button></div>
            </div>
          </div>
        </div>
      )}

      <ProductModal show={showModal} onHide={handleCloseModal} productToEdit={productToEdit} onSave={handleSaveProduct} />
      <CategoryModal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} onUpdate={() => { fetchCategories(); fetchProducts(currentPage); }} />
      <EditProfileModal show={showEditProfileModal} onHide={() => setShowEditProfileModal(false)} />
      <ReactivateProductModal show={showReactivateModal} onHide={() => setShowReactivateModal(false)} onReactivated={handleProductReactivated} />
      <AdminEditUserModal
        show={showAdminEditUserModal}
        onHide={() => setShowAdminEditUserModal(false)}
      />
    </div>
  );
}

export default AdminDashboard;