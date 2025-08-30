// src/components/ReactivateProductModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import Pagination from './Pagination';
import Select from 'react-select';

function ReactivateProductModal({ show, onHide, onReactivated }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const modalRef = useRef();

  // Busca as categorias para o filtro (apenas uma vez quando o modal abre)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categorias?limit=all');
        setCategories(response.data.categorias.map(cat => ({ value: cat.nome, label: cat.nome })));
      } catch (err) {
        console.error("Falha ao buscar categorias", err);
      }
    };
    if (show) {
      fetchCategories();
    }
  }, [show]);

  // Busca os produtos inativos sempre que os filtros ou a página mudam
  useEffect(() => {
    if (!show) return;

    const fetchInactiveProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: currentPage, limit: 10 });
        if (searchTerm) params.append('search', searchTerm);
        if (filterCategory) params.append('category', filterCategory.value);
        
        const response = await api.get(`/api/produtos/inativos?${params.toString()}`);
        
        setProducts(response.data.produtos);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
      } catch (err) {
        console.error("Erro ao buscar produtos inativos", err);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce para evitar buscas a cada letra digitada
    const debounceFetch = setTimeout(() => {
      if (currentPage !== 1 && (searchTerm || filterCategory)) {
        setCurrentPage(1);
      } else {
        fetchInactiveProducts();
      }
    }, 500);
    
    return () => clearTimeout(debounceFetch);
  }, [show, currentPage, searchTerm, filterCategory]);

  // Controla a exibição do modal do Bootstrap
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);

    if (show) {
      // Reseta os filtros e a página ao abrir
      setSearchTerm('');
      setFilterCategory(null);
      setCurrentPage(1);
      bsModal.show();
    } else {
      bsModal.hide();
    }
  }, [show]);

  // Função para reativar um produto
  const handleReactivate = async (productId) => {
    if (window.confirm('Tem certeza que deseja reativar este produto?')) {
      try {
        await api.patch(`/api/produtos/${productId}/reativar`);
        alert('Produto reativado com sucesso!');
        onReactivated(); // Avisa a página principal para recarregar a lista principal
        
        // Recarrega a lista dentro do modal para remover o item reativado
        const newProductsList = products.filter(p => p.id !== productId);
        setProducts(newProductsList);

        // Se a página ficar vazia, volta para a anterior
        if (newProductsList.length === 0 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
      } catch (err) {
        alert('Falha ao reativar produto.');
      }
    }
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1" data-bs-backdrop="static">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Reativar Produtos</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Pesquisar por nome..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="col-md-6">
                <Select 
                  options={categories} 
                  isClearable 
                  placeholder="Filtrar por Categoria..." 
                  value={filterCategory} 
                  onChange={setFilterCategory} 
                  noOptionsMessage={() => "Nenhuma categoria"}
                />
              </div>
            </div>
            {loading ? (
              <div className="text-center my-4"><div className="spinner-border"/></div>
            ) : (
              <div className="list-group">
                {products.length > 0 ? products.map(product => (
                  <div key={product.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <img 
                        src={product.imagem_produto_url ? `http://localhost:3001/uploads/${product.imagem_produto_url}` : 'https://placehold.co/60'} 
                        alt={product.nome} 
                        className="img-thumbnail me-3" 
                        style={{width: '60px', height: '60px', objectFit: 'cover'}}
                      />
                      <div>
                        <strong>{product.nome}</strong>
                        <div className="text-muted small">{product.categoria_nome || 'Sem categoria'}</div>
                      </div>
                    </div>
                    <button className="btn btn-success" onClick={() => handleReactivate(product.id)}>
                      Reativar
                    </button>
                  </div>
                )) : <p className="text-center text-muted my-4">Nenhum produto inativo encontrado.</p>}
              </div>
            )}
          </div>
          <div className="modal-footer d-flex justify-content-center">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReactivateProductModal;