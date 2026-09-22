import type React from 'react';
import styles from './Navbar.module.scss';

export const Navbar: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <a href="/" className={styles.brand}>
          SRROP
        </a>
        <div className={styles.categories}>
          <a href="/products" className={styles.category}>
            All products
          </a>
          <a href="/products?category=beauty" className={styles.category}>
            Beauty
          </a>
          <a href="/products?category=furniture" className={styles.category}>
            Furniture
          </a>
          <a href="/products?category=fragrances" className={styles.category}>
            Fragrances
          </a>
          <a href="/cart" className={styles.category}>
            [ CART ]
          </a>
        </div>
      </div>
    </div>
  );
};
