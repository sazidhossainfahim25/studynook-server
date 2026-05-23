const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
dotenv.config();
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

app.use(
  cors({
    origin: process.env.JWKS_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

// MongoDB Connection
const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.JWKS_URL}/api/auth/jwks`),
 );

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    // console.log("Decoded JWT Payload:", payload);
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized", error });
  }
};

async function run() {
  try {
    await client.connect();
    const db = client.db("studynook");
    const roomsCollection = db.collection("rooms");
    const bookingsCollection = db.collection("bookings");

    // My Rooms
    app.get("/my-rooms", async (req, res) => {
      const email = req.query.email;
      const query = { ownerEmail: email };
      const result = await roomsCollection.find(query).toArray();
      res.send(result);
    });

    // My Bookings
    app.get("/my-bookings",  async (req, res) => {
      try {
        const email = req.query.email;
        const query = { userEmail: email };
        const result = await bookingsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching bookings", error });
      }
    });

    // Update Room
    app.patch("/update-room/:id",  async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            name: updatedData.name,
            capacity: updatedData.capacity,
            hourlyRate: updatedData.hourlyRate,
            description: updatedData.description,
            amenities: updatedData.amenities,
          },
        };
        const result = await roomsCollection.updateOne(query, updateDoc);
        res.send({
          acknowledged: result.acknowledged,
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        res.status(500).send({ message: "Error updating room", error });
      }
    });

    // Delete Room
    app.delete("/rooms/:id",  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomsCollection.deleteOne(query);
      res.send(result);
    });

    // Get All Rooms
    app.get("/rooms", async (req, res) => {
      const result = await roomsCollection.find().toArray();
      res.send(result);
    });

    // Get Single Room id
    app.get("/rooms/:id", verifyToken , async (req, res) => {
      const { id } = req.params;

      // Check ObjectId validity
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({
          success: false,
          message: "Invalid room ID",
        });
      }

      const result = await roomsCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // Add Room
    app.post("/add-room",  async (req, res) => {
      try {
        const newRoom = req.body;
        const result = await roomsCollection.insertOne(newRoom);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error adding room", error });
      }
    });

    // All Bookings
    app.get("/bookings",  async (req, res) => {
      const result = await bookingsCollection.find().toArray();
      res.send(result);
    });

    // Book a Room (Conflict Check + Booking Count)
    app.post("/bookings",  async (req, res) => {
      try {
        const { roomId, date, startTime, endTime, userEmail } = req.body;

        // Conflict Check
        const conflict = await bookingsCollection.findOne({
          roomId,
          date,
          status: "confirmed",
          $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
        });

        if (conflict) {
          return res
            .status(400)
            .send({ message: "Room is already booked for this time." });
        }

        const result = await bookingsCollection.insertOne({
          ...req.body,
          status: "confirmed",
          createdAt: new Date(),
        });
        // Increment booking count for the room
        await roomsCollection.updateOne(
          { _id: new ObjectId(roomId) },
          { $inc: { bookingCount: 1 } },
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error making booking", error });
      }
    });

    // Cancel Booking
    app.patch("/bookings/:id/cancel", async (req, res) => {
      try {
        const { id } = req.params;
        const { roomId } = req.body;

        const result = await bookingsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: "cancelled" } },
        );

        if (result.modifiedCount > 0) {
          await roomsCollection.updateOne(
            { _id: new ObjectId(roomId) },
            { $inc: { bookingCount: -1 } },
          );
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error cancelling booking", error });
      }
    });

    console.log("Connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("studynook server is running!");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
