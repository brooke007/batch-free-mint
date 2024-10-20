import * as web3 from "@solana/web3.js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const connection = new web3.Connection(process.env.RPC_URL as string);
  const numAddresses = 10; 

  const accounts = Array.from({length: numAddresses}, () => web3.Keypair.generate());

  const accountInfo = accounts.map(account => ({
    publicKey: account.publicKey.toBase58(),
    privateKey: Buffer.from(account.secretKey).toString('hex')
  }));
  fs.writeFileSync('accounts.json', JSON.stringify(accountInfo, null, 2));

  const soltranser = 0.1; // transfer 0.04 SOL from main to all accounts
 
  const projectPublicKey = new web3.PublicKey(
    "2W34mwCihejVM2qEarq1sbxQHXD41aSSazbrV2d5njcH"
  );
  const mainWallet = web3.Keypair.fromSecretKey(Uint8Array.from(Buffer.from(process.env.PRIVATE_KEY as string, 'hex')));
  
  const transferAmount = web3.LAMPORTS_PER_SOL * soltranser;

  const transactions = new web3.Transaction();

  // Transfer from main account to all sub-accounts
  for (const account of accounts) {
      transactions.add(
        web3.SystemProgram.transfer({
          fromPubkey: mainWallet.publicKey,
          toPubkey: account.publicKey,
          lamports: transferAmount
        })
      );
      // console.log(`Successfully transferred ${soltranser} SOL from main account to ${account.publicKey.toBase58()}`);
    } 

    await web3.sendAndConfirmTransaction(connection, transactions, [
      mainWallet,
    ]);

  // Transfer from all sub-accounts to project account
  for (const account of accounts) {
    try {
      const balance = await connection.getBalance(account.publicKey);
      const transferAmount = 0.003 * web3.LAMPORTS_PER_SOL; //transfer 0.003 SOL from all accounts to project
      
      if (balance >= transferAmount) {
        const transaction = new web3.Transaction().add(
          web3.SystemProgram.transfer({
            fromPubkey: account.publicKey,
            toPubkey: projectPublicKey,
            lamports: transferAmount
          })
        );
        await web3.sendAndConfirmTransaction(connection, transaction, [account]);
        console.log(`Successfully transferred ${transferAmount / web3.LAMPORTS_PER_SOL} SOL from ${account.publicKey.toBase58()} to project account`);
      } else {
        console.log(`Account ${account.publicKey.toBase58()} has insufficient balance, skipping transfer`);
      }
    } catch (error) {
      if (error instanceof web3.SendTransactionError) {
        console.error(`Transfer failed: ${error.message}`);
        console.error('Logs:', error.logs);
      } else {
        console.error(`Unknown error: ${error}`);
      }
    }
  }
}

main().catch(console.error);
