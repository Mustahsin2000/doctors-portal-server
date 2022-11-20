const express = require('express');

const cors = require('cors');

const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;

require('dotenv').config();

const app = express();

//middlewire
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wfblndv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){

  try{

    const appoinmentOpption = client.db('doctorsPortal').collection('appoinmentOptions');
    const bookingsCollection = client.db('doctorsPortal').collection('bookings');
    const usersCollection = client.db('doctorsPortal').collection('users');

    
    // useAggregate to query multiple collection and then marge data
    app.get('/appoinmentOptions',async(req,res)=>{
      const date = req.query.date;
      const query = {};
      const options = await appoinmentOpption.find(query).toArray();
      
      //get the bookings of the provided date
      const bookingQuery = {appoinmentDate: date}
      const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
      
      //code carefully
      options.forEach(option=>{
        const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
        //kotogula book hoise
        const bookedSlots = optionBooked.map(book=>book.slot);
        //book korar por koto gula baki ase
        const remainingSlots = option.slots.filter(slot=> !bookedSlots.includes(slot));
        option.slots = remainingSlots;
        console.log(date,option.name,remainingSlots.length)
        
      })
      res.send(options);
    })

    /*
    naming convention
    app.get('/bookings')
    app.get('/bookings/:id')
    app.post('/bookings')
    app.patch('/bookings/:id')
    app.delete('/bookings/:id')
    */

    //amar bookings er history dashboard er jonno
    app.get('/bookings',async(req,res)=>{
      const email = req.query.email;
      const query = {email: email};
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    })
    
    app.post('/bookings',async (req,res)=>{
      const booking = req.body;
      // console.log(booking);
      const query = {
        appoinmentDate: booking.appoinmentDate,
        email:booking.email,
        treatment:booking.treatment
      }
      const alreadyBooked = await bookingsCollection.find(query).toArray();
    
      if(alreadyBooked.length){
        const message = `You already have a booking on ${booking.appoinmentDate}`
        return res.send({acknowledged:false, message})
      }
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    //user er track rakhar jonno
    app.post('/users',async(req,res)=>{
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })



  }
  finally{

  }

}
run().catch(console.log)


app.get('/',async(req,res)=>{
    res.send('doctors portal server is running');
})

app.listen(port,()=>console.log(`Doctors portal ${port}`));