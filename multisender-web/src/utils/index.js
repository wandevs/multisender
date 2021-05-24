const { aggregate } = require('@makerdao/multicall');
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const abi = require('../assets/UpgradebleStormSender.json').abi;

const MULTI_CALL_ADDR = {
  '1': '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441',
}

const RPC_URL = {
  '1': 'https://mainnet.infura.io/v3/6b6aaec489854ba9bcf2c40666ca8176',
}

export const MULTISENDER_SC_ADDR = '0x3a471089DC0a91676b1dbd62Da7e49DAB6b94D00';

export const tokenAddresses = {
  '1': [
    '0x000000000000000000000000000000000000beef',
  ],
}

export const WAN_TOKEN_ADDRESS = '0x000000000000000000000000000000000000beef';

export const getTokenInfo = async (tokens, chainId, account) => {
  console.debug('getTokenInfo', tokens, chainId, account);
  const config = {
    rpcUrl: RPC_URL[chainId],
    multicallAddress: MULTI_CALL_ADDR[chainId],
  }
  if (!tokens || tokens.length === 0 || !chainId || !account) {
    return;
  }

  // balance
  let calls = tokens.map(v => {
    if (v === WAN_TOKEN_ADDRESS) {
      return {
        call: ['getEthBalance(address)(uint256)', account],
        returns: [[v + '_balance', val => val.toString()]]
      }
    } else {
      return {
        target: v,
        call: ['balanceOf(address)(uint256)', account],
        returns: [[v + '_balance', val => val.toString()]]
      }
    }
  });

  // symbol
  calls = calls.concat(tokens.map(v => {
    return v !== WAN_TOKEN_ADDRESS && {
      target: v,
      call: ['symbol()(string)'],
      returns: [[v + '_symbol', val => val]]
    }
  }))

  // decimals
  calls = calls.concat(tokens.map(v => {
    return v !== WAN_TOKEN_ADDRESS && {
      target: v,
      call: ['decimals()(uint8)'],
      returns: [[v + '_decimals', val => val]]
    }
  }))

  // allownce
  calls = calls.concat(tokens.map(v => {
    return v !== WAN_TOKEN_ADDRESS && {
      target: v,
      call: ['allowance(address,address)(uint256)', account, MULTISENDER_SC_ADDR],
      returns: [[v + '_allowance', val => val.toString()]]
    }
  }))

  calls = calls.filter(v => {
    return v !== false
  });

  try {
    let ret = await aggregate(calls, config);
    let storage = {};

    for (const key in ret.results.transformed) {
      let keys = key.split('_');
      switch (keys.length) {
        case 2:
          if (!storage[keys[0]]) {
            storage[keys[0]] = {};
          }
          storage[keys[0]][keys[1]] = ret.results.transformed[key];
          break;
        default:
          break;
      }
    }
    return storage;
  } catch (err) {
    console.log('error', err);
  }
}

export const multisend = async (chainId, from, web3, tokenAddress, decimals, receivers, amounts, totalAmount, setProgress) => {
  console.debug('multisend input', chainId, from, web3, tokenAddress, receivers, amounts, totalAmount);
  if (!from || !web3 || !chainId || !tokenAddress || !receivers || !amounts || !totalAmount) {
    return { success: false, data: 'Params error' };
  }

  let waitArray = [];

  let payAmount = '0x' + (new BigNumber(totalAmount.multipliedBy(10 ** decimals).toFixed(0))).toString(16);

  setProgress(0);

  if (tokenAddress !== WAN_TOKEN_ADDRESS) {
    waitArray.push(await approve(MULTISENDER_SC_ADDR, tokenAddress, payAmount, from, web3));
  }

  const sc = new web3.eth.Contract(abi, MULTISENDER_SC_ADDR);
  console.debug('multisend', payAmount, MULTISENDER_SC_ADDR);


  for (let i = 0; i < Math.ceil(receivers.length / 200); i++) {
    let subRecivers = receivers.slice(i * 200, (i + 1) * 200);
    let subAmounts = amounts.slice(i * 200, (i + 1) * 200);
    subAmounts = subAmounts.map(v => {
      return '0x' + (new BigNumber(v).multipliedBy(10 ** decimals)).toString(16);
    });

    let value = new BigNumber(0);
    if (tokenAddress === WAN_TOKEN_ADDRESS) {
      subAmounts.forEach(v=>{
        value = value.plus(new BigNumber(v));
      })
    }

    let gas = 200000 + 60000 * subRecivers.length;
    if (gas > 8e6) {
      gas = 8e6;
    }

    let data = await sc.methods.multisendToken(tokenAddress, subRecivers, subAmounts).encodeABI();
  
    const params = {
      to: MULTISENDER_SC_ADDR,
      data,
      value: '0x' + value.toString(16),
      gasPrice: "0x2540BE400",
      from
    };
  
    if (!window.injectWeb3) {
      params.gas = '0x' + gas.toString(16);
      params.gasPrice = undefined;
    } else {
      params.gasLimit = '0xF4240';
    }
  
    waitArray.push(web3.eth.sendTransaction(params));
    setProgress(((i + 1) * 100 /Math.ceil(receivers.length / 200)).toFixed(0));
  }

  let txID = await Promise.all(waitArray);

  txID = txID.map(v=>{
    if (v.transactionHash) {
      return {
        txHash: v.transactionHash,
        status: v.status
      };
    } else {
      return v;
    }
  });

  return { success: true, data: txID };
}

const approve = async (scAddr, tokenAddr, amount, owner, web3) => {
  console.debug('approve called', amount);
  if (!tokenAddr || !web3) {
    return { success: false, data: "approve input params error" };
  }
  if (tokenAddr !== '0x0000000000000000000000000000000000000000') {
    const abi = [{ "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }];
    let token = new web3.eth.Contract(abi, tokenAddr);

    let allowance = await token.methods.allowance(owner, scAddr).call();
    allowance = new BigNumber(allowance);

    if (allowance.toString() !== '0' && amount.toString() !== '0') {
      if (allowance.gte(new BigNumber(amount))) {
        return { success: true };
      }

      let ret = await approve(scAddr, tokenAddr, 0, owner, web3);
      if (!ret || !ret.status) {
        return { success: false, data: 'approve 0 failed' };
      }
    }

    let data;
    if (amount.toString() === '0') {
      data = await token.methods.approve(scAddr, '0x0').encodeABI();
    } else {
      data = await token.methods.approve(scAddr, '0xf000000000000000000000000000000000000000000000000000000000000000').encodeABI();
    }

    const params = {
      to: tokenAddr,
      data,
      value: 0,
      gasPrice: "0x2540BE400",
      from: owner
    };

    if (!window.injectWeb3) {
      params.gas = '0x' + web3.utils.toBN(200000).toString('hex');
      params.gasPrice = undefined;
    } else {
      params.gasLimit = '0xF4240';
    }

    let txID = await web3.eth.sendTransaction(params);
    if (!txID || !txID.status) {
      return { success: false, data: 'Approve failed:' + txID.transactionHash };
    }
    return { success: true, data: txID.transactionHash };
  }
  return { success: true };
}


export function commafy(num) {
  if (!num) {
    return '--';
  }

  num = num.toString();

  if (!num.includes('.')) {
    num += '.0';
  } else {
    if (num.indexOf('.') > 3) {
      num = Number(num).toFixed(1);
    } else if (num.length > 5) {
      num = Number(num).toFixed(4);
    }
  }

  return num.replace(/(\d)(?=(\d{3})+\.)/g, function ($0, $1) {
    return $1 + ",";
  });
}

export const isAddress = function (address) {
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    // check if it has the basic requirements of an address
    return false;
  } else if (/^(0x)?[0-9a-f]{40}$/.test(address.toLowerCase())) {
    // If it's all small caps or all all caps, return true
    return true;
  }

  return false;
}