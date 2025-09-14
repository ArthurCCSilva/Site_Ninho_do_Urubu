// src/pages/CustomerCartPage.jsx
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import WarningModal from '../components/WarningModal';
import './CustomerCartPage.css';
import { useFeatureFlags } from '../context/FeatureFlagContext';

function CustomerCartPage() {
  const { isEnabled } = useFeatureFlags();
  const { cartItems, removeFromCart, checkout, updateQuantity } = useCart();
  const navigate = useNavigate();
  
  const [formaPagamento, setFormaPagamento] = useState('Cartão de Crédito');
  const [localEntrega, setLocalEntrega] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [valorPago, setValorPago] = useState('');

  const [boletoInfo, setBoletoInfo] = useState({ elegivel: false, planos: [] });
  const [selectedPlano, setSelectedPlano] = useState('');
  const [boletoDueDays, setBoletoDueDays] = useState([]);
  const [selectedDueDay, setSelectedDueDay] = useState('');
  const [showMixedCartWarning, setShowMixedCartWarning] = useState(false);

  useEffect(() => {
    const fetchBoletoData = async () => {
      if (cartItems.length > 0) {
        try {
          const [plansRes, daysRes] = await Promise.all([
            api.get('/api/pedidos/boleto-planos-carrinho'),
            api.get('/api/boleto-dias')
          ]);
          setBoletoInfo(plansRes.data);
          setBoletoDueDays(daysRes.data);
        } catch (err) { console.error("Erro ao buscar dados de boleto", err); }
      } else {
        setBoletoInfo({ elegivel: false, planos: [] });
      }
    };
    fetchBoletoData();
  }, [cartItems]);

  const totalFinal = useMemo(() => {
    const baseTotal = cartItems.reduce((total, item) => total + (item.valor * item.quantidade), 0);

    if (formaPagamento === 'Boleto Virtual' && selectedPlano && boletoInfo.planos.length > 0) {
      const planoSelecionado = boletoInfo.planos.find(p => p.id == selectedPlano);
      if (planoSelecionado) {
        // ✅ CORREÇÃO AQUI
        // 1. Calcula o valor total de UM produto com o plano selecionado
        const valorTotalPlanoPorUnidade = parseFloat(planoSelecionado.numero_parcelas) * parseFloat(planoSelecionado.valor_parcela);
        
        // 2. Descobre a quantidade do item no carrinho que usa este plano
        // (Assumindo que só há um tipo de produto no carrinho quando boleto é elegível)
        const quantidadeNoCarrinho = cartItems.length > 0 ? cartItems[0].quantidade : 1;

        // 3. Multiplica o valor total do plano pela quantidade
        return valorTotalPlanoPorUnidade * quantidadeNoCarrinho;
      }
    }
    
    return baseTotal;
  }, [cartItems, formaPagamento, selectedPlano, boletoInfo.planos]);
  
  const troco = valorPago > totalFinal ? valorPago - totalFinal : 0;

  useEffect(() => {
    const uniqueProductTypes = new Set(cartItems.map(item => item.produto_id));
    if (formaPagamento === 'Boleto Virtual' && uniqueProductTypes.size > 1) {
      setShowMixedCartWarning(true);
    } else {
      setShowMixedCartWarning(false);
    }
  }, [formaPagamento, cartItems]);

  const handleCheckout = async () => {
    if (!localEntrega.trim()) { return alert('Por favor, preencha o local de entrega.'); }
    if (formaPagamento === 'Dinheiro' && (!valorPago || parseFloat(valorPago) < totalFinal)) {
      return alert('Para pagamento em dinheiro, informe um valor igual ou maior que o total da compra.');
    }
    if (formaPagamento === 'Boleto Virtual' && (!selectedPlano || !selectedDueDay)) {
      return alert("Por favor, selecione um plano de parcelamento E um dia de vencimento.");
    }

    if (window.confirm('Deseja confirmar a compra?')) {
      setLoadingCheckout(true);
      try {
        const valorFinalPago = formaPagamento === 'Dinheiro' ? valorPago : null;
        const infoBoleto = formaPagamento === 'Boleto Virtual' ? { plano_id: selectedPlano, dia_vencimento: selectedDueDay } : null;
        const novoPedido = await checkout(formaPagamento, localEntrega, valorFinalPago, infoBoleto);
        alert(`Compra finalizada com sucesso! Pedido #${novoPedido.pedidoId}`);
        navigate('/meus-pedidos');
      } catch (err) {
        alert(err.response?.data?.message || 'Não foi possível finalizar a compra.');
      } finally {
        setLoadingCheckout(false);
      }
    }
  };

  const handleRemoveOneAndContinue = () => {
    // Remove o último item adicionado ao carrinho
    if (cartItems.length > 0) {
      const lastItem = cartItems[cartItems.length - 1];
      removeFromCart(lastItem.produto_id);
    }
    setShowMixedCartWarning(false);
  };
  
  const handleClearAndContinue = () => {
    clearCart(); // Supondo que você tenha uma função clearCart no seu CartContext
    setShowMixedCartWarning(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center mt-5">
        <h2>Seu carrinho está vazio.</h2>
        <p className="lead text-muted">Adicione produtos para continuar.</p>
        <Link to="/" className="btn btn-primary mt-3">Ver Produtos</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Meu Carrinho</h1>
      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-body">
              <div className="d-none d-lg-block">
                <table className="table align-middle">
                  <thead><tr><th scope="col" colSpan="2">Produto</th><th scope="col" className="text-center">Preço</th><th scope="col" className="text-center">Quantidade</th><th scope="col" className="text-end">Subtotal</th><th scope="col"></th></tr></thead>
                  <tbody>{cartItems.map(item => (<tr key={item.produto_id}>
                    <td style={{ width: '120px' }}><img src={item.imagem_produto_url ? `http://localhost:3001/uploads/${item.imagem_produto_url}` : 'https://placehold.co/100'} alt={item.nome} className="cart-product-image rounded" /></td>
                    <td>
                      {item.nome}
                      {item.elegivel_boleto && isEnabled('sistema_boleto') ? ( <span className="badge bg-info ms-2">Opção Boleto</span> ) : null}
                    </td>
                    <td className="text-center">R$ {parseFloat(item.valor).toFixed(2).replace('.', ',')}</td>
                    <td className="text-center"><div className="input-group input-group-sm justify-content-center" style={{ width: '110px', margin: 'auto' }}><button className="btn btn-outline-secondary" type="button" onClick={() => updateQuantity(item.produto_id, item.quantidade - 1)}>-</button><span className="form-control text-center">{item.quantidade}</span><button className="btn btn-outline-secondary" type="button" onClick={() => updateQuantity(item.produto_id, item.quantidade + 1)} disabled={item.quantidade >= item.estoque_total}>+</button></div></td>
                    <td className="text-end">R$ {(parseFloat(item.valor) * item.quantidade).toFixed(2).replace('.', ',')}</td>
                    <td className="text-center"><button className="btn btn-outline-danger btn-sm" title="Remover item" onClick={() => removeFromCart(item.produto_id)}>&times;</button></td>
                  </tr>))}</tbody>
                </table>
              </div>
              <div className="d-lg-none">
                {cartItems.map(item => (<div key={item.produto_id} className="cart-item-mobile"><img src={item.imagem_produto_url ? `http://localhost:3001/uploads/${item.imagem_produto_url}` : 'https://placehold.co/100'} alt={item.nome} className="cart-item-mobile-img" /><div className="cart-item-mobile-details"><h6 className="mb-1">{item.nome}{item.elegivel_boleto && <span className="badge bg-info ms-2">Parcelável</span>}</h6><p className="mb-2 text-muted">R$ {parseFloat(item.valor).toFixed(2).replace('.', ',')}</p><div className="cart-item-mobile-actions"><div className="cart-quantity-controls"><button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => updateQuantity(item.produto_id, item.quantidade - 1)}>-</button><span className="mx-2">{item.quantidade}</span><button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => updateQuantity(item.produto_id, item.quantidade + 1)} disabled={item.quantidade >= item.estoque_total}>+</button></div><button className="btn btn-outline-danger btn-sm" onClick={() => removeFromCart(item.produto_id)}>Remover</button></div></div></div>))}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Finalizar Pedido</h5>
              <hr />
              <div className="mb-3"><label htmlFor="local-entrega" className="form-label fw-bold">Local de Entrega</label><textarea id="local-entrega" className="form-control" rows="3" placeholder="Endereço completo para entrega..." value={localEntrega} onChange={(e) => setLocalEntrega(e.target.value)} required></textarea></div>
              <div className="mb-3">
                <label htmlFor="forma-pagamento" className="form-label fw-bold">Forma de Pagamento</label>
                <select id="forma-pagamento" className="form-select" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                  <option value="Cartão de Crédito">Cartão de Crédito</option><option value="Cartão de Débito">Cartão de Débito</option><option value="PIX">PIX</option><option value="Dinheiro">Dinheiro</option>
                  {boletoInfo.elegivel && isEnabled('sistema_boleto') && (<option value="Boleto Virtual">Boleto Virtual</option>)}
                </select>
              </div>
              {formaPagamento === 'Boleto Virtual' && boletoInfo.elegivel && (
                <div className="mb-3 p-3 bg-light rounded">
                  <div className="mb-3">
                    <label htmlFor="plano-boleto" className="form-label fw-bold">Escolha o Parcelamento</label>
                    <select id="plano-boleto" className="form-select" value={selectedPlano} onChange={(e) => setSelectedPlano(e.target.value)}>
                      <option value="">Selecione...</option>
                      {boletoInfo.planos.map(plano => (<option key={plano.id} value={plano.id}>{plano.numero_parcelas}x de R$ {parseFloat(plano.valor_parcela).toFixed(2).replace('.', ',')}{plano.juros ? ' (com juros)' : ' (sem juros)'}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dia-vencimento-boleto" className="form-label fw-bold">Escolha o Dia do Vencimento</label>
                    <select id="dia-vencimento-boleto" className="form-select" value={selectedDueDay} onChange={(e) => setSelectedDueDay(e.target.value)}>
                      <option value="">Selecione...</option>
                      {boletoDueDays.map(dia => (<option key={dia.id} value={dia.dia_vencimento}>Todo dia {dia.dia_vencimento}</option>))}
                    </select>
                  </div>
                </div>
              )}
              {formaPagamento === 'Dinheiro' && (
                <div className="mb-3">
                  <label htmlFor="valor-pago" className="form-label">Pagar com (para troco)</label>
                  <input type="number" step="0.01" id="valor-pago" className="form-control" placeholder="Ex: 50.00" value={valorPago} onChange={(e) => setValorPago(e.target.value)} />
                  {valorPago > totalFinal && (<div className="form-text text-success fw-bold">Troco: R$ {troco.toFixed(2).replace('.', ',')}</div>)}
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between fw-bold mt-2 fs-5"><span>Total a Pagar</span><span>R$ {totalFinal.toFixed(2).replace('.', ',')}</span></div>
              <div className="d-grid mt-4"><button className="btn btn-success btn-lg" onClick={handleCheckout} disabled={loadingCheckout}>{loadingCheckout ? 'Processando...' : 'Finalizar Compra'}</button></div>
            </div>
          </div>
        </div>
      </div>
      <WarningModal 
        show={showMixedCartWarning}
        onHide={() => {
            setShowMixedCartWarning(false);
            setFormaPagamento('Cartão de Crédito'); // Volta para uma forma de pagamento segura
        }}
        title="Carrinho com Itens Diversos"
      >
        <p>O pagamento com "Boleto Virtual" só é permitido para a compra de **um tipo de produto por vez** (você pode comprar várias unidades do mesmo produto).</p>
        <p>Seu carrinho contém itens diferentes. Por favor, escolha uma das opções abaixo:</p>
        <div className="d-grid gap-2">
            <button className="btn btn-primary" onClick={() => setFormaPagamento('PIX')}>Pagar com PIX</button>
            <button className="btn btn-secondary" onClick={handleRemoveOneAndContinue}>Remover Último Item e Tentar Novamente</button>
            <button className="btn btn-danger" onClick={handleClearAndContinue}>Limpar Carrinho</button>
        </div>
      </WarningModal>
    </div>
  );
}

export default CustomerCartPage;