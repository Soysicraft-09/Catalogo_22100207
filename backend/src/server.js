const dotenv = require('dotenv');
const app = require('./app');

dotenv.config();

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
