


const TABLE_SIZE = 16; //256;



/**
 *  Sorted Array 
 *  mantain a sorted array by insert at right place 
 *  use splice operation and expensive 
 * 
 */

 class SortedArray {
    // array values 
    _values = Array();

    // comparer 
    _comparer = (a,b) => { return b > a };

    // setup  compareer or default
    constructor(cmper) {
        if (cmper)  this._comparer = cmper;
    }
    
    // binary search use recourse  
    _search2 = (el, start = 0, end = this._values.length )=>{
        // empty array 
        if (this._values.length == 0) return - 1;

        // mid point
        let mid = 0 | (start + (end - start) / 2);

        // mid point element
        let bcompare =  this._comparer(this._values[mid], el);

        if (start == mid) {  
            return bcompare ?  mid : mid - 1;
        } else { // recure search
            return bcompare ?  this._search(el, mid, end )  : this._search(el, start, mid);
        }
    }

    // binary search use loop reduce return the position to insert 
    _search = (el, start = 0, end = this._values.length )=>{
        // empty array 
        if (this._values.length == 0) return 0;

        let mid;
        while(end > start) {
            // mid position
            mid = 0 | (start + (end - start) / 2);

            // value compare and check
            if (this._comparer(this._values[mid], el)) {
                if (start == mid) { // find and return
                    return start + 1;
                } else { // next position in right
                    start = mid;
                }
            } else if (start == mid) { // finish current position
                return start;
            } else { // next position in left
                end = mid;
            }
        }

        // start equals end
        return start+1;
    }

    // add item into sorted array
    add(item) {
        // search position
        let ipos = this._search(item) ;

        // insert 
        this._values.splice(ipos, 0, item);
        return ipos;
    }

    first() { return this._values[0]; }

    // pop with cmpare object 
    pop(cobj) { 
        if (!cobj || this._comparer(this._values[0],cobj)) {
            return this._values.shift(); 
        } else {
            return null;
        }
    }
}


// sorted link table
class LinkTable {
    constructor(chker) {
        // setup  compareer or default
        this._checker = chker ? chker : (a,b) => { return a == b };
    }

    // add item as first 
    add(key,value) {
        // replace original header
        let item = { value,
            _key : key,
            _next: this._header 
        }
        this._header = item;
    }

    find(key,bremove= false) {
        let item  = this._header; // parent item
        let pitem = this._header; // current item

        do {
            if (item._key == key ) { //
                // remmove from  linklist 
                if (bremove) pitem.next = item.next;
                return item.value; // get content 
            } else {
                if (bremove) pitem = item; // set current parent
            }
        } while (item = item._next);

        return null;
    }

    remove(key) { return this.find(key,true) };

}

class HashTable {
    // array values 
    _values = Array();

    // init heap with comparer
    constructor(kfunc=(v)=>{ return JSON.stringify(v) }) {
        // setup  compareer
        this._kfunction = kfunc;
    }

    _search(ary,id) {
        // ary empty
        if (!ary || ary.length==0) return null;

        for(let i=0;i<ary.length; i++) {
            if (id == ary[i].id ) return ary[i];
        }
        return null;
    }

    _hash(key) {
        let 
        i = 0,
        h = 0,
        l = key.length;
    
        if ( l > 0 ) while (i < l) h = (h << 5) - h + key.charCodeAt(i++) | 0;
        h &= 0x7FFFFFFF;
        return h % TABLE_SIZE;
    }

    add(item) {
        let key = this._kfunction(item);
        let idx = this._hash(key);

        if (!this._values[idx]) this._values[idx] = new LinkTable();

        this._values[idx].add(key,item);
    }

    find(item, bremove = false) {
        let key = this._kfunction(item);
        let idx = this._hash(key);

        // empty link list
        if (!this._values[idx]) return null;

        // link list operation
        if (bremove) {
            return this._values[idx].remove(key);
        } else {
            return this._values[idx].find(key); 
        }
    }

    remove(item) { // wraped find function 
        return this.find(item,true);
    }
}

module.exports = { LinkTable, HashTable };