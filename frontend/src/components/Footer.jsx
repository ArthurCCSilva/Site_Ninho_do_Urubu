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
                            <div className="line"></div>
                            <p>Sua loja de produtos oficiais e licenciados.</p>
                            <div className="sociais-icons">
                                <a href="#" target="_blank"><i className="ri-whatsapp-fill"></i></a>
                                <a href="#" target="_blank"><i className="ri-mail-fill"></i></a>
                                <a href="#" target="_blank"><i className="ri-instagram-fill"></i></a>
                                <a href="#" target="_blank"><i className="ri-facebook-circle-fill"></i></a>
                            </div>
                        </div>
                        <div className="col-lg-3 col-sm-6">
                            <h5 className="mb-0">NAVEGAÇÃO</h5>
                            <div className="line"></div>
                            <ul>
                                <li><Link to="/">Página Inicial</Link></li>
                                <li><Link to="/produtos">Produtos</Link></li>
                                <li><Link to="/meus-pedidos">Meus Pedidos</Link></li>
                                <li><Link to="/termos-de-uso">Termos de Uso</Link></li>
                            </ul>
                        </div>
                        <div className="col-lg-3 col-sm-6">
                            <h5 className="mb-0">CONTATO</h5>
                            <div className="line"></div>
                            <ul>
                                <li>WhatsApp: (XX) 9 XXXX-XXXX</li>
                                <li>Instagram: @seu_instagram</li>
                                <li>E-mail: contato@seuemail.com</li>
                            </ul>
                        </div>
                        <div className="col-lg-3 col-sm-6">
                            <h5 className="mb-0">ENDEREÇO</h5>
                            <div className="line"></div>
                            <ul>
                                <li>Cidade - UF</li>
                                <li>Nome da Rua, Nº XX</li>
                                <li>Bairro</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="container">
                    <div className="row g-4 justify-content-between">
                        <div className="col-auto">
                            <p className="mb-0">© {new Date().getFullYear()} Todos os direitos reservados a Ninho do Urubu Store.</p>
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