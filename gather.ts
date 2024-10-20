import * as web3 from "@solana/web3.js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const connection = new web3.Connection(process.env.RPC_URL as string);
  const mainPublicKey = new web3.PublicKey(
    "FtQSst8MjmZ2DAvev4gqTQzmgLqJ98ffDJ5txCuX5N2u"
  );

  const accounts = JSON.parse(fs.readFileSync("accounts.json", "utf8"));

  // transfer all sol and tokens to main account
  for (const account of accounts) {
    const balance = await connection.getBalance(new web3.PublicKey(account.publicKey));
    console.log(`${account.publicKey}: ${balance}`);
    if (balance > 0) {
      const transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: new web3.PublicKey(account.publicKey),
          toPubkey: mainPublicKey,
          lamports: 0.001 * web3.LAMPORTS_PER_SOL,
        })
      );
      const signer = web3.Keypair.fromSecretKey(Buffer.from(account.privateKey, 'hex'));
      try {
        const signature = await web3.sendAndConfirmTransaction(connection, transaction, [signer]);
        console.log(`Transfer successful: ${signature}`);
      } catch (error) {
        console.error(`Transfer failed: ${error}`);
      }
    }
  }
}

main().catch((error) => {
  // Error handling without console output
});
