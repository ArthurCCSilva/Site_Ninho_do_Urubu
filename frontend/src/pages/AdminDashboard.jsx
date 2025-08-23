// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProductAdminList from '../components/ProductAdminList';
import ProductModal from '../components/ProductModal';
import CategoryModal from '../components/CategoryModal'; // Importa o novo modal

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [categories, setCategories] = useState([]);

  // ✅ NOVO ESTADO para controlar o modal de categorias
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Função para buscar os produtos da API com os filtros
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category', filterCategory);
      if (sortOrder) params.append('sort', sortOrder);
      
      const response = await api.get(`/api/produtos?${params.toString()}`);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar produtos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNÇÃO ATUALIZADA para buscar categorias da API de categorias
  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categorias');
      // Extrai apenas os nomes para o dropdown de filtro
      setCategories(response.data.map(c => c.nome));
    } catch (err) {
      console.error("Falha ao buscar categorias para o filtro", err);
    }
  };
  
  // Roda a busca de produtos sempre que um filtro mudar
  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [searchTerm, filterCategory, sortOrder]);

  // Roda uma vez para buscar as categorias para o dropdown
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('imagem_perfil', file);
    try {
      await api.put(`/api/auth/${user.id}/imagem`, data);
      alert('Imagem de perfil atualizada com sucesso! Por favor, faça login novamente para ver a alteração.');
      logout();
    } catch (error) {
      console.error('Falha ao atualizar a imagem de perfil', error);
      alert('Erro ao atualizar a imagem.');
    }
  };

  const handleShowAddModal = () => { setProductToEdit(null); setShowModal(true); };
  const handleShowEditModal = (product) => { setProductToEdit(product); setShowModal(true); };
  const handleCloseModal = () => setShowModal(false);
  const handleSave = () => { setShowModal(false); fetchProducts(); };
  const handleDelete = async (productId) => {
    if (window.confirm('Tem certeza que deseja excluir este produto? A ação não pode ser desfeita.')) {
      try {
        await api.delete(`/api/produtos/${productId}`);
        fetchProducts();
      } catch (err) {
        alert('Falha ao excluir produto.');
        console.error(err);
      }
    }
  };
  
  const profileImageUrl = user?.imagem_perfil_url
    ? `http://localhost:3001/uploads/${user.imagem_perfil_url}`
    : 'https://placehold.co/150';

  return (
    <div>
      <h1 className="mb-4">Painel do Administrador</h1>

      <div className="row">
        {/* PAINEL 1: INFORMAÇÕES DO ADMIN */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header"><h4>Informações do Admin</h4></div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-3 text-center">
                  <img src={profileImageUrl} alt="Foto de Perfil" className="img-fluid rounded-circle" style={{ maxWidth: '100px' }} />
                </div>
                <div className="col-md-9">
                  <h5 className="card-title">{user?.nome}</h5>
                  <p className="card-text mb-0">
                    <strong>Email:</strong> {user?.email}
                  </p>
                  <p className="card-text">
                    <strong>Status:</strong> <span className="badge bg-success text-uppercase">{user?.role}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAINEL 2: CONFIGURAÇÕES GERAIS */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header"><h4>Configurações Gerais</h4></div>
            <div className="card-body d-flex flex-column justify-content-center align-items-start">
              <div className="mb-3">
                <label htmlFor="profileImageInput" className="btn btn-secondary">
                  Mudar Foto de Perfil
                </label>
                <input
                  type="file"
                  id="profileImageInput"
                  style={{ display: 'none' }}
                  onChange={handleProfileImageChange}
                  accept="image/png, image/jpeg"
                />
              </div>
              
              {/* ✅ BOTÃO AGORA CONECTADO PARA ABRIR O MODAL */}
              <button className="btn btn-info" onClick={() => setShowCategoryModal(true)}>
                Gerenciar Categorias
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- SEÇÃO DE GERENCIAMENTO DE PRODUTOS --- */}
      <div className="d-flex justify-content-between align-items-center my-4">
        <h2>Gerenciamento de Produtos</h2>
        <button className="btn btn-primary" onClick={handleShowAddModal}>
          Adicionar Novo Produto
        </button>
      </div>
      
      {/* --- INTERFACE DE FILTROS --- */}
      <div className="card card-body mb-4">{/* ... seu código de filtros ... */}</div>

      {/* --- LISTA DE PRODUTOS --- */}
      {loading ? <div className="text-center"><div className="spinner-border" /></div>
        : error ? <div className="alert alert-danger">{error}</div>
        : <ProductAdminList 
            products={products}
            onEdit={handleShowEditModal}
            onDelete={handleDelete}
          />
      }
      
      {/* --- MODAIS RENDERIZADOS --- */}
      <ProductModal 
        show={showModal}
        onHide={handleCloseModal}
        productToEdit={productToEdit}
        onSave={handleSave}
      />
      
      {/* ✅ NOVO MODAL DE CATEGORIAS RENDERIZADO AQUI */}
      <CategoryModal 
        show={showCategoryModal}
        onHide={() => setShowCategoryModal(false)}
        onUpdate={fetchCategories} // Passa a função para o modal poder atualizar a lista de filtros
      />
    </div>
  );
}

export default AdminDashboard;