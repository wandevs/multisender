import React, { useEffect, useMemo, useState } from 'react';
import { Input, AutoComplete, InputNumber, Button, notification, Progress } from 'antd';

import styled from 'styled-components';
import Wallet from '../pages/components/Wallet';
import { GithubOutlined, SendOutlined } from '@ant-design/icons';
import { tokenAddresses, getTokenInfo, commafy, WAN_TOKEN_ADDRESS, isAddress, multisend } from '../utils';
const BigNumber = require('bignumber.js');
import FileSelecton from '../pages/components/FileSelection';

const { TextArea } = Input;

function BasicLayout(props) {
  const [wallet, setWallet] = useState({});
  const [balance, setBalance] = useState(0);
  const [symbol, setSymbol] = useState('NativeCoin');
  const [totalSend, setTotalSend] = useState('0');
  const [txCount, setTxCount] = useState(0);
  const [tokenOptions, setTokenOptions] = useState([]);
  const [tokenAddress, setTokenAddress] = useState('');
  const [decimals, setDecimals] = useState(18);
  const [tokensInfo, setTokensInfo] = useState();
  const [inputText, setInputText] = useState('');
  const [receivers, setReceivers] = useState([]);
  const [amounts, setAmounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState();
  const [updateBalance, setUpdateBalance] = useState(0);

  useEffect(() => {
    const func = async () => {
      if (!wallet || !wallet.networkId || !tokenAddresses) {
        return;
      }

      console.log('update info');

      let ret;
      try {
        if (isAddress(tokenAddress) && !tokenAddresses[wallet.networkId.toString()].includes(tokenAddress)) {
          console.log('isAddress');
          ret = await getTokenInfo([...tokenAddresses[wallet.networkId.toString()], tokenAddress], wallet.networkId, wallet.address);
          console.log('ret', ret);
        } else {
          ret = await getTokenInfo([...tokenAddresses[wallet.networkId.toString()]], wallet.networkId, wallet.address);
        }
      } catch (err) {
        console.log('error', err);
      }
      

      if (!ret || ret.length === 0) {
        return;
      }

      if (isAddress(tokenAddress) && !tokenAddresses[wallet.networkId.toString()].includes(tokenAddress)) {
        console.log('set balance', commafy((new BigNumber(ret[tokenAddress].balance)).div(10 ** ret[tokenAddress].decimals)));
        setBalance(commafy((new BigNumber(ret[tokenAddress].balance)).div(10 ** ret[tokenAddress].decimals)));
        setDecimals(ret[tokenAddress].decimals);
        setSymbol(ret[tokenAddress].symbol);
      }

      let e = tokenAddress;

      if (isAddress(e)) {
        let tokensInfo = ret;
        if (tokensInfo && tokensInfo[e]) {
          if (e === WAN_TOKEN_ADDRESS) {
            setBalance(commafy((new BigNumber(tokensInfo[e].balance)).div(1e18)));
            setDecimals(18);
            setSymbol(nativeCoin);
          } else {
            setBalance(commafy((new BigNumber(tokensInfo[e].balance)).div(10 ** tokensInfo[e].decimals)));
            setDecimals(tokensInfo[e].decimals);
            setSymbol(tokensInfo[e].symbol);
          }
        }
      }

      console.debug('tokens', ret);
      setTokensInfo(ret);

      let options = tokenAddresses[wallet.networkId.toString()].map(v => {
        if (v === WAN_TOKEN_ADDRESS) {
          return {
            label: nativeCoin + ' (balance: ' + commafy((new BigNumber(ret[v].balance)).div(1e18)) + ') \t' + v,
            value: v
          };
        } else {
          return {
            label: ret[v].symbol + ' (balance: ' + commafy((new BigNumber(ret[v].balance)).div(10 ** ret[v].decimals)) + ') \t' + v,
            value: v
          };
        }
      });

      setTokenOptions(options);
    }
    func();
    let timer = setInterval(func, 10000);
    return ()=>{
      clearInterval(timer);
    }
  }, [wallet, tokenAddress]);

  useEffect(() => {
    let lines = inputText.split('\n');
    let tmpTotal = new BigNumber(0);
    let _receivers = [];
    let _amounts = [];
    if (lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].split(',').length === 2 && isAddress(lines[i].split(',')[0]) && !isNaN(lines[i].split(',')[1])) {
          tmpTotal = tmpTotal.plus(new BigNumber(lines[i].split(',')[1]));
          _receivers.push(lines[i].split(',')[0].toLowerCase());
          _amounts.push(new BigNumber(lines[i].split(',')[1]));
        }
      }

      setTotalSend(tmpTotal.toString());
      setReceivers(_receivers);
      setAmounts(_amounts);
      setTxCount(Math.ceil(_receivers.length / 200));
    }
  }, [inputText]);

  const onUploadCheck = (value, files) => {
    if (value) {
      var reader = new FileReader();
      reader.readAsText(files[0], 'UTF-8');
      reader.onload = (evt) => {
        var fileString = evt.target.result;
        setInputText(fileString);
      }
    }
  }

  const chainId = wallet.networkId;
  const nativeCoin = useMemo(()=>{
    if (!chainId) {
      return 'WAN';
    }
    switch(Number(chainId)) {
      case 888:
      case 999:
        return 'WAN';
      case 56:
      case 97:
        return 'BNB';
      case 128:
      case 256:
        return 'HT';
      case 1285:
        return 'MOVR';
      case 43114:
        return 'AVAX';
    }
  }, [chainId]);

  return (
    <Background>
      <Wallet setWallet={setWallet} wallet={wallet} />
      <Head>
        {/* <img src={require('../../public/favicon.png')} style={{ marginTop: "-8px" }} width="40" />
        <Title>MultiSender@Wanchain</Title> */}

        <WalletButton onClick={() => {
          wallet.resetApp().then(wallet.connect);
        }}>{!wallet.connected ? "Connect Wallet" : (wallet.address.slice(0, 6) + '...' + wallet.address.slice(-6))}</WalletButton>
        <GitHub>

          <GithubOutlined onClick={() => {
            window.open("https://github.com/wandevs/multisender")
          }} />
        </GitHub>
        {
          // Number(wallet.networkId) !== 1 && Number(wallet.networkId) !== 888 && <Testnet>Testnet</Testnet>
        }
      </Head>
      <H1>Welcome to MultiSender</H1>
      <H2>This supports sending native coin and tokens from wallet to multiple addresses.</H2>
      <H3>Network supported: Wanchain, BSC, Heco, Moonriver, Avalanche - C chain</H3>
      <Body>
        <Text>Input or select token address:</Text>
        <span>
          <SAutoComplete
            value={tokenAddress}
            onChange={(e) => {
              setTokenAddress(e.toLowerCase());
              if (isAddress(e)) {
                if (tokensInfo && tokensInfo[e]) {
                  if (e === WAN_TOKEN_ADDRESS) {
                    setBalance(commafy((new BigNumber(tokensInfo[e].balance)).div(1e18)));
                    setDecimals(18);
                    setSymbol(nativeCoin);
                  } else {
                    setBalance(commafy((new BigNumber(tokensInfo[e].balance)).div(10 ** tokensInfo[e].decimals)));
                    setDecimals(tokensInfo[e].decimals);
                    setSymbol(tokensInfo[e].symbol);
                  }
                }
              }
            }}
            allowClear
            // autoFocus
            options={tokenOptions} />
        </span>
        <DecimalBox>
          Decimals:
          <span>{" " + decimals}</span>
        </DecimalBox>
        <Text>Input or upload recipient addresses in CSV format:</Text>
        <FileSelecton type="file" id="input" style={{ marginLeft: "10px" }} onChange={(e) => {
          let value = e.target.value;
          let files = e.target.files;
          setTimeout(() => { onUploadCheck(value, files) }, 1000);
        }} />
        <STextArea rows={12} placeholder={
          `
          You can paste multiple addresses here, such as below:

          0x4cF0a877e906deAd748a41Ae7da8C220e4247d9E,1.01
          0x5560Af0f46d00fcEa88627A9df7a4798B1B10961,2000
          0xd409bc9f0Acc5A4c8a86FebB2d99BB87EF7E268d,0.5
          `
        } value={inputText} onChange={(e) => {
          setInputText(e.target.value);
        }} />
        <Text>Your balance: {balance + ' ' + symbol}, Receipent addresses: {receivers.length}, Total amount: {totalSend + ' ' + symbol} </Text>
        <ButtonLine>
          <SButton type="primary" loading={loading} icon={<SendOutlined />} disabled={txCount === 0} onClick={() => {
            if (!isAddress(tokenAddress)) {
              notification.open({ message: "Please fill token address" });
              return;
            }

            if (tokenAddress === WAN_TOKEN_ADDRESS) {
              if ((new BigNumber(totalSend)).plus(0.1).gt((new BigNumber(tokensInfo[WAN_TOKEN_ADDRESS].balance)).div(1e18))) {
                notification.open({ message: "Balance not enough" });
                return;
              }
            } else {
              if ((new BigNumber(totalSend)).gt((new BigNumber(tokensInfo[tokenAddress].balance)).div(10 ** tokensInfo[tokenAddress].decimals))) {
                notification.open({ message: "Balance not enough" });
                return;
              }

              if (!(new BigNumber(tokensInfo[WAN_TOKEN_ADDRESS].balance)).div(1e18).gt(new BigNumber(0.01))) {
                notification.open({ message: "Gas fee not enough" });
                return;
              }
            }

            setLoading(true);
            let key = Date.now();
            let args = {
              message: 'Waiting for transaction confirm...',
              duration: 0,
              key,
            };
            notification.open(args);
            multisend(wallet.networkId, wallet.address, wallet.web3, tokenAddress, decimals, receivers, amounts, new BigNumber(totalSend), setProgress).then(ret => {
              if (ret.success) {
                args = {
                  message: 'Transactions sent success',
                  description: JSON.stringify(ret.data, null, 2),
                  duration: 0,
                  key,
                };
                notification.open(args);
                setUpdateBalance(updateBalance+1);
              } else {
                args = {
                  message: 'Transactions sent failed',
                  description: JSON.stringify(ret.data, null, 2),
                  duration: 0,
                  key,
                };
                notification.open(args);
                setUpdateBalance(updateBalance+1);
              }
              setLoading(false);
            }).catch(err => {
              args = {
                message: 'Transactions sent failed',
                description: JSON.stringify(err, null, 2),
                key,
                duration: 0,
              };
              notification.open(args);
              setLoading(false);
              setUpdateBalance(updateBalance+1);
            });
          }}>Send</SButton>
        </ButtonLine>
        {
          progress !== undefined && loading && <Progress percent={progress} />
        }
      </Body>
    </Background>
  );
}

export default BasicLayout;

const Background = styled.div`
  background-image: url("background.jpg");
  min-width: 100%;
  min-height: 100%;
  background-size:100% 100%;
  color: black;
  padding-bottom: 40px;
`;

const ButtonLine = styled.div`
  text-align: center;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const Head = styled.div`
  padding: 20px;
`;


const GitHub = styled.span`
  float: right;
  font-size: 30px;
  padding-right: 20px;
  cursor: pointer;
  color: black;
`;

const Title = styled.span`
  color: black;
  font-size: 20px;
  font-weight: 700;
  padding: 15px;
`;

const WalletButton = styled.span`
  border-radius: 15px;
  background: #dcdcdc;
  color: black;
  height: 40px;
  width: 160px;
  padding: 8px;
  margin: 5px;
  float: right;
  text-align: center;
  cursor: pointer;
`;

const Testnet = styled(WalletButton)`
  background: #e4e4e4;
  font-size: 16px;
  width: auto;
  cursor: auto;
`;

const H1 = styled.h1`
  color: #555b5d;
  margin-top: 12vh;
  margin-left:auto;
  margin-right:auto;
  font-size: 40px;
  width: 100%;
  text-align: center;
`;

const H2 = styled.div`
  color: #616161;
  margin-top: 20px;
  margin-left:auto;
  margin-right:auto;
  font-size: 20px;
  width: 100%;
  text-align: center;
`;

const H3 = styled(H2)`
  font-size: 16px;
`;

const Body = styled.div`
  background: white;
  box-shadow: rgb(0 0 0 / 1%) 0px 0px 1px, rgb(0 0 0 / 14%) 0px 4px 8px, rgb(0 0 0 / 14%) 0px 16px 24px, rgb(0 0 0 / 10%) 0px 24px 32px;
  width: 800px;
  height: 640px;
  margin-top: 20px;
  border-radius: 20px;
  margin-left:auto;
  margin-right:auto;
  padding: 20px;
  margin-bottom: 40px;
  color: black;
`;

const Text = styled.div`
  font-size: 16px;
  margin: 10px;
`;

const SAutoComplete = styled(AutoComplete)`
  width: 80%;
  margin: 10px;

  div {
    border-radius: 15px!important;
    background: transparent!important;
    color: black!important;
    border: 1px solid #c3c3c3!important;
  }
`;

const DecimalBox = styled.span`
  margin: 10px;
  padding: 10px;
`;

const STextArea = styled(TextArea)`
  margin: 10px;
  width: 97%;

`;

const SButton = styled(Button)`
  margin-top: 20px;
`;