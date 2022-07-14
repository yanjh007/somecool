

'use strict';

const 
crypto  = require('crypto'),
CHARS32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
ZERO16 = Array(16).fill(0).join(''),
ZERO5  = Array(5).fill(0).join(''),
ICAL   = 2147483647;

const padZero = (str, pl = 16) =>{  return (ZERO16 + str).slice(-pl); }

/**
* Generate a random base-32 secret
*/
const genarateKey = (length)=> {
    const base32chars = CHARS32.split("");
    length = length % 2 === 0 ? length : length + 1; // ensuring even length
 
    const secret = [];
    for (var i = 0; i < length; i++) {
        secret.push(base32chars[0 | Math.random() * 32]);
    }
    return secret.join('');
}
 
/**
 * Convert a base-32 to hexadecimal with a different base-32 alphabet 
 * from the one used by the parseInt() function
 */
const base32toBuffer = (base32)=> {
    // convert index to bitstring padding 5, length 80
    let bits = base32
        .split("")
        .map(v=>padZero(CHARS32.indexOf(v.toUpperCase()).toString(2),5))
        .join("");

    // split bitsstring into 4bit segment to hex , length 20 
    let hex = Array(bits.length/4)
        .fill()
        .map((v,i)=>bits.slice(i*4,i*4+4))
        .map(v=>parseInt(v,2).toString(16))
        .join("");

    // hex string to buffer
	return Buffer.from(hex,"hex");
}


/**
 * Calculate totp for the given secret 
 * something like : 4F5BIFLRUAUTLHVN
 */

const getOTP = (secret)=> {
	// Encode the secret from base-32 to hex, place it into a buffer and store it as the variable "key".
    let key = base32toBuffer(secret);

    // Calculate number of 30-seconds intervals from epoch time, encode this to hex and then 0-pad to obtain a 12 character string. 
	// Finally place this hex string into a buffer and store it into the variable "mssg".
    let msg =  padZero((0 | Math.round(Date.now() / 30000)).toString(16));

	// Use crypto to obtain an SH1 HMAC digest from the key and mssg
	let hmac = crypto
        .createHmac('sha1', key)
        .update(Buffer.from(msg,"hex"))
        .digest("hex"); // create Hmac instances

    // console.log(hmac);
    // Bitwise operations to convert the SH1 HMAC output into a 6 digits code
    let icode = parseInt(hmac.slice(-1), 16) ;
    let ocode = (parseInt(hmac.slice(icode * 2, icode * 2 + 8), 16) & ICAL)
        .toString()
        .slice(-6);

	return ocode;
}

module.exports = { genarateKey, getOTP };

/**
// Display in console the 6 digits code every time it changes

compatible with google authticator 

useage:
1 Genarate a secret
const secret = randomBase32(16);

console.log('Your random secret is: ' + secret);

2 getOTP use secret every 30s
setInterval(()=>{
	if ((0 | Date.now() / 1000) % 30 == 0)  console.log(getOTP(secret));
}, 1000);

*/