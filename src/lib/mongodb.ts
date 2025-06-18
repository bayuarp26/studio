import { MongoClient, ServerApiVersion } from 'mongodb';

// KRITIKAL UNTUK DEPLOYMENT VERCEL:
// Pastikan variabel lingkungan MONGODB_URI telah diatur dengan BENAR
// di pengaturan Environment Variables proyek Vercel Anda.
// Kegagalan mengatur ini akan menyebabkan error "Invalid/Missing environment variable: "MONGODB_URI"" saat build atau runtime.
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Format MONGODB_URI yang benar untuk MongoDB Atlas adalah:
// mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_URL>/<DATABASE_NAME>?retryWrites=true&w=majority
//
// PASTIKAN:
// 1. <USERNAME> dan <PASSWORD> sudah benar.
// 2. <PASSWORD> tidak mengandung karakter spesial seperti '<' atau '>' kecuali jika memang bagian dari password dan sudah di-URL-encode jika perlu.
// 3. <CLUSTER_URL> adalah alamat cluster Anda (contoh: cluster-porto.hpgcbuz.mongodb.net).
// 4. <DATABASE_NAME> adalah NAMA DATABASE spesifik yang ingin Anda gunakan (contoh: portofolioDB). Ini WAJIB ada di URI.
//
// Contoh URI yang lengkap:
// mongodb+srv://cloud-hoster:K50Tqrh3xG55hdUJ@cluster-porto.hpgcbuz.mongodb.net/portofolioDB?retryWrites=true&w=majority

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

// Default export adalah clientPromise yang akan digunakan di seluruh aplikasi
// untuk berinteraksi dengan database.
// Koleksi-koleksi seperti 'projects', 'skills', 'admin_users', 'profile_settings'
// akan dibuat/digunakan DI DALAM database yang telah dikonfigurasi pada MONGODB_URI.
export default clientPromise;
