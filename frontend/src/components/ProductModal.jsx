// src/components/ProductModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';
import Select from 'react-select';
import ImageCropperModal from './ImageCropperModal';

function ProductModal({ show, onHide, productToEdit, onSave }) {
  const initialState = {
    nome: '',
    descricao: '',
    valor: '',
    categoria_id: null,
    estoque: '',
    custo: '',
    destaque: false,
    promocao: false,
    produto_pai_id: null,
    unidades_por_pai: '',
  };
  
  const [formData, setFormData] = useState(initialState);
  const [imagemFile, setImagemFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef();

  const [imageToCrop, setImageToCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef(null);

  // Busca categorias E a lista de todos os produtos para os seletores
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/api/categorias?limit=all'),
          api.get('/api/produtos?limit=1000') // Pega uma lista grande de produtos
        ]);
        setCategories(catRes.data.categorias.map(c => ({ value: c.id, label: c.nome })));
        
        // Filtra o produto que está sendo editado da lista de pais para evitar auto-referência
        const productList = prodRes.data.produtos
          .filter(p => !productToEdit || p.id !== productToEdit.id)
          .map(p => ({ value: p.id, label: p.nome }));
        setAllProducts(productList);

      } catch (err) {
        console.error("Erro ao carregar dados para o modal", err);
      }
    };
    if (show) {
      fetchData();
    }
  }, [show, productToEdit]);

  // Preenche/limpa o formulário quando o modal é aberto
  useEffect(() => {
    if (show) {
      if (productToEdit) {
        setFormData({
          nome: productToEdit.nome || '',
          descricao: productToEdit.descricao || '',
          valor: productToEdit.valor || '',
          categoria_id: productToEdit.categoria_id || null,
          estoque: productToEdit.estoque_total || '',
          custo: productToEdit.custo_medio_ponderado || '',
          destaque: !!productToEdit.destaque,
          promocao: !!productToEdit.promocao,
          produto_pai_id: productToEdit.produto_pai_id || null,
          unidades_por_pai: productToEdit.unidades_por_pai || '',
        });
      } else {
        setFormData(initialState);
      }
      setImagemFile(null);
      setError('');
    }
  }, [productToEdit, show]);
  
  // Controla a exibição do modal do Bootstrap
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  // Handlers para os inputs
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCheckboxChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked });
  const handleCategoryChange = (selectedOption) => setFormData({ ...formData, categoria_id: selectedOption ? selectedOption.value : null });
  const handleParentProductChange = (selectedOption) => setFormData({ ...formData, produto_pai_id: selectedOption ? selectedOption.value : null });
  
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setImagemFile(croppedFile);
    setShowCropper(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (imagemFile) {
      data.append('imagem_produto', imagemFile);
    }
    try {
      if (productToEdit) {
        await api.put(`/api/produtos/${productToEdit.id}`, data);
      } else {
        await api.post('/api/produtos', data);
      }
      onSave();
    } catch (error) {
      setError(error.response?.data?.message || "Erro ao salvar produto!");
      console.error("Falha ao salvar produto", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal fade" ref={modalRef} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{productToEdit ? 'Editar Produto' : 'Adicionar Novo Produto'}</h5>
                <button type="button" className="btn-close" onClick={onHide}></button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="mb-3"><label className="form-label">Nome</label><input type="text" name="nome" value={formData.nome} onChange={handleChange} className="form-control" required /></div>
                <div className="mb-3"><label className="form-label">Descrição</label><textarea rows="3" name="descricao" value={formData.descricao} onChange={handleChange} className="form-control" /></div>
                <div className="row">
                  <div className="col"><div className="mb-3"><label className="form-label">Valor de Venda (R$)</label><input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} className="form-control" required /></div></div>
                  
                  {!productToEdit && (
                    <>
                      <div className="col"><div className="mb-3"><label className="form-label">Estoque Inicial</label><input type="number" name="estoque" value={formData.estoque} onChange={handleChange} className="form-control" required /></div></div>
                      <div className="col"><div className="mb-3"><label className="form-label">Custo/un. (R$)</label><input type="number" step="0.01" name="custo" value={formData.custo} onChange={handleChange} className="form-control" required /></div></div>
                    </>
                  )}
                </div>
                <div className="mb-3"><label htmlFor="categoria_id" className="form-label">Categoria</label><Select id="categoria_id" name="categoria_id" options={categories} placeholder="Selecione..." value={categories.find(option => option.value === formData.categoria_id) || null} onChange={handleCategoryChange} isClearable noOptionsMessage={() => "Nenhuma categoria"} /></div>
                <div className="mb-3"><label className="form-label">Imagem (Opcional)</label><input type="file" ref={fileInputRef} name="imagem_produto" onChange={handleFileSelect} className="form-control" accept="image/*" />{imagemFile && <img src={URL.createObjectURL(imagemFile)} alt="Preview" width="100" className="mt-2 rounded"/>}</div>
                <hr />

                <h5>Relação de Produto (Opcional)</h5>
                <p className="small text-muted">Use para relacionar um fardo a uma unidade, ou um produto a um fardo.</p>
                <div className="row">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label className="form-label">Este produto é uma unidade de (Produto Pai)</label>
                      <Select options={allProducts} placeholder="Selecione o fardo..." isClearable value={allProducts.find(option => option.value === formData.produto_pai_id) || null} onChange={handleParentProductChange} />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Unidades por Fardo</label>
                      <input type="number" name="unidades_por_pai" value={formData.unidades_por_pai} onChange={handleChange} className="form-control" placeholder="Se este for um fardo, ex: 6" />
                    </div>
                  </div>
                </div>

                <hr />
                <div className="form-check form-switch mb-3"><input className="form-check-input" type="checkbox" role="switch" id="destaqueCheck" name="destaque" checked={formData.destaque} onChange={handleCheckboxChange} /><label className="form-check-label" htmlFor="destaqueCheck">Marcar como Produto Destaque</label></div>
                <div className="form-check form-switch"><input className="form-check-input" type="checkbox" role="switch" id="promocaoCheck" name="promocao" checked={formData.promocao} onChange={handleCheckboxChange} /><label className="form-check-label" htmlFor="promocaoCheck">Marcar como Produto em Promoção</label></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onHide} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ImageCropperModal 
        show={showCropper}
        onHide={() => setShowCropper(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}

export default ProductModal;