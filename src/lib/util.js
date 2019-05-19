import * as nem from 'nem2-sdk';
import indentStr from 'indent-string';

/**
 * TransferTransaction:
 *   Recipient: SDFVRV-CE2TY7-UCMR6S-WJX3KD-IVD3HW-YMTZUU-XIEP
 *   Message: 19c3fc060f9ae9900dcaae627c41f4214fa8effa02d83d583c97f5b41be19e3f
 *   Mosaics:
 *     - MosaicId: 192e62ed52e0fce3
 *       Amount: 1
 */
function formatTransferTransaction(tx) {
  let text = '';
  text += `TransferTransaction:\n`;
  text += `  Recipient: `;
  if (tx.recipient instanceof nem.Address) {
    text += `${tx.recipient.pretty()}\n`;
  } else {
    text += `${tx.recipient.toHex()}\n`;
  }
  text += tx.message.payload && tx.message.payload.length > 0 ?
    `  Message: ${tx.message.payload}\n` :
    ''
  ;
  if (tx.mosaics.length > 0) {
    text += `  Mosaics:\n`;
    text += tx.mosaics.map(mosaic => {
      const idType = mosaic.id instanceof nem.MosaicId ? 'MosaicId' : 'NamespaceId';
      return `    - ${idType}: ${mosaic.id.toHex()}\n` + `      Amount: ${mosaic.amount.compact()}`;
    }).join("\n") + `\n`;
  }
  return text;
}

/**
 *
 */
function formatRegisterNamespaceTransaction(tx) {
  let text = '';
  text += 'RegisterNamespaceTransaction: NamespaceName:' + tx.namespaceName;
  if (tx.namespaceType === nem.NamespaceType.RootNamespace && tx.duration !== undefined) {
    text += ' NamespaceType:RootNamespace Duration:' + tx.duration.compact();
  } else if (tx.parentId !== undefined) {
    text += ' NamespaceType:SubNamespace ParentId:' + tx.parentId.toHex();
  }
  return text;
}

/**
 * MosaicDefinitionTransaction:
 *   MosaicName: 29be4f611c23ef73
 *   Duration: Infinity
 *   Divisibility: 0
 *   SupplyMutable: true
 *   Transferable: true
 *   LevyMutable: false
 */
function formatMosaicDefinitionTransaction(tx) {
  let text = '';
  text += `MosaicDefinitionTransaction:\n` +
    `  MosaicName: ${tx.mosaicId.toHex()}\n` +
    `  Duration: ${(tx.mosaicProperties.duration ? tx.mosaicProperties.duration.compact() : 'Infinity')}\n` +
    `  Divisibility: ${tx.mosaicProperties.divisibility}\n` +
    `  SupplyMutable: ${tx.mosaicProperties.supplyMutable}\n` +
    `  Transferable: ${tx.mosaicProperties.transferable}\n` +
    `  LevyMutable: ${tx.mosaicProperties.levyMutable}\n`
  ;
  return text;
}

/**
 * MosaicSupplyChangeTransaction:
 *   MosaicId: 192e62ed52e0fce3
 *   Direction: Increase
 *   Delta: 1000000
 */
function formatMosaicSupplyChangeTransaction(tx) {
  let text = '';
  text += `MosaicSupplyChangeTransaction:\n` +
    `  MosaicId: ${tx.mosaicId.toHex()}\n`;
  text += `  Direction: ${(tx.direction === nem.MosaicSupplyType.Increase ? 'Increase' : 'Decrease')}\n`;
  text += `  Delta: ${tx.delta.compact()}\n`;
  return text;
}

/**
 * ModifyMultisigAccountTransaction:
 *   MinApprovalDelta:1
 *   MinRemovalDelta:1
 *   Modifications:
 *     - Type: Add
 *       CosignatoryPublicAccount: SDQYQM-DWHMKY-L574MQ-7XEKJD-JTNBUM-NSMV4P-RTCL
 *     - Type:Add
 *       CosignatoryPublicAccount: SAGN6H-HVBJX4-QFXDIJ-B4XPQ6-TTOMMN-2JU6GF-4VRQ
 *   Signer: SBFRBT-Y5YPZ3-4HYO3Y-RH5272-G25LEY-KY4EEE-OVFY
 *   Deadline: 2019-05-13
 *   Hash: F44EEE880FC38884B5ADFF4BCC6D0123F0CA1977DDA3AB7213691D5F2C4A63C0
 */
function formatModifyMultisigAccountTransaction(tx) {
  let text = '';
  text += `ModifyMultisigAccountTransaction:\n`
    + `  MinApprovalDelta: ${tx.minApprovalDelta}\n`
    + `  MinRemovalDelta: ${tx.minRemovalDelta}\n`
  ;
  text += `  Modifications:\n`
  tx.modifications.map((modification) => {
    text += `    - Type: ${(modification.type === nem.MultisigCosignatoryModificationType.Add ? 'Add' : 'Remove')}\n`;
    text += `      CosignatoryPublicAccount: ${modification.cosignatoryPublicAccount.address.pretty()}\n`;
  });
  return text;
}

/**
 *
 */
function formatAggregateTransaction(tx) {
  let text = '';
  text += `AggregateTransaction:\n`;
  if (tx.cosignatures.length > 0) {
    text += `Cosignatures:\n`;
  }
  tx.cosignatures.map((cosignature) => {
    text += '  Signer:' + cosignature.signer.address.pretty();
  });
  if (tx.innerTransactions.length > 0) {
    text += `  InnerTransactions:\n`;
    tx.innerTransactions.map(innerTx => {
      text += formatTx2Text(innerTx, 4);
    });
  }
  return text;
}

/**
 * TODO:
 */
function formatLockFundsTransaction(tx) {
  let text = '';
  text += 'LockFundsTransaction: ' +
      'Mosaic:' + tx.mosaic.id.toHex() + ':' + tx.mosaic.amount.compact() +
      ' Duration:' + tx.duration.compact() +
      ' Hash:' + tx.hash;
  return text;
}

/**
 * TODO:
 */
function formatSecretLockTransaction(tx) {
  let text = '';
  text += 'SecretLockTransaction: ' +
      'Mosaic:' + tx.mosaic.id.toHex() + ':' + tx.mosaic.amount.compact() +
      ' Duration:' + tx.duration.compact() +
      ' HashType:' + (tx.hashType === 0 ? 'SHA3_512' : ' unknown') +
      ' Secret:' + tx.secret +
      ' Recipient:' + tx.recipient.pretty();
  return text;
}

/**
 * TODO:
 */
function formatSecretProofTransaction(tx) {
  let text = '';
  text += 'SecretProofTransaction: ' +
    'HashType:' + (tx.hashType === 0 ? 'SHA3_512' : ' unknown') +
    ' Secret:' + tx.secret +
    ' Proof:' + tx.proof;
  return text;
}

/**
 * TODO:
 */
function formatCommonTransaction(tx) {
  return `  ${tx.signer ? 'Signer: ' + tx.signer.address.pretty() : ''}\n` +
`  Deadline: ${tx.deadline.value.toLocalDate().toString()}\n` +
`  ${tx.transactionInfo && tx.transactionInfo.hash ? 'Hash: ' + tx.transactionInfo.hash : ''}`;
}

export function formatTx2Text(tx, indent = 0) {
  let formattedTx = '';
  switch (true) {
    case tx instanceof nem.TransferTransaction:
      formattedTx = formatTransferTransaction(tx);
      break;
    case tx instanceof nem.RegisterNamespaceTransaction:
      formattedTx = formatRegisterNamespaceTransaction(tx);
      break;
    case tx instanceof nem.MosaicDefinitionTransaction:
      formattedTx = formatMosaicDefinitionTransaction(tx);
      break;
    case tx instanceof nem.MosaicSupplyChangeTransaction:
      formattedTx = formatMosaicSupplyChangeTransaction(tx);
      break;
    case tx instanceof nem.ModifyMultisigAccountTransaction:
      formattedTx = formatModifyMultisigAccountTransaction(tx);
      break;
    case tx instanceof nem.AggregateTransaction:
      formattedTx = formatAggregateTransaction(tx);
      break;
    case tx instanceof nem.LockFundsTransaction:
      formattedTx = formatLockFundsTransaction(tx);
      break;
    case tx instanceof nem.SecretLockTransaction:
      formattedTx = formatSecretLockTransaction(tx);
      break;
    case tx instanceof nem.SecretProofTransaction:
      formattedTx = formatSecretProofTransaction(tx);
      break;
    default:
      throw new Error(`Unsupported Transaction Instance: ${tx.type}`)
      break;
  }
  formattedTx += formatCommonTransaction(tx);
  return indent > 0 ? indentStr(formattedTx, indent) : formattedTx;
}
