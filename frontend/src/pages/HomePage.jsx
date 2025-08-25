// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import './HomePage.css'; // Agora esta importação funcionará

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/api/produtos');
        setProducts(response.data.produtos || []);
      } catch (err) {
        setError('Falha ao carregar os produtos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <h1 className="homepage-title">Nossos Produtos</h1>
      {/* Usamos divs com classes do Bootstrap em vez de componentes */}
      <div className="row g-4">
        {products.map(product => (
          <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex align-items-stretch">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;