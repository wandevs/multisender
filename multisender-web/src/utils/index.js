const { aggregate } = require('@makerdao/multicall');
const Web3 = require('web3');
const BigNumber = require('bignumber.js');

const MULTI_CALL_ADDR = {
  '1': '0xBa5934Ab3056fcA1Fa458D30FBB3810c3eb5145f',
  '3': '0x14095a721Dddb892D6350a777c75396D634A7d97',
}

const RPC_URL = { 
  '1': 'https://gwan-ssl.wandevs.org:56891',
  '3': 'https://gwan-ssl.wandevs.org:46891',
}

export const MULTISENDER_SC_ADDR = '0xf82facd9c905abc3484fc2165c7538c50ef1629d';

export const tokenAddresses = {
  '1': [
    '0x000000000000000000000000000000000000beef',
    '0xd15e200060fc17ef90546ad93c1c61bfefdc89c7',
    '0x81862b7622ced0defb652addd4e0c110205b0040',
    '0xc6f4465a6a521124c8e3096b62575c157999d361',
    '0xdabd997ae5e4799be47d6e69d9431615cba28f48',
    '0xe3ae74d1518a76715ab4c7bedf1af73893cd435a',
    '0x06da85475f9d2ae79af300de474968cd5a4fde61',
    '0x11e77e27af5539872efed10abaa0b408cfd9fbbd',
    '0x52a9cea01c4cbdd669883e41758b8eb8e8e2b34b',
    '0x8b9f9f4aa70b1b0d586be8adfb19c1ac38e05e9a',
    '0x73eaa7431b11b1e7a7d5310de470de09883529df',
  ],
  '3': [
    '0x000000000000000000000000000000000000beef',
    '0x07fdb4e8f8e420d021b9abeb2b1f6dce150ef77c',
    '0x57195b9d12421e963b720020483f97bb7ff2e2a6',
    '0x48344649b9611a891987b2db33faada3ac1d05ec',
    '0x974ab46969d3d9a4569546051a797729e301d6eb',
    '0x3d5950287b45f361774e5fb6e50d70eea06bc167',
    '0x0a3b082c1ceda3d35e5bad2776c5a5236044a03d',
  ]
}

export const WAN_TOKEN_ADDRESS = '0x000000000000000000000000000000000000beef';

export const getTokenInfo = async (tokens, chainId, account) => {
  const config = {
    rpcUrl: RPC_URL[chainId],
    multicallAddress: MULTI_CALL_ADDR[chainId],
  }
  console.log('getTokenInfo', tokens, chainId, account);
  if (!tokens || tokens.length === 0 || !chainId || !account) {
    return;
  }

  // balance
  let calls = tokens.map(v=>{
    if (v === WAN_TOKEN_ADDRESS) {
      return {
        call: ['getEthBalance(address)(uint256)', account],
        returns: [[v+'_balance', val => val.toString()]]
      }
    } else {
      return {
        target: v,
        call: ['balanceOf(address)(uint256)', account],
        returns: [[v+'_balance', val => val.toString()]]
      }
    }
  });

  // symbol
  calls = calls.concat(tokens.map(v=>{
    return v !== WAN_TOKEN_ADDRESS && {
      target: v,
      call: ['symbol()(string)'],
      returns: [[v+'_symbol', val => val]]
    }
  }))

  // decimals
  calls = calls.concat(tokens.map(v=>{
    return v !== WAN_TOKEN_ADDRESS && {
      target: v,
      call: ['decimals()(uint8)'],
      returns: [[v+'_decimals', val => val]]
    }
  }))

  // allownce
  calls = calls.concat(tokens.map(v=>{
    return v !== WAN_TOKEN_ADDRESS && {
      target: v,
      call: ['allowance(address,address)(uint256)', account, MULTISENDER_SC_ADDR],
      returns: [[v+'_allowance', val => val.toString()]]
    }
  }))

  calls = calls.filter(v=>{
    return v !== false
  });

  console.log('aggregate', calls, config);

  try {
    let ret = await aggregate(calls, config);
    console.log('aggregate return', ret);
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