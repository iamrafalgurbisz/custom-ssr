import type React from 'react';
import { Suspense, use } from 'react';
import type { Product as ProductData } from '../../api';
import { ErrorBoundary } from '../../components/ErrorBoundary/ErrorBoundary';
import styles from './product.module.scss';

interface Props {
  data: {
    product: Promise<ProductData | null>;
  };
}

const Details: React.FC<{ promise: Promise<ProductData | null> }> = ({ promise }) => {
  const product = use(promise);

  if (!product) return 'Product not found.';

  const { title, images, thumbnail, description, price } = product;

  return (
    <div className={styles.product}>
      <img
        className={styles.img}
        src={images[0]}
        srcSet={`${thumbnail} 300w, ${images[0]} 1000w`}
        sizes="300px"
        alt={title}
        fetchPriority="high"
        width={300}
        height={300}
      />
      <div className={styles.descriptionWrapper}>
        <span>{title}</span>
        <span className={styles.description}>{description}</span>
        <span className={styles.priceSection}>{price}</span>
      </div>
    </div>
  );
};

export const Product: React.FC<Props> = ({ data }) => (
  <section>
    <ErrorBoundary fallback="Product could not be loaded.">
      <Suspense fallback="Loading product...">
        <Details promise={data.product} />
      </Suspense>
    </ErrorBoundary>
  </section>
);
