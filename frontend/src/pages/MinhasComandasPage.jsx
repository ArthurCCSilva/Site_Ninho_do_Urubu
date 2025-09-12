// src/pages/MinhasComandasPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

function MinhasComandasPage() {
    const [comandas, setComandas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchComandas = async () => {
            setLoading(true);
            try {
                const response = await api.get('/api/usuarios/minhas-comandas');
                setComandas(response.data);
            } catch (err) {
                setError("Não foi possível carregar suas comandas.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchComandas();
    }, []);

    const formatCurrency = (val) => (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    if (loading) return <div className="text-center"><div className="spinner-border"/></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h1 className="mb-4">Minhas Comandas em Aberto</h1>
            {comandas.length > 0 ? (
                <div className="accordion" id="comandasAccordion">
                    {comandas.map((comanda, index) => (
                        <div className="accordion-item" key={comanda.id}>
                            <h2 className="accordion-header" id={`heading-${index}`}>
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${index}`}>
                                    <strong>Comanda #{comanda.id}</strong>&nbsp;- Aberta em {new Date(comanda.data_criacao).toLocaleDateString('pt-BR')}
                                    <span className="ms-auto me-2">Valor Parcial: {formatCurrency(comanda.valor_total)}</span>
                                </button>
                            </h2>
                            <div id={`collapse-${index}`} className="accordion-collapse collapse" data-bs-parent="#comandasAccordion">
                                <div className="accordion-body">
                                    <p>Para fechar esta comanda e efetuar o pagamento, por favor, dirija-se ao caixa.</p>
                                    <h5 className="mt-3">Itens na Comanda:</h5>
                                    <ul className="list-group">
                                        {comanda.itens.map((item, itemIndex) => (
                                            <li key={itemIndex} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <img src={item.imagem_produto_url ? `http://localhost:3001/uploads/${item.imagem_produto_url}` : 'https://placehold.co/50'} alt={item.produto_nome} className="img-thumbnail me-3" style={{width: 50, height: 50, objectFit: 'cover'}}/>
                                                    <div>
                                                        {item.produto_nome}
                                                        <small className="d-block text-muted">{item.quantidade} x {formatCurrency(item.preco_unitario)}</small>
                                                    </div>
                                                </div>
                                                <span className="fw-bold">{formatCurrency(item.quantidade * item.preco_unitario)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center">
                    <p>Você não possui nenhuma comanda em aberto no momento.</p>
                    <Link to="/" className="btn btn-primary">Voltar para a Loja</Link>
                </div>
            )}
        </div>
    );
}

export default MinhasComandasPage;