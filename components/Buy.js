import React, { useState, useEffect, useMemo } from 'react';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { findReference, FindReferenceError } from '@solana/pay';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { InfinitySpin } from 'react-loader-spinner';
import IPFSDownload from './IpfsDownload';
import { addOrder, hasPurchased } from '../lib/api';

const STATUS = {
  Initial: 'Initial',
  Submitted: 'Submitted',
  Paid: 'Paid',
};

export default function Buy({ itemID }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const orderID = useMemo(() => Keypair.generate().publicKey, []); // Public key used to identify the order

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(STATUS.Initial); // Tracking transaction status
  const [item, setItem] = useState(null); // IPFS hash & filename of the purchased item

  const order = useMemo(
    () => ({
      buyer: publicKey.toString(),
      orderID: orderID.toString(),
      itemID: itemID,
    }),
    [publicKey, orderID, itemID]
  );

  // Fetch the transaction object from the server (done to avoid tempering)
  const processTransaction = async () => {
    setLoading(true);
    const txResponse = await fetch('../api/createTransaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });
    const txData = await txResponse.json();

    const tx = Transaction.from(Buffer.from(txData.transaction, 'base64'));
    console.log('Tx data is', tx);

    // Attempt to send transaction to the network
    try {
      const txHash = await sendTransaction(tx, connection);
      console.log(
        `Transaction sent: https://solscan.io/tx/${txHash}?cluster=devnet`
      );
      setStatus(STATUS.Submitted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {

    // Check if address already has purchased this item
    // If so, fetch the item and set paid to true
    // Async func to avoid blocking the UI
    async function checkPurchased() {
      const purchased = await hasPurchased(publicKey, itemID);
      if (purchased) {
        setStatus(STATUS.Paid);
        console.log("Address has already purchased this item!");
      }
    }
    checkPurchased();
  }, [publicKey, itemID]);





  useEffect(() => {
    // Check if transaction was confirmed
    if (status === STATUS.Submitted) {
      setLoading(true);
      const interval = setInterval(async () => {
        try {
          // Look for orderID on the blockchain
          const result = await findReference(connection, orderID);
          console.log('Finding tx reference', result.confirmationStatus);

          // If the transaction is confirmed or finalized, the payment was successful
          if (result.confirmationStatus === 'confirmed' || result.confirmationStatus === 'finalized') {
            clearInterval(interval);
            setStatus(STATUS.Paid);
            setLoading(false);
            addOrder(order);
            alert('Thank you for your purchase!');
          }
        } catch (e) {
          if (e instanceof FindReferenceError) {
            return null;
          }
          console.error('Unknown error', e);
        } finally {
          setLoading(false);
        }
      }, 1000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [status]);

  if (!publicKey) {
    return (
      <div>
        <p>You need to connect your wallet to make transactions</p>
      </div>
    );
  }

  if (loading) {
    return <InfinitySpin color="gray" />;
  }

  return (
    <div>
      {status === STATUS.Paid ? (
        <IPFSDownload
          filename="thrift_items"
          hash="QmZJUV49hLEWjdHWLzejehVKcG7gGrKSWFX1RVLRtbxFCM"
          cta="Download thrifts"
        />
      ) : (
        <button
          disabled={loading}
          className="buy-button"
          onClick={processTransaction}
        >
          Buy now 🛍️
        </button>
      )}
    </div>
  );
}
