import { useMemo } from 'react'
import { useApi } from '../context/ApiContext'
import {
  createApiClient, targetsApi, targetGroupsApi, scansApi, scanProfilesApi,
  vulnsApi, vulnTypesApi, reportsApi, exportsApi, usersApi, userGroupsApi,
  rolesApi, issueTrackersApi, wafsApi, workersApi, excludedHoursApi
} from '../api/client'

export function useApiClient() {
  const { apiKey, baseUrl } = useApi()
  const client = useMemo(() => createApiClient(baseUrl, apiKey), [baseUrl, apiKey])
  
  const api = useMemo(() => ({
    targets: targetsApi(client),
    targetGroups: targetGroupsApi(client),
    scans: scansApi(client),
    scanProfiles: scanProfilesApi(client),
    vulns: vulnsApi(client),
    vulnTypes: vulnTypesApi(client),
    reports: reportsApi(client),
    exports: exportsApi(client),
    users: usersApi(client),
    userGroups: userGroupsApi(client),
    roles: rolesApi(client),
    issueTrackers: issueTrackersApi(client),
    wafs: wafsApi(client),
    workers: workersApi(client),
    excludedHours: excludedHoursApi(client),
    raw: client,
  }), [client])

  return api
}

