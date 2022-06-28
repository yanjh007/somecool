

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

        let mid, bcompare;
        while(end > start) {
            // mid position
            mid = 0 | (start + (end - start) / 2);

            // value compare and check
            if (this._comparer(this._values[mid], el)) {
                if (start == mid) { // next round
                    return start + 1;
                } else { // return next position
                    start = mid;
                }
            } else if (start == mid) { // current position
                return start;
            } else { // return privous position
                end = mid;
            }
        }

        // start equals end
        return start+1;
    }
