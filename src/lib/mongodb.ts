import { MongoClient, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
  // This error will be thrown if the MONGODB_URI environment variable is not set at all.
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Ensure the MONGODB_URI is in the correct format.
// For MongoDB Atlas, it typically looks like:
// mongodb+srv://<username>:<password>@<cluster-address>/<DATABASE_NAME>?retryWrites=true&w=majority
// 
// CRITICAL: The <DATABASE_NAME> part IS REQUIRED. 
// If your URI looks like "...@cluster-address.mongodb.net/" (ending with a slash),
// you MUST add your database name before any query parameters (e.g., "...@cluster-address.mongodb.net/myFirstDatabase?retryWrites=true&w=majority").
//
// The error "querySrv ENOTFOUND" often means the <cluster-address> is incorrect or not resolvable,
// or the URI is not using the 'mongodb+srv://' prefix for an Atlas SRV connection when it should.
// Also, ensure that your password in the URI does not contain special characters like '<' or '>' unless they are truly part of the password
// and are properly URL-encoded if necessary.

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
