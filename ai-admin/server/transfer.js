const mongoose = require('mongoose');

// 1. Source and Destination URIs
const DEST_URI = 'mongodb+srv://botefyankushwaghmare:Ankush%405959@botefy.twg5k.mongodb.net/aimmobile?retryWrites=true&w=majority&appName=botefy';       // Replace with your actual source DB URI
const SOURCE_URI  = 'mongodb+srv://salaar:salaar@salaar.0jzfd.mongodb.net/sms?retryWrites=true&w=majority&appName=salaar';    // Replace with your actual destination DB URI

// 2. Define Schema (Dynamic for both)
const dynamicSchema = new mongoose.Schema({}, { strict: false });

// 3. Create two separate connections
const sourceConnection = mongoose.createConnection(SOURCE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const destConnection = mongoose.createConnection(DEST_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 4. Define models for each DB
const SourcePrefix = sourceConnection.model('Prefix', dynamicSchema);
const DestPrefix = destConnection.model('Prefix', dynamicSchema);

// 5. Transfer Logic
async function transferData() {
  try {
    console.log('Fetching data from source DB...');
    const data = await SourcePrefix.find().lean();  // Read from source

    console.log(`Found ${data.length} documents. Inserting into destination DB...`);
    await DestPrefix.insertMany(data);              // Write to destination

    console.log('✅ Data transferred successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during transfer:', err);
    process.exit(1);
  }
}

// 6. Wait for connections before starting
Promise.all([
  sourceConnection.asPromise(),
  destConnection.asPromise(),
]).then(() => {
  transferData();
});
