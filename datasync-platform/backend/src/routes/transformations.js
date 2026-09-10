const express = require('express');

const router = express.Router();

// Mock in-memory state for transformations
let transformations = [
  {
    id: 'tr_1',
    name: 'stg_customers',
    type: 'dbt_model',
    schedule: 'After Connector Sync',
    status: 'succeeded',
    destination: 'Snowflake Analytics',
    last_run_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    duration_seconds: 2.3,
    rows_affected: 20,
    sql: 'SELECT id, name, LOWER(email) as email, city, signup_date, CURRENT_TIMESTAMP as dbt_updated_at FROM {{ source("raw", "demo_users") }}'
  },
  {
    id: 'tr_2',
    name: 'stg_orders',
    type: 'dbt_model',
    schedule: 'After Connector Sync',
    status: 'succeeded',
    destination: 'Snowflake Analytics',
    last_run_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    duration_seconds: 3.1,
    rows_affected: 30,
    sql: 'SELECT id, user_id, product, amount, status, order_date FROM {{ source("raw", "demo_orders") }} WHERE amount > 0'
  },
  {
    id: 'tr_3',
    name: 'fct_customer_revenue',
    type: 'quickstart_sql',
    schedule: 'After Connector Sync',
    status: 'succeeded',
    destination: 'Snowflake Analytics',
    last_run_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    duration_seconds: 4.8,
    rows_affected: 20,
    sql: 'SELECT c.id as user_id, c.name, COUNT(o.id) as total_orders, SUM(o.amount) as total_revenue, AVG(o.amount) as aov FROM {{ ref("stg_customers") }} c LEFT JOIN {{ ref("stg_orders") }} o ON c.id = o.user_id GROUP BY 1, 2'
  },
  {
    id: 'tr_4',
    name: 'dim_product_catalog',
    type: 'dbt_model',
    schedule: 'Daily at 00:00 UTC',
    status: 'succeeded',
    destination: 'Snowflake Analytics',
    last_run_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    duration_seconds: 1.6,
    rows_affected: 10,
    sql: 'SELECT id, name, category, price, in_stock, CASE WHEN in_stock THEN "Available" ELSE "Backordered" END as availability FROM {{ source("raw", "demo_products") }}'
  }
];

router.get('/', (req, res) => {
  res.json(transformations);
});

router.post('/:id/run', (req, res) => {
  const model = transformations.find(t => t.id === req.params.id);
  if (!model) {
    return res.status(404).json({ error: 'Transformation model not found' });
  }
  model.status = 'running';
  setTimeout(() => {
    model.status = 'succeeded';
    model.last_run_at = new Date().toISOString();
    model.duration_seconds = +(Math.random() * 2 + 1.5).toFixed(1);
  }, 1000);
  res.json({ message: `Triggered transformation for ${model.name}`, model });
});

module.exports = router;
