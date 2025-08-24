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
  const [limit, setLimit] = useState(7); // Limite de 7 itens por página

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
      const formattedCategories = response.data.categorias.map(cat => ({
        value: cat.nome,
        label: cat.nome
      }));
      setCategories(formattedCategories);
    } catch (err) {
      console.error("Falha ao buscar categorias para o filtro", err);
    }
  };
  
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
  
  useEffect(() => { fetchCategories(); }, [showCategoryModal]);

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('imagem_perfil', file);
    try {
      await api.put(`/api/auth/${user.id}/imagem`, data);
      alert('Imagem de perfil atualizada! Por favor, faça login novamente para ver a alteração.');
      logout();
    } catch (error) {
      alert('Erro ao atualizar a imagem.');
      console.error(error);
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
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header"><h4>Informações do Admin</h4></div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-3 text-center">
                  <img src={profileImageUrl} alt="Foto de Perfil" className="img-fluid rounded-circle" style={{ maxWidth: '100px' }}/>
                </div>
                <div className="col-md-9">
                  <h5 className="card-title">{user?.nome}</h5>
                  <p className="card-text mb-0"><strong>Email:</strong> {user?.email}</p>
                  <p className="card-text"><strong>Status:</strong> <span className="badge bg-success text-uppercase">{user?.role}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header"><h4>Configurações Gerais</h4></div>
            <div className="card-body d-flex flex-column justify-content-center align-items-start">
              <button className="btn btn-secondary mb-3" onClick={() => setShowEditProfileModal(true)}>
                Editar Perfil e Senha
              </button>
              <Link to="/admin/pedidos" className="btn btn-primary mb-3"> 
                Gerenciar Pedidos
              </Link>
              <button className="btn btn-info" onClick={() => setShowCategoryModal(true)}>
                Gerenciar Categorias
              </button>
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
          <div className="col-lg-5">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nome ou descrição..."
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
              noOptionsMessage={() => "Nenhuma categoria encontrada"}
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
      
      <div className="card">
        <div className="card-body">
          {loading ? ( <div className="text-center my-5"><div className="spinner-border" /></div> ) 
            : error ? ( <div className="alert alert-danger">{error}</div> ) 
            : ( <ProductAdminList products={products} onEdit={handleShowEditModal} onDelete={handleDelete} /> )
          }
        </div>
        
        <div className="card-footer d-flex justify-content-center">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      <ProductModal show={showModal} onHide={handleCloseModal} productToEdit={productToEdit} onSave={handleSaveProduct} />
      <CategoryModal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} onUpdate={fetchCategories} />
      <EditProfileModal show={showEditProfileModal} onHide={() => setShowEditProfileModal(false)} />
    </div>
  );
}

export default AdminDashboard;