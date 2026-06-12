export const terminalSteps = [
  {
    command: "deping setup",
    output: [
      "INFO deping: DePing Node Initialized",
      "INFO deping: Public Key (Hex): 4d1dEAgaqYEPfHSrJWXAihHaUjNa7rnY3Awonnwxdo9r",
    ],
  },

  {
    command: "deping start",
    output: [
      "INFO deping: Starting DePIN Miner Node...",
      "INFO deping: Node Public Key (Hex): 4d1dEAgaqYEPfHSrJWXAihHaUjNa7rnY3Awonnwxdo9r",

      "INFO deping::network::stream: 📡 Initializing connection to Ingress Core... server=http://127.0.0.1:50051",

      "WARN deping::network::stream: ⏳ Connection failed: tcp connect error (Connection refused). Retrying...",

      "INFO deping::network::stream: 💤 Entering cool-down... retry_in=1.02s",

      "INFO deping::network::stream: 📡 Initializing connection to Ingress Core...",

      "WARN deping::network::stream: Connection failed: tcp connect error (Connection refused). Retrying...",
    ],
  },
];
