// filepath: d:\Programme\car-rental-app\server\seed.js
require('dotenv').config();
const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: String,
  type: String,
  description: String,
  price: Number,
  image: String,
  availableDates: [Date]
});
const Car = mongoose.model('Car', carSchema);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    await Car.insertMany([
  {
    name: 'Toyota Yaris',
    type: 'small',
    description: 'Compact and efficient, perfect for city driving',
    price: 35,
    image: 'https://example.com/yaris.jpg',
    availableDates: [
      new Date('2023-06-01'),
      new Date('2023-06-02'),
      new Date('2023-06-05')
    ]
  },
  {
    name: 'Honda CR-V',
    type: 'SUV',
    description: 'Spacious SUV for family trips',
    price: 65,
    image: 'https://example.com/crv.jpg',
    availableDates: [
      new Date('2023-06-03'),
      new Date('2023-06-04'),
      new Date('2023-06-07')
    ]
  },
  {
    name: 'BMW 5 Series',
    type: 'luxury',
    description: 'Premium sedan for business travel',
    price: 95,
    image: 'https://example.com/bmw5.jpg',
    availableDates: [
      new Date('2023-06-06'),
      new Date('2023-06-08'),
      new Date('2023-06-10')
    ]
  }
]);
    console.log("Seed data inserted!");
    mongoose.disconnect();
  })
  .catch(err => console.log(err));