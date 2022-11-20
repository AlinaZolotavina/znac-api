const {
  PORT = 3000,
  DB_URL = 'mongodb://localhost:27017/znacdb',
} = process.env;

module.exports = {
  PORT,
  DB_URL,
};
