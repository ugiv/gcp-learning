import express from 'express';
import pg from 'pg';
import {Connector} from '@google-cloud/cloud-sql-connector';

const {Pool} = pg;

const connector = new Connector();
const clientOpts = await connector.getOptions({
    instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
    ipType: 'PUBLIC'
});

const pool = new Pool({
    ...clientOpts,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.DB_NAME,
    max: 5
});

const app = express();

app.use(express.json());

app.get('/', async (req, res) => {
  await pool.query('INSERT INTO visits(created_at) VALUES(NOW())');
  const {rows} = await pool.query('SELECT created_at FROM visits ORDER BY created_at DESC LIMIT 5');
  console.table(rows); // prints the last 5 visits
  res.send(rows);
});


app.post('/add', (req, res) => {
  const { title, description } = req.body;
  const randomId = Math.floor(Math.random() * 10000);
  try {
    pool.query('INSERT INTO daily_note VALUES($1, $2, $3)', [randomId, title, description], (error, results) => {
      if (error) {
        throw error;
      };
      res.status(200).json({status: "ok", response: results.rows})
    })
  } catch(error) {
    console.log(error)
  }
});

app.get('/list', (req, res) => {
  try {
    pool.query('SELECT * FROM daily_note', (error, results) => {
      if (error){
        throw error;
      };
      res.status(200).send(results.rows);
    })
  } catch (error) {
    console.log(error)
  }
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, async () => {
  console.log('process.env: ', process.env);
  await pool.query(`CREATE TABLE IF NOT EXISTS visits (
    id SERIAL NOT NULL,
    created_at timestamp NOT NULL,
    PRIMARY KEY (id)
  );`);
  console.log(`helloworld: listening on port ${port}`);
});

