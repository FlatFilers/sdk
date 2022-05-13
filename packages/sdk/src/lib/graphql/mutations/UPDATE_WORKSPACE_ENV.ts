import { gql } from 'graphql-request'

export const UPDATE_WORKSPACE_ENV = gql`
  mutation UpdateWorkspaceEnv($workspaceId: UUID!, $env: JSON!) {
    updateWorkspaceEnvironment(workspaceId: $workspaceId, env: $env) {
      success
    }
  }
`
