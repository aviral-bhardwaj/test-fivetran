Absolutely. If your goal is to build a **Fivetran/Airbyte-like data integration platform**, I would not start by thinking "how do I build 200 connectors?" I would start by designing the **platform primitives** that make every connector behave the same way.

Think of the system as:

> **Control Plane + Data Plane + Connector SDK + Metadata/State + Orchestration + Destination Engine + Observability + Security**

Once those foundations are right, adding PostgreSQL, MySQL, Salesforce, HubSpot, S3, APIs, etc. becomes mostly connector-specific work rather than reinventing the platform each time.

![Image](https://images.openai.com/static-rsc-4/joK0M98xeMhIb7GFMyb4lh3nKrDSBw8XRPAWPtG4HHNbAijFDZwp4oxAO-VryvwDrv8wgSh9B8U3Bf3giJYl0J8VUiCsMWLiiMaXY_lcq1kGLcnjBh0dPmJpxSUVY13kyyJ2_maiTj6UjCKnF1kwh72TE2hUq5zxAX-jflPi8f7vTcpzHPfNmONFNEpkCHC5?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/EfnKj4f-JKQHvKi_BSoivBjS1lzV4zbMwT-U2GYOO0yzdWgqPIgHkoG3hL__H1AxMtIcvTB-Z-Zgas9IJzKZ34RLkmUxxbifE2AO_D4Fl65MtQKKnzvuRmoFNZG7jWYR0sZuOcT6CVI050vUIjOk_lpVGntlMWOcjaaXWZlEx5xYe6Fnu-0cZsU8-P15qY-v?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/lzg1Xa5cYYSyhHD5lEVvud4_iBXYvQiCzTXSo0NMZFXVzsVjjvIq9hiv3qSadRP6IboOtUlD2ZiRV02ooovtGxhpz_mFzzwPS6qUhM19S16J0_Ci6LPEnuiZQo3ako1d62LfgkzfQ2-s74kbzw6OJLAPngx717yxbsGAZNIJNswgwu937usHmLqpE61LPfNZ?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/pXCFdHJeLJOEhmoomD9A4gXD9zmf8wqfg9UvLxUBOuxbiza6aWgrk6YUAT5295nSAs0Vod-ReoAyhbDlBDRWr2VMthIyCzl5D4Am2utGmkqnF0-YadJd22nrofiDlUP91gNfmW1NfBTejAADc1ZQPtfHGgoDSPFAotq9H_SKhZsnwFYQtmrOw56nkGURyFRA?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/9cZGNyTJz0-Or1wl7frqMIY_ERO7-V6H_THuer-Q-1Xe3Ne0Mp45S4_EJpOs1HlW8K43bzJY8-IbJTH21__N--dijmtQb5BygUtqWn31BZaWLlhJLd3AzyOVlnDybU1Z48-1hX9CWx3zsMkdvRWRKmNU3zEKiwC10FDEgAhazEIWT4cBuxIvTIVNVtxRrrOu?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/5C5s35EKcR1qBDpYXgShZMUuWij6rUv01yuLxk9YC8P3UyhkkdKF-KSQ8DbogLVWlpvgoI_gn27EaqBEZDeJfI1A-B2Tn08Ugusd_oI-QUS4KMoUTclKAPCdoKwYbcH79XxcfLQ0a1Lo7e-hm-qr4tvJjPR1KzdAhsxjz5hPtw1DZbup8ze3n_i5UrmyDRoj?purpose=fullsize)

Below is how I would architect it if I were designing it from scratch for a serious production system.

---

# 1. First understand what you are actually building

A Fivetran/Airbyte-like product isn't simply:

```text
Source → ETL → Destination
```

It is closer to:

```text
                    ┌──────────────────────────────┐
                    │         CONTROL PLANE        │
                    │                              │
                    │ UI / API                     │
                    │ Users / Tenants              │
                    │ Connection Management        │
                    │ Scheduler                    │
                    │ Job Management                │
                    │ Metadata                     │
                    │ Schema Management             │
                    │ Billing / Quotas             │
                    └──────────────┬───────────────┘
                                   │
                              schedules jobs
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │          DATA PLANE           │
                    │                              │
                    │ Connector Workers             │
                    │ Extraction                   │
                    │ Normalization                 │
                    │ Transformation               │
                    │ Destination Loading           │
                    └──────────────┬───────────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             ▼                     ▼                     ▼
        PostgreSQL             Salesforce              APIs
        MySQL                  HubSpot                 S3
        MongoDB                Stripe                  Kafka
             │                     │                     │
             └─────────────────────┼─────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │       DESTINATIONS            │
                    │                              │
                    │ Snowflake                   │
                    │ BigQuery                    │
                    │ Redshift                    │
                    │ Databricks                  │
                    │ PostgreSQL                   │
                    │ S3                           │
                    └──────────────────────────────┘
```

But even this is still too simplified.

The important architectural distinction is:

### Control Plane

Controls **what should happen**.

### Data Plane

Actually **moves the data**.

That separation is one of the most important decisions you'll make.

---

# 2. The architecture I recommend

Here's the production architecture I'd target.

```text
                           USERS
                             │
                             ▼
                    ┌─────────────────┐
                    │    Web UI       │
                    │ React / Next.js │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   API Gateway   │
                    │ Auth / RateLimit│
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
       Connection       Organization      User/Auth
        Service           Service          Service
            │                │                │
            └────────────────┼────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Metadata Service  │
                  │                     │
                  │ Connections         │
                  │ Schemas             │
                  │ Streams              │
                  │ Sync State          │
                  │ Job State            │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │    Orchestrator     │
                  │                     │
                  │ Scheduler           │
                  │ Job Manager         │
                  │ Retry Manager       │
                  │ Backoff             │
                  │ Dependency Manager  │
                  └──────────┬──────────┘
                             │
                             ▼
                     ┌──────────────┐
                     │ Message Queue│
                     │ Kafka/SQS    │
                     │ RabbitMQ     │
                     └──────┬───────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
              ▼             ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Worker 1 │  │ Worker 2 │  │ Worker N │
        │          │  │          │  │          │
        │Postgres  │  │Salesforce│  │  MySQL   │
        │Connector │  │Connector │  │Connector │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │             │              │
             └─────────────┼──────────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │  Data Processing   │
                 │                    │
                 │ Normalize          │
                 │ Validate           │
                 │ Transform          │
                 │ Schema Evolution   │
                 └──────────┬─────────┘
                            │
                            ▼
                 ┌────────────────────┐
                 │ Destination Engine │
                 │                    │
                 │ Batch Writer       │
                 │ Streaming Writer   │
                 │ Merge/Upsert       │
                 │ Schema Manager     │
                 └──────────┬─────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
      Snowflake          BigQuery         Databricks
```

And underneath everything:

```text
┌──────────────────────────────────────────────────────────────┐
│                       PLATFORM INFRA                         │
│                                                              │
│ PostgreSQL       Redis       Object Storage       Kafka       │
│ Secrets Manager  Kubernetes  Container Registry              │
│ Prometheus       Grafana     OpenTelemetry                    │
│ Elasticsearch    AlertManager                                 │
└──────────────────────────────────────────────────────────────┘
```

---

# 3. The most important architectural concept: Control Plane vs Data Plane

This is where I would spend serious design time.

## Control Plane

The control plane contains relatively small amounts of data.

Examples:

```text
Tenant
User
Connection
Connector
Destination
Schedule
Sync configuration
Schema
Job
Job attempt
Cursor
State
Billing
Quota
```

For example:

```text
Tenant
   │
   ├── User
   │
   ├── Connection
   │       │
   │       ├── Source
   │       └── Destination
   │
   ├── Schedule
   │
   └── Sync Jobs
```

Control plane database:

```text
PostgreSQL
```

is perfectly reasonable initially.

---

# 4. Data Plane

The data plane is where potentially **billions of rows** move.

For example:

```text
Salesforce
     │
     │ 1 million records
     ▼
Connector Worker
     │
     ▼
Extract
     │
     ▼
Normalize
     │
     ▼
Buffer
     │
     ▼
Destination Writer
     │
     ▼
Snowflake
```

You absolutely do **not** want the API server handling those records.

Bad architecture:

```text
API
 │
 ├── Connect Salesforce
 ├── Download 10GB
 ├── Transform
 └── Write Snowflake
```

Good architecture:

```text
API
 │
 └── create_sync_job()
          │
          ▼
       Queue
          │
          ▼
       Worker
          │
          ├── Extract
          ├── Process
          └── Load
```

The API becomes lightweight and horizontally scalable.

---

# 5. Your first major services

I would initially create roughly these services.

```text
1. API Gateway
2. Auth Service
3. Organization/Tenant Service
4. Connection Service
5. Connector Catalog
6. Metadata Service
7. Scheduler
8. Job Service
9. Worker Manager
10. Connector Runtime
11. Schema Service
12. State Service
13. Destination Service
14. Secrets Service
15. Monitoring Service
16. Billing/Usage Service
```

But here's an important architecture lesson:

**Do not immediately deploy all 16 as microservices.**

For your first version, I would use a **modular monolith for the control plane**.

Something like:

```text
backend/
│
├── auth/
├── organizations/
├── connections/
├── connectors/
├── destinations/
├── jobs/
├── schedules/
├── schemas/
├── metadata/
├── billing/
└── api/
```

Then:

```text
Worker Runtime
```

is separated from day one.

So:

```text
              Control Plane
                   │
             Modular Monolith
                   │
              PostgreSQL
                   │
                 Queue
                   │
                   ▼
              Worker Plane
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
   Worker       Worker       Worker
```

This is much easier to build.

Later:

```text
Connection Service
Metadata Service
Job Service
Schema Service
```

can become independent services.

---

# 6. The Connector is the heart of the product

This is probably the single most important abstraction.

You need a standard connector interface.

For example:

```python
class SourceConnector:

    def validate_connection(self):
        pass

    def discover_schema(self):
        pass

    def get_streams(self):
        pass

    def get_initial_state(self):
        pass

    def read(self, stream, state):
        pass

    def get_incremental_state(self):
        pass
```

A destination:

```python
class DestinationConnector:

    def validate_connection(self):
        pass

    def create_schema(self):
        pass

    def create_table(self):
        pass

    def write(self, records):
        pass

    def merge(self, records):
        pass

    def alter_table(self):
        pass
```

Then every connector follows the same contract.

---

# 7. Connector architecture

Imagine PostgreSQL.

Your platform shouldn't know the details of PostgreSQL.

Instead:

```text
Connector SDK
      │
      ▼
PostgreSQL Connector
      │
      ├── connect()
      ├── discover()
      ├── snapshot()
      ├── incremental()
      ├── CDC()
      └── state()
```

Salesforce:

```text
Connector SDK
      │
      ▼
Salesforce Connector
      │
      ├── OAuth
      ├── discover()
      ├── API pagination
      ├── incremental()
      └── state()
```

HubSpot:

```text
Connector SDK
      │
      ▼
HubSpot Connector
      │
      ├── OAuth
      ├── API calls
      ├── rate limiting
      ├── pagination
      └── state
```

The platform doesn't care.

That's the magic.

---

# 8. Connector SDK

I'd build an SDK that every connector implements.

Something like:

```text
Connector SDK
│
├── SourceConnector
│
├── DestinationConnector
│
├── Stream
│
├── Record
│
├── Schema
│
├── State
│
├── Checkpoint
│
├── RateLimiter
│
├── RetryPolicy
│
├── Logger
│
└── Metrics
```

Example:

```python
class Stream:

    name: str

    schema: Schema

    cursor_field: str

    primary_key: list[str]

    supports_incremental: bool

    supports_cdc: bool
```

Now:

```text
Postgres users
Postgres orders
Postgres products
```

become streams.

---

# 9. What actually happens when a user creates a connection?

This is where the architecture starts becoming interesting.

User opens UI.

```text
UI
 │
 ▼
POST /connections
 │
 ▼
API
 │
 ▼
Connection Service
 │
 ├── validate tenant
 ├── validate connector
 ├── encrypt credentials
 ├── save configuration
 └── create connection
```

Database:

```text
connections

id
tenant_id
source_type
name
configuration
status
created_at
updated_at
```

Credentials should **not** be stored as plain JSON.

Instead:

```text
Connection
     │
     └── secret_ref
             │
             ▼
        Secrets Manager
```

Examples:

```text
AWS Secrets Manager
Hashicorp Vault
GCP Secret Manager
Azure Key Vault
```

---

# 10. Connection testing

User presses:

> Test Connection

Architecture:

```text
UI
 │
 ▼
API
 │
 ▼
Job
 │
 ▼
Queue
 │
 ▼
Connector Worker
 │
 ▼
Source
```

Worker:

```text
load secret
     │
connect
     │
authenticate
     │
discover basic metadata
     │
return result
```

Result:

```json
{
  "status": "success",
  "latency_ms": 238,
  "message": "Connection successful"
}
```

---

# 11. Schema discovery

After connection succeeds:

```text
POST /connections/{id}/discover
```

Worker runs:

```text
Connector
    │
    ▼
discover()
    │
    ▼
Streams
    │
    ├── users
    ├── orders
    ├── products
    └── payments
```

For PostgreSQL:

```text
information_schema
pg_catalog
```

might produce:

```text
users
 ├── id BIGINT
 ├── name VARCHAR
 ├── email VARCHAR
 └── created_at TIMESTAMP
```

Store this in metadata.

---

# 12. Metadata database

This is extremely important.

I'd have entities like:

```text
tenants
users
connections
destinations
syncs
streams
schemas
jobs
job_attempts
states
checkpoints
events
usage
```

Conceptually:

```text
Connection
     │
     └── Sync
           │
           ├── Stream
           │     │
           │     ├── Schema
           │     └── State
           │
           └── Destination
```

---

# 13. Sync is your core domain object

Think of a **Sync** as:

> Move data from source A to destination B using configuration C.

Example:

```text
Sync ID: 123

Source:
PostgreSQL

Destination:
Snowflake

Streams:
users
orders
products

Mode:
Incremental

Frequency:
Every 15 minutes
```

Database:

```text
syncs

id
connection_id
destination_id
status
schedule
sync_mode
created_at
```

Then:

```text
sync_streams

sync_id
stream_id
enabled
cursor_field
cursor_value
primary_key
destination_table
```

---

# 14. Scheduling

Suppose user says:

> Sync every 30 minutes.

Scheduler stores:

```text
sync_id = 123
cron = */30 * * * *
```

Scheduler periodically asks:

```text
What jobs should run?
```

Then:

```text
Scheduler
    │
    ▼
Sync #123 due
    │
    ▼
Create Job
    │
    ▼
Queue
```

Do **not** let the scheduler itself perform the data movement.

It only creates work.

---

# 15. Job architecture

A job might look like:

```text
Job
│
├── id
├── sync_id
├── status
├── started_at
├── finished_at
├── attempt
├── records_read
├── records_written
├── bytes_read
└── error
```

Lifecycle:

```text
PENDING
   ↓
QUEUED
   ↓
RUNNING
   ↓
SUCCESS
```

or:

```text
RUNNING
   ↓
FAILED
   ↓
RETRY
   ↓
RUNNING
```

---

# 16. Queue

The queue is the traffic controller.

You could use:

```text
Kafka
AWS SQS
Google Pub/Sub
RabbitMQ
Redis Streams
```

For an MVP:

```text
Redis / RabbitMQ
```

is easier.

At scale:

```text
Kafka
```

becomes attractive for event-heavy architectures.

But don't automatically choose Kafka because "big data = Kafka."

You may not need it initially.

---

# 17. Worker architecture

Worker receives:

```json
{
  "job_id": "123",
  "sync_id": "456"
}
```

Worker loads configuration.

```text
Worker
 │
 ├── Load Sync
 ├── Load Connector
 ├── Load State
 ├── Load Schema
 └── Load Destination
```

Then:

```text
SOURCE
   │
   ▼
EXTRACT
   │
   ▼
BUFFER
   │
   ▼
NORMALIZE
   │
   ▼
LOAD
   │
   ▼
CHECKPOINT
```

---

# 18. Full sync

Suppose:

```text
Postgres
10 million rows
```

First synchronization:

```text
SELECT *
FROM users;
```

But never blindly load all 10 million records into RAM.

Instead:

```text
DB
 │
 ▼
cursor
 │
 ▼
batch 1 → 10,000 rows
batch 2 → 10,000
batch 3 → 10,000
...
```

Architecture:

```text
               PostgreSQL
                    │
             server-side cursor
                    │
                    ▼
               Batch Reader
                    │
             ┌──────┴──────┐
             ▼             ▼
         Batch 1        Batch 2
             │             │
             └──────┬──────┘
                    ▼
               Processing
                    │
                    ▼
               Destination
```

---

# 19. Incremental sync

This is where things become much more interesting.

Suppose:

```text
users
```

has:

```text
id
name
updated_at
```

Initial state:

```text
cursor = NULL
```

After first sync:

```text
cursor = 2026-09-10T08:55:31
```

Next query:

```sql
SELECT *
FROM users
WHERE updated_at > :cursor
ORDER BY updated_at;
```

Then update:

```text
cursor = 2026-09-10T09:19:47
```

This state must be persisted.

---

# 20. Never keep state only in the worker

Bad:

```text
Worker memory
    │
    └── cursor = 123
```

Worker crashes.

Cursor disappears.

You duplicate or lose data.

Instead:

```text
Worker
  │
  ▼
State Service
  │
  ▼
PostgreSQL / durable state store
```

Example:

```text
stream_state

sync_id
stream_id
cursor
snapshot_complete
version
updated_at
```

---

# 21. The harder problem: exactly-once

This is one of the biggest traps.

People say:

> I'll build exactly-once.

Be careful.

Across arbitrary source and destination systems, true distributed exactly-once semantics are extremely difficult.

Your practical goal should generally be:

> **At-least-once extraction + idempotent destination writes + durable checkpoints**

Then you get effectively reliable synchronization.

---

# 22. Example failure

Imagine:

```text
Read rows 1-1000
       ↓
Write destination
       ↓
Destination succeeds
       ↓
Worker crashes
       ↓
Checkpoint wasn't saved
```

Next execution reads:

```text
1-1000
```

again.

If destination does:

```sql
INSERT
```

you get duplicates.

Instead:

```text
staging table
     ↓
MERGE
     ↓
destination
```

using primary key.

Example:

```sql
MERGE INTO target t
USING staging s
ON t.id = s.id

WHEN MATCHED THEN
    UPDATE ...

WHEN NOT MATCHED THEN
    INSERT ...
```

Now replay is safe.

---

# 23. Destination architecture

You should create destination adapters.

```text
Destination SDK
│
├── Snowflake
├── BigQuery
├── Redshift
├── Databricks
├── PostgreSQL
├── MySQL
└── S3
```

Every destination implements:

```text
connect()
create_schema()
create_table()
alter_table()
write_batch()
merge()
commit()
```

---

# 24. Staging is extremely useful

Instead of:

```text
Worker
   ↓
Production table
```

use:

```text
Worker
   ↓
Staging
   ↓
Validation
   ↓
MERGE
   ↓
Production
```

For example:

```text
Snowflake

raw_sync_123_users
         │
         ▼
       MERGE
         │
         ▼
users
```

This gives you:

* replay
* idempotency
* debugging
* partial recovery
* better performance
* easier schema evolution

---

# 25. Data format

Internally, don't tie everything to JSON.

JSON is useful for APIs but inefficient for high-volume data.

I'd consider:

```text
Internal record representation
        ↓
Arrow
        ↓
Parquet
```

or a well-defined streaming record format.

For example:

```text
Record
{
    stream_id,
    namespace,
    key,
    data,
    emitted_at,
    source_cursor
}
```

---

# 26. Object storage

Object storage becomes your friend.

```text
S3
│
├── raw/
│
├── staging/
│
├── failed/
│
├── checkpoints/
│
└── logs/
```

Example:

```text
s3://platform-data/
    tenant-123/
        sync-456/
            job-789/
                users/
                    part-0001.parquet
                    part-0002.parquet
```

This lets workers avoid keeping massive datasets in memory.

---

# 27. CDC

Now we reach the advanced part.

Incremental polling isn't enough for serious database replication.

You eventually want:

> **Change Data Capture**

For PostgreSQL:

```text
Postgres WAL
   │
   ▼
Replication Slot
   │
   ▼
CDC Reader
   │
   ▼
Change Events
```

Example:

```json
{
  "op": "UPDATE",
  "table": "users",
  "primary_key": 123,
  "before": {...},
  "after": {...},
  "lsn": "0/16B6C50"
}
```

For MySQL:

```text
MySQL
  │
  ▼
binlog
  │
  ▼
CDC connector
```

This changes the architecture substantially.

---

# 28. CDC architecture

I'd separate CDC from ordinary extraction.

```text
                  Source DB
                     │
                     ▼
                CDC Reader
                     │
                     ▼
                Event Buffer
                     │
                     ▼
                 Event Log
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      Processor             Replay Engine
          │
          ▼
     Destination
```

Kafka becomes much more attractive here.

```text
Postgres WAL
     ↓
CDC Reader
     ↓
Kafka
     ↓
Consumers
     ↓
Snowflake
BigQuery
Databricks
```

---

# 29. Schema evolution

This is another monster hiding under the bed.

Suppose today:

```text
users

id
name
email
```

Tomorrow:

```text
users

id
name
email
phone
```

What happens?

Your destination must detect:

```text
NEW COLUMN phone
```

Then:

```text
ALTER TABLE users
ADD COLUMN phone VARCHAR
```

Your architecture therefore needs:

```text
Source Schema
      │
      ▼
Schema Registry / Metadata
      │
      ▼
Schema Diff
      │
      ▼
Destination Schema Manager
      │
      ▼
ALTER / MIGRATION
```

---

# 30. Schema changes you need to support

At minimum:

```text
ADD COLUMN
DROP COLUMN
RENAME COLUMN
TYPE CHANGE
NULLABILITY CHANGE
PRIMARY KEY CHANGE
```

But don't treat them all equally.

For example:

```text
ADD nullable column
```

is relatively safe.

Whereas:

```text
INT → STRING
```

could be dangerous.

You need a schema compatibility policy.

---

# 31. Multi-tenancy

If this is SaaS, multi-tenancy must be designed from day one.

Example:

```text
Tenant A
   │
   ├── connections
   ├── jobs
   └── destinations

Tenant B
   │
   ├── connections
   ├── jobs
   └── destinations
```

Every resource should have:

```text
tenant_id
```

And authorization:

```text
request
   ↓
user
   ↓
organization
   ↓
resource
```

Never trust:

```text
GET /connections/123
```

without checking:

```text
connection.tenant_id == current_user.tenant_id
```

---

# 32. Worker isolation

This is especially important.

Imagine:

```text
Tenant A → Salesforce
Tenant B → PostgreSQL
Tenant C → MySQL
```

You don't want Tenant A's bad connector to consume all resources.

Use:

```text
Kubernetes
```

with:

```text
CPU limits
Memory limits
Network policies
Pod isolation
Timeouts
Concurrency limits
```

For large customers, potentially:

```text
Dedicated worker pools
```

Example:

```text
Standard Pool
Premium Pool
Enterprise Pool
```

---

# 33. Kubernetes architecture

Eventually:

```text
                    Kubernetes Cluster
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       API Pods        Scheduler Pods    Worker Pods
                                             │
                               ┌─────────────┼─────────────┐
                               ▼             ▼             ▼
                           Connector      Connector     Connector
                           Worker         Worker        Worker
```

Worker pods can autoscale.

For example:

```text
Queue depth = 10
    ↓
5 workers

Queue depth = 10,000
    ↓
100 workers
```

using Kubernetes HPA/KEDA-style scaling.

---

# 34. Concurrency management

Suppose customer creates:

```text
500 syncs
```

You cannot necessarily execute all 500 simultaneously.

You need limits.

```text
Tenant concurrency = 10
Connector concurrency = 20
Global concurrency = 1000
```

Scheduler:

```text
Can run?
   │
   ├── global quota?
   ├── tenant quota?
   ├── source quota?
   ├── destination quota?
   └── worker capacity?
```

Only then:

```text
enqueue()
```

---

# 35. Rate limiting

APIs are painful.

Salesforce might say:

```text
API limit
```

HubSpot:

```text
rate limit
```

Stripe:

```text
rate limit
```

Your connector SDK should provide:

```text
RateLimiter
```

Conceptually:

```python
rate_limiter.acquire()

call_api()

rate_limiter.release()
```

Handle:

```text
429
Retry-After
HTTP 5xx
timeouts
connection resets
```

---

# 36. Retry system

Never blindly retry everything.

Categorize errors:

```text
Transient
Permanent
Authentication
Rate limit
Schema
Data
Network
Destination
```

Example:

```text
429
 ↓
retry

500
 ↓
retry

timeout
 ↓
retry

401
 ↓
DO NOT endlessly retry

invalid SQL
 ↓
DO NOT retry
```

Use exponential backoff:

```text
1 sec
2 sec
4 sec
8 sec
16 sec
...
```

with jitter.

---

# 37. Dead-letter queue

Eventually some records/jobs will repeatedly fail.

You need:

```text
Worker
   │
   ▼
Failure
   │
   ▼
Retry
   │
   ▼
Retry
   │
   ▼
DLQ
```

Then UI:

```text
Sync #123

⚠ 12 records failed

[View failed records]
[Retry]
[Ignore]
```

---

# 38. Observability

This isn't optional.

Every job should expose:

```text
records read
records written
records rejected
bytes read
bytes written
duration
throughput
API calls
retries
errors
```

Example:

```text
Sync #123

Status: SUCCESS

Duration: 4m 32s

Records:
  Read:     1,203,445
  Written:  1,203,445
  Failed:   0

Throughput:
  4,424 records/sec

Bytes:
  3.2 GB
```

---

# 39. Metrics architecture

Use:

```text
OpenTelemetry
      │
      ├── metrics
      ├── traces
      └── logs
```

Then:

```text
Prometheus
Grafana
OpenSearch / Elasticsearch
```

Metrics like:

```text
sync_success_total
sync_failure_total
records_read_total
records_written_total
connector_latency
destination_latency
queue_depth
worker_cpu
worker_memory
```

---

# 40. Distributed tracing

One sync should have one trace.

```text
Sync
 │
 ├── API
 │
 ├── Scheduler
 │
 ├── Queue
 │
 ├── Worker
 │     │
 │     ├── Source API
 │     ├── Transform
 │     └── Destination
 │
 └── Metadata
```

This lets you answer:

> Why did this sync take 18 minutes?

Maybe:

```text
Source: 2m
Queue wait: 7m
Transform: 1m
Destination: 8m
```

Now you know.

---

# 41. Security architecture

Credentials are one of the most sensitive parts.

Never:

```text
Postgres password
     ↓
PostgreSQL metadata DB
     ↓
plain text
```

Instead:

```text
User
 │
 ▼
API
 │
 ▼
Secrets Manager
 │
 └── encrypted secret
```

Metadata stores:

```text
secret_id
```

not:

```text
password
```

---

# 42. Encryption

Use:

```text
TLS
```

for network traffic.

And:

```text
AES/KMS
```

for data at rest.

Architecture:

```text
                 KMS
                  │
                  ▼
Secrets Manager
                  │
                  ▼
              Connector
```

---

# 43. Network architecture

Production cloud:

```text
                         Internet
                            │
                            ▼
                       CDN / WAF
                            │
                            ▼
                      Load Balancer
                            │
                            ▼
                       API Gateway
                            │
                ┌───────────┴───────────┐
                │                       │
             Private                  Private
              subnet                  subnet
                │                       │
              API                    Workers
                │                       │
                └───────────┬───────────┘
                            │
                     Internal Services
                            │
           ┌────────────────┼───────────────┐
           ▼                ▼               ▼
       PostgreSQL        Redis            Kafka
```

Databases should not be publicly exposed.

---

# 44. Public vs private connectivity

Your connectors may need to connect to:

```text
Public SaaS APIs
```

easy.

But customers may have:

```text
Private PostgreSQL
Private MySQL
On-prem Oracle
Internal APIs
```

Then you need options such as:

```text
VPN
VPC Peering
PrivateLink
SSH Tunnel
Customer-hosted agent
```

A very powerful architecture is:

```text
Your Cloud
     │
     │ encrypted channel
     ▼
Customer Agent
     │
     ▼
Private Database
```

This is how you avoid requiring customers to expose databases publicly.

---

# 45. Customer Agent architecture

This is worth designing early.

```text
                  Your Platform
                       │
                  Control Plane
                       │
                       ▼
                 Agent Gateway
                       │
                  encrypted
                   channel
                       │
                       ▼
              Customer Environment
                       │
                       ▼
                  Data Agent
                   /       \
                  /         \
                 ▼           ▼
             Postgres      Oracle
```

The agent:

```text
pulls jobs
executes connectors
pushes results/status
```

rather than your platform connecting inbound into the customer's network.

Much easier from a security perspective.

---

# 46. UI architecture

Your UI should expose:

```text
Dashboard
│
├── Connections
│
├── Destinations
│
├── Syncs
│
├── Runs
│
├── Schemas
│
├── Logs
│
├── Alerts
│
├── Usage
│
└── Settings
```

Connection creation:

```text
Select Source
      ↓
Configure
      ↓
Test Connection
      ↓
Discover Schema
      ↓
Select Streams
      ↓
Select Destination
      ↓
Configure Sync
      ↓
Activate
```

---

# 47. A complete end-to-end example

Let's walk through:

> PostgreSQL → Snowflake

User creates:

```text
Source:
PostgreSQL

Destination:
Snowflake

Tables:
users
orders

Frequency:
Every 15 minutes
```

---

## Step 1

UI:

```text
POST /connections
```

API:

```text
Connection Service
```

stores:

```text
connection_id = 100
```

---

## Step 2

User tests connection.

```text
API
 ↓
Job
 ↓
Queue
 ↓
Worker
 ↓
Postgres
```

Success.

---

## Step 3

Discovery.

```text
Worker
 ↓
Postgres metadata
 ↓
users
orders
products
payments
```

UI displays them.

User selects:

```text
users
orders
```

---

## Step 4

Destination configuration.

```text
Snowflake
database = ANALYTICS
schema = RAW
```

---

## Step 5

Create sync.

```text
sync_id = 900
```

Database:

```text
sync
 ├── source = connection 100
 ├── destination = snowflake 200
 ├── schedule = */15 * * * *
 └── streams
      ├── users
      └── orders
```

---

# 48. First sync

Scheduler sees:

```text
sync 900 is due
```

Creates:

```text
job 5000
```

Queue:

```text
sync.execute
```

Worker picks it.

```text
Worker
 │
 ├── Load sync
 ├── Load source credentials
 ├── Load destination credentials
 ├── Load schema
 └── Load state
```

---

# 49. Extract

Worker:

```text
users
```

reads:

```text
10,000 records
```

Then:

```text
10k
 ↓
batch
 ↓
normalize
 ↓
stage
```

---

# 50. Destination

Snowflake:

```text
RAW._staging_users_5000
```

Worker writes records.

Then:

```text
MERGE
```

into:

```text
RAW.users
```

Then staging cleanup.

---

# 51. Checkpoint

Worker updates:

```text
state:

sync_id = 900
stream = users
cursor = 2026-09-10 09:14:58
```

Then orders.

Finally:

```text
job = SUCCESS
```

---

# 52. Next sync

15 minutes later:

```text
Scheduler
 ↓
Job
 ↓
Worker
 ↓
State
```

Worker sees:

```text
cursor = 09:14:58
```

queries:

```sql
SELECT *
FROM users
WHERE updated_at > '09:14:58';
```

Only changes are transferred.

That's the basic engine.

---

# 53. What if the worker crashes?

Suppose:

```text
Read:
1,000,000 rows

Written:
800,000

Checkpoint:
700,000
```

Worker dies.

New worker starts from:

```text
700,000
```

Rows:

```text
700,001 → 800,000
```

may be replayed.

Destination uses:

```text
MERGE
```

so they're safe.

This is the reliability model you want.

---

# 54. The internal event model

I would create domain events such as:

```text
ConnectionCreated
ConnectionTested
SchemaDiscovered
SyncCreated
SyncStarted
StreamStarted
BatchExtracted
BatchLoaded
SchemaChanged
SyncFailed
SyncCompleted
```

These events can drive:

```text
notifications
metrics
audit
billing
UI
```

without tightly coupling everything.

---

# 55. Audit logging

For SaaS, track:

```text
WHO
WHAT
WHEN
WHERE
```

Example:

```text
User A
created connection
Postgres Production
2026-09-10 09:15
```

Another:

```text
Admin
changed destination credentials
2026-09-10 09:18
```

Audit logs should be append-only.

---

# 56. Billing

Eventually customers pay based on things like:

```text
rows synced
bytes processed
compute
connector type
frequency
number of connections
```

Your job events should therefore capture:

```text
records_read
records_written
bytes_processed
duration
```

Then:

```text
Job
 ↓
Usage Event
 ↓
Usage Aggregator
 ↓
Billing
```

Don't bolt billing instrumentation on six months later.

---

# 57. Recommended technology stack

If I were building this today, I'd consider:

### Frontend

```text
React
Next.js
TypeScript
```

### Backend

I'd choose either:

```text
Go
```

or:

```text
Python + FastAPI
```

For your first version, Python is extremely productive for connector development.

For a larger execution/control platform, Go is very attractive.

A hybrid is perfectly reasonable:

```text
Python
 ├── connectors
 ├── data processing
 └── SDK

Go
 ├── API
 ├── scheduler
 ├── workers
 └── infrastructure
```

But don't introduce two languages merely for architectural theater.

---

# 58. Databases

Control plane:

```text
PostgreSQL
```

Cache:

```text
Redis
```

Object storage:

```text
S3
```

Event streaming:

```text
Kafka
```

later, when justified.

---

# 59. Infrastructure

```text
Docker
Kubernetes
Terraform
Helm
```

Cloud:

```text
AWS
```

could be:

```text
EKS
RDS PostgreSQL
ElastiCache Redis
S3
MSK Kafka
Secrets Manager
ECR
CloudWatch
```

Equivalent services exist in GCP/Azure.

---

# 60. My recommended MVP

This is important.

**Do not build the whole Fivetran on day one.**

Build this:

```text
             ┌─────────────┐
             │     UI      │
             └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │     API     │
             └──────┬──────┘
                    │
             ┌──────▼──────┐
             │ PostgreSQL  │
             └──────┬──────┘
                    │
                 Queue
                    │
             ┌──────▼──────┐
             │   Worker    │
             └──────┬──────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     PostgreSQL            MySQL
       Source              Source
          │                   │
          └─────────┬─────────┘
                    ▼
              Destination
                    │
                    ▼
                Snowflake
```

Start with:

### Sources

```text
PostgreSQL
MySQL
```

### Destinations

```text
PostgreSQL
Snowflake
S3
```

### Features

```text
Full sync
Incremental sync
Schema discovery
Schema evolution
Scheduling
Retries
Logs
Metrics
Multi-tenancy
Secrets
```

Then add:

```text
CDC
Salesforce
HubSpot
BigQuery
Databricks
Kafka
```

---

# 61. Suggested repository structure

I would structure the repository roughly like this:

```text
data-platform/
│
├── frontend/
│   ├── dashboard/
│   ├── connections/
│   ├── destinations/
│   ├── syncs/
│   └── runs/
│
├── backend/
│   ├── api/
│   ├── auth/
│   ├── organizations/
│   ├── connections/
│   ├── destinations/
│   ├── syncs/
│   ├── jobs/
│   ├── schedules/
│   ├── metadata/
│   ├── schemas/
│   ├── billing/
│   └── audit/
│
├── sdk/
│   ├── source/
│   ├── destination/
│   ├── models/
│   ├── state/
│   ├── retry/
│   └── rate_limit/
│
├── connectors/
│   ├── postgres/
│   ├── mysql/
│   ├── salesforce/
│   ├── hubspot/
│   └── s3/
│
├── workers/
│   ├── extraction/
│   ├── transformation/
│   ├── loading/
│   └── orchestration/
│
├── infrastructure/
│   ├── terraform/
│   ├── kubernetes/
│   ├── helm/
│   └── monitoring/
│
└── docs/
    ├── architecture/
    ├── connectors/
    ├── APIs/
    └── operations/
```

---

# 62. The architecture I'd ultimately evolve toward

Your mature platform could look like this:

```text
                         ┌─────────────────┐
                         │      USER       │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   WEB CONSOLE   │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   API GATEWAY   │
                         └────────┬────────┘
                                  │
          ┌───────────────────────┼────────────────────────┐
          │                       │                        │
          ▼                       ▼                        ▼
 ┌────────────────┐      ┌────────────────┐       ┌────────────────┐
 │ Connection     │      │ Organization   │       │ Billing        │
 │ Service        │      │ Service        │       │ Service        │
 └───────┬────────┘      └────────────────┘       └────────────────┘
         │
         ▼
 ┌────────────────┐
 │ Metadata       │
 │ Service        │
 └───────┬────────┘
         │
         ▼
 ┌────────────────┐
 │ Scheduler      │
 └───────┬────────┘
         │
         ▼
 ┌────────────────┐
 │ Job Manager    │
 └───────┬────────┘
         │
         ▼
 ┌─────────────────────────────────────────────┐
 │              EVENT / JOB BUS                │
 │                  Kafka                      │
 └───────────────┬─────────────┬───────────────┘
                 │             │
                 ▼             ▼
          ┌────────────┐ ┌────────────┐
          │ Worker     │ │ Worker     │
          │ Pool       │ │ Pool       │
          └─────┬──────┘ └─────┬──────┘
                │              │
       ┌────────┴──────┐       │
       ▼               ▼       ▼
   PostgreSQL       Salesforce  MySQL
   Connector        Connector   Connector
       │               │       │
       └───────────────┼───────┘
                       ▼
               ┌──────────────┐
               │ Normalization│
               │ / Processing │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │ Destination  │
               │ Engine       │
               └──────┬───────┘
                      │
        ┌─────────────┼──────────────┐
        ▼             ▼              ▼
    Snowflake      BigQuery       Databricks
        │             │              │
        └─────────────┼──────────────┘
                      │
                      ▼
                Data Warehouse
```

Underneath:

```text
┌───────────────────────────────────────────────────────────┐
│                       PLATFORM                            │
│                                                           │
│ PostgreSQL     Redis       S3        Kafka                │
│ Vault/KMS      Kubernetes  Registry  OpenTelemetry        │
│ Prometheus     Grafana     Alerting  Audit Logs           │
└───────────────────────────────────────────────────────────┘
```

---

# 63. The five hardest engineering problems

If you're serious about building this, these are the areas I'd obsess over.

### 1. State management

```text
Where exactly did the previous sync stop?
```

### 2. Reliability

```text
What happens if the worker dies at any point?
```

### 3. Schema evolution

```text
What happens when the source schema changes?
```

### 4. Connector abstraction

```text
How can 100 connectors behave consistently?
```

### 5. Scale/isolation

```text
What happens when one customer has 10,000 syncs?
```

These are more important than choosing React vs Vue or Kafka vs RabbitMQ.

---

# 64. The mental model I want you to keep

Think of your platform as **three machines**.

### Machine #1: Control

```text
What should happen?
```

```text
Users
Connections
Schedules
Schemas
Jobs
State
Permissions
Billing
```

### Machine #2: Execution

```text
Actually move the data.
```

```text
Extract
Transform
Buffer
Load
Checkpoint
Retry
```

### Machine #3: Platform

```text
Make the other two reliable.
```

```text
Security
Kubernetes
Secrets
Observability
Queues
Storage
Autoscaling
Networking
```

That separation will keep the architecture sane.

---

## One more important point

I would **not** try to copy Fivetran or Airbyte service-for-service.

Instead, copy the **architectural ideas**:

```text
                  ┌──────────────────────────┐
                  │       CONTROL PLANE      │
                  │                          │
                  │ API                      │
                  │ Connections              │
                  │ Metadata                 │
                  │ Scheduler                │
                  │ Job Manager              │
                  └────────────┬─────────────┘
                               │
                               ▼
                         ┌───────────┐
                         │   QUEUE   │
                         └─────┬─────┘
                               │
                               ▼
                  ┌──────────────────────────┐
                  │       DATA PLANE         │
                  │                          │
                  │ Connector SDK            │
                  │ Extractors               │
                  │ State                    │
                  │ Processing               │
                  │ Destination Writers      │
                  └────────────┬─────────────┘
                               │
                               ▼
                       ┌──────────────┐
                       │ DESTINATIONS │
                       └──────────────┘
```

That is the skeleton.

Everything else is muscle, plumbing, and the occasional production fire extinguisher. 🔥

### Where I'd take you next

If you're actually planning to **build this**, the best next step is to turn this conceptual architecture into a **real engineering blueprint**, not just keep discussing boxes.

I can walk you through it in this order:

1. **Complete C4 architecture**: Context → Container → Component → Code level
2. **Production architecture diagram** with every service and data flow
3. **Complete database schema** for tenants, connections, syncs, streams, schemas, jobs, state, etc.
4. **Connector SDK design**, including the exact interfaces/classes
5. **PostgreSQL → Snowflake connector implementation**
6. **Full sync algorithm**
7. **Incremental sync algorithm**
8. **CDC architecture**
9. **Queue + scheduler + worker design**
10. **Retry/idempotency/checkpoint algorithm**
11. **Schema evolution algorithm**
12. **Kubernetes deployment architecture**
13. **Security/network/Vault architecture**
14. **Observability architecture**
15. **Multi-tenant architecture**
16. **API specification**
17. **Repository structure**
18. **A phased implementation roadmap from MVP → production → Fivetran-scale**

And for each one, I can give you **actual tables, APIs, sequence diagrams, component diagrams, pseudocode, failure scenarios, and technology decisions**, rather than just high-level boxes.
