export type KnowledgeChunk = {
  id: string;
  type: string;
  title: string;
  text: string;
  url: string;
};

export type KnowledgeFile = {
  meta: { version: number; chunk_count: number; sources: string[] };
  chunks: KnowledgeChunk[];
};

export type ChatSource = {
  id: string;
  title: string;
  url: string;
};

export type ChatResponse = {
  answer: string;
  sources: ChatSource[];
};
