import { Client } from '@elastic/elasticsearch';

const createElasticsearchClient = () => {
  // Check for required environment variables
  if (!process.env.ELASTIC_API_KEY) {
    throw new Error('ELASTIC_API_KEY not found in environment variables');
  }

  const client = new Client({
    node: 'https://0edbad337a9c49d68e2143ac561c535b.us-central1.gcp.cloud.es.io:443',
    auth: {
      apiKey: 'a3ItZ0FwUUJmS2NIOElBVVBqdl86bF9acTd4YkJTdzZQTnRzM05lTTMwZw=='
    },
    tls: {
      rejectUnauthorized: true
    }
  });

  return client;
};

// Export a function that tests the connection
export const testConnection = async () => {
  const client = createElasticsearchClient();
  try {
    const result = await client.ping();
    console.log('Elasticsearch Cloud connection successful:', result);
    return true;
  } catch (error) {
    console.error('Elasticsearch Cloud connection failed:', error);
    return false;
  }
};

export const elasticClient = createElasticsearchClient();