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



        app.get('/my-tutors/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await tutorCollection.find(query).toArray();
            res.status(200).json(result);
        });


        app.get('/tutor', async (req, res) => {
            const result = await tutorCollection.find().toArray()
            res.status(200).json(result)
        })
        app.get('/tutor-home', async (req, res) => {
            const result = await tutorCollection.find().limit(6).toArray()
            res.status(200).json(result)
        })

        app.post('/add-tutor', async (req, res) => {
            const addTutor = req.body
            const result = await tutorCollection.insertOne(addTutor)
            res.status(201).json(result)
        })

        app.get('/tutor/:id', verifyToken, async (req, res) => {
            const { id } = req.params
            const result = await tutorCollection.findOne({ _id: new ObjectId(id) })
            res.status(200).json(result)
        })


        app.delete('/tutor/:id', async (req, res) => {
            try {
                const result = await tutorCollection.deleteOne({ _id: new ObjectId(req.params.id) });

                result.deletedCount === 1
                    ? res.status(200).json({ message: "Successfully deleted" })
                    : res.status(404).json({ message: "Tutor not found" });
            } catch (error) {
                res.status(500).json({ message: "Failed to delete" });
            }
        });


        app.put('/tutor/:id', async (req, res) => {
            const { id } = req.params;
            const updatedData = req.body;
            delete updatedData._id;

            const result = await tutorCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );

            result.matchedCount > 0
                ? res.status(200).json({ message: "Successfully updated" })
                : res.status(404).json({ message: "Tutor not found" });
        });



        app.post('/add-booking', verifyToken, async (req, res) => {
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


        app.get('/my-bookings', verifyToken, async (req, res) => {
            try {
                const email = req.query.email;
                let query = { status: { $ne: 'cancelled' } };

                if (email) {
                    query.email = email;
                }
                const result = await bookingCollection.find(query).toArray();
                res.status(200).json(result);
            } catch (error) {
                res.status(500).json({ error: "Failed to fetch bookings" });
            }
        });

        app.patch('/booking/:bookingId', async (req, res) => {
            try {
                const { bookingId } = req.params;
                const query = { _id: new ObjectId(bookingId) };


                const booking = await bookingCollection.findOne(query);

                if (!booking) {
                    return res.status(404).json({ error: "Booking not found" });
                }


                if (booking.status === 'cancelled') {
                    return res.status(400).json({ message: "This booking is already cancelled" });
                }


                const updateResult = await bookingCollection.updateOne(
                    query,
                    { $set: { status: 'cancelled' } }
                );


                if (updateResult.modifiedCount > 0 && booking.tutorId) {
                    const tutorQuery = { _id: new ObjectId(booking.tutorId) };
                    await tutorCollection.updateOne(tutorQuery, { $inc: { totalSlot: 1 } });
                }

                res.status(200).json({ success: true, message: "Booking cancelled and slot restored!", result: updateResult });

            } catch (error) {
                console.error("Cancel Booking Error:", error);
                res.status(500).json({ error: "Failed to cancel booking due to server error" });
            }
        });

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