import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Vangt alle niet-API-paden af; de statische site draait alleen op GitHub Pages. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(404).json({
    error: 'Not found',
    message:
      'Deze Vercel-deployment host alleen de chat-API. De website staat op GitHub Pages.',
    endpoints: ['/api/chat'],
  });
}
