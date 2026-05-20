import {
  SchemaType,
  type FunctionDeclaration,
} from "@google/generative-ai";

export const GEMINI_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_catalog",
    description: "Busca faixas no catálogo Spotify do usuário",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "Termo de busca" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_lyrics",
    description:
      "Busca músicas a partir de um trecho de letra (busca no catálogo Spotify)",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        text: { type: SchemaType.STRING, description: "Trecho da letra" },
      },
      required: ["text"],
    },
  },
  {
    name: "create_playlist",
    description:
      "Cria playlist na conta Spotify. Pergunte antes se for pública.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        track_queries: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description:
            "Lista de buscas no Spotify (ex: nome da música, artista, ou 'artista - música'). Obrigatório ter pelo menos uma faixa.",
        },
        temporary_hours: {
          type: SchemaType.NUMBER,
          description: "Horas até expirar (opcional)",
        },
      },
      required: ["name", "track_queries"],
    },
  },
];
