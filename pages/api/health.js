export default function handler(req, res) {
  res.status(200).json({ status: 'ok', message: 'Application is running correctly' });
} 