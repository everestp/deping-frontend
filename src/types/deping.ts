import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export interface NodeAccount {
   owner: PublicKey;
   emailHash: [number: 32];
   rewardBalance: BN;
   stakedAmount: BN;
   unstakeRequestAt: BN;
   isValidator: boolean;
   bump: number;
}
export interface Root {
  version: string
  name: string
  metadata: Metadata
  instructions: Instruction[]
  accounts: Account2[]
  errors: Error[]
}

export interface Metadata {
  address: string
}

export interface Instruction {
  name: string
  accounts: Account[]
  args: Arg[]
}

export interface Account {
  name: string
  isMut: boolean
  isSigner: boolean
}

export interface Arg {
  name: string
  type: any
}

export interface Account2 {
  name: string
  type: Type
}

export interface Type {
  kind: string
  fields: Field[]
}

export interface Field {
  name: string
  type: any
}

export interface Error {
  code: number
  name: string
  msg: string
}
