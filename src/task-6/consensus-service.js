const { Client, PrivateKey, TopicCreateTransaction, TopicMessageSubmitTransaction, AccountId, Hbar } = require("@hashgraph/sdk");

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

const client = Client.forTestnet()
	.setOperator(account1Id, account1)
	.setDefaultMaxTransactionFee(new Hbar(10));

const client2 = Client.forTestnet()
	.setOperator(account2Id, account2)
	.setDefaultMaxTransactionFee(new Hbar(10));

const client3 = Client.forTestnet()
	.setOperator(account3Id, account3)
	.setDefaultMaxTransactionFee(new Hbar(10));

async function createTopic() {
	let txResponse = await new TopicCreateTransaction()
		.setSubmitKey(account1.publicKey)
		.setSubmitKey(account2.publicKey)
		.execute(client);

	let receipt = await txResponse.getReceipt(client);
	return receipt.topicId.toString()
}

async function send_message(topicId, client) {
	const message = new Date().toISOString();

	const response = await new TopicMessageSubmitTransaction({
		topicId,
		message
	}).execute(client);

	let receipt = await response.getReceipt(client);
	console.log(`\nSent message to topic: ${topicId}, message: ${message}`);
	return receipt.status.toString()
}

async function main() {
	let topicId = await createTopic();
	console.log(`Created topic with id: ${topicId}`)
	console.log(`Look at topic messages: https://hashscan.io/testnet/topic/${topicId}`);
	await new Promise((resolve) => setTimeout(resolve, 5000));
	await send_message(topicId, client3).catch((error) => console.log(`Err: ${error}`));
	await send_message(topicId, client2)
	process.exit()
}

main();
