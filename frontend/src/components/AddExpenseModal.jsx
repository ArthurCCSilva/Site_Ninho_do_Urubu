// src/components/AddExpenseModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import Select from 'react-select'; // Usamos para a busca de produtos

function AddExpenseModal({ show, onHide, onSave }) {
  const initialState = { 
    descricao: '', 
    valor: '', 
    data: new Date(), 
    categoria_id: '', 
    produto_id: null 
  };
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const modalRef = useRef();

  // Estados para os seletores
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);

  // Busca as categorias de despesa e a lista de produtos quando o modal abre
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/api/despesa-categorias'),
          api.get('/api/produtos')
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
  
  // Efeito para auto-preencher o formulário quando um produto é selecionado
  useEffect(() => {
    if (selectedProduto) {
      const categoriaPerda = categorias.find(c => c.label === 'Perda de Inventário');
      setFormData(prev => ({
        ...prev,
        valor: selectedProduto.custo || '',
        descricao: `Perda de estoque: ${selectedProduto.label}`,
        categoria_id: categoriaPerda ? categoriaPerda.value : '',
        produto_id: selectedProduto.value
      }));
    } else {
      // Limpa os campos se o produto for desmarcado
      if (formData.produto_id !== null) {
          setFormData(prev => ({
            ...initialState,
            data: prev.data // Mantém a data selecionada
          }));
      }
    }
  }, [selectedProduto, categorias]);

  // Efeito para controlar a exibição do modal
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Formata a data para YYYY-MM-DD antes de enviar
      const dataFormatada = formData.data.toISOString().split('T')[0];
      await api.post('/api/despesas', { ...formData, data: dataFormatada });
      alert('Despesa adicionada com sucesso!');
      onSave(); // Avisa o componente pai para recarregar os dados
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
            <div className="modal-header">
              <h5 className="modal-title">Adicionar Nova Despesa</h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="mb-3">
                <label className="form-label">Associar a um Produto (Opcional)</label>
                <Select
                  options={produtos}
                  isClearable
                  placeholder="Selecione um produto..."
                  value={selectedProduto}
                  onChange={setSelectedProduto}
                  noOptionsMessage={() => "Nenhum produto encontrado"}
                />
              </div>

              {/* ✅ CAMPO CONDICIONAL DE QUANTIDADE */}
              {selectedProduto && (
                <div className="mb-3">
                  <label className="form-label">Quantidade para Baixa no Estoque</label>
                  <input type="number" name="quantidadeBaixa" value={formData.quantidadeBaixa} onChange={handleChange} className="form-control" min="1" required />
                </div>
              )}
              
              <hr/>

              <div className="mb-3">
                <label className="form-label">Descrição</label>
                <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} className="form-control" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Valor (R$)</label>
                <input type="number" step="0.01" name="valor" value={formData.valor} onChange={handleChange} className="form-control" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Categoria</label>
                <select className="form-select" name="categoria_id" value={formData.categoria_id} onChange={handleChange}>
                  <option value="">Selecione...</option>
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
               <div className="mb-3">
                <label className="form-label d-block">Data da Despesa</label>
                <DatePicker 
                    selected={formData.data} 
                    onChange={(date) => setFormData({...formData, data: date})} 
                    className="form-control" 
                    dateFormat="dd/MM/yyyy" 
                    locale="pt-BR"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar Despesa</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddExpenseModal;