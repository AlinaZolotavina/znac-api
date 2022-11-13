const corsOptions = {
  origin: [
    // 'https://movieexplorer.nomoredomains.sbs',
    // 'http://movieexplorer.nomoredomains.sbs',
    'http://localhost:3000',
  ],
  credentials: true,
};

module.exports = corsOptions;
