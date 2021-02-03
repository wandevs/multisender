import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Wallet from '../pages/components/Wallet';
import { Input, AutoComplete, InputNumber, Button } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { tokenAddresses, getTokenInfo, commafy, WAN_TOKEN_ADDRESS, isAddress } from '../utils';
const BigNumber = require('bignumber.js');

const { TextArea } = Input;

function BasicLayout(props) {
  const [wallet, setWallet] = useState({});
  const [type, setType] = useState('CSV');
  const [balance, setBalance] = useState(0);
  const [symbol, setSymbol] = useState('WAN');
  const [totalSend, setTotalSend] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [tokenOptions, setTokenOptions] = useState([]);
  const [tokenAddress, setTokenAddress] = useState('');
  const [decimals, setDecimals] = useState(18);
  const [tokensInfo, setTokensInfo] = useState();

  useEffect(()=>{
    const func = async ()=>{
      let ret;
      if (isAddress(tokenAddress)) {
        ret = await getTokenInfo([...tokenAddresses, tokenAddress], wallet.chainId, wallet.address);
      } else {
        ret = await getTokenInfo([...tokenAddresses], wallet.networkId, wallet.address);
      }

      if (!ret || ret.length === 0) {
        return;
      }

      

      console.log('tokens', ret);
      setTokensInfo(ret);

      let options = tokenAddresses.map(v=>{
        if (v === WAN_TOKEN_ADDRESS) {
          return {
            label: 'WAN' + ' (balance: ' + commafy((new BigNumber(ret[v].balance)).div(1e18))  + ') ' + v,
            value: v
          };
        } else {
          return {
            label: ret[v].symbol + ' (balance: ' + commafy((new BigNumber(ret[v].balance)).div(10 ** ret[v].decimals))  + ') ' + v,
            value: v
          };
        }
      });

      setTokenOptions(options);
    }
    func();
  }, [wallet, tokenAddress]);

  console.log('wallet', wallet);
  return (
    <Background>
      <Wallet setWallet={setWallet} wallet={wallet} />
      <Head>
        <Title>MultiSender@Wanchain</Title>
        
        <WalletButton onClick={() => {
          wallet.resetApp().then(wallet.connect);
        }}>{!wallet.connected ? "Connect Wallet" : (wallet.address.slice(0, 6) + '...' + wallet.address.slice(-6))}</WalletButton>
        <GitHub onClick={()=>{
          window.open("https://github.com/wandevs/multisender")
        }}>
          {
            Number(wallet.networkId) === 3 && "Testnet"
          }
          <GithubOutlined/>
        </GitHub>
      </Head>
      <H1>Welcome to MultiSender</H1>
      <H2>We support send token in wallet to multi addresses on Wanchain Mainnet or Testnet.</H2>
      <Body>
        <Text>Input or select token address:</Text>
        <span>
        <SAutoComplete
          value={tokenAddress}
          onChange={(e)=>{
            setTokenAddress(e);
            if (isAddress(e)) {
              if (tokensInfo && tokensInfo[e]) {
                if (e === WAN_TOKEN_ADDRESS) {
                  setBalance(commafy((new BigNumber(tokensInfo[e].balance)).div(1e18)));
                  setDecimals(18);
                  setSymbol('WAN');
                } else {
                  setBalance(commafy((new BigNumber(tokensInfo[e].balance)).div(10 ** tokensInfo[e].decimals)));
                  setDecimals(tokensInfo[e].decimals);
                  setSymbol(tokensInfo[e].symbol);
                }
              }
            }
          }}
          allowClear
          autoFocus
          options={tokenOptions} />
        </span>
        <DecimalBox>
        Decimals:
        </DecimalBox>
        <span><InputNumber value={decimals} readOnly/></span>
        <Text>Input receiver in CSV format:</Text>
        <STextArea rows={14} placeholder={
          `
          0x4cF0a877e906deAd748a41Ae7da8C220e4247d9E,1.01
          0x5560Af0f46d00fcEa88627A9df7a4798B1B10961,2000
          0xd409bc9f0Acc5A4c8a86FebB2d99BB87EF7E268d,0.5
          `
        }/>
        <Text>Wallet Balance: {balance + ' ' + symbol}, Total send: {totalSend + ' ' + symbol}, Need tx count: {txCount} </Text>
        <ButtonLine>
          <Button type="primary" style={{marginRight: "20px"}}>Approve</Button>
          <Button type="primary">Start Send</Button>
        </ButtonLine>
      </Body>
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

const ButtonLine = styled.div`
  text-align: center;
  width: 100%;
  margin-top: 10px;
`;

const Head = styled.div`
  padding: 20px;
`;

const GitHub = styled.span`
  float: right;
  font-size: 30px;
  padding-right: 20px;
  cursor: pointer;
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

const H1 = styled.h1`
  color: white;
  margin-top: 120px;
  margin-left:auto;
  margin-right:auto;
  font-size: 40px;
  width: 100%;
  text-align: center;
`;

const H2 = styled.div`
  color: white;
  margin-top: 20px;
  margin-left:auto;
  margin-right:auto;
  font-size: 20px;
  width: 100%;
  text-align: center;
`;

const Body = styled.div`
  background: #0053868a;
  width: 800px;
  height: 600px;
  margin-top: 20px;
  border-radius: 20px;
  margin-left:auto;
  margin-right:auto;
  padding: 20px;
`;

const Text = styled.div`
  font-size: 16px;
  margin: 10px;
`;

const TextInLine = styled.span`
  font-size: 16px;
  margin: 10px;
`;

const SAutoComplete = styled(AutoComplete)`
  width: 70%;
  margin: 10px;
`;

const DecimalBox = styled.span`
  margin: 10px;
  padding: 10px;
`;

const STextArea = styled(TextArea)`
  margin: 10px;
  width: 97%;
`;
