// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProductAdminList from '../components/ProductAdminList';
import ProductModal from '../components/ProductModal';

function AdminDashboard() {
  // Estados para os dados do usuário e dos produtos
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para controlar o modal
  const [showModal, setShowModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  // Função para buscar os produtos da API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/produtos');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar produtos. Verifique se o backend está rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Executa a busca de produtos assim que a página carrega
  useEffect(() => {
    fetchProducts();
  }, []);

  // Funções para controlar a abertura e fechamento do modal
  const handleShowAddModal = () => {
    setProductToEdit(null); // Limpa o estado para garantir que o formulário esteja vazio
    setShowModal(true);
  };

  const handleShowEditModal = (product) => {
    setProductToEdit(product); // Define qual produto será editado
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // Função chamada quando um produto é salvo (criado ou editado)
  const handleSave = () => {
    setShowModal(false); // Fecha o modal
    fetchProducts(); // E atualiza a lista de produtos para mostrar a mudança
  };
  
  // Função para deletar um produto
  const handleDelete = async (productId) => {
    // window.confirm abre uma caixa de diálogo nativa do navegador
    if (window.confirm('Tem certeza que deseja excluir este produto? A ação não pode ser desfeita.')) {
      try {
        await api.delete(`/api/produtos/${productId}`);
        fetchProducts(); // Atualiza a lista após deletar
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
      
      {/* --- SEÇÃO DO CARD DE INFORMAÇÕES DO ADMIN --- */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Informações do Admin</h4>
        </div>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-2 text-center">
              <img src={profileImageUrl} alt="Foto de Perfil" className="img-fluid rounded-circle" style={{ maxWidth: '100px' }}/>
            </div>
            <div className="col-md-10">
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
      {/* --- FIM DA SEÇÃO DO CARD --- */}

      {/* --- SEÇÃO DE GERENCIAMENTO DE PRODUTOS --- */}
      <div className="d-flex justify-content-between align-items-center my-4">
        <h2>Gerenciamento de Produtos</h2>
        <button className="btn btn-primary" onClick={handleShowAddModal}>
          Adicionar Novo Produto
        </button>
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