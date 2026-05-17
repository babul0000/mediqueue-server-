const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const uri = process.env.MONGODB_URI
const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const db = client.db('mediqueue')
        const tutorCollection = db.collection('tutor')
        // const bookingCollection = db.collection('booking')


        // app.get('/featured', async (req, res) => {
        //     const result = await tutorCollection.find().limit(4).toArray()
        //     res.send(result)
        // })

        app.get('/tutor', async (req, res) => {
            const result = await tutorCollection.find().toArray()
            res.send(result)
        })

        // app.post('/destination', async (req, res) => {
        //     const destination = req.body
        //     const result = await destinationCollection.insertOne(destination)
        //     res.send(result)
        // })

        


        app.get('/tutor/:id', async (req, res) => {
            const { id } = req.params

            const result = await tutorCollection.findOne({ _id: new ObjectId(id) })
            res.json(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server is running on')
})

app.listen(PORT, () => {
    console.log(`server runNiNg on port ${PORT}`);
})