export const faqs = [
  {
    q: "How does DePing work?",
    a: "DePing distributes monitoring jobs through a global network of independently operated nodes. Each website check runs from multiple regions in parallel, and results are validated through cryptographic consensus before triggering alerts or settling rewards on Solana.",
  },
  {
    q: "How do node operators earn rewards?",
    a: "Operators run our Rust-based worker, complete monitoring jobs, and earn DPN tokens for every verified check. Rewards accumulate off-chain and are batch-settled to Solana wallets once they pass the 10-token threshold.",
  },
  {
    q: "Why use decentralized monitoring?",
    a: "Traditional cloud monitoring relies on a handful of datacenters. DePing checks your website from thousands of real consumer and edge locations, detecting regional ISP outages and routing issues that centralized providers completely miss.",
  },
  {
    q: "How are uptime results verified?",
    a: "Every result is signed by the worker, cross-checked against geographically diverse peers, and scored for consensus. Outliers are rejected; matching results unlock rewards and trigger alerts only when a real outage is confirmed.",
  },
  {
    q: "How does Solana settlement work?",
    a: "Our Anchor program receives signed reward batches from the Go sync handler via RabbitMQ. Settlement is sub-cent in cost and confirmed in under 400ms — operators can withdraw to any Solana wallet at any time.",
  },
  {
    q: "Can enterprises use DePing?",
    a: "Yes. Enterprise plans include SLA guarantees, dedicated regions, private node deployments, and direct integrations with PagerDuty, Datadog, and custom incident systems.",
  },
];
