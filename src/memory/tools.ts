import { llm } from '@livekit/agents';
import { forget, recall, remember } from './memory.ts';

export function createMemoryTools(userId: string) {
  const rememberDetail = llm.tool({
    name: 'remember_detail',

    description:
      'Save an important detail about the user to long-term memory. Use this when the user explicitly asks you to remember something, or when they clearly provide a stable preference, project detail, skill, or useful personal fact.',

    parameters: {
      type: 'object',

      properties: {
        content: {
          type: 'string',
          description: 'The specific information that should be remembered.',
        },

        memory_type: {
          type: 'string',
          description:
            'The category of memory, such as preference, project, skill, fact, or instruction.',
        },
      },

      required: ['content'],
    },

    execute: async ({
      content,
      memory_type = 'fact',
    }: {
      content: string;
      memory_type?: string;
    }) => {
      console.log(`[Memory] Saving for ${userId}: ${content}`);

      const memory = await remember(userId, content, memory_type);

      return `Memory saved successfully: ${memory.content}`;
    },
  });

  const recallDetails = llm.tool({
    name: 'recall_details',

    description:
      'Retrieve previously saved long-term memories about the current user. Use this when the user asks what you remember about them or when a previous user detail is relevant to answering the question.',

    parameters: {
      type: 'object',

      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of memories to retrieve.',
        },
      },

      required: [],
    },

    execute: async ({ limit = 10 }: { limit?: number }) => {
      console.log(`[Memory] Recalling memories for ${userId}`);

      const memories = await recall(userId, limit);

      if (memories.length === 0) {
        return 'No saved memories were found for this user.';
      }

      return memories
        .map(
          (memory) =>
            `Memory ID: ${memory._id}\n` +
            `Type: ${memory.memory_type}\n` +
            `Content: ${memory.content}`,
        )
        .join('\n\n');
    },
  });

  const forgetDetail = llm.tool({
    name: 'forget_detail',

    description:
      'Delete a specific saved memory when the user explicitly asks Max to forget something.',

    parameters: {
      type: 'object',

      properties: {
        memory_id: {
          type: 'string',
          description: 'The MongoDB ID of the memory to delete.',
        },
      },

      required: ['memory_id'],
    },

    execute: async ({ memory_id }: { memory_id: string }) => {
      console.log(`[Memory] Forgetting memory ${memory_id} for ${userId}`);

      const deleted = await forget(userId, memory_id);

      if (!deleted) {
        return 'That memory was not found.';
      }

      return 'The memory has been deleted successfully.';
    },
  });

  return [rememberDetail, recallDetails, forgetDetail];
}
