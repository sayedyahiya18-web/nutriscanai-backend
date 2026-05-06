require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/product', productRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('NutriScan AI Backend is Running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
