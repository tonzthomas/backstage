import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import fetch from 'node-fetch';

export const argoTriggerWorkflowAction = createTemplateAction<{
  workflowTemplate: string;
  namespace: string;
  parameters?: Record<string, string>;
}>({
  id: 'argo:trigger-workflow',
  description: 'Triggers an Argo Workflow from Backstage',
  schema: {
    input: {
      required: ['workflowTemplate', 'namespace'],
      type: 'object',
      properties: {
        workflowTemplate: {
          type: 'string',
          description: 'The name of the Argo Workflow template to trigger',
        },
        namespace: {
          type: 'string',
          description: 'The namespace where the workflow is to be triggered',
        },
        parameters: {
          type: 'object',
          description: 'Optional parameters to pass to the workflow',
        },
      },
    },
  },
  async handler(ctx) {
    const { workflowTemplate, namespace, parameters } = ctx.input;

    const argoServerUrl = 'https://localhost:2746/';
    const argoToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InhGUkZ1dE9YSE92QmxaaU9GUEhKTXlaeHBLVnI5YWV4Q3lKblo4amlMcEUifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJhcmdvIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImFyZ28tc2VydmVyIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImFyZ28tc2VydmVyIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiMWZhNGM5ZjQtMTJiNi00ZjNmLWFmOTYtMzgwYTkxY2E0MzA4Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmFyZ286YXJnby1zZXJ2ZXIifQ.j2R7DUZGJ6-wS0aJPd5XkFLkAxDwF4RUhrUHZbUWqeQRKYz39zuPVFR4UyRY6LoGUK1LpwRLr2nKC_3X6WiOxUkPbI5Box0s7j9yym9H_uZ6sU_P5D1Ro5fhWbmaEZUnimcE5hp240j78XiN7os3VmtRoBoPNhQnlhIiTJEmUd715SE_Ql7-MQcT_pv3QxsuPptkD_WxORT3dnB4UgKFS2oWSb7T_WUjG9t6aUZnOej8Xsmt9HQtbbtAWZm1SG93kjnC049lxCS9g5gvFve_PDcRCUwZy1rHOr9p3UeQ4If8t7xF8n7Wkru367KW0LKAUMo9neS-eZXITACGN9vrTA'; // Replace with your Argo token

    const workflowPayload = {
      metadata: {
        generateName: `${workflowTemplate}-`,
        namespace,
      },
      spec: {
        workflowTemplateRef: { name: workflowTemplate },
        arguments: {
          parameters: Object.entries(parameters || {}).map(([name, value]) => ({
            name,
            value,
          })),
        },
      },
    };

    const response = await fetch(`${argoServerUrl}/api/v1/workflows/${namespace}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${argoToken}`,
      },
      body: JSON.stringify(workflowPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to trigger Argo Workflow: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    ctx.logger.info(`Argo Workflow triggered successfully: ${data.metadata.name}`);
    ctx.output('workflowName', data.metadata.name);
  },
});
