/**
 * Airbyte-compatible Connector Catalog
 * Defines specifications, JSON Schemas, streams, and categories
 * for Sources and Destinations.
 */

const SOURCE_CATALOG = [
  // --- DATABASES ---
  {
    id: 'postgres',
    name: 'PostgreSQL',
    category: 'database',
    icon: 'Database',
    description: 'Sync tables and change data from PostgreSQL databases via WAL or standard queries.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/postgres',
    spec: {
      type: 'object',
      required: ['host', 'port', 'database', 'username'],
      properties: {
        host: { type: 'string', title: 'Host', default: 'localhost', description: 'Hostname of the database.' },
        port: { type: 'number', title: 'Port', default: 5432, description: 'Port to connect to.' },
        database: { type: 'string', title: 'Database', description: 'Name of the database.' },
        username: { type: 'string', title: 'User', description: 'Database username.' },
        password: { type: 'string', title: 'Password', isSecret: true, description: 'Database password.' },
        ssl: { type: 'boolean', title: 'SSL Connection', default: false, description: 'Encrypt connection with SSL.' }
      }
    },
    defaultStreams: ['users', 'orders', 'transactions', 'audit_logs']
  },
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    icon: 'Database',
    description: 'Replicate data from MySQL databases using binlog or standard query replication.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/mysql',
    spec: {
      type: 'object',
      required: ['host', 'port', 'database', 'username'],
      properties: {
        host: { type: 'string', title: 'Host', default: 'localhost' },
        port: { type: 'number', title: 'Port', default: 3306 },
        database: { type: 'string', title: 'Database' },
        username: { type: 'string', title: 'User' },
        password: { type: 'string', title: 'Password', isSecret: true }
      }
    },
    defaultStreams: ['customers', 'products', 'inventory', 'payments']
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    icon: 'Database',
    description: 'Extract collections and BSON documents from MongoDB replica sets.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/mongodb',
    spec: {
      type: 'object',
      required: ['connection_string', 'database'],
      properties: {
        connection_string: { type: 'string', title: 'Connection String', description: 'e.g. mongodb+srv://cluster.mongodb.net', isSecret: true },
        database: { type: 'string', title: 'Database Name' },
        auth_source: { type: 'string', title: 'Authentication Database', default: 'admin' }
      }
    },
    defaultStreams: ['accounts', 'events', 'user_sessions']
  },
  {
    id: 'sqlite',
    name: 'SQLite Database',
    category: 'database',
    icon: 'Database',
    description: 'Read tables and views from SQLite local database files.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/sqlite',
    spec: {
      type: 'object',
      required: ['db_path'],
      properties: {
        db_path: { type: 'string', title: 'Database File Path', default: './data/source.db', description: 'Path to .db or .sqlite file on disk.' }
      }
    },
    defaultStreams: ['items', 'records', 'activity']
  },
  {
    id: 'clickhouse',
    name: 'ClickHouse',
    category: 'database',
    icon: 'Database',
    description: 'Stream columnar analytics data from ClickHouse clusters.',
    releaseStage: 'beta',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/clickhouse',
    spec: {
      type: 'object',
      required: ['host', 'port', 'database', 'username'],
      properties: {
        host: { type: 'string', title: 'Host', default: 'localhost' },
        port: { type: 'number', title: 'HTTP Port', default: 8123 },
        database: { type: 'string', title: 'Database', default: 'default' },
        username: { type: 'string', title: 'Username', default: 'default' },
        password: { type: 'string', title: 'Password', isSecret: true }
      }
    },
    defaultStreams: ['web_analytics', 'clickstream_events']
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'database',
    icon: 'Database',
    description: 'Extract keys, hashes, and timeseries datasets from Redis instances.',
    releaseStage: 'beta',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/redis',
    spec: {
      type: 'object',
      required: ['host', 'port'],
      properties: {
        host: { type: 'string', title: 'Host', default: 'localhost' },
        port: { type: 'number', title: 'Port', default: 6379 },
        password: { type: 'string', title: 'Password', isSecret: true },
        database: { type: 'number', title: 'DB Index', default: 0 }
      }
    },
    defaultStreams: ['cached_keys', 'session_data']
  },

  // --- CLOUD APIS & SAAS ---
  {
    id: 'github',
    name: 'GitHub',
    category: 'api',
    icon: 'GitBranch',
    description: 'Sync repositories, commits, pull requests, issues, and stargazers.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/github',
    spec: {
      type: 'object',
      required: ['repository', 'access_token'],
      properties: {
        repository: { type: 'string', title: 'Repository', description: 'owner/repo, e.g. airbytehq/airbyte' },
        access_token: { type: 'string', title: 'Personal Access Token', isSecret: true, description: 'GitHub fine-grained or classic token.' },
        branch: { type: 'string', title: 'Target Branch', default: 'main' }
      }
    },
    defaultStreams: ['repositories', 'commits', 'pull_requests', 'issues', 'stargazers']
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'api',
    icon: 'CreditCard',
    description: 'Sync payment charges, customer accounts, subscriptions, and invoices.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/stripe',
    spec: {
      type: 'object',
      required: ['api_key'],
      properties: {
        api_key: { type: 'string', title: 'Secret API Key', isSecret: true, description: 'Starts with sk_live_ or sk_test_' },
        account_id: { type: 'string', title: 'Connected Account ID (Optional)' },
        start_date: { type: 'string', title: 'Start Date (UTC)', default: '2024-01-01T00:00:00Z' }
      }
    },
    defaultStreams: ['charges', 'customers', 'invoices', 'subscriptions', 'refunds']
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'api',
    icon: 'ShoppingBag',
    description: 'Extract storefront orders, products, customers, and fulfillment records.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/shopify',
    spec: {
      type: 'object',
      required: ['shop_domain', 'api_password'],
      properties: {
        shop_domain: { type: 'string', title: 'Shop Domain', description: 'your-store.myshopify.com' },
        api_password: { type: 'string', title: 'Admin API Access Token', isSecret: true },
        start_date: { type: 'string', title: 'Start Date', default: '2024-01-01T00:00:00Z' }
      }
    },
    defaultStreams: ['orders', 'products', 'customers', 'inventory_levels', 'draft_orders']
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'api',
    icon: 'Users',
    description: 'Sync CRM standard and custom objects: Leads, Contacts, Accounts, and Deals.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/salesforce',
    spec: {
      type: 'object',
      required: ['client_id', 'client_secret', 'refresh_token'],
      properties: {
        is_sandbox: { type: 'boolean', title: 'Sandbox Environment', default: false },
        client_id: { type: 'string', title: 'Connected App Consumer Key' },
        client_secret: { type: 'string', title: 'Consumer Secret', isSecret: true },
        refresh_token: { type: 'string', title: 'OAuth Refresh Token', isSecret: true }
      }
    },
    defaultStreams: ['leads', 'contacts', 'accounts', 'opportunities']
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'api',
    icon: 'Building',
    description: 'Extract marketing contacts, companies, deals, tickets, and email campaigns.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/hubspot',
    spec: {
      type: 'object',
      required: ['access_token'],
      properties: {
        access_token: { type: 'string', title: 'Private App Access Token', isSecret: true },
        start_date: { type: 'string', title: 'Start Date', default: '2024-01-01T00:00:00Z' }
      }
    },
    defaultStreams: ['contacts', 'companies', 'deals', 'marketing_campaigns']
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'api',
    icon: 'MessageSquare',
    description: 'Export public and private channel messages, reactions, threads, and user logs.',
    releaseStage: 'beta',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/slack',
    spec: {
      type: 'object',
      required: ['api_token'],
      properties: {
        api_token: { type: 'string', title: 'Bot or User OAuth Token (xoxb- or xoxp-)', isSecret: true },
        channel_filter: { type: 'string', title: 'Channel Filter (comma separated)', default: 'general,random' }
      }
    },
    defaultStreams: ['channels', 'messages', 'users', 'channel_members']
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'api',
    icon: 'CheckSquare',
    description: 'Extract issues, epics, sprint boards, workflows, and changelogs.',
    releaseStage: 'beta',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/jira',
    spec: {
      type: 'object',
      required: ['domain', 'email', 'api_token'],
      properties: {
        domain: { type: 'string', title: 'Jira Domain', description: 'your-company.atlassian.net' },
        email: { type: 'string', title: 'Account Email' },
        api_token: { type: 'string', title: 'API Token', isSecret: true }
      }
    },
    defaultStreams: ['issues', 'projects', 'sprints', 'worklogs']
  },

  // --- FILES & OBJECT STORAGE ---
  {
    id: 'csv',
    name: 'Local CSV / TSV File',
    category: 'file',
    icon: 'FileText',
    description: 'Ingest and stream local comma or tab delimited tabular files.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/file',
    spec: {
      type: 'object',
      required: ['file_path'],
      properties: {
        file_path: { type: 'string', title: 'File Path', description: 'Path to CSV file on server.', default: './data/sample.csv' },
        delimiter: { type: 'string', title: 'Delimiter', default: ',' }
      }
    },
    defaultStreams: ['csv_records']
  },
  {
    id: 'jsonl',
    name: 'Local JSONL / JSON File',
    category: 'file',
    icon: 'FileCode',
    description: 'Stream newline-delimited JSON or document trees.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/file',
    spec: {
      type: 'object',
      required: ['file_path'],
      properties: {
        file_path: { type: 'string', title: 'File Path', default: './data/records.jsonl' }
      }
    },
    defaultStreams: ['json_documents']
  },
  {
    id: 's3',
    name: 'AWS S3 File Storage',
    category: 'file',
    icon: 'Cloud',
    description: 'Read Parquet, CSV, and JSON files from Amazon S3 buckets.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/s3',
    spec: {
      type: 'object',
      required: ['bucket', 'aws_access_key_id', 'aws_secret_access_key'],
      properties: {
        bucket: { type: 'string', title: 'Bucket Name' },
        path_prefix: { type: 'string', title: 'Path Prefix / Folder', default: 'raw/' },
        aws_region: { type: 'string', title: 'AWS Region', default: 'us-east-1' },
        aws_access_key_id: { type: 'string', title: 'Access Key ID' },
        aws_secret_access_key: { type: 'string', title: 'Secret Access Key', isSecret: true }
      }
    },
    defaultStreams: ['s3_objects']
  },
  {
    id: 'gcs',
    name: 'Google Cloud Storage',
    category: 'file',
    icon: 'CloudRain',
    description: 'Stream datasets and archives from Google Cloud Storage buckets.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/gcs',
    spec: {
      type: 'object',
      required: ['bucket_name', 'credentials_json'],
      properties: {
        bucket_name: { type: 'string', title: 'GCS Bucket Name' },
        credentials_json: { type: 'string', title: 'Service Account JSON Key', isSecret: true }
      }
    },
    defaultStreams: ['gcs_blobs']
  },

  // --- SAMPLE / BUILT-IN GENERATOR ---
  {
    id: 'demo',
    name: 'Airbyte Sample E-Commerce',
    category: 'sample',
    icon: 'Sparkles',
    description: 'Zero-configuration test source generating live users, orders, products, and reviews.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/faker',
    spec: {
      type: 'object',
      properties: {
        seed: { type: 'number', title: 'Random Seed', default: 42 },
        record_count: { type: 'number', title: 'Record Count per Batch', default: 50 }
      }
    },
    defaultStreams: ['demo_users', 'demo_orders', 'demo_products', 'demo_reviews']
  }
];

const DESTINATION_CATALOG = [
  // --- WAREHOUSES ---
  {
    id: 'sqlite_warehouse',
    name: 'SQLite Data Warehouse',
    category: 'warehouse',
    icon: 'Database',
    description: 'Embedded SQL warehouse that automatically generates schemas, indexes, and tables.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/destinations/sqlite',
    spec: {
      type: 'object',
      required: ['dbPath'],
      properties: {
        dbPath: { type: 'string', title: 'Warehouse Database Path', default: './data/warehouse.db' },
        table_prefix: { type: 'string', title: 'Raw Table Prefix', default: 'airbyte_raw_' }
      }
    }
  },
  {
    id: 'duckdb',
    name: 'DuckDB Analytical Warehouse',
    category: 'warehouse',
    icon: 'Layers',
    description: 'High-speed columnar OLAP database for real-time analytics and Parquet export.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/destinations/duckdb',
    spec: {
      type: 'object',
      required: ['dbPath'],
      properties: {
        dbPath: { type: 'string', title: 'DuckDB Database Path', default: './data/analytics.duckdb' }
      }
    }
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    category: 'warehouse',
    icon: 'Snowflake',
    description: 'Load structured and semi-structured VARIANT data into Snowflake data cloud.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/destinations/snowflake',
    spec: {
      type: 'object',
      required: ['account', 'username', 'password', 'database', 'schema', 'warehouse'],
      properties: {
        account: { type: 'string', title: 'Account Identifier', description: 'xy12345.us-east-1' },
        warehouse: { type: 'string', title: 'Warehouse Name', default: 'COMPUTE_WH' },
        database: { type: 'string', title: 'Database' },
        schema: { type: 'string', title: 'Schema', default: 'PUBLIC' },
        username: { type: 'string', title: 'Username' },
        password: { type: 'string', title: 'Password', isSecret: true }
      }
    }
  },
  {
    id: 'bigquery',
    name: 'Google BigQuery',
    category: 'warehouse',
    icon: 'Server',
    description: 'Direct streaming and batch loads into Google BigQuery datasets.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/destinations/bigquery',
    spec: {
      type: 'object',
      required: ['project_id', 'dataset_id', 'credentials_json'],
      properties: {
        project_id: { type: 'string', title: 'GCP Project ID' },
        dataset_id: { type: 'string', title: 'BigQuery Dataset ID', default: 'airbyte_dataset' },
        credentials_json: { type: 'string', title: 'Service Account Key (JSON)', isSecret: true }
      }
    }
  },
  {
    id: 'postgres_dest',
    name: 'PostgreSQL Warehouse',
    category: 'warehouse',
    icon: 'Database',
    description: 'Replicate streams into normalized PostgreSQL relational tables.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/destinations/postgres',
    spec: {
      type: 'object',
      required: ['host', 'port', 'database', 'username'],
      properties: {
        host: { type: 'string', title: 'Host', default: 'localhost' },
        port: { type: 'number', title: 'Port', default: 5432 },
        database: { type: 'string', title: 'Database' },
        schema: { type: 'string', title: 'Schema', default: 'public' },
        username: { type: 'string', title: 'Username' },
        password: { type: 'string', title: 'Password', isSecret: true }
      }
    }
  },

  // --- FILE STORAGE ---
  {
    id: 'local_file',
    name: 'Local File Archive',
    category: 'file',
    icon: 'HardDrive',
    description: 'Store synced stream records as JSONL, CSV, or Parquet archives partitioned by sync ID.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/destinations/local-json',
    spec: {
      type: 'object',
      required: ['outputDir'],
      properties: {
        outputDir: { type: 'string', title: 'Output Directory', default: './data/syncs' },
        format: { type: 'string', title: 'Format', enum: ['jsonl', 'csv'], default: 'jsonl' }
      }
    }
  },
  {
    id: 's3_dest',
    name: 'AWS S3 Bucket',
    category: 'file',
    icon: 'Cloud',
    description: 'Stream records directly into an Amazon S3 data lake.',
    releaseStage: 'generally_available',
    documentationUrl: 'https://docs.airbyte.com/integrations/destinations/s3',
    spec: {
      type: 'object',
      required: ['bucket', 'aws_access_key_id', 'aws_secret_access_key'],
      properties: {
        bucket: { type: 'string', title: 'S3 Bucket Name' },
        prefix: { type: 'string', title: 'Key Prefix', default: 'airbyte_data/' },
        region: { type: 'string', title: 'AWS Region', default: 'us-east-1' },
        aws_access_key_id: { type: 'string', title: 'Access Key ID' },
        aws_secret_access_key: { type: 'string', title: 'Secret Access Key', isSecret: true }
      }
    }
  },

  // --- AI & VECTOR DATABASES ---
  {
    id: 'pinecone',
    name: 'Pinecone Vector Database',
    category: 'vector',
    icon: 'Zap',
    description: 'Generate embeddings and insert vectorized stream records into Pinecone indexes.',
    releaseStage: 'beta',
    documentationUrl: 'https://docs.airbyte.com/integrations/destinations/pinecone',
    spec: {
      type: 'object',
      required: ['api_key', 'index_name'],
      properties: {
        api_key: { type: 'string', title: 'Pinecone API Key', isSecret: true },
        environment: { type: 'string', title: 'Environment', default: 'us-east-1-aws' },
        index_name: { type: 'string', title: 'Index Name' }
      }
    }
  },
  {
    id: 'chroma',
    name: 'Chroma Vector Store',
    category: 'vector',
    icon: 'Box',
    description: 'Embed and index records directly into an open-source Chroma collection.',
    releaseStage: 'beta',
    documentationUrl: 'https://docs.airbyte.com/integrations/destinations/chroma',
    spec: {
      type: 'object',
      required: ['collection_name'],
      properties: {
        server_url: { type: 'string', title: 'Chroma Server URL', default: 'http://localhost:8000' },
        collection_name: { type: 'string', title: 'Collection Name', default: 'airbyte_embeddings' }
      }
    }
  }
];

module.exports = {
  SOURCE_CATALOG,
  DESTINATION_CATALOG,
  getSourceSpec: (id) => SOURCE_CATALOG.find(c => c.id === id),
  getDestinationSpec: (id) => DESTINATION_CATALOG.find(c => c.id === id)
};
