let SearchService: any;

async function setupElasticsearch() {
  try {
    if (!SearchService) {
      SearchService = (await import('../app/services/SearchService')).SearchService;
    }
    const searchService = SearchService.getInstance();
    await searchService.initialize();  
    console.log('Connection successful, setting up index...');
    await searchService.setupIndex(true);
    console.log('Elasticsearch setup completed successfully');
  } catch (error) {
    console.error('Elasticsearch setup failed:', error);
    process.exit(1);
  }
}

setupElasticsearch();
