// src/components/AddExpenseModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import CurrencyInput from 'react-currency-input-field';

function AddExpenseModal({ show, onHide, onSave }) {
  const initialState = {
    descricao: '',
    valor: '',
    data: new Date(),
    categoria_id: '',
    produto_id: null,
    quantidadeBaixa: 1
  };
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const modalRef = useRef();

  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/api/despesa-categorias'),
          api.get('/api/produtos?limit=1000')
        ]);
        setCategorias(catRes.data.map(c => ({ value: c.id, label: c.nome })));
        setProdutos(prodRes.data.produtos.map(p => ({
            value: p.id,
            label: p.nome,
            custo: p.custo_medio_ponderado
        })));
      } catch (err) {
        console.error("Erro ao carregar dados para o modal", err);
      }
    };
    if (show) {
      fetchData();
      setFormData(initialState);
      setSelectedProduto(null);
      setError('');
    }
  }, [show]);
  
  useEffect(() => {
    if (selectedProduto) {
      const categoriaPerda = categorias.find(c => c.label === 'Perda de Inventário');
      const quantidade = parseInt(formData.quantidadeBaixa, 10) || 0;
      const custoTotal = quantidade * (selectedProduto.custo || 0);

      setFormData(prev => ({
        ...prev,
        // ✅ CORREÇÃO: Salva o valor com PONTO no estado
        valor: custoTotal.toFixed(2),
        descricao: `Perda de estoque: ${quantidade}x ${selectedProduto.label}`,
        categoria_id: categoriaPerda ? categoriaPerda.value : '',
        produto_id: selectedProduto.value
      }));
    } else {
      if (formData.produto_id !== null) {
          setFormData(prev => ({
            ...initialState,
            data: prev.data,
            categoria_id: prev.categoria_id,
          }));
      }
    }
  }, [selectedProduto, formData.quantidadeBaixa, categorias]);


  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleCurrencyChange = (value, name) => {
    // O 'value' do onValueChange já vem no formato "123.45"
    setFormData(prev => ({ ...prev, [name]: value === undefined ? '' : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const dataFormatada = formData.data.toISOString().split('T')[0];
      
      // ✅ CORREÇÃO DEFINITIVA AQUI
      // O valor do CurrencyInput vem como "0,50". Trocamos a vírgula por ponto.
      const valorCorrigido = formData.valor ? String(formData.valor).replace(',', '.') : '0';

      // Prepara o payload final para a API
      const payload = {
        ...formData,
        data: dataFormatada,
        valor: valorCorrigido
      };

      await api.post('/api/despesas', payload);
      alert('Despesa adicionada com sucesso!');
      onSave();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao adicionar despesa.');
    }
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header"><h5 className="modal-title">Adicionar Nova Despesa</h5><button type="button" className="btn-close" onClick={onHide}></button></div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="mb-3">
                <label className="form-label">Associar a Produto (para Baixa de Estoque)</label>
                <Select options={produtos} isClearable placeholder="Selecione um produto..." value={selectedProduto} onChange={setSelectedProduto} noOptionsMessage={() => "Nenhum produto encontrado"}/>
              </div>
              {selectedProduto && (
                <div className="mb-3">
                  <label className="form-label fw-bold">Quantidade para Baixa no Estoque</label>
                  <input type="number" name="quantidadeBaixa" value={formData.quantidadeBaixa} onChange={handleChange} className="form-control" min="1" required />
                </div>
              )}
              <hr/>
              <div className="mb-3"><label>Descrição</label><input type="text" name="descricao" value={formData.descricao} onChange={handleChange} className="form-control" required /></div>
              <div className="mb-3">
                <label>Valor (R$)</label>
                <CurrencyInput type="tel" name="valor" className="form-control" value={formData.valor} onValueChange={handleCurrencyChange} disabled={!!selectedProduto} intlConfig={{ locale: 'pt-BR', currency: 'BRL' }} decimalScale={2} placeholder="R$ 0,00" required />
              </div>
              <div className="mb-3"><label>Categoria</label><select className="form-select" name="categoria_id" value={formData.categoria_id} onChange={handleChange}><option value="">Selecione...</option>{categorias.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}</select></div>
              <div className="mb-3"><label className="form-label d-block">Data da Despesa</label><DatePicker selected={formData.data} onChange={(date) => setFormData({...formData, data: date})} className="form-control" dateFormat="dd/MM/yyyy" locale="pt-BR" /></div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button><button type="submit" className="btn btn-primary">Salvar Despesa</button></div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default AddExpenseModal;