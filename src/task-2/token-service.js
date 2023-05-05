const { PrivateKey, Client, TokenCreateTransaction, Hbar, TokenType, TokenSupplyType, TokenAssociateTransaction, TransferTransaction, TokenPauseTransaction, TokenUnpauseTransaction, CustomRoyaltyFee, CustomFixedFee, TokenMintTransaction } = require("@hashgraph/sdk");

require('dotenv').config()

// Acount 1
const account1 = PrivateKey.fromString(process.env.PRIVATE_KEY_1)
const account1Id = process.env.ACCOUNT_ID_1

// Acount 2
const account2 = PrivateKey.fromString(process.env.PRIVATE_KEY_2)
const account2Id = process.env.ACCOUNT_ID_2

// Acount 3
const account3 = PrivateKey.fromString(process.env.PRIVATE_KEY_3)
const account3Id = process.env.ACCOUNT_ID_3

const client = Client.forTestnet();
client.setOperator(account1Id, account1);
client.setDefaultMaxTransactionFee(new Hbar(100));

async function createToken() {
	const customFee = new CustomRoyaltyFee({
		feeCollectorAccountId: account2Id,
		fallbackFee: new CustomFixedFee().setHbarAmount(new Hbar(200)),
		numerator: 10,
		denominator: 100
	})

	const tx = await new TokenCreateTransaction()
		.setTokenName("MGToken")
		.setTokenSymbol("MGT")
		.setTokenType(TokenType.NonFungibleUnique)
		.setSupplyType(TokenSupplyType.Finite)
		.setInitialSupply(0)
		.setMaxSupply(5)
		.setDecimals(0)
		.setTreasuryAccountId(account1Id)
		.setAdminKey(account1)
		.setPauseKey(account1)
		.setSupplyKey(account2)
		.setCustomFees([customFee])
		.freezeWith(client)
		.sign(account1);

	const txSubmit = await tx.execute(client);
	const receipt = await txSubmit.getReceipt(client);
	console.log(`Created token: ${receipt.tokenId}`);
	return receipt.tokenId.toString();
}

async function allowReceive(tokenId, accountId, accountKey) {
	const tx = await new TokenAssociateTransaction()
		.setAccountId(accountId)
		.setTokenIds([tokenId])
		.freezeWith(client)
		.sign(accountKey);

	const txSubmit = await tx.execute(client);
	return await txSubmit.getReceipt(client)
}

async function mintToken(tokenId) {
	const receipts = [];

	for await (const iterator of Array.apply(null, Array(5)).map((x, i) => i)) {
		const mintTx = new TokenMintTransaction()
			.setTokenId(tokenId)
			.setMetadata([Buffer.from([`NFT ${iterator}`])])
			.freezeWith(client);

		const mintTxSign = await mintTx.sign(account2);
		const mintTxSubmit = await mintTxSign.execute(client);
		const mintRx = await mintTxSubmit.getReceipt(client);

		receipts.push(mintRx);
	}

	return receipts;
}

async function transferTokens(tokenId){
	const txId = await new TransferTransaction()
		.addNftTransfer(tokenId, 2, account1Id, account3Id)
		.execute(client);

	return (await txId.getReceipt(client))
}

async function main() {
	let tokenId = await createToken();

	// Allow account3 and account4 to recive token
	await allowReceive(tokenId, account3Id, account3);

	await mintToken(tokenId);
	const tx = await transferTokens(tokenId);
	console.log(tx)

	process.exit()
}

main()
