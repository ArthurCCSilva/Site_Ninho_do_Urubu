// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

function HomePage() {
  // useState é a "memória" do nosso componente
  const [products, setProducts] = useState([]); // Guarda a lista de produtos
  const [loading, setLoading] = useState(true);   // Diz se estamos carregando
  const [error, setError] = useState(null);      // Guarda mensagens de erro

  // useEffect executa uma função depois que o componente aparece na tela
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/api/produtos');
        setProducts(response.data); // Sucesso: guarda os produtos na memória
      } catch (err) {
        setError('Falha ao carregar os produtos. O servidor backend está rodando?');
      } finally {
        setLoading(false); // Terminou de carregar (com sucesso ou erro)
      }
    };

    fetchProducts();
  }, []); // O '[]' vazio faz com que rode apenas uma vez

  // Mostra uma mensagem enquanto os dados carregam
  if (loading) return <p className="text-center">Carregando produtos...</p>;
  // Mostra uma mensagem de erro se algo deu errado
  if (error) return <p className="alert alert-danger">{error}</p>;

  return (
    <div>
      <h1 className="mb-4">Nossos Produtos</h1>
      <div className="row">
        {/* O .map() cria um componente ProductCard para cada produto na lista */}
        {products.map(product => (
          <div key={product.id} className="col-12 col-md-6 col-lg-4 col-xl-3 mb-4">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;