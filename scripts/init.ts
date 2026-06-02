import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("Vault Initialization", () => {
  // Use the default anchor provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Replace 'Deping' with the exact name of your program in Anchor.toml
  const program = anchor.workspace.Deping;

  it("Initializes the staking vault", async () => {
    const [stakingVaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking_vault")],
      program.programId
    );

    await program.methods
      .initializeStakingVault()
      .accounts({
        stakingVault: stakingVaultAuthority,
        mint: new PublicKey("2V5HdggYQXW1Z9nhrVKjNdYqg5NsQnZhwMERYr8WK1pU"),
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        stakingVaultAuthority: stakingVaultAuthority,
      })
      .rpc();

    console.log("Vault initialized successfully at:", stakingVaultAuthority.toBase58());
  });
});
