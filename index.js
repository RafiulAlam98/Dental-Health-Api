const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

const app = express();

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qlklf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const appointmentsOptionCollection = client
      .db("doctorService")
      .collection("appointmentOptions");
    const bookingsCollection = client
      .db("doctorService")
      .collection("bookings");

      // use aggregate to query multiple collection and then to merge data

    app.get("/appointmentOptions", async (req, res) => {
      const query = {};
      const date = req.query.date
      console.log(date)
      const options = await appointmentsOptionCollection.find(query).toArray();

      //get the bookings by the provided date
      const bookingQuery = {appointmentDate:date}
      const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray()


      // code carefully
      options.forEach(option =>{
        const optionBooked = alreadyBooked.filter(book=> book.treatment === option.name)
        const bookedSlots = optionBooked.map(book=>book.slot)
        const remainingSlots = option.slots.filter(slot=>!bookedSlots.includes(slot))
        option.slots=remainingSlots
      })
      res.send(options);
    });


    app.post("/bookings", async (req, res) => {
      const booking = req.body
      
      const result = await bookingsCollection.insertOne(booking)
      console.log(result)
      res.json(result);
    });
  } finally {
    //     await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`running on ${port}`);
});
