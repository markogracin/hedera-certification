const { AccountCreateTransaction, Hbar, Client, PrivateKey, KeyList, TransferTransaction } = require("@hashgraph/sdk")

require('dotenv').config()

// Acount 1
const account1 = PrivateKey.fromString(process.env.PRIVATE_KEY_1)
const account1Id = process.env.ACCOUNT_ID_1

// Acount 2
const account2 = PrivateKey.fromString(process.env.PRIVATE_KEY_2)

// Acount 3
const account3 = PrivateKey.fromString(process.env.PRIVATE_KEY_3)

// Acount 4
const account4Id = process.env.ACCOUNT_ID_4

const client = Client.forTestnet();
client.setOperator(account1Id, account1);

const publicKeys = [
	account1.publicKey,
	account2.publicKey,
	account3.publicKey
]

const newKey = new KeyList(publicKeys, 2)

async function createWallet(){
	let tx = await new AccountCreateTransaction()
		.setKey(newKey)
		.setInitialBalance(new Hbar(20))
		.execute(client);

	return (await tx.getReceipt(client)).accountId
}

async function spendFail(accId){
	const tx = await new TransferTransaction()
		.addHbarTransfer(accId, new Hbar(-10))
		.addHbarTransfer(account4Id, new Hbar(10))
		.freezeWith(client)
		.sign(account1);

	return await (await tx.execute(client)).getReceipt(client)
}

async function spend(accId){
	const tx = await (await new TransferTransaction()
		.addHbarTransfer(accId, new Hbar(-10))
		.addHbarTransfer(account4Id, new Hbar(10))
		.freezeWith(client)
		.sign(account1)).sign(account2);

	return await (await tx.execute(client)).getReceipt(client)
}

async function main(){
	const accountId = await createWallet();
	console.log(accountId)
	await spendFail(accountId).catch((err) => console.error(`Error: ${err}`))
	const tx = await spend(accountId);
	console.log(tx)
	process.exit()
}

main()
