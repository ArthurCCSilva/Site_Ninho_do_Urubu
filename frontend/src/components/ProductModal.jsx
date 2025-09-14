// src/components/ProductModal.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Modal } from 'bootstrap';
import Select from 'react-select';
import ImageCropperModal from './ImageCropperModal';
import CurrencyInput from 'react-currency-input-field';
import { useFeatureFlags } from '../context/FeatureFlagContext';


function ProductModal({ show, onHide, productToEdit, onSave }) {
  const { isEnabled } = useFeatureFlags();

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
  const [productType, setProductType] = useState('simples');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef();

  const [imageToCrop, setImageToCrop] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef(null);

  // Estados para os planos de parcelamento
  const [planos, setPlanos] = useState([]);
  const [novoPlano, setNovoPlano] = useState({ numero_parcelas: 2, valor_parcela: '', juros: false });

  // Busca categorias, todos os produtos E os planos de parcelamento
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/api/categorias?limit=all'),
          api.get('/api/produtos?limit=1000')
        ]);
        setCategories(catRes.data.categorias.map(c => ({ value: c.id, label: c.nome })));
        const productList = prodRes.data.produtos
          .filter(p => !productToEdit || p.id !== productToEdit.id)
          .map(p => ({ value: p.id, label: p.nome }));
        setAllProducts(productList);
      } catch (err) {
        console.error("Erro ao carregar dados para o modal", err);
      }
    };

    const fetchPlanos = async () => {
      if (productToEdit) {
        try {
          const response = await api.get(`/api/boleto-planos/produto/${productToEdit.id}`);
          setPlanos(response.data);
        } catch (err) { console.error("Erro ao buscar planos", err); }
      } else {
        setPlanos([]);
      }
    };

    if (show) {
      fetchData();
      fetchPlanos();
      setNovoPlano({ numero_parcelas: 2, valor_parcela: '', juros: false });
    }
  }, [productToEdit, show]);

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
        if (productToEdit.unidades_por_pai > 0) setProductType('pai');
        else if (productToEdit.produto_pai_id) setProductType('filho');
        else setProductType('simples');
      } else {
        setFormData(initialState);
        setProductType('simples');
      }
      setImagemFile(null);
      setError('');
    }
  }, [productToEdit, show]);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCheckboxChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked });
  const handleCategoryChange = (selectedOption) => setFormData({ ...formData, categoria_id: selectedOption ? selectedOption.value : null });
  const handleParentProductChange = (selectedOption) => setFormData({ ...formData, produto_pai_id: selectedOption ? selectedOption.value : null });
  const handleCurrencyChange = (value, name) => {
    setFormData(prev => ({ ...prev, [name]: value || '' }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImageToCrop(reader.result); setShowCropper(true); };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setImagemFile(croppedFile);
    setShowCropper(false);
    if (fileInputRef.current) { fileInputRef.current.value = ""; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const dataToSend = { ...formData };
    if (productType === 'simples') {
      dataToSend.produto_pai_id = null;
      dataToSend.unidades_por_pai = null;
    } else if (productType === 'pai') {
      dataToSend.produto_pai_id = null;
    } else if (productType === 'filho') {
      dataToSend.unidades_por_pai = null;
    }
    const data = new FormData();
    Object.keys(dataToSend).forEach(key => {
      // Converte valores de moeda para o formato correto antes de enviar
      if (key === 'valor' || key === 'custo') {
        const correctedValue = String(dataToSend[key]).replace(',', '.');
        data.append(key, correctedValue);
      } else {
        data.append(key, dataToSend[key]);
      }
    });
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

  const handleAddPlano = async () => {
    const valorParcelaCorrigido = novoPlano.valor_parcela ? String(novoPlano.valor_parcela).replace(',', '.') : '0';
    if (!valorParcelaCorrigido || parseFloat(valorParcelaCorrigido) <= 0) {
      return alert("Insira um valor de parcela válido.");
    }
    try {
      await api.post('/api/boleto-planos', {
        produto_id: productToEdit.id,
        numero_parcelas: novoPlano.numero_parcelas,
        valor_parcela: valorParcelaCorrigido,
        juros: novoPlano.juros
      });
      const response = await api.get(`/api/boleto-planos/produto/${productToEdit.id}`);
      setPlanos(response.data);
      setNovoPlano({ numero_parcelas: 2, valor_parcela: '', juros: false });
    } catch (err) {
      alert("Erro ao adicionar plano.");
    }
  };

  const handleDeletePlano = async (planoId) => {
    if (window.confirm("Tem certeza que deseja deletar este plano de parcelamento?")) {
      try {
        await api.delete(`/api/boleto-planos/${planoId}`);
        setPlanos(planos.filter(p => p.id !== planoId));
      } catch (err) {
        alert("Erro ao deletar plano.");
      }
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
                  <div className="col"><div className="mb-3"><label className="form-label">Valor de Venda (R$)</label><CurrencyInput id="valor" name="valor" className="form-control" value={formData.valor} onValueChange={handleCurrencyChange} intlConfig={{ locale: 'pt-BR', currency: 'BRL' }} decimalScale={2} placeholder="R$ 0,00" required /></div></div>
                  {!productToEdit && (
                    <>
                      <div className="col"><div className="mb-3"><label className="form-label">Estoque Inicial</label><input type="number" name="estoque" value={formData.estoque} onChange={handleChange} className="form-control" required /></div></div>
                      <div className="col"><div className="mb-3"><label className="form-label">Custo/un. (R$)</label><CurrencyInput id="custo" name="custo" className="form-control" value={formData.custo} onValueChange={handleCurrencyChange} intlConfig={{ locale: 'pt-BR', currency: 'BRL' }} decimalScale={2} placeholder="R$ 0,00" required /></div></div>
                    </>
                  )}
                </div>
                <div className="mb-3"><label htmlFor="categoria_id" className="form-label">Categoria</label><Select id="categoria_id" name="categoria_id" options={categories} placeholder="Selecione..." value={categories.find(option => option.value === formData.categoria_id) || null} onChange={handleCategoryChange} isClearable noOptionsMessage={() => "Nenhuma categoria"} /></div>
                <div className="mb-3"><label className="form-label">Imagem (Opcional)</label><input type="file" ref={fileInputRef} name="imagem_produto" onChange={handleFileSelect} className="form-control" accept="image/*" />{imagemFile && <img src={URL.createObjectURL(imagemFile)} alt="Preview" width="100" className="mt-2 rounded" />}</div>
                <hr />
                <h5>Relação de Produto</h5>
                <div className="mb-3">
                  <label className="form-label">Tipo de Produto</label>
                  <select className="form-select" value={productType} onChange={(e) => setProductType(e.target.value)}>
                    <option value="simples">Produto Simples (sem relação)</option>
                    <option value="pai">Fardo / Pacote (Produto Pai)</option>
                    <option value="filho">Unidade Avulsa (Produto Filho)</option>
                  </select>
                </div>
                {productType === 'pai' && (
                  <div className="mb-3"><label className="form-label">Unidades contidas neste Fardo</label><input type="number" name="unidades_por_pai" value={formData.unidades_por_pai} onChange={handleChange} className="form-control" placeholder="Ex: 6" /></div>
                )}
                {productType === 'filho' && (
                  <div className="mb-3"><label className="form-label">Este produto é uma unidade de qual Fardo (Pai)?</label><Select options={allProducts} placeholder="Selecione o fardo..." isClearable value={allProducts.find(o => o.value === formData.produto_pai_id) || null} onChange={handleParentProductChange} /></div>
                )}
                <hr />
                {isEnabled('produtos_destaque') && (
                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" role="switch" id="destaqueCheck" name="destaque" checked={formData.destaque} onChange={handleCheckboxChange} />
                    <label className="form-check-label" htmlFor="destaqueCheck">Marcar como Produto Destaque</label>
                  </div>
                )}
                {isEnabled('produtos_promocao') && (
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="promocaoCheck" name="promocao" checked={formData.promocao} onChange={handleCheckboxChange} />
                    <label className="form-check-label" htmlFor="promocaoCheck">Marcar como Produto em Promoção</label>
                  </div>
                )}
                {productToEdit && isEnabled('sistema_boleto') && (
                  <>
                    <hr />
                    <h5>Planos de Parcelamento (Boleto Virtual)</h5>
                    <p className="small text-muted">Adicione aqui as opções de parcelamento para este produto.</p>
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6>Planos Atuais:</h6>
                        {planos.length > 0 ? (
                          <ul className="list-group mb-3">
                            {planos.map(plano => (
                              <li key={plano.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <span>{plano.numero_parcelas}x de R$ {parseFloat(plano.valor_parcela).toFixed(2).replace('.', ',')}<span className={`badge ms-2 ${plano.juros ? 'bg-warning' : 'bg-success'}`}>{plano.juros ? 'Com Juros' : 'Sem Juros'}</span></span>
                                <button type="button" className="btn-close" aria-label="Deletar plano" onClick={() => handleDeletePlano(plano.id)}></button>
                              </li>
                            ))}
                          </ul>
                        ) : <p className="small text-muted">Nenhum plano cadastrado.</p>}
                        <h6>Adicionar Novo Plano:</h6>
                        <div className="row g-2 align-items-end">
                          <div className="col-md-3"><label>Nº Parcelas</label><input type="number" className="form-control" value={novoPlano.numero_parcelas} onChange={e => setNovoPlano({ ...novoPlano, numero_parcelas: e.target.value })} /></div>
                          <div className="col-md-4"><label>Valor Parcela</label><CurrencyInput className="form-control" value={novoPlano.valor_parcela} onValueChange={(value) => setNovoPlano({ ...novoPlano, valor_parcela: value })} intlConfig={{ locale: 'pt-BR', currency: 'BRL' }} decimalScale={2} /></div>
                          <div className="col-md-3 d-flex align-items-center pt-3"><div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={novoPlano.juros} onChange={e => setNovoPlano({ ...novoPlano, juros: e.target.checked })} id="jurosCheck" /><label className="form-check-label" htmlFor="jurosCheck">Com Juros</label></div></div>
                          <div className="col-md-2 d-grid"><button type="button" className="btn btn-primary" onClick={handleAddPlano}>Adicionar</button></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onHide} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ImageCropperModal show={showCropper} onHide={() => setShowCropper(false)} imageSrc={imageToCrop} onCropComplete={handleCropComplete} />
    </>
  );
}

export default ProductModal;