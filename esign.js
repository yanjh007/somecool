const {
    generateKeyPairSync,
    createSign,
    createVerify,
    createPublicKey
} = require('crypto');
  
const ALGO = {
    Name: "sect239k1",
    Sha: "SHA256",
    PKfmt: {
        type: "spki",
        format: "pem"
    }
}

const convertKey = (key)=>{
    const 
        kheader = "-----BEGIN PUBLIC KEY-----",
        ktailer = "-----END PUBLIC KEY-----";

    let skey,okey;
    if (typeof key == "object") {
        skey = key.export(ALGO.PKfmt);
        skey = skey
            .replace(kheader,"")
            .replace(ktailer,"")
            .replace(/\n/g,"");
        return skey;
    } else { // restore key
        skey = [kheader,key,ktailer].join("\n");
        okey = createPublicKey(skey);
        return okey;
    }
}

const msign = (ptext,vkey)=>{
    const sign = createSign(ALGO.Sha);
    sign.write(ptext)
    sign.end();
    // sign.end();
      
    return sign.sign(vkey, 'hex');
}

// verify use text sign and keystring
const mverify = (ptext, sign, skey)=>{
    const verify = createVerify(ALGO.Sha);
    verify.write(ptext);
    verify.end();
    
    let pkey = convertKey(skey);
    return verify.verify(pkey, sign, 'hex');
}

// console.log("VKEY:", privateKey.export({}));

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: ALGO.Name });
const stext = "China中国";

let sign = msign(stext, privateKey);

// convert public key 
let spkey = convertKey(publicKey);
console.log("PKEY:", spkey);
  
// verify object and run
console.log("Verify:", mverify(stext, sign, spkey))
