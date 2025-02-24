import React, { useEffect, useState } from "react";
import Product from "../components/Product";
import CreateProduct from "../components/CreateProduct";
import HeadComponent from '../components/Head';


import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Constants
const TWITTER_HANDLE = "LXHoover";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const { publicKey } = useWallet();
  const [products, setProducts] = useState([]);
  const isOwner = ( publicKey ? publicKey.toString() === process.env.NEXT_PUBLIC_OWNER_PUBLIC_KEY : false );
  const [creating, setCreating] = useState(false);
  

  useEffect(() => {
    if (publicKey) {
      fetch(`/api/fetchProducts`)
        .then(response => response.json())
        .then(data => {
          setProducts(data);
          console.log("Products", data);
        });
    }
  }, [publicKey]);


  const renderNotConnectedContainer = () => (
    <div>
      <img src="https://media.giphy.com/media/izgCxKfI2PnbO/giphy.gif" alt="emoji" />

      <div className="button-container">
        <WalletMultiButton className="cta-button connect-wallet-button" />
      </div>    
    </div>
  );

  const renderItemBuyContainer = () => (
    <div className="products-container">
      {products.map((product) => (
        <Product key={ product.id } product={ product } />
      ))}
    </div>
  );
  
  return (
    <div className="App">
      <HeadComponent/>
      <div className="container">
        <header className="header-container">
          <p className="header"> 🧥👜👟Solanian Thrift Store 👀😈</p>
          <p className="sub-text">The only thrift store catering to the Solana blockchain</p>

          {isOwner && (
            <button className="create-product-button" onClick={() => setCreating(!creating)}>
              { creating ? "Close" : "Upload Thrift!" }
            </button>
          )}
        </header>

        <main>
          {/* We only render the connect button if public key doesn't exist */}
          { creating && <CreateProduct/> }
          { publicKey ? renderItemBuyContainer(): renderNotConnectedContainer() }
        </main>

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src="twitter-logo.svg" />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with lots of ☕ by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
