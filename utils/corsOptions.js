const corsOptions = {
  origin: [
    'https://znac.org',
    'http://znac.org',
    'http://localhost:3000',
  ],
  credentials: true,
};

module.exports = corsOptions;
