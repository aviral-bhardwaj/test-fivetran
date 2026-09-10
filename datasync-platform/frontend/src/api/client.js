import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const getOrganizations = () => api.get('/organizations');
export const createOrganization = (data) => api.post('/organizations', data);

export const getConnectors = () => api.get('/connectors');
export const createConnector = (data) => api.post('/connectors', data);
export const updateConnector = (id, data) => api.put(`/connectors/${id}`, data);
export const deleteConnector = (id) => api.delete(`/connectors/${id}`);
export const testConnector = (id) => api.post(`/connectors/${id}/test`);

export const getDestinations = () => api.get('/destinations');
export const createDestination = (data) => api.post('/destinations', data);
export const updateDestination = (id, data) => api.put(`/destinations/${id}`, data);
export const deleteDestination = (id) => api.delete(`/destinations/${id}`);

export const getConnections = () => api.get('/connections');
export const createConnection = (data) => api.post('/connections', data);
export const getConnection = (id) => api.get(`/connections/${id}`);
export const updateConnection = (id, data) => api.put(`/connections/${id}`, data);
export const deleteConnection = (id) => api.delete(`/connections/${id}`);
export const triggerSync = (id) => api.post(`/connections/${id}/sync`);
export const getConnectionSyncs = (id) => api.get(`/connections/${id}/syncs`);
export const discoverSchema = (id) => api.post(`/connections/${id}/discover`);
export const toggleConnection = (id) => api.post(`/connections/${id}/toggle`);

export const getSyncs = () => api.get('/syncs');
export const getSync = (id) => api.get(`/syncs/${id}`);

export const getHealth = () => api.get('/health');
export const getMetrics = () => api.get('/metrics');

export const getSourceCatalog = (params) => api.get('/catalog/sources', { params });
export const getSourceSpec = (id) => api.get(`/catalog/sources/${id}/spec`);
export const getDestinationCatalog = (params) => api.get('/catalog/destinations', { params });
export const getSyncLogs = (id) => api.get(`/syncs/${id}/logs`);
export const getUsage = () => api.get('/usage');
export const getTransformations = () => api.get('/transformations');
export const runTransformation = (id) => api.post(`/transformations/${id}/run`);

export const getConnectionData = (id) => api.get(`/connections/${id}/data`);
export const insertConnectionRecord = (id, data) => api.post(`/connections/${id}/insert-record`, data);
export const getDestinationTables = (id) => api.get(`/destinations/${id}/tables`);
export const getDestinationTableData = (id, table) => api.get(`/destinations/${id}/tables/${table}/data`);
export const queryDestinationWarehouse = (id, sql) => api.post(`/destinations/${id}/query`, { sql });


