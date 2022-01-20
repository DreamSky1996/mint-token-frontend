import { useEffect, useState } from 'react';
import './App.css';
import BTContractJson from './contracts/AnyswapV5ERC20.json';
import MTContractJson from './contracts/MintableToken.json';
import MintContractJson from './contracts/MintContract.json';
import { ethers } from 'ethers';

const btAddress = "0x5E9E06d8f09c2F0bAF2FCEA7b75a1435fAdf4D83";
const mtAddress = "0x4C9657ed39d4773f2f270A761ed356cb8a6Bb07E";
const mintContractAddress = "0xA3198B4e339EA2FfCaeD864Bd0A2996cdCA2c7a8";
const bt_abi = BTContractJson.abi; 
const mt_abi = MTContractJson.abi; 
const mc_abi = MintContractJson.abi; 

function App() {

  const [currentAccount, setCurrentAccount] = useState(null);
  const [approved, setApproved] = useState(false);
  const [mintAmount, setMintAmount] = useState(0);
  const [btBalance, setBtBalance] = useState("");
  const [mtBalance, setMtBalance] = useState("");
  const [mintEnable, setMintEnable] = useState(true);
  const [inputError, setInputError] = useState(false);

  const shorten = (str) => {
    if (str.length < 10) return str;
    return `${str.slice(0, 6)}...${str.slice(str.length - 4)}`;
};


  const checkWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have Metamask installed!");
      return;
    } else {
      console.log("Wallet exists! We're ready to go!")
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account);
      console.log("adsfafd");
      checkApproved();
      checkAcountBalance();
    } else {
      console.log("No authorized account found");
    }
  }

  const connectWalletHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Please install Metamask!");
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Found an account! Address: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(err)
    }
  }
  const checkAcountBalance = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(ethereum);
        const btContract = new ethers.Contract(btAddress, bt_abi, provider);
        const mtContract = new ethers.Contract(mtAddress, mt_abi, provider);

        let mt_bal = await mtContract.balanceOf(accounts[0]);
        let mt_balStr = ethers.utils.formatUnits(mt_bal, 9);
        let bt_bal = await btContract.balanceOf(accounts[0]);
        let bt_balStr = ethers.utils.formatUnits(bt_bal, 6);
        setBtBalance(bt_balStr);
        setMtBalance(mt_balStr);
      } else {
        console.log("Ethereum object does not exist");
      }
    } catch (err) {
      console.log(err);
    }
  }
  
  const mintHandler = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setMintEnable(false);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const mcContract = new ethers.Contract(mintContractAddress, mc_abi, signer);
        // let processedMintAmount = ethers.utils.parseUnits(mintAmount,6)
        let mintTxn = await mcContract.mint(mintAmount);

        await mintTxn.wait();
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${mintTxn.hash}`);
        checkAcountBalance();
        setMintEnable(true);
      } else {
        console.log("Ethereum object does not exist");
      }
    } catch (err) {
      console.log(err);
      setMintEnable(true);
    }
  }
  
  const approveHandler = async () => { 
    try {
      const { ethereum } = window;

      if (ethereum) {
        setMintEnable(false);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const btContract = new ethers.Contract(btAddress, bt_abi, signer);

        let approveTxn = await btContract.approve(mintContractAddress, '100000000000000000000000000000');

        await approveTxn.wait();
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${approveTxn.hash}`);
        setApproved(true);
        setMintEnable(true);
      } else {
        console.log("Ethereum object does not exist");
      }
      
    } catch (err) {
      console.log(err);
      setMintEnable(true);
    }
    
  }

  const checkApproved = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        const btContract = new ethers.Contract(btAddress, bt_abi, provider);

        let allowance = await btContract.allowance(accounts[0], mintContractAddress);
        setApproved(allowance.gt('0'));

      } else {
        console.log("Ethereum object does not exist");
        setApproved(false);
      }

    } catch (err) {
      setApproved(false);
      console.log(err);
    }
    
  }
  
  const connectWalletButton = () => {
    return (
      <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
        Connect Wallet
      </button>
    )
  }

  const mintButton = () => {
    return (
      <button onClick={mintHandler} className={mintEnable? 'cta-button mint-button': 'cta-button mint-button disabled'} disabled={!mintEnable}>
        { mintEnable ?"Mint" : "Processing..."}
      </button>
    )
  }
  const approveButton = () => {
    return (
      <button onClick={approveHandler} className={mintEnable ? 'cta-button mint-button' : 'cta-button mint-button disabled'} disabled={!mintEnable}>
        { mintEnable ?"Approve" : "Processing..."}
      </button>
    )
  }

  const mintOrApproveBtn = () => {
    return (
      <div>      
        <div className="d-flex justify-center">
          <div>
            <input className="amount_input" type="number" value={mintAmount} onChange={handleMintAmountChange}/>
          </div>
          <div>
            {
              approved? mintButton() : approveButton()
            }
          </div>
        </div>
        <div className="input_error">
          {inputError?'Sorry, you can only mint integer amount less than 9':''}            
        </div>  
      </div>
    )
  }

  const handleMintAmountChange = (e) => {
    setInputError(false)
    setMintEnable(true)
    if (checkInputError(e.target.value)) {
      setMintAmount(e.target.value)
    } else {
      setInputError(true)
    }    
  }
  const checkInputError = (val) => {
    if (Number.isInteger(Number(val)) && Number(val) < 10 && Number(val) >= 0) {
      return true
    } else {
      return false
    }
  }

  useEffect(() => {
    checkWalletIsConnected();
    // console.log("useEffect")
  }, []);

  useEffect(() => {
    checkWalletIsConnected();
  }, [currentAccount])

  return (
    <div className='main-app'>
      <div className="d-flex justify-center title">
        Mint Token
      </div>
      <div className="d-flex justify-center current_address">
        {currentAccount? "Connected Address: " + shorten(currentAccount) : ""}
      </div>
      <div>
        <div className="balance_container">
          <div className="trans_card">
            <div className="balance_title">
              Minted Token
            </div>
            <div className="balance_value">
              {mtBalance}
            </div>
          </div>

          <div className="trans_card">
            <div className="balance_title">
              Buy Token
            </div>
            <div className="balance_value">
              {btBalance}
            </div>
          </div>
        </div>        
        <div className="balance_container">
          <div className="trans_card">
            {currentAccount ? mintOrApproveBtn() : connectWalletButton()}
          </div>
        </div>        
      </div>
    </div>
  )
}

export default App;
