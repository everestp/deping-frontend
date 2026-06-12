export const architectureLayers = [
  {
    id: "public",
    name: "Public Layer",
    nodes: [
      { id: "cli", label: "Rust CLI Miner", tech: "Rust + Tokio" },
      { id: "targets", label: "Target Websites", tech: "HTTPS" },
    ],
  },
  {
    id: "ingress",
    name: "Ingress Layer",
    nodes: [
      { id: "grpc", label: "Go gRPC Core", tech: "Protocol Buffers" },
      { id: "rest", label: "Go REST API", tech: "Gin Framework" },
    ],
  },
  {
    id: "orchestration",
    name: "Orchestration",
    nodes: [
      { id: "job_queue", label: "job_queue", tech: "RabbitMQ" },
      { id: "processing_queue", label: "processing_queue", tech: "RabbitMQ" },
      { id: "solana_queue", label: "solana_sync_queue", tech: "RabbitMQ" },
    ],
  },
  {
    id: "storage",
    name: "Storage & Compute",
    nodes: [
      { id: "redis", label: "Redis Scheduler", tech: "In-Memory" },
      { id: "postgres", label: "PostgreSQL", tech: "Time-series" },
      { id: "workers", label: "Worker Pool", tech: "Kubernetes" },
      { id: "sync", label: "Solana Sync Handler", tech: "Go" },
    ],
  },
  {
    id: "chain",
    name: "Blockchain Layer",
    nodes: [
      { id: "solana", label: "Solana Mainnet", tech: "Proof of History" },
      { id: "anchor", label: "Anchor Program", tech: "Rust on-chain" },
    ],
  },
];
