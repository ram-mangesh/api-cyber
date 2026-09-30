import axios from 'axios'

export function createApiClient(baseUrl, apiKey) {
  const client = axios.create({
    // We send ALL requests to our local /dynamic-proxy endpoint
    // The server (Vite or Express) will read the 'x-target-base-url' header and route it perfectly.
    baseURL: `/dynamic-proxy/api/v1`,
    headers: {
      'x-target-base-url': baseUrl,
      'X-Auth': apiKey,
      'Content-Type': 'application/json',
    },
  })
  return client
}

// Targets
export const targetsApi = (client) => ({
  getAll: (params) => client.get('/targets', { params }),
  getOne: (id) => client.get(`/targets/${id}`),
  create: (data) => client.post('/targets/add', data),
  update: (id, data) => client.patch(`/targets/${id}`, data),
  delete: (id) => client.delete(`/targets/${id}`),
  deleteMany: (ids) => client.post('/targets/delete', { target_id_list: ids }),
  csvExport: () => client.get('/targets/cvs_export', { responseType: 'blob' }),
  getConfig: (id) => client.get(`/targets/${id}/configuration`),
  updateConfig: (id, data) => client.patch(`/targets/${id}/configuration`, data),
  getExclusions: (id) => client.get(`/targets/${id}/configuration/exclusions`),
  updateExclusions: (id, data) => client.put(`/targets/${id}/configuration/exclusions`, data),
  getAllowedHosts: (id) => client.get(`/targets/${id}/allowed_hosts`),
  addAllowedHost: (id, data) => client.post(`/targets/${id}/allowed_hosts`, data),
  deleteAllowedHost: (id, ahId) => client.delete(`/targets/${id}/allowed_hosts/${ahId}`),
  getTechnologies: (id) => client.get(`/targets/${id}/technologies`),
  getTargetGroups: (id) => client.get(`/targets/${id}/target_groups`),
  getContinuousScan: (id) => client.get(`/targets/${id}/continuous_scan`),
  updateContinuousScan: (id, data) => client.put(`/targets/${id}/continuous_scan`, data),
  getContinuousScanList: (id) => client.get(`/targets/${id}/continuous_scan/list`),
  resetSensor: (id) => client.post(`/targets/${id}/sensor/reset`),
  getLoginSequence: (id) => client.get(`/targets/${id}/configuration/login_sequence`),
  downloadLoginSequence: (id) => client.get(`/targets/${id}/configuration/login_sequence/download`, { responseType: 'blob' }),
  getImports: (id) => client.get(`/targets/${id}/configuration/imports`),
  addImport: (id, data) => client.post(`/targets/${id}/configuration/imports`, data),
  getWorkerConfig: (id) => client.get(`/targets/${id}/configuration/workers`),
})

// Target Groups
export const targetGroupsApi = (client) => ({
  getAll: (params) => client.get('/target_groups', { params }),
  getOne: (id) => client.get(`/target_groups/${id}`),
  create: (data) => client.post('/target_groups', data),
  update: (id, data) => client.put(`/target_groups/${id}`, data),
  delete: (id) => client.delete(`/target_groups/${id}`),
  deleteMany: (ids) => client.post('/target_groups/delete', { group_id_list: ids }),
  getTargets: (id) => client.get(`/target_groups/${id}/targets`),
  addTargets: (id, data) => client.post(`/target_groups/${id}/targets`, data),
})

// Scans
export const scansApi = (client) => ({
  getAll: (params) => client.get('/scans', { params }),
  getOne: (id) => client.get(`/scans/${id}`),
  create: (data) => client.post('/scans', data),
  abort: (id) => client.post(`/scans/${id}/abort`),
  resume: (id) => client.post(`/scans/${id}/trigger`),
  delete: (id) => client.delete(`/scans/${id}`),
  deleteMany: (ids) => client.post('/scans/delete', { scan_id_list: ids }),
  getResults: (id) => client.get(`/scans/${id}/results`),
  getResult: (scanId, resultId) => client.get(`/results/${resultId}`),
  getStatistics: (scanId, resultId) => client.get(`/scans/${scanId}/results/${resultId}/statistics`),
  getCrawlDataItem: (scanId, resultId, locId) => client.get(`/scans/${scanId}/results/${resultId}/crawldata/${locId}`),
  getCrawlChildren: (scanId, resultId, locId) => client.get(`/scans/${scanId}/results/${resultId}/crawldata/${locId}/children`),
  getCrawlLocVulns: (scanId, resultId, locId) => client.get(`/scans/${scanId}/results/${resultId}/crawldata/${locId}/vulnerabilities`),
  // /crawldata itself answers 302 with a Location header when no `q` is passed, so read the root's children instead
  getCrawlData: (scanId, resultId, params, locId = 1) =>
    client.get(`/scans/${scanId}/results/${resultId}/crawldata/${locId}/children`, { params }),
  getTechnologies: (scanId, resultId) => client.get(`/scans/${scanId}/results/${resultId}/technologies`),
  getVulnerabilityTypes: (scanId, resultId) => client.get(`/scans/${scanId}/results/${resultId}/vulnerability_types`),
})

// Scanning Profiles
export const scanProfilesApi = (client) => ({
  getAll: () => client.get('/scanning_profiles'),
  getOne: (id) => client.get(`/scanning_profiles/${id}`),
  create: (data) => client.post('/scanning_profiles', data),
  update: (id, data) => client.patch(`/scanning_profiles/${id}`, data),
  delete: (id) => client.delete(`/scanning_profiles/${id}`),
})

// http_response endpoints return a raw text file, not JSON
const RAW_TEXT = { responseType: 'text', transformResponse: [(d) => d] }

// Vulnerabilities
export const vulnsApi = (client) => ({
  getAll: (params) => client.get('/vulnerabilities', { params }),
  getOne: (vulnId) => client.get(`/vulnerabilities/${vulnId}`),
  getHttpResponse: (vulnId) => client.get(`/vulnerabilities/${vulnId}/http_response`, RAW_TEXT),
  updateStatus: (vulnId, data) => client.put(`/vulnerabilities/${vulnId}/status`, data),
  recheck: (vulnId) => client.post(`/vulnerabilities/${vulnId}/recheck`),
  recheckAll: (ids) => client.post('/vulnerabilities/recheck', { vuln_id_list: ids }),
  getIssues: (params) => client.get('/vulnerabilities/issues', { params }),
  getByScan: (scanId, resultId, params) => client.get(`/scans/${scanId}/results/${resultId}/vulnerabilities`, { params }),
  updateScanVulnStatus: (scanId, resultId, vulnId, data) =>
    client.put(`/scans/${scanId}/results/${resultId}/vulnerabilities/${vulnId}/status`, data),
  recheckScanVuln: (scanId, resultId, vulnId) =>
    client.post(`/scans/${scanId}/results/${resultId}/vulnerabilities/${vulnId}/recheck`),
  recheckAllScanVulns: (scanId, resultId) =>
    client.post(`/scans/${scanId}/results/${resultId}/vulnerabilities/recheck`),
  getScanVulnHttpResponse: (scanId, resultId, vulnId) =>
    client.get(`/scans/${scanId}/results/${resultId}/vulnerabilities/${vulnId}/http_response`, RAW_TEXT),
})

// Vulnerability Types & Groups
export const vulnTypesApi = (client) => ({
  getAll: (params) => client.get('/vulnerability_types', { params }),
  getOne: (id) => client.get(`/vulnerability_types/${id}`),
  getGroups: () => client.get('/vulnerability_groups'),
})

// Reports
export const reportsApi = (client) => ({
  getAll: (params) => client.get('/reports', { params }),
  getOne: (id) => client.get(`/reports/${id}`),
  create: (data) => client.post('/reports', data),
  delete: (id) => client.delete(`/reports/${id}`),
  deleteMany: (ids) => client.post('/reports/delete', { report_id_list: ids }),
  repeat: (id) => client.post(`/reports/${id}/repeat`),
  getTemplates: () => client.get('/report_templates'),
  download: (descriptor) => client.get(`/reports/download/${descriptor}`, { responseType: 'blob' }),
})

// Exports
export const exportsApi = (client) => ({
  getTypes: () => client.get('/export_types'),
  getAll: (params) => client.get('/exports', { params }),
  getOne: (id) => client.get(`/exports/${id}`),
  create: (data) => client.post('/exports', data),
  delete: (id) => client.delete(`/exports/${id}`),
  deleteMany: (ids) => client.post('/exports/delete', { export_id_list: ids }),
})

// Users
export const usersApi = (client) => ({
  getAll: () => client.get('/users'),
  getOne: (id) => client.get(`/users/${id}`),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.patch(`/users/${id}`, data),
  deleteMany: (ids) => client.post('/users/delete', { user_id_list: ids }),
  enable: (ids) => client.post('/users/enable', { user_id_list: ids }),
  disable: (ids) => client.post('/users/disable', { user_id_list: ids }),
})

// User Groups
export const userGroupsApi = (client) => ({
  getAll: () => client.get('/user_groups'),
  getOne: (id) => client.get(`/user_groups/${id}`),
  create: (data) => client.post('/user_groups', data),
  update: (id, data) => client.patch(`/user_groups/${id}`, data),
  delete: (id) => client.delete(`/user_groups/${id}`),
  getUsers: (id) => client.get(`/user_groups/${id}/users`),
  addUsers: (id, data) => client.post(`/user_groups/${id}/users`, data),
  getRoles: (id) => client.get(`/user_groups/${id}/roles`),
  updateRoles: (id, data) => client.put(`/user_groups/${id}/roles`, data),
})

// Roles
export const rolesApi = (client) => ({
  getAll: () => client.get('/roles'),
  getOne: (id) => client.get(`/roles/${id}`),
  create: (data) => client.post('/roles', data),
  update: (id, data) => client.put(`/roles/${id}`, data),
  delete: (id) => client.delete(`/roles/${id}`),
  getPermissions: () => client.get('/roles/permissions'),
})

// Issue Trackers
export const issueTrackersApi = (client) => ({
  getAll: () => client.get('/issue_trackers'),
  getOne: (id) => client.get(`/issue_trackers/${id}`),
  create: (data) => client.post('/issue_trackers', data),
  update: (id, data) => client.patch(`/issue_trackers/${id}`, data),
  delete: (id) => client.delete(`/issue_trackers/${id}`),
  checkConnection: (data) => client.post('/issue_trackers/check_connection', data),
  checkProjects: (data) => client.post('/issue_trackers/check_projects', data),
  getCollections: () => client.get('/issue_trackers/collections'),
  getCustomFields: (data) => client.post('/issue_trackers/custom_fields', data),
  checkExistingConnection: (id) => client.post(`/issue_trackers/${id}/check_connection`),
  getExistingProjects: (id) => client.get(`/issue_trackers/${id}/projects`),
})

// WAFs
export const wafsApi = (client) => ({
  getAll: () => client.get('/wafs'),
  getOne: (id) => client.get(`/wafs/${id}`),
  create: (data) => client.post('/wafs', data),
  update: (id, data) => client.patch(`/wafs/${id}`, data),
  delete: (id) => client.delete(`/wafs/${id}`),
  checkConnection: (data) => client.post('/wafs/check_connection', data),
  checkExistingConnection: (id) => client.post(`/wafs/${id}/check_connection`),
})

// Workers / Agents
export const workersApi = (client) => ({
  getAll: () => client.get('/workers'),
  getOne: (id) => client.get(`/workers/${id}`),
  authorize: (id) => client.post(`/workers/${id}/authorize`),
  reject: (id) => client.post(`/workers/${id}/reject`),
  check: (id) => client.post(`/workers/${id}/check`),
  upgrade: (id) => client.post(`/workers/${id}/upgrade`),
  rename: (id, data) => client.post(`/workers/${id}/rename`, data),
  ignoreErrors: (id) => client.post(`/workers/${id}/ignore_errors`),
  getRegistrationToken: () => client.get('/config/agents/registration_token'),
})

// Excluded Hours Profiles
export const excludedHoursApi = (client) => ({
  getAll: () => client.get('/excluded_hours_profiles'),
  getOne: (id) => client.get(`/excluded_hours_profiles/${id}`),
  create: (data) => client.post('/excluded_hours_profiles', data),
  update: (id, data) => client.put(`/excluded_hours_profiles/${id}`, data),
  delete: (id) => client.delete(`/excluded_hours_profiles/${id}`),
})
