import { Client } from '@elastic/elasticsearch';


const ELASTIC_CLOUD_ID = process.env.ELASTIC_CLOUD_ID || '';
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY || '';

if (!ELASTIC_CLOUD_ID || !ELASTIC_API_KEY) {
  throw new Error('Elasticsearch Cloud credentials are not configured');
}

export const elasticClient = new Client({
  cloud: {
    id: ELASTIC_CLOUD_ID
  },
  auth: {
    apiKey: ELASTIC_API_KEY
  }
});

export async function testConnection() {
  try {
    const health = await elasticClient.cluster.health();
    console.log('Elasticsearch health status:', health.status);
    return true;
  } catch (error) {
    console.error('Elasticsearch connection failed:', error);
    return false;
  }
}