import { MongoClient, ServerApiVersion } from 'mongodb';

// This is the critical environment variable that needs to be set.
// For Vercel deployment, ensure MONGODB_URI is added to your project's
// Environment Variables in the Vercel dashboard settings.
if (!process.env.MONGODB_URI) {
  // This error will be thrown if the MONGODB_URI environment variable is not set at all.
  // This is the error you are seeing on Vercel: "Invalid/Missing environment variable: "MONGODB_URI""
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Ensure the MONGODB_URI is in the correct format.
// For MongoDB Atlas, it typically looks like:
// mongodb+srv://<username>:<password>@<cluster-address>/<DATABASE_NAME>?retryWrites=true&w=majority
//
// CRITICAL: The <DATABASE_NAME> part IS REQUIRED in the URI.
// If your URI (from .env.local or Vercel Environment Variables) looks like "...@cluster-address.mongodb.net/"
// (ending with a slash WITHOUT a database name), you MUST add your database name before any query parameters.
// For example, if your URI is: mongodb+srv://user:pass@cluster.mongodb.net/
// And your database is 'myAppDB', it should become: mongodb+srv://user:pass@cluster.mongodb.net/myAppDB?retryWrites=true&w=majority
//
// Also, ensure that your password in the URI does not contain special characters like '<' or '>'
// unless they are truly part of the password and are properly URL-encoded if necessary.
// Example: If password is 'my<pass>word', the '<' and '>' might need encoding or removal if not part of the actual password.

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
  // In production mode (like on Vercel), it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
