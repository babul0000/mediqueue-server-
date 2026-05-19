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

const PORT = process.env.PORT || 5000;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL || 'http://localhost:3000'}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
    const header = req?.headers.authorization
    if (!header) {
        return res.status(401).json({ message: 'unauthorized' })
    }
    const token = header.split(' ')[1]
    if (!token) {
        return res.status(401).json({ message: 'unauthorized' })
    }
    try {
        const { payload } = await jwtVerify(token, JWKS)
        req.user = payload;
        next()
    } catch (error) {
        return res.status(403).json({ message: 'forbidden' })
    }
}

async function run() {
    try {
        const db = client.db('mediqueue')

        const tutorCollection = db.collection('tutor')
        const bookingCollection = db.collection('booking')

        app.get('/tutor', async (req, res) => {
            const result = await tutorCollection.find().toArray()
            res.status(200).json(result)
        })

        app.post('/add-tutor', async (req, res) => {
            const addTutor = req.body
            const result = await tutorCollection.insertOne(addTutor)
            res.status(201).json(result)
        })

        app.get('/tutor/:id', async (req, res) => {
            const { id } = req.params
            const result = await tutorCollection.findOne({ _id: new ObjectId(id) })
            res.status(200).json(result)
        })

        app.patch('/tutor/:id/decrease-slot', async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };

                const updateDoc = {
                    $inc: { totalSlot: -1 }
                };

                const result = await tutorCollection.updateOne(filter, updateDoc);
                res.status(200).json(result);
            } catch (error) {
                console.error("Decrease slot error:", error);
                res.status(500).json({ error: "Failed to decrease slot or invalid ID" });
            }
        });


        app.post('/add-booking', async (req, res) => {
            try {
                const bookingData = req.body;
                const query = { _id: new ObjectId(bookingData.tutorId) };


                const tutor = await tutorCollection.findOne(query);


                if (!tutor || tutor.totalSlot <= 0) {
                    return res.status(400).json({ message: "This session is fully booked. You can’t join at the moment." });
                }


                if (new Date() < new Date(tutor.sessionDate)) {
                    return res.status(400).json({ message: "Booking is not available yet for this tutor" });
                }
                const result = await bookingCollection.insertOne(bookingData);
await tutorCollection.updateOne(query, { $inc: { totalSlot: -1 } });


                res.status(200).json({ success: true, message: "Your booking has been confirmed successfully!", result });
                
            } catch (error) {
                console.error("Booking Error:", error);
                res.status(500).json({ error: "Failed to create booking" });
            }
        });

        app.get('/my-bookings', async (req, res) => {
            try {
                const result = await bookingCollection.find().toArray();
                res.status(200).json(result);
            } catch (error) {
                console.error("Fetch Bookings Error:", error);
                res.status(500).json({ error: "Failed to fetch bookings" });
            }
        });

        app.patch('/booking/:bookingId', async (req, res) => {
            const { bookingId } = req.params

            const result = await bookingCollection.updateOne(
                { _id: new ObjectId(bookingId) },
                { $set: { status: 'cancelled' } }
            )

            res.json(result)
        })

        console.log("Successfully connected to MongoDB!");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running successfully')
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})