const {
	TransferTransaction,
	Client,
	ScheduleCreateTransaction,
	ScheduleDeleteTransaction,
	PrivateKey,
	Hbar
} = require("@hashgraph/sdk");

require('dotenv').config()

const myPrivateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
const myAccountId = process.env.MY_ACCOUNT_ID;

const accountId1 = process.env.ACCOUNT_ID_1;
const accountId2 = process.env.ACCOUNT_ID_2;

const client = Client.forTestnet();

client.setOperator(myAccountId, myPrivateKey);

async function main() {

	//Create a transaction to schedule
	const transferTransaction = new TransferTransaction()
		.addHbarTransfer(accountId1, Hbar.fromTinybars(-101))
		.addHbarTransfer(accountId2, Hbar.fromTinybars(101));

	//Schedule a transaction
	const scheduleTransaction = await new ScheduleCreateTransaction()
		.setScheduledTransaction(transferTransaction)
		.setAdminKey(myPrivateKey)
		.execute(client);

	//Get the receipt of the transaction
	const scheduledTxReceipt = await scheduleTransaction.getReceipt(client);

	//Get the schedule ID
	const scheduleId = scheduledTxReceipt.scheduleId;
	console.log("The schedule ID is " + scheduleId);

	//Get the scheduled transaction ID
	const scheduledTxId = scheduledTxReceipt.scheduledTransactionId;
	console.log("The scheduled transaction ID is " + scheduledTxId);

	//Create the transaction and sign with the admin key
	const transaction = await new ScheduleDeleteTransaction()
		.setScheduleId(scheduleId)
		.freezeWith(client)
		.sign(myPrivateKey);

	//Sign with the operator key and submit to a Hedera network
	const txResponse = await transaction.execute(client);

	//Get the transaction receipt
	const receipt = await txResponse.getReceipt(client);

	//Get the transaction status
	const transactionStatus = receipt.status;
	console.log("The transaction consensus status is " +transactionStatus);

	process.exit();
}

main();
