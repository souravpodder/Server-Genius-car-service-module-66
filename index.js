const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' })
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }

    console.log('decoded', decoded);
    req.decoded = decoded;
    next();
  })
  // console.log('inside verifyJWT', authHeader);

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e7s9p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('GeniusCar').collection('service');
    const orderCollection = client.db('GeniusCar').collection('order');

    // Auth 
    app.post('/token', async (req, res) => {
      const user = req.body;
      console.log(user);
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d'
      })

      res.send({ accessToken });
    })

    // service related api 
    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    })

    app.get('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    })

    //Post single service
    app.post('/service', async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    })

    // delete a service 
    app.delete('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result)
    })

    // ordercollcetion operations 
    app.post('/order', async (req, res) => {
      const newOrder = req.body;
      const result = await orderCollection.insertOne(newOrder);
      res.send(result);
    })

    app.get('/orders', verifyJWT, async (req, res) => {
      const decoddedEmail = req.decoded.email;
      const email = req.query.email;
      // console.log(query);
      if (email === decoddedEmail) {
        const query = { email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      } else {
        res.status(403).send({ message: 'Forbidden access!' });
      }
    })
  }
  finally {

  }
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('I am using server with genius car')
})

app.get('/hero', (req, res) => {
  res.send('Programming Hero has great heros.')
})

app.listen(port, () => {
  console.log('listening to port', port);
})