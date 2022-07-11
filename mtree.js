

// array heap first is min

class MinTree {
    _root = null;
    // values array 
    _values =  Array();

    // size of array 
    _size   =  this._values.length;

    // comparer 
    _comparer;

    // init heap with comparer
    constructor(cmper) {
        // setup  compareer
        this._comparer = cmper ? cmper : (a,b) => { return b > a };
    }

    // pop value get first heap top value
    pop(cobj) {
        if (this._size <=0) return null;

        let value = this._values[0];
        // condistion pop user comparer
        if (cobj && !this._comparer(value,cobj)) return null;
        
        // really pop
        this._values[0] = this._values[--this._size];
        // this._values[this._size] = null;

        this._values.pop();

        // fix down operation
        this._fixDown();    

        // return pop value
        return value;
    }

    // add item to minHeap array
    add(item) {
        if (!this._root) {
            this._root = item;
            return;
        }         

        // if(this._size >= this._values.length) Arrays.copyOf(values, size << 1) ;
        this._values[this._size++] = item ;
        return this._fixUp();
    }

    // get first item
    first() { return this._values[0]; }

    print() {  console.log(this._values.join(",")); }

    _switch(f,k) {
        let t = this._values[f] ; 
        this._values[f] = this._values[k]; 
        this._values[k] = t ;
        t = null;
    }

    // fix down in pop value
    _fixDown() {
        let k, f = 0 ; 

        while((k = (f << 1) + 1) < this._size) { //至少存在左子节点
            if(k < this._size - 1) {   //存在右子节点
                //左右子节点进行比较。
                if (this._comparer(this._values[k+1], this._values[k])) k++;
            }

            if(this._comparer(this._values[f],this._values[k])) break; //父节点小于较小者子节点，则找到合适的位置，退出循环

            // switch f and k
            this._switch(f,k);
            f = k ;
        }

        return f;
    }

    _fixUp() {
        // last one index 
        let j, f = this._size - 1 ;  

        while((j = ((f - 1) >> 1)) >= 0) { //通过父节点的下标
            if(this._comparer(this._values[j], this._values[f])) break; //父节点的值小于子节点的值，则打适合的位置。
            // if(this._values[j] <= this._values[f]) break; //父节点的值小于子节点的值，则打适合的位置。

            // switch value
            this._switch(f,j);

            f = j ;
        }

        return j;
    }
}

module.exports = { MinHeap, SortedArray };



