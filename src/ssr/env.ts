export const isProd = process.env.NODE_ENV === 'production';

export const port = Number(process.env.PORT) || 3000;

export const TTL = Number(process.env.TTL);

if (!TTL) {
  throw new Error('TTL is not set.');
}
