
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

    // binary search use loop reduce
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

module.exports = { SortedArray };
