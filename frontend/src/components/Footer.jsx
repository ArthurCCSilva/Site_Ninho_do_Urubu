// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
// ✅ 1. Importa o nosso novo arquivo CSS
import './Footer.css'; 

// Importa a sua imagem da logo. Coloque o caminho correto para sua imagem.
// Se a imagem estiver na pasta 'public', o caminho seria '/logo_footer.png'
// Se estiver em 'src/assets', seria como abaixo.
// import logoFooter from '../assets/img/logo_footer.png';

function Footer() {
    return (
        // ✅ 2. Adiciona o HTML completo do novo footer
        <footer className="bg-footer mt-3">
            <div className="footer-top">
                <div className="container">
                    <div className="row gy-5">
                        <div className="col-lg-3 col-sm-6">
                            {/* Ajuste o caminho da imagem da logo aqui */}
                            {/* <a href="#"><img src={logoFooter} alt="Logo" /></a> */}
                            <Link className="navbar-brand" to="/"><img src="/logo_Bar_Ninho_do_Urubu_pq.png" alt="Logo Bar Ninho do Urubu - pequena em png" style={{ height: '56px', width: 'auto' }} /></Link>
                            <div className="line"></div>
                            
                            <p>O bar do torcedor.</p>
                            <div className="sociais-icons">
                                <a href="https://wa.me/556796355477?text=" target="_blank"><i className="ri-whatsapp-fill"></i></a>
                                <a href="https://www.instagram.com/ninho.do.urubu_?igsh=a3N0MzRibG8zZGd4" target="_blank"><i className="ri-instagram-fill"></i></a>
                            </div>
                        </div>
                        <div className="col-lg-3 col-sm-6">
                            <h5 className="mb-0">NAVEGAÇÃO</h5>
                            <div className="line"></div>
                            <ul>
                                <li><Link to="/">Página Inicial</Link></li>
                                <li><Link to="/login">Login</Link></li>
                                <li><Link to="/meus-pedidos">Meus Pedidos</Link></li>
                                <li><Link to="/termos-de-uso">Termos de Uso</Link></li>
                            </ul>
                        </div>
                        <div className="col-lg-3 col-sm-6">
                            <h5 className="mb-0">CONTATO</h5>
                            <div className="line"></div>
                            <ul>
                                <li>WhatsApp: (67) 9 9635-5477</li>
                                <li>Instagram: @ninho.do.urubu_</li>
                            </ul>
                        </div>
                        <div className="col-lg-3 col-sm-6">
                            <h5 className="mb-0">ENDEREÇO</h5>
                            <div className="line"></div>
                            <ul>
                                <li>Senador Sá - CE</li>
                                <li>Avenida 23 de Agosto, 359</li>
                                <li>Centro</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="container">
                    <div className="row g-4 justify-content-between">
                        <div className="col-auto">
                            <p className="mb-0">© {new Date().getFullYear()} Todos os direitos reservados a Bar Ninho do Urubu.</p>
                        </div>
                        <div className="col-auto">
                            <p className="mb-0">Criado por: <a href="https://www.instagram.com/connect_si_15/" target="_blank">Connect - Soluções Inovadoras</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;