import React, {useState} from 'react';
import styled from 'styled-components';
import Wallet from '../pages/components/Wallet';

function BasicLayout(props) {
  const [wallet, setWallet] = useState({});
  console.log('wallet', wallet);
  return (
    <Background>
      <Wallet setWallet={setWallet} wallet={wallet}/>
      <Head>
        <Title>MultiSender@Wanchain</Title>
        <WalletButton onClick={()=>{
          wallet.resetApp().then(wallet.connect);
        }}>{!wallet.connected ? "Connect Wallet" : (wallet.address.slice(0,6) + '...' + wallet.address.slice(-6))}</WalletButton>
      </Head>
    </Background>
  );
}

export default BasicLayout;

const Background = styled.div`
  background-image: url("background.png");
  width: 100%;
  height: 100%;
  background-size:100% 100%;
  color: white;
`;

const Head = styled.div`
  padding: 20px;
`;

const Title = styled.span`
  color: #e0ebf1;
  font-size: 20px;
  font-weight: 700;
  padding: 15px;
`;

const WalletButton = styled.span`
  border-radius: 15px;
  background: #b50d58;
  height: 40px;
  width: 160px;
  padding: 8px;
  margin: 5px;
  float: right;
  text-align: center;
  cursor: pointer;
`;