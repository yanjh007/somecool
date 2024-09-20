const CHA_ROUND = 10;
const BLK_SIZE  = 64;
const BLK_HEAD  = new Uint32Array([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);

// Utility functions
const rotate = (v, c) => (v << c) | (v >>> (32 - c));

const randomArray = (n) => new Uint8Array(n).map(() => Math.floor(256 * Math.random()));

// Convert hex string to Uint8Array // Convert Uint8Array to hex string
const ary2Hex = (uint8Array) => Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('');

// length number buffer array 
const bufLength = (uint8Array) => {
    let len = new Uint8Array(8);
    new DataView(len.buffer).setUint32(0,uint8Array.length,true);
    return len;
};

// pad data to fix length 
function padBuffer(data, pLength=16) {
    let iRemain = data.length % pLength;
    if ( iRemain == 0) return data;

    const paddedData = new Uint8Array(data.length + pLength - iRemain);
    
    paddedData.set(data);

    return paddedData;
};

function quarterRound(x, a, b, c, d) {
    x[a] = (x[a] + x[b]) >>> 0; x[d] = rotate(x[d] ^ x[a], 16);
    x[c] = (x[c] + x[d]) >>> 0; x[b] = rotate(x[b] ^ x[c], 12);
    x[a] = (x[a] + x[b]) >>> 0; x[d] = rotate(x[d] ^ x[a], 8);
    x[c] = (x[c] + x[d]) >>> 0; x[b] = rotate(x[b] ^ x[c], 7);
}

function chacha20Block(key, counter, iv) {
    const keySt = new Uint32Array(key.buffer, key.byteOffset, 8);
    const ivSt  = new Uint32Array(iv.buffer, iv.byteOffset, 3);

    const state = new Uint32Array([...BLK_HEAD, ...keySt, counter, ...ivSt]);

    let workingState = new Uint32Array(state);
    for (let i = 0; i < CHA_ROUND; i++) {
        quarterRound(workingState, 0, 4, 8, 12);
        quarterRound(workingState, 1, 5, 9, 13);
        quarterRound(workingState, 2, 6, 10, 14);
        quarterRound(workingState, 3, 7, 11, 15);

        quarterRound(workingState, 0, 5, 10, 15);
        quarterRound(workingState, 1, 6, 11, 12);
        quarterRound(workingState, 2, 7, 8, 13);
        quarterRound(workingState, 3, 4, 9, 14);
    }

    const result = new Uint8Array(BLK_SIZE);
    for (let i = 0; i < 16; i++) {
        const value = (workingState[i] + state[i]) >>> 0;
        result[i * 4] = value & 0xFF;
        result[i * 4 + 1] = (value >>> 8) & 0xFF;
        result[i * 4 + 2] = (value >>> 16) & 0xFF;
        result[i * 4 + 3] = (value >>> 24) & 0xFF;
    }

    return result;
}

function chachaEncrypt(key, counter, iv, plaintext) {
    let encrypted = new Uint8Array(plaintext.length);
    let offset = 0;

    while (offset < plaintext.length) {
        const bkey = chacha20Block(key, counter++, iv);
        const blockSize = Math.min(BLK_SIZE, plaintext.length - offset);
        for (let i = 0; i < blockSize; i++) {
            encrypted[offset + i] = plaintext[offset + i] ^ bkey[i];
        }
        offset += blockSize;
    }

    return encrypted;
}

// mac data from key, plaintext, tag check if provided 
function poly1305Tag(key, iv, ciphertext, aad, tag=null) {
    // first block ad polykey
    const polyKey = chacha20Block(key, 0, iv).slice(0, 32);

    // data for mac
    const macData = new Uint8Array([...padBuffer(aad), ...padBuffer(ciphertext), ...bufLength(aad), ...bufLength(ciphertext)]);

    // result // Clamp
    const r = new Uint8Array(polyKey.slice(0, 16));
    [3,7,11,15].map(i=>r[i] &= 15);
       [4,8,12].map(i=>r[i] &= 252);

    const rVal = BigInt("0X" + ary2Hex([...r].reverse()));
    const sVal = BigInt("0X" + ary2Hex([...polyKey.slice(16, 32)].reverse()));
    const p = BigInt('0x3fffffffffffffffffffffffffffffffb');

    let acc = 0n;
    for (let i = 0; i < macData.length; i += 16) {
        const block = new Uint8Array(17);
        block.set(macData.slice(i, i + 16));
        block[16] = 1;
        const n = BigInt("0X" + ary2Hex([...block].reverse()));

        acc = (acc + n) * rVal % p;
    }

    // acc and buffer 
    acc = (acc + sVal) % (1n << 128n);
    const tagBuf = new Uint8Array(16).map((v,i)=>Number((acc >> BigInt(8 * i)) & 0xFFn));

    if (tag) { // compare module return null 
        return (tagBuf.some((v, i) => v != tag[i])) ? "Tag authentication failed" : null;
    } else {
        return tagBuf;
    }
};

function encrypt(plaintext, key, iv, aad) {
    if (typeof plaintext === "string") {
        plaintext = new TextEncoder().encode(plaintext);
    } else if (typeof plaintext === "object" && !(plaintext instanceof Uint8Array)) {
        plaintext = new TextEncoder().encode(JSON.stringify(plaintext));
    }

    if (!iv)   iv = randomArray(12);
    if (!aad) aad = randomArray(8);

    const ciphertext = chachaEncrypt(key, 1, iv, plaintext);

    const tag = poly1305Tag(key, iv, ciphertext, aad);

    // final string split by ;
    return [ciphertext, iv, aad, tag]
        .map(v => btoa(String.fromCharCode.apply(null, v)).replace(/=/g, ""))
        .join(";");
}

function decrypt(encryptedData, key) {
    // split params
    let [ciphertext, iv, aad, tag] = encryptedData.split(";").map(v => 
        new Uint8Array(atob(v).split("").map(c => c.charCodeAt(0)))
    );
    
    // decrypt and decode utf-8
    const plaintext = new TextDecoder().decode(chachaEncrypt(key, 1, iv, ciphertext));

    const warning= poly1305Tag(key, iv, ciphertext, aad, tag);
    
    return warning ? { plaintext, warning } : { plaintext };
}

function testChaCha20Poly1305() {
    const otext = 'China:中国.1';
    const oBuffer = new TextEncoder().encode(otext);

    const key = randomArray(32);
    console.log("Key:", key);

    const eresult = encrypt(oBuffer, key);
    console.log('Result:', eresult);

    let [etext, iv2, aad2, tag2] = eresult.split(";").map(v => 
        new Uint8Array(atob(v).split("").map(c => c.charCodeAt(0)))
    );

    const { plaintext: decryptedText, warning } = decrypt(eresult, key);

    console.log('Decrypted plaintext:', decryptedText);
    if (warning) {
        console.warn(warning);
    }
}; // testChaCha20Poly1305(); // Run the test

// // Export functions for use in other modules
module.exports = { encrypt, decrypt, randomArray };
