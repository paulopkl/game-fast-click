export const environment = {
  production: true,
  API_URL: process.env["API_URL"] || 'http://localhost:3000',
  LOG_LEVEL: process.env["LOG_LEVEL"] || 'info',
};
