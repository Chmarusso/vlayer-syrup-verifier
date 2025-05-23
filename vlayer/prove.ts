/// <reference types="bun" />

import { createVlayerClient } from "@vlayer/sdk";
import proverSpec from "../out/SyrupProver.sol/SyrupProver";
import verifierSpec from "../out/SyrupVerifier.sol/SyrupVerifier";
import {
  getConfig,
  createContext,
  deployVlayerContracts,
  writeEnvVariables,
} from "@vlayer/sdk/config";

const URL_TO_PROVE = "https://api.maple.finance/v2/graphql";
const BODY = '{"operationName":"getPortfolioData","variables":{"account":"0xc923e559b424d67a2e1facf8beda9fcb422dd5ac","accountId":"0xc923e559b424d67a2e1facf8beda9fcb422dd5ac"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"0a01b0cae68c71a035f5793cc2c16fc1a656483b3c3fbf2b5ccde6f829b8cc0d"}}}';

// const URL_TO_PROVE = "https://api.kraken.com/0/public/Ticker?pair=ETHUSD";
// const BODY = "";

const config = getConfig();
const { chain, ethClient, account, proverUrl, confirmations, notaryUrl } =
  createContext(config);

if (!account) {
  throw new Error(
    "No account found make sure EXAMPLES_TEST_PRIVATE_KEY is set in your environment variables",
  );
}

const vlayer = createVlayerClient({
  url: proverUrl,
  token: config.token,
});

async function generateWebProof() {
  console.log("⏳ Generating web proof...");
  const result =
    await Bun.$`vlayer web-proof-fetch --notary ${notaryUrl} --url ${URL_TO_PROVE} -d ${BODY} -H 'content-type: application/json' -X POST`;
  return result.stdout.toString();
}

console.log("⏳ Deploying contracts...");

const { prover, verifier } = await deployVlayerContracts({
  proverSpec,
  verifierSpec,
  proverArgs: [],
  verifierArgs: [],
});

await writeEnvVariables(".env", {
  VITE_PROVER_ADDRESS: prover,
  VITE_VERIFIER_ADDRESS: verifier,
});

console.log("✅ Contracts deployed", { prover, verifier });

const webProof = await generateWebProof();

console.log("⏳ Proving...");
const hash = await vlayer.prove({
  address: prover,
  functionName: "main",
  proverAbi: proverSpec.abi,
  args: [
    {
      webProofJson: webProof.toString(),
    },
  ],
  chainId: chain.id,
});
const result = await vlayer.waitForProvingResult({ hash });
const [proof, positionId, dripsEarned] = result;
console.log("✅ Proof generated");

console.log("⏳ Verifying...");
const txHash = await ethClient.writeContract({
  address: verifier,
  abi: verifierSpec.abi,
  functionName: "verify",
  args: [proof, positionId, dripsEarned],
  chain,
  account,
});

await ethClient.waitForTransactionReceipt({
  hash: txHash,
  confirmations,
  retryCount: 60,
  retryDelay: 1000,
});

console.log("✅ Verified!");
console.log("Drips earned: ", dripsEarned);
console.log("Position ID: ", positionId);