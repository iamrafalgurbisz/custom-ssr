import type React from 'react';
import { useHasMounted } from '../../hooks/useHasMounted';

export const Cart: React.FC = () => {
  const hasMounted = useHasMounted();
  if (!hasMounted) return null;

  return (
    <section>
      This is the cart. It will always be empty. It's just to show that its content is rendered only
      on the client, so it's not part of the HTML cache.
    </section>
  );
};
