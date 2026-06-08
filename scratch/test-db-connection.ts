import { Client } from 'pg';

async function test() {
  console.log("Connecting with localhost...");
  const clientLocalhost = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/vertiaccess"
  });
  try {
    await clientLocalhost.connect();
    console.log("Connected to localhost successfully!");
    await clientLocalhost.end();
  } catch (err) {
    console.error("Failed to connect to localhost:", err);
  }

  console.log("Connecting with 127.0.0.1...");
  const clientIP = new Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/vertiaccess"
  });
  try {
    await clientIP.connect();
    console.log("Connected to 127.0.0.1 successfully!");
    await clientIP.end();
  } catch (err) {
    console.error("Failed to connect to 127.0.0.1:", err);
  }
}

test();
