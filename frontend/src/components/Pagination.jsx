// src/components/Pagination.jsx

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null; // Não mostra a paginação se só houver uma página
  }

  // Cria um array de números de página, ex: [1, 2, 3, 4, 5]
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav>
      <ul className="pagination justify-content-center">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>Anterior</button>
        </li>

        {pages.map(page => (
          <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page)}>{page}</button>
          </li>
        ))}

        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>Próximo</button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;