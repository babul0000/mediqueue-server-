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

// install npm i jose-cjs
// tarpor seta akhane call korte hobe
// tarpor seta verify korte hobe sem nicer coder moto

// const JWKS = createRemoteJWKSet(
//     new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
// )

// const verifyToken = async (req, res, next) => {
//     const header = req?.headers.authorization
//     if (!header) {
//         return res.status(401).json({ message: 'unauthorization' })
//     }
//     const token = header.split(' ')[1]
//     if (!token) {
//         return res.status(401).json({ message: 'unauthorization' })
//     }
//     console.log(token);
//     try {
//         const { payload } = await jwtVerify(token, JWKS)
//         console.log(payload);
//         next()
//     } catch (error) {
//         return res.status(403).json({ message: 'forbidden' })
//     }
//     // ay pojonto holo total verify er kaj
// }


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


        // app.get('/destination/:id', verifyToken, async (req, res) => {
        //     const { id } = req.params

        //     const result = await destinationCollection.findOne({ _id: new ObjectId(id) })
        //     res.json(result)
        // })

        // app.patch('/destination/:id', async (req, res) => {
        //     const { id } = req.params
        //     const updatedData = req.body

        //     const result = await destinationCollection.updateOne(
        //         { _id: new ObjectId(id) },
        //         { $set: updatedData }
        //     )
        //     res.json(result)
        // })


        // app.delete('/destination/:id', async (req, res) => {
        //     const { id } = req.params;
        //     const result = await destinationCollection.deleteOne({ _id: new ObjectId(id) })
        //     res.json(result)
        // })

        // app.get('/booking/:userId', verifyToken, async (req, res) => {
        //     const { userId } = req.params
        //     const result = await bookingCollection.find({ userId: userId }).toArray()
        //     res.json(result)
        // })

        // app.post('/booking', verifyToken, async (req, res) => {
        //     const bookingData = req.body;
        //     const result = await bookingCollection.insertOne(bookingData)
        //     res.json(result)
        // })

        // app.delete('/booking/:bookingId', verifyToken, async (req, res) => {
        //     const { bookingId } = req.params
        //     const result = await bookingCollection.deleteOne({ _id: new ObjectId(bookingId) })
        //     res.json(result)
        // })


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