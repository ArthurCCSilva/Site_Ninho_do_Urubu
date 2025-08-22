// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProductAdminList from '../components/ProductAdminList';
import ProductModal from '../components/ProductModal';
import CategoryModal from '../components/CategoryModal'; // 1. IMPORTE o novo modal

function AdminDashboard() {
  // ✅ ALTERADO: Pegamos a função 'logout' também do nosso contexto
  const { user, logout } = useAuth();

  // Estados para os dados dos produtos
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para controlar o modal de Adicionar/Editar Produto
  const [showModal, setShowModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  //"Cérebros" dos Filtros
  // --- ADICIONE ESTES NOVOS ESTADOS ABAIXO DOS OUTROS ---
  const [searchTerm, setSearchTerm] = useState(''); // Guarda o texto da busca
  const [filterCategory, setFilterCategory] = useState(''); // Guarda a categoria selecionada
  const [sortOrder, setSortOrder] = useState(''); // Guarda a ordem de ordenação
  const [categories, setCategories] = useState([]); // Guarda a lista de categorias para o dropdown

  // 2. ADICIONE um novo estado para controlar o modal de categorias
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  // Função para buscar os produtos da API
  // src/pages/AdminDashboard.jsx

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Cria um objeto para gerenciar os parâmetros da URL de forma limpa e segura
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (filterCategory) {
        params.append('category', filterCategory);
      }
      if (sortOrder) {
        params.append('sort', sortOrder);
      }

      // Faz a chamada à API, adicionando os parâmetros na URL
      // Ex: /api/produtos?search=camiseta&sort=price_asc
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

  // Executa a busca de produtos assim que a página carrega
  // src/pages/AdminDashboard.jsx

  // Este useEffect agora é o "gatilho" principal para a busca.
  // Ele executa a função fetchProducts sempre que um dos filtros (searchTerm, 
  // filterCategory, sortOrder) mudar.
  useEffect(() => {
    // Adicionamos um "debounce": uma pequena pausa de 500ms após o usuário
    // parar de digitar na busca, para não fazer uma requisição a cada tecla.
    const debounceFetch = setTimeout(() => {
      fetchProducts();
    }, 500);

    // Limpa o timeout anterior se o usuário continuar digitando
    return () => clearTimeout(debounceFetch);

  }, [searchTerm, filterCategory, sortOrder]); // O array de dependências que o useEffect "assiste"

  // Este useEffect roda apenas UMA VEZ quando o componente é montado (note o [] vazio)
  // para buscar e armazenar as categorias únicas para o menu de filtro.
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/produtos');
        // Pega todas as categorias, remove as duplicadas e armazena no estado
        const uniqueCategories = [...new Set(response.data.map(p => p.categoria))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Falha ao buscar categorias", err);
      }
    };
    fetchCategories();
  }, []);

  // ✅ NOVO: Função para lidar com a mudança da foto de perfil
  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('imagem_perfil', file);

    try {
      // Usamos a rota que já criamos no backend para isso!
      await api.put(`/api/auth/${user.id}/imagem`, data);
      alert('Imagem de perfil atualizada com sucesso! Por favor, faça login novamente para ver a alteração.');
      // A forma mais simples de atualizar a informação é forçar um novo login
      // para obter um novo token com a URL da imagem atualizada.
      logout();
    } catch (error) {
      console.error('Falha ao atualizar a imagem de perfil', error);
      alert('Erro ao atualizar a imagem.');
    }
  };

  // Funções para controlar a abertura e fechamento do modal
  const handleShowAddModal = () => {
    setProductToEdit(null);
    setShowModal(true);
  };

  const handleShowEditModal = (product) => {
    setProductToEdit(product);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // Função chamada quando um produto é salvo (criado ou editado)
  const handleSave = () => {
    setShowModal(false);
    fetchProducts();
  };

  // Função para deletar um produto
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

  // Lógica para montar a URL da imagem de perfil do admin
  const profileImageUrl = user?.imagem_perfil_url
    ? `http://localhost:3001/uploads/${user.imagem_perfil_url}`
    : 'https://placehold.co/150';

  return (
    <div>
      <h1 className="mb-4">Painel do Administrador</h1>

      {/* --- ✅ INÍCIO DA SEÇÃO SUPERIOR ATUALIZADA (2 PAINÉIS) --- ✅ */}
      <div className="row">
        {/* PAINEL 1: INFORMAÇÕES DO ADMIN (SEM O BOTÃO DE MUDAR FOTO) */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h4>Informações do Admin</h4>
            </div>
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

        {/* PAINEL 2: CONFIGURAÇÕES GERAIS (NOVO) */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h4>Configurações Gerais</h4>
            </div>
            <div className="card-body d-flex flex-column justify-content-center align-items-start">
              {/* Botão Mudar Foto foi movido para cá */}
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
              {/* Botão para abrir o futuro modal de categorias */}
              <button className="btn btn-info" onClick={() => { /* Lógica para abrir o modal virá aqui */ }}>
                Gerenciar Categorias
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* --- ✅ FIM DA SEÇÃO SUPERIOR ATUALIZADA --- ✅ */}


      {/* --- SEÇÃO DE GERENCIAMENTO DE PRODUTOS (sem alterações) --- */}
      <div className="d-flex justify-content-between align-items-center my-4">
        <h2>Gerenciamento de Produtos</h2>
        <button className="btn btn-primary" onClick={handleShowAddModal}>
          Adicionar Novo Produto
        </button>
      </div>
      
      {/* --- INTERFACE DE FILTROS (sem alterações) --- */}
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
            <select className="form-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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

      {/* Lógica para mostrar spinner, erro ou a lista de produtos */}
      {loading && <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Carregando...</span></div></div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && (
        <ProductAdminList
          products={products}
          onEdit={handleShowEditModal}
          onDelete={handleDelete}
        />
      )}
      {/* --- FIM DA SEÇÃO DE GERENCIAMENTO --- */}

      {/* O componente do Modal fica aqui, mas só é visível quando showModal é true */}
      <ProductModal
        show={showModal}
        onHide={handleCloseModal}
        productToEdit={productToEdit}
        onSave={handleSave}
      />
    </div>
  );
}

export default AdminDashboard;