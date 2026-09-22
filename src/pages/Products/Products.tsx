import type React from 'react';
import { Suspense, use } from 'react';
import type { ProductSummary } from '../../api';
import { ErrorBoundary } from '../../components/ErrorBoundary/ErrorBoundary';
import styles from './products.module.scss';

interface Props {
  data: {
    products: Promise<{ products: ProductSummary[] }>;
  };
}

const ProductsList: React.FC<{ promise: Props['data']['products'] }> = ({ promise }) => {
  const { products } = use(promise);

  return (
    <div className={styles.products}>
      {products.map((product) => (
        <div key={product.id} className={styles.product}>
          <img src={product.thumbnail} alt={product.title} width={200} height={200} />
          <a href={`/product/${product.id}`} className={styles.link}>
            {product.title}
          </a>
        </div>
      ))}
    </div>
  );
};

export const Products: React.FC<Props> = ({ data }) => (
  <section>
    <ErrorBoundary fallback="Products could not be loaded.">
      <Suspense fallback="Loading products...">
        <ProductsList promise={data.products} />
      </Suspense>
    </ErrorBoundary>
  </section>
);
