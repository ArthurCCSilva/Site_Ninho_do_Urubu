// src/pages/DevDashboardPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function DevDashboardPage() {
    const { user } = useAuth();
    const [flags, setFlags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPage, setSelectedPage] = useState('global');
    const [pageTitle, setPageTitle] = useState('Permissões (Globais do Site)');
    
    // ✅ CORREÇÃO: A propriedade correta é 'imagem_perfil_url'
    const profileImageUrl = user?.imagem_perfil_url 
        ? `http://localhost:3001/uploads/${user.imagem_perfil_url}` 
        : 'https://placehold.co/150';

    const fetchFlagsForDev = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/feature-flags/dev?page_category=${selectedPage}`);
            setFlags(response.data);
        } catch (error) {
            console.error("Erro ao buscar feature flags:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlagsForDev();
    }, [selectedPage]);

    const handleToggle = async (flagId, currentStatus) => {
        try {
            setFlags(flags.map(f => 
                f.id === flagId ? { ...f, is_enabled: !currentStatus } : f
            ));
            await api.patch(`/api/feature-flags/${flagId}`, { is_enabled: !currentStatus });
        } catch (error) {
            alert('Erro ao atualizar a funcionalidade. Revertendo alteração.');
            console.error(error);
            setFlags(flags.map(f => 
                f.id === flagId ? { ...f, is_enabled: currentStatus } : f
            ));
        }
    };

    const handleSelectPage = (pageKey, title) => {
        setSelectedPage(pageKey);
        setPageTitle(`Permissões (${title})`);
    };

    return (
        <div>
            <h1 className="mb-4">Painel do Desenvolvedor</h1>
            <div className="row">
                <div className="col-lg-7 mb-4">
                    <div className="card h-100">
                        <div className="card-header"><h4>Informações do Desenvolvedor</h4></div>
                        <div className="card-body d-flex align-items-center">
                            <img src={profileImageUrl} alt="Foto de Perfil" className="img-fluid rounded-circle me-4" style={{ maxWidth: '100px', height: '100px', objectFit: 'cover' }}/>
                            <div>
                                {/* ✅ CORREÇÕES AQUI PARA USAR AS PROPRIEDADES CERTAS */}
                                <h5 className="card-title">{user?.nomeCompleto}</h5>
                                <p className="card-text mb-0"><strong>Email:</strong> {user?.usuario || 'Não informado'}</p>
                                <p className="card-text"><strong>Status:</strong> <span className="badge bg-danger text-uppercase">{user?.role}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* O restante do seu componente continua igual... */}
                <div className="col-lg-5 mb-4">
                    <div className="card h-100">
                        <div className="card-header"><h4>Permissões por Página</h4></div>
                        <div className="card-body">
                           <div className="d-grid gap-2">
                                <button className={`btn ${selectedPage === 'global' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleSelectPage('global', 'Globais do Site')}>Permissões Globais</button>
                                <button className={`btn ${selectedPage === 'dashboard' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleSelectPage('dashboard', 'Painel Admin')}>Permissões de Dashboard</button>
                                <button className={`btn ${selectedPage === 'home' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleSelectPage('home', 'Página Home')}>Página Home</button>
                                <button className={`btn ${selectedPage === 'pagamentos' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleSelectPage('pagamentos', 'Pagamentos')}>Permissões de Pagamento</button>
                                <button className={`btn ${selectedPage === 'financeiro' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => handleSelectPage('financeiro', 'Painel Financeiro')}>Permissões Financeiras</button>
                           </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mt-4">
                <div className="card-header"><h4>{pageTitle} (Feature Flags)</h4></div>
                <div className="card-body">
                    {loading ? <div className="text-center"><div className="spinner-border spinner-border-sm"/></div> :
                    <div className="list-group">
                        {flags.map(flag => (
                            <div key={flag.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1">{flag.description}</h6>
                                    <small className="text-muted">Chave: <code>{flag.feature_key}</code></small>
                                </div>
                                <div className="form-check form-switch">
                                    <input 
                                        className="form-check-input" 
                                        style={{transform: 'scale(1.5)'}}
                                        type="checkbox" 
                                        role="switch" 
                                        id={`flag-switch-${flag.id}`}
                                        checked={!!flag.is_enabled} 
                                        onChange={() => handleToggle(flag.id, flag.is_enabled)}
                                    />
                                    <label className="form-check-label" htmlFor={`flag-switch-${flag.id}`}>{flag.is_enabled ? 'Ativo' : 'Inativo'}</label>
                                </div>
                            </div>
                        ))}
                    </div>
                    }
                </div>
            </div>
        </div>
    );
}

export default DevDashboardPage;