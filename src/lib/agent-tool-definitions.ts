export const OPENAI_AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_catalog",
      description: "Busca faixas no catálogo Spotify do usuário",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Termo de busca" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_lyrics",
      description:
        "Busca músicas a partir de um trecho de letra (busca no catálogo Spotify)",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Trecho da letra" },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_playlist",
      description:
        "Cria playlist na conta Spotify do usuário (temporária por padrão 24h)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          track_queries: {
            type: "array",
            items: { type: "string" },
            description:
              "Lista de buscas no Spotify (música, artista ou 'artista - música')",
          },
          temporary_hours: {
            type: "number",
            description: "Horas até expirar (opcional, padrão 24)",
          },
        },
        required: ["name", "track_queries"],
      },
    },
  },
];
