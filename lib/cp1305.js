class CP1305 {
    static CHA_ROUND  = 10;
    static IV_LENGTH  = 12;
    static TAG_LENGTH = 16;
    static BLK_SIZE   = 64;
    static TEXT_KEY   = "expand 32-byte k";
    static BLK_HEAD   = new Uint32Array(this.TEXT_KEY.match(/.{1,4}/g)
        .map(v=>parseInt(v.split("").reverse().map(c=>c.charCodeAt(0).toString(16)).join(""),16))
    );
    // static BLK_HEAD   = new Uint32Array([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);
    static POLY_MOD   = BigInt('0x3fffffffffffffffffffffffffffffffb'); // 2^130-5
    static POLY_REMAIN   =  1n << 128n; // 2^128 16byte
    
    static b64Decode = (str64)=>Uint8Array.from(atob(str64), c => c.charCodeAt(0));
    static b64Encode = (ary)=>btoa(String.fromCharCode.apply(null, 
            ary instanceof ArrayBuffer ? new Uint8Array(ary): ary 
        )).replace(/=/g, "");
    // Utility functions

    static randomArray = (n) => new Uint8Array(n).map(() => Math.floor(256 * Math.random()));
    
    // Convert hex string to Uint8Array // Convert Uint8Array to hex string
    static ary2Hex = (uint8Array) => Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('');

    // length number buffer  
    static lenBuf = (uint8Array, bLength=8) => {
        let len = new Uint8Array(bLength); // 8 byte to contain length value
        new DataView(len.buffer).setUint32(0,uint8Array.length,true);
        return len;
    };
    
    // pad data to default block size  
    static padBuf = (data, pLength=16)=> { 
        let iRemain = data.length % pLength;
        if ( iRemain == 0) return data;
    
        const paddedData = new Uint8Array(data.length + pLength - iRemain);
        
        paddedData.set(data);
    
        return paddedData;
    };

    static rotate = (v, c) => ((v << c) | (v >>> (32 - c))) >>> 0;
    
    static quarterRound = (x, a, b, c, d)=> {
        x[a] = (x[a] + x[b]) >>> 0; x[d] = this.rotate(x[d] ^ x[a] , 16);
        x[c] = (x[c] + x[d]) >>> 0; x[b] = this.rotate(x[b] ^ x[c] , 12);
        x[a] = (x[a] + x[b]) >>> 0; x[d] = this.rotate(x[d] ^ x[a] ,  8);
        x[c] = (x[c] + x[d]) >>> 0; x[b] = this.rotate(x[b] ^ x[c] ,  7);
    }
    
    // handle key block
    static chaBlock = (keyBlock, counter = 0)=> {
        const state = [...keyBlock];
        // counter set 
        if (counter>0) state[12] = counter;
        
        // work state
        const wkState = [...state];

        for (let i = 0; i < this.CHA_ROUND; i++) {
            this.quarterRound(wkState, 0, 4, 8,  12);
            this.quarterRound(wkState, 1, 5, 9,  13);
            this.quarterRound(wkState, 2, 6, 10, 14);
            this.quarterRound(wkState, 3, 7, 11, 15);
    
            this.quarterRound(wkState, 0, 5, 10, 15);
            this.quarterRound(wkState, 1, 6, 11, 12);
            this.quarterRound(wkState, 2, 7, 8,  13);
            this.quarterRound(wkState, 3, 4, 9,  14);
        }
    
        // result block
        const result = new Uint8Array(this.BLK_SIZE);
        const k = this.BLK_SIZE/4;
        let rv;
        for (let i = 0; i < k; i++) {
            rv = (wkState[i] + state[i]) >>> 0;
            [0,1,2,3].forEach(j=> result[i*4+j] = (rv >>> (j*8)) & 0xFF);
        } 
        
        return result;
    }

    static keyBlock = (key,iv) => new Uint32Array([
        ...this.BLK_HEAD, 
        ...new Uint32Array(key.buffer, key.byteOffset, 8), 
        0, // default counter
        ...new Uint32Array(iv.buffer, iv.byteOffset, 3)
    ])

    // encode use encrypt and decrypt
    static chaEncode = (bufContent, key, iv) =>{
        let bkey,
        encrypted = new Uint8Array(bufContent),
        kb = this.keyBlock(key,iv); // copy 
        
        for(let i= 0, ic = 1, l = bufContent.length; i<l; i++) {
          // key block stream 
          if (i % this.BLK_SIZE == 0) bkey = this.chaBlock(kb, ic++);

          encrypted[i] ^= bkey[ i % this.BLK_SIZE];
        } 
        return encrypted;
    }
    
    // mac data from key, plaintext, tag check if provided 
    static poly1305Tag = (aad, cipherText, key, iv, tag=null)=> {
        // data for mac
        const macData = new Uint8Array([
          ...this.padBuf(aad), 
          ...this.padBuf(cipherText), 
          ...this.lenBuf(aad), 
          ...this.lenBuf(cipherText)
        ]);

        // first block ad polykey  // result // Clamp
        const polyKey = this.chaBlock(this.keyBlock(key, iv)).slice(0, 32);
        // console.log(polyKey);

        [3,7,11,15].map(i=>polyKey[i] &= 15 );
           [4,8,12].map(i=>polyKey[i] &= 252);
    
        // rvalue and svalue 
        const rVal = BigInt("0X" + this.ary2Hex(new Uint8Array(polyKey.slice( 0, 16)).reverse()));
        const sVal = BigInt("0X" + this.ary2Hex(new Uint8Array(polyKey.slice(16, 32)).reverse()));

        let acc = 0n, b = 0n;
        for (let i = 0; i < macData.length; i += 16) {
            b = BigInt("0X"+this.ary2Hex([...macData.slice(i, i + 16),1].reverse()));

            acc = (acc + b) * rVal % this.POLY_MOD;
        }
    
        // acc and to buffer 
        acc = (acc + sVal) % this.POLY_REMAIN;
        const tagBuf = new Uint8Array(16).map((v,i)=>Number((acc >> BigInt(8 * i)) & 0xFFn));
    
        if (tag) { // compare module return null 
            return (tagBuf.some((v, i) => v != tag[i])) ? "Tag authentication failed" : null;
        } else {
            return tagBuf;
        }
    };
    
    // key should be buffer
    static encrypt = (plaintext, key, iv, aad)=> {
        // encode json and string        
        if (typeof plaintext === "object" && !(plaintext instanceof Uint8Array)) {
            plaintext = JSON.stringify(plaintext);
        }

        if (typeof plaintext === "string") {
            plaintext = new TextEncoder().encode(plaintext);
        } 

        if (typeof aad === "string") aad = new TextEncoder().encode(aad);

        // key and iv
        if (typeof key === "string") key = this.b64Decode(key);
        if (typeof iv  === "string") iv  = this.b64Decode(iv);

        if (!aad)  aad = []; // empty aad

        // random IV if not provide
        if (!iv) iv = this.randomArray(this.IV_LENGTH);
    
        // cha encode
        // console.log(plaintext, key, iv);
        const cipherText = this.chaEncode(plaintext, key, iv);
    
        // get tag 
        const tag = this.poly1305Tag(aad, cipherText, key, iv);
    
        // merge buffer encrypted | iv | tag | aad
        return this.b64Encode([
            ...cipherText, 
            ...iv,
            ...tag,
            ...aad,...[aad.length]
        ]);
    }
    
    // decrypt
    static decrypt = (encrypted, key)=> {
        if (typeof key === "string") key = this.b64Decode(key);

        let 
        buf = this.b64Decode(encrypted),
        lenBuf  = buf.length -1,
        lenAAD  = buf[lenBuf],
        p3 = lenBuf - lenAAD,
        p2 = p3 - this.TAG_LENGTH,
        p1 = p2 - this.IV_LENGTH,
        bufContent = buf.slice(0,  p1),
        bufIV      = buf.slice(p1, p2),
        bufTag     = buf.slice(p2, p3),
        bufAAD     = buf.slice(p3, lenBuf);

        // decrypt and decode utf-8
        let decrypted = this.chaEncode(bufContent, key, bufIV);
        const plaintext = new TextDecoder().decode(decrypted);
    
        // compute tag 
        const warning= this.poly1305Tag(bufAAD, bufContent, key, bufIV, bufTag);
        
        // decode adata 
        const adata = new TextDecoder().decode(bufAAD);
        return warning ? { plaintext, warning, adata } : { plaintext, adata };        
    }
}

// EXPORT //
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CP1305
}

// function testChaCha20Poly1305() {
//     showText();

//     const otext = 'China:中国.1';
//     const atext = "附加数据"; // add text
//     showText("原文: " + otext);
    
//     const oBuffer = new TextEncoder().encode(otext);

//     const key = Cha20P.randomArray(32);

//     showText("密钥: " + Cha20P.b64Encode(key));

//     const dadd = new TextEncoder().encode(atext);
    
//     const eresult = Cha20P.encrypt(oBuffer, key, null, dadd );
    
//     showText('密文: ' + eresult);

//     const { plaintext, warning, adata } = Cha20P.decrypt(eresult, key);

//     showText('解密: ' + plaintext);

//     showText('附加信息: ' + adata);

//     if (warning) showText("校验: " + warning);

// }; // testChaCha20Poly1305(); // Run the test
