import type { Response } from 'express';

export const ERROR_PAGE = '<!DOCTYPE html><html><body><h1>Internal Server Error</h1></body></html>';

export const sendHtml = (res: Response, status: number, html: string) => {
  res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
};
